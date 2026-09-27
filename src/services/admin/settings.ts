import { supabase } from "@/lib/supabase";
import { AdminSettings } from "@/types/admin";
import { logAdminActivity } from "./activity";

const DEFAULT_SETTINGS: AdminSettings = {
  id: 1,
  business_name: "CondiRico",
  email: "hola@condirico.com",
  phone: "+1 800 CONDI RICO",
  whatsapp: "+1 800 266 3474",
  address: "Av. Providencia 1234, Local 5",
  city: "Santiago",
  currency: "EUR",
  min_order_amount: 10,
  maintenance_mode: false,
  logo_url: "",
  whatsapp_orders_enabled: true,
  newsletter_enabled: true,
};

export async function getAdminSettings(): Promise<AdminSettings> {
  try {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("[getAdminSettings] Warning:", error.message);
      return DEFAULT_SETTINGS;
    }

    if (!data) {
      return DEFAULT_SETTINGS;
    }

    return {
      id: data.id,
      business_name: data.business_name || DEFAULT_SETTINGS.business_name,
      email: data.email || DEFAULT_SETTINGS.email,
      phone: data.phone || DEFAULT_SETTINGS.phone,
      whatsapp: data.whatsapp || DEFAULT_SETTINGS.whatsapp,
      address: data.address || DEFAULT_SETTINGS.address,
      city: data.city || DEFAULT_SETTINGS.city,
      currency: data.currency || DEFAULT_SETTINGS.currency,
      min_order_amount: Number(data.min_order_amount ?? DEFAULT_SETTINGS.min_order_amount),
      maintenance_mode: Boolean(data.maintenance_mode),
      logo_url: data.logo_url || "",
      whatsapp_orders_enabled: data.whatsapp_orders_enabled !== false,
      newsletter_enabled: data.newsletter_enabled !== false,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (err) {
    console.error("[getAdminSettings] Error:", err);
    return DEFAULT_SETTINGS;
  }
}

export async function updateAdminSettings(
  settings: Partial<AdminSettings>
): Promise<{ success: boolean; data?: AdminSettings; error?: string }> {
  try {
    const payload = {
      business_name: settings.business_name,
      email: settings.email || null,
      phone: settings.phone || null,
      whatsapp: settings.whatsapp || null,
      address: settings.address || null,
      city: settings.city || null,
      currency: settings.currency || "EUR",
      min_order_amount: settings.min_order_amount !== undefined ? Number(settings.min_order_amount) : 10,
      maintenance_mode: Boolean(settings.maintenance_mode),
      logo_url: settings.logo_url || null,
      whatsapp_orders_enabled: Boolean(settings.whatsapp_orders_enabled),
      newsletter_enabled: Boolean(settings.newsletter_enabled),
      updated_at: new Date().toISOString(),
    };

    // Check if row exists
    const { data: existing } = await supabase.from("admin_settings").select("id").limit(1).maybeSingle();

    let result;
    if (existing?.id) {
      result = await supabase
        .from("admin_settings")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("admin_settings")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    await logAdminActivity(
      "SETTINGS_UPDATED",
      "admin_settings",
      result.data?.id,
      "Configuración general del negocio actualizada"
    );

    return { success: true, data: result.data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al guardar configuración.";
    return { success: false, error: msg };
  }
}
