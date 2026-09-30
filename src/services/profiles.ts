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
      console.warn("[getProfile] Supabase profile query:", error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error("[getProfile] Unexpected error:", err);
    return null;
  }
}

/**
 * Updates a user profile in public.profiles (strictly excludes role modification)
 */
export async function updateProfile(
  userId: string,
  profileData: Partial<Omit<Profile, "id" | "created_at" | "role">>
): Promise<{ success: boolean; profile?: Profile; error?: string }> {
  if (!userId) {
    return { success: false, error: "Usuario no autenticado." };
  }

  try {
    // Sanitize payload: strictly disallow role modification from frontend
    const sanitizedData = { ...profileData };
    delete (sanitizedData as Record<string, unknown>).role;
    delete (sanitizedData as Record<string, unknown>).id;

    const payload = {
      ...sanitizedData,
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
 * Authoritative check if a user has admin privileges in Supabase
 * Tries secure public.is_admin() RPC first, then falls back to verified profiles.role
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    // 1. Try secure is_admin RPC function
    const { data: rpcAdmin, error: rpcErr } = await supabase.rpc("is_admin");
    if (!rpcErr && typeof rpcAdmin === "boolean") {
      return rpcAdmin;
    }

    // 2. Query public.profiles directly
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
