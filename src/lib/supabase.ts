import { createClient, SupabaseClient, User as SupabaseUser } from "@supabase/supabase-js";
import { UserProfile } from "@/lib/auth";

const SUPABASE_CONFIG_STORAGE_KEY = "condirico_supabase_config_v1";

// Default or environment variables
const DEFAULT_SUPABASE_URL = "https://wcgwttjnvyeibxdnhqfl.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZ3d0dGpudnllaWJ4ZG5ocWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NjA5NTYsImV4cCI6MjEwNjAzNjk1Nn0.iE3Felsr8MQ7GYnMGGGMLexs8358nVTzzKJOgEq70vs";

const ENV_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || "";
const ENV_SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isCustom: boolean;
}

// Retrieve stored or environment Supabase configuration
export function getSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return {
          url: parsed.url,
          anonKey: parsed.anonKey,
          isCustom: true,
        };
      }
    }
  } catch (err) {
    console.warn("Error reading Supabase config from storage:", err);
  }

  const activeUrl = ENV_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const activeKey = ENV_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  return {
    url: activeUrl,
    anonKey: activeKey,
    isCustom: Boolean(activeUrl && activeKey),
  };
}

// Save custom Supabase credentials (URL & Anon Key)
export function saveSupabaseConfig(url: string, anonKey: string) {
  const cleanUrl = url.trim().replace(/\/$/, "");
  const cleanKey = anonKey.trim();
  localStorage.setItem(
    SUPABASE_CONFIG_STORAGE_KEY,
    JSON.stringify({ url: cleanUrl, anonKey: cleanKey })
  );
  // Re-instantiate client
  supabaseInstance = createClient(cleanUrl, cleanKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

// Clear custom Supabase credentials
export function clearSupabaseConfig() {
  localStorage.removeItem(SUPABASE_CONFIG_STORAGE_KEY);
  const defaultConfig = getSupabaseConfig();
  supabaseInstance = createClient(defaultConfig.url, defaultConfig.anonKey);
}

// Initialize Supabase Client
let supabaseInstance: SupabaseClient = (() => {
  const cfg = getSupabaseConfig();
  return createClient(cfg.url, cfg.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
})();

export const supabase = supabaseInstance;

export function getSupabase(): SupabaseClient {
  return supabaseInstance;
}

// Convert Supabase User to CondiRico UserProfile
export function mapSupabaseUserToProfile(sbUser: SupabaseUser): UserProfile {
  const meta = sbUser.user_metadata || {};
  return {
    id: sbUser.id,
    name: meta.full_name || meta.name || sbUser.email?.split("@")[0].replace(/[._]/g, " ") || "Usuario CondiRico",
    email: sbUser.email || "",
    phone: meta.phone || "+34 600 000 000",
    address: meta.address || "Dirección principal",
    hasBiometrics: Boolean(meta.hasBiometrics),
    createdAt: sbUser.created_at || new Date().toISOString(),
    preferences: {
      offersNewsletter: meta.offersNewsletter ?? true,
      whatsappUpdates: meta.whatsappUpdates ?? true,
      preferredInvoiceType: meta.preferredInvoiceType || "boleta",
      deliveryInstructions: meta.deliveryInstructions || "",
      city: meta.city || "Madrid",
      postalCode: meta.postalCode || "28001",
    },
  };
}

// Test connection to Supabase instance
export async function testSupabaseConnection(url?: string, anonKey?: string): Promise<{ success: boolean; message: string }> {
  try {
    const testClient = url && anonKey ? createClient(url.trim(), anonKey.trim()) : getSupabase();
    // Test auth endpoint
    const { data, error } = await testClient.auth.getSession();
    if (error && !error.message.includes("session")) {
      return { success: false, message: error.message };
    }
    return { success: true, message: "Conexión exitosa con Supabase Cloud Auth." };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "No se pudo contactar el servidor de Supabase.";
    return { success: false, message: msg };
  }
}

// Supabase Cloud Sign Up
export async function signUpWithSupabase(params: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
}): Promise<{ user: UserProfile | null; error: string | null; confirmationRequired?: boolean }> {
  const supabase = getSupabase();
  const email = params.email.trim().toLowerCase();
  const password = params.password;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: params.fullName,
          phone: params.phone || "",
          address: params.address || "",
          hasBiometrics: false,
        },
      },
    });

    if (error) {
      // Friendly Spanish error messages
      let msg = error.message;
      if (error.message.includes("User already registered") || error.message.includes("already exists")) {
        msg = "Ya existe una cuenta registrada con este correo electrónico. Por favor, inicia sesión.";
      } else if (error.message.includes("Password should be at least")) {
        msg = "La contraseña debe tener al menos 6 caracteres.";
      } else if (error.message.includes("Invalid email")) {
        msg = "El formato de correo electrónico no es válido.";
      }
      return { user: null, error: msg };
    }

    if (data.user) {
      const profile = mapSupabaseUserToProfile(data.user);
      const isConfirmed = Boolean(data.session || data.user.confirmed_at);
      return {
        user: profile,
        error: null,
        confirmationRequired: !isConfirmed && !data.session,
      };
    }

    return { user: null, error: "No se pudo completar el registro en Supabase." };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido al registrarse en Supabase";
    return { user: null, error: msg };
  }
}

