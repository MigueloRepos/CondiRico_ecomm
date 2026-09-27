import { supabase } from "@/lib/supabase";

export interface NewsletterResult {
  success: boolean;
  message: string;
  alreadySubscribed?: boolean;
}

/**
 * Subscribes an email to the newsletter in public.newsletter_subscribers
 */
export async function subscribeNewsletter(email: string): Promise<NewsletterResult> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    return {
      success: false,
      message: "Por favor ingresa un correo electrónico válido.",
    };
  }

  try {
    // Check if subscriber already exists
    const { data: existing, error: searchErr } = await supabase
      .from("newsletter_subscribers")
      .select("id, is_active")
      .eq("email", trimmed)
      .maybeSingle();

    if (existing) {
      return {
        success: true,
        alreadySubscribed: true,
        message: "¡Ya te encuentras suscrito a nuestras novedades y ofertas exclusivas!",
      };
    }

    const { error: insertErr } = await supabase
      .from("newsletter_subscribers")
      .insert({
        email: trimmed,
        is_active: true,
      });

    if (insertErr) {
      if (insertErr.code === "23505") {
        return {
          success: true,
          alreadySubscribed: true,
          message: "¡Ya te encuentras suscrito a nuestras novedades y ofertas!",
        };
      }
      console.error("[subscribeNewsletter] Supabase error:", insertErr);
      return {
        success: false,
        message: "No pudimos completar la suscripción en este momento. Inténtalo nuevamente.",
      };
    }

    return {
      success: true,
      alreadySubscribed: false,
      message: "¡Gracias por suscribirte! Recibirás nuestras mejores promociones y novedades.",
    };
  } catch (err) {
    console.error("[subscribeNewsletter] Unexpected error:", err);
    return {
      success: false,
      message: "Ocurrió un error al procesar tu suscripción. Inténtalo más tarde.",
    };
  }
}
