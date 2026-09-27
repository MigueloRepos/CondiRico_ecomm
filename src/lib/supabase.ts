import { createClient, SupabaseClient, User as SupabaseUser } from "@supabase/supabase-js";
import { UserProfile } from "@/lib/auth";

const SUPABASE_CONFIG_STORAGE_KEY = "condirico_supabase_config_v1";

// Default or environment variables
const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

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

  return {
    url: ENV_SUPABASE_URL || "https://dohfegpudvjqumivjtyv.supabase.co", // Demo ready instance
    anonKey:
      ENV_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvaGZlZ3B1ZHZqcXVtaXZqdHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDgwMDAwMDAsImV4cCI6MjAyMzU3NjAwMH0.sampleAnonTokenForCondiRicoApp",
    isCustom: Boolean(ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY),
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