// Supabase Cloud Sign In
export async function signInWithSupabase(params: {
  email: string;
  password: string;
}): Promise<{ user: UserProfile | null; error: string | null }> {
  const supabase = getSupabase();
  const email = params.email.trim().toLowerCase();
  const password = params.password;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let msg = error.message;
      if (error.message.includes("Invalid login credentials") || error.message.includes("invalid_grant")) {
        msg = "Correo o contraseña incorrectos. Verifica tus datos o regístrate si no tienes cuenta.";
      } else if (error.message.includes("Email not confirmed")) {
        msg = "Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.";
      }
      return { user: null, error: msg };
    }

    if (data.user) {
      const profile = mapSupabaseUserToProfile(data.user);
      return { user: profile, error: null };
    }

    return { user: null, error: "No se pudo iniciar sesión con Supabase." };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al conectar con Supabase.";
    return { user: null, error: msg };
  }
}

// Supabase Cloud OAuth Sign In
export async function signInWithSupabaseOAuth(provider: "google" | "github"): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + window.location.pathname + "#auth",
      },
    });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Error al iniciar OAuth" };
  }
}

// Supabase Cloud Sign Out
export async function signOutSupabase(): Promise<void> {
  const supabase = getSupabase();
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn("Supabase sign out error:", err);
  }
}

// Update Supabase User Profile Metadata & Password (if provided)
export async function updateSupabaseUserProfile(params: {
  fullName: string;
  phone: string;
  address: string;
  city?: string;
  postalCode?: string;
  deliveryInstructions?: string;
  offersNewsletter?: boolean;
  whatsappUpdates?: boolean;
  preferredInvoiceType?: "boleta" | "factura";
  hasBiometrics?: boolean;
  newPassword?: string;
}): Promise<{ user: UserProfile | null; error: string | null }> {
  const supabase = getSupabase();

  try {
    const updatePayload: {
      data: Record<string, unknown>;
      password?: string;
    } = {
      data: {
        full_name: params.fullName.trim(),
        name: params.fullName.trim(),
        phone: params.phone.trim(),
        address: params.address.trim(),
        city: params.city?.trim() || "",
        postalCode: params.postalCode?.trim() || "",
        deliveryInstructions: params.deliveryInstructions?.trim() || "",
        offersNewsletter: params.offersNewsletter ?? true,
        whatsappUpdates: params.whatsappUpdates ?? true,
        preferredInvoiceType: params.preferredInvoiceType || "boleta",
      },
    };

    if (params.hasBiometrics !== undefined) {
      updatePayload.data.hasBiometrics = params.hasBiometrics;
    }

    if (params.newPassword && params.newPassword.trim().length >= 6) {
      updatePayload.password = params.newPassword.trim();
    }

    const { data, error } = await supabase.auth.updateUser(updatePayload);

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.user) {
      // Also sync public.profiles table
      try {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: params.fullName.trim(),
          phone: params.phone.trim(),
          address: params.address.trim(),
          city: params.city?.trim() || null,
          postal_code: params.postalCode?.trim() || null,
          delivery_instructions: params.deliveryInstructions?.trim() || null,
          offers_newsletter: params.offersNewsletter ?? true,
          whatsapp_updates: params.whatsappUpdates ?? true,
          preferred_invoice_type: params.preferredInvoiceType || "boleta",
          has_biometrics: params.hasBiometrics ?? false,
          updated_at: new Date().toISOString(),
        });
      } catch (profileErr) {
        console.warn("[updateSupabaseUserProfile] profiles table sync warning:", profileErr);
      }

      const updatedProfile = mapSupabaseUserToProfile(data.user);
      return { user: updatedProfile, error: null };
    }

    return { user: null, error: "No se pudo actualizar el perfil en Supabase." };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al conectar con Supabase.";
    return { user: null, error: msg };
  }
}

// Verify Email OTP token with Supabase Cloud
export async function verifyOtpWithSupabase(params: {
  email: string;
  token: string;
  userDataFallback?: {
    fullName: string;
    phone?: string;
    address?: string;
  };
}): Promise<{ user: UserProfile | null; error: string | null }> {
  const supabase = getSupabase();
  const email = params.email.trim().toLowerCase();
  const token = params.token.trim();

  try {
    // 1. Try type: 'signup' (Supabase default for signup confirmation OTPs)
    let { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });

    // 2. If 'signup' fails, fallback to type: 'email'
    if (error) {
      const retry = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      if (!retry.error && retry.data?.user) {
        data = retry.data;
        error = null;
      }
    }

    if (error) {
      let errorMsg = error.message;
      if (error.message.includes("Token has expired") || error.message.includes("expired")) {
        errorMsg = "El código de verificación ha expirado. Por favor solicita uno nuevo.";
      } else if (
        error.message.includes("invalid") ||
        error.message.includes("Token is invalid") ||
        error.message.includes("bad_code")
      ) {
        errorMsg = "El código ingresado es incorrecto o inválido. Revisa los 6 dígitos recibidos en tu correo.";
      }
      return { user: null, error: errorMsg };
    }

    if (data?.user) {
      const profile = mapSupabaseUserToProfile(data.user);
      return { user: profile, error: null };
    }

    return { user: null, error: "No se pudo verificar el código de confirmación." };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al verificar código con Supabase.";
    return { user: null, error: msg };
  }
}

// Resend Verification Email / OTP to user email
export async function resendVerificationOtpWithSupabase(
  email: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = getSupabase();
  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
    });

    if (error) {
      // If error is rate-limiting or project specific
      let msg = error.message;
      if (error.message.includes("rate limit") || error.message.includes("security purposes")) {
        msg = "Por favor espera unos segundos antes de solicitar otro código.";
      }
      return { success: false, error: msg };
    }
    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al reenviar código.",
    };
  }
}
