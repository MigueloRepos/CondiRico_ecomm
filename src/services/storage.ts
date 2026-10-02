import { supabase } from "@/lib/supabase";
import { updateProfile } from "@/services/profiles";

export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "image/webp" | "image/jpeg";
}

/**
 * Validates that the selected file is an acceptable image
 */
export function validateImageFile(file: File, maxMb = 8): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No se seleccionó ningún archivo." };
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "image/gif",
    "image/avif",
  ];

  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: "Formato no válido. Usa JPG, PNG, WebP o GIF.",
    };
  }

  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `La imagen es demasiado pesada (${(file.size / (1024 * 1024)).toFixed(1)} MB). El tamaño máximo es ${maxMb} MB.`,
    };
  }

  return { valid: true };
}

/**
 * Compresses and formats an image file client-side using HTML5 Canvas
 */
export async function optimizeImage(
  file: File,
  options: ImageUploadOptions = {}
): Promise<{ file: File; dataUrl: string }> {
  // SVGs don't need raster compression
  if (file.type === "image/svg+xml") {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    return { file, dataUrl };
  }

  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.85,
    format = "image/webp",
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ file, dataUrl: e.target?.result as string });
          return;
        }

        // Draw image with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL(format, quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ file, dataUrl });
              return;
            }

            const ext = format === "image/webp" ? "webp" : "jpg";
            const optimizedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, "") + `.${ext}`,
              { type: format }
            );

            resolve({ file: optimizedFile, dataUrl });
          },
          format,
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a product image to Supabase Storage (bucket: "products")
 * with automatic fallback to high-quality data URL if the bucket is unavailable.
 */
export async function uploadProductImage(
  file: File
): Promise<{ url: string; error?: string }> {
  const validation = validateImageFile(file, 10);
  if (!validation.valid) {
    return { url: "", error: validation.error };
  }

  try {
    // 1. Optimize image client-side (max 1200x1200px WebP)
    const { file: optimizedFile, dataUrl } = await optimizeImage(file, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.85,
      format: "image/webp",
    });

    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 30);
    const fileName = `product-${Date.now()}-${safeName}.webp`;

    // 2. Attempt upload to Supabase Storage "products" bucket
    try {
      const { data, error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, optimizedFile, {
          cacheControl: "31536000",
          upsert: true,
          contentType: optimizedFile.type || "image/webp",
        });

      if (!uploadError && data?.path) {
        const { data: publicUrlData } = supabase.storage
          .from("products")
          .getPublicUrl(data.path);

        if (publicUrlData?.publicUrl) {
          return { url: publicUrlData.publicUrl };
        }
      } else if (uploadError) {
        console.warn("[uploadProductImage] Storage notice:", uploadError.message);
      }
    } catch (storageErr) {
      console.warn("[uploadProductImage] Storage request notice:", storageErr);
    }

    // 3. Fallback to optimized data URL so image upload NEVER fails
    return { url: dataUrl };
  } catch (err) {
    console.error("[uploadProductImage] Unexpected error:", err);
    return {
      url: "",
      error: err instanceof Error ? err.message : "Error al procesar la imagen.",
    };
  }
}

/**
 * Uploads a user avatar to Supabase Storage (bucket: "avatars")
 * and persists it to the user's profile record in Supabase.
 */
export async function uploadUserAvatar(
  userId: string,
  file: File
): Promise<{ url: string; error?: string }> {
  if (!userId) {
    return { url: "", error: "Usuario no autenticado." };
  }

  const validation = validateImageFile(file, 5);
  if (!validation.valid) {
    return { url: "", error: validation.error };
  }

  try {
    // 1. Optimize avatar client-side (max 400x400px WebP square)
    const { file: optimizedFile, dataUrl } = await optimizeImage(file, {
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.88,
      format: "image/webp",
    });

    const fileName = `avatar-${userId}-${Date.now()}.webp`;
    let finalUrl = dataUrl;

    // 2. Attempt upload to Supabase Storage "avatars" bucket
    try {
      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, optimizedFile, {
          cacheControl: "31536000",
          upsert: true,
          contentType: optimizedFile.type || "image/webp",
        });

      if (!uploadError && data?.path) {
        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(data.path);

        if (publicUrlData?.publicUrl) {
          finalUrl = publicUrlData.publicUrl;
        }
      } else if (uploadError) {
        console.warn("[uploadUserAvatar] Storage notice:", uploadError.message);
      }
    } catch (storageErr) {
      console.warn("[uploadUserAvatar] Storage request notice:", storageErr);
    }

    // 3. Persist avatar_url in public.profiles table
    try {
      await updateProfile(userId, { avatar_url: finalUrl });
    } catch (dbErr) {
      console.warn("[uploadUserAvatar] Could not persist to profile table:", dbErr);
    }

    // 4. Update Supabase Auth user metadata
    try {
      await supabase.auth.updateUser({
        data: {
          avatar_url: finalUrl,
          avatarUrl: finalUrl,
        },
      });
    } catch (authErr) {
      console.warn("[uploadUserAvatar] Could not update user metadata:", authErr);
    }

    return { url: finalUrl };
  } catch (err) {
    console.error("[uploadUserAvatar] Unexpected error:", err);
    return {
      url: "",
      error: err instanceof Error ? err.message : "Error al subir foto de perfil.",
    };
  }
}
