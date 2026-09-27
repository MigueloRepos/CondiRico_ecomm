import { supabase } from "@/lib/supabase";
import { Profile } from "@/types/database";

/**
 * Loads the user profile from public.profiles
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[getProfile] Supabase error:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("[getProfile] Unexpected error:", err);
    return null;
  }
}

/**
 * Updates or creates a user profile in public.profiles
 */
export async function updateProfile(
  userId: string,
  profileData: Partial<Omit<Profile, "id" | "created_at">>
): Promise<{ success: boolean; profile?: Profile; error?: string }> {
  if (!userId) {
    return { success: false, error: "Usuario no autenticado." };
  }

  try {
    const payload = {
      ...profileData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        ...payload,
      })
      .select()
      .single();

    if (error) {
      console.error("[updateProfile] Supabase error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, profile: data };
  } catch (err: unknown) {
    console.error("[updateProfile] Unexpected error:", err);
    const msg = err instanceof Error ? err.message : "Error al actualizar perfil";
    return { success: false, error: msg };
  }
}

/**
 * Checks if a user has admin privileges in public.profiles
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return false;
    return data.role === "admin";
  } catch (err) {
    console.error("[checkIsAdmin] Error:", err);
    return false;
  }
}

/**
 * Grants admin role in public.profiles
 */
export async function promoteToAdmin(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: "Usuario no autenticado." };
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ role: "admin", updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al actualizar rol a admin.";
    return { success: false, error: msg };
  }
}

