import { supabase } from "@/lib/supabase";

export interface ContactMessageInput {
  name: string;
  email: string;
  phone?: string | null;
  topic: string;
  message: string;
}

export interface ContactMessageResult {
  success: boolean;
  message: string;
}

/**
 * Sends a message to public.contact_messages
 */
export async function sendContactMessage(input: ContactMessageInput): Promise<ContactMessageResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const message = input.message.trim();
  const topic = input.topic.trim() || "Consulta General";
  const phone = input.phone?.trim() || null;

  if (!name || !email || !message) {
    return {
      success: false,
      message: "Por favor completa tu nombre, correo y el mensaje.",
    };
  }

  try {
    const { error } = await supabase
      .from("contact_messages")
      .insert({
        name,
        email,
        phone,
        topic,
        message,
        status: "new",
      });

    if (error) {
      console.error("[sendContactMessage] Supabase error:", error);
      return {
        success: false,
        message: "No se pudo enviar tu mensaje. Por favor contáctanos por WhatsApp o inténtalo más tarde.",
      };
    }

    return {
      success: true,
      message: "¡Tu mensaje ha sido enviado con éxito! Nuestro equipo de atención te responderá a la brevedad.",
    };
  } catch (err) {
    console.error("[sendContactMessage] Unexpected error:", err);
    return {
      success: false,
      message: "Ocurrió un error al enviar el mensaje. Inténtalo nuevamente.",
    };
  }
}
