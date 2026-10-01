import React, { useState } from "react";
import { X, MessageSquare, Phone, Clock, ArrowRight, Sparkles, Send } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

interface WhatsAppInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber?: string;
}

const COMMON_INQUIRIES = [
  "¿Cuáles son los tiempos y zonas de entrega en 24h?",
  "Deseo consultar la disponibilidad de un producto.",
  "¿Cuáles son los métodos de pago aceptados?",
  "Tengo una duda con mi compra o factura.",
];

export const WhatsAppInquiryModal: React.FC<WhatsAppInquiryModalProps> = ({
  isOpen,
  onClose,
  phoneNumber = "34600123456",
}) => {
  const [selectedTopic, setSelectedTopic] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  if (!isOpen) return null;

  const activeQuestion = customMessage.trim() || selectedTopic || "Hola CondiRico, tengo una consulta:";
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `👋 ¡Hola CondiRico! Tengo una consulta o inquietud:\n\n"${activeQuestion}"\n\n¿Me podrían asesorar por favor? ¡Muchas gracias!`
  )}`;

  const handleOpenWhatsApp = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md transition-opacity duration-300 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white border border-border p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="Cerrar ventana de consultas"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="grid size-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25 shrink-0">
            <WhatsAppIcon className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Atención Directa
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Respuesta rápida
              </span>
            </div>
            <h2 className="mt-1 text-xl sm:text-2xl font-extrabold text-brand-deep tracking-tight">
              ¿Tienes alguna duda o inquietud?
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5">
          Nuestro equipo de atención al cliente está listo para resolver cualquier pregunta sobre productos, envíos, métodos de pago o asistirte en tu compra.
        </p>

        {/* Quick Topics */}
        <div className="space-y-2 mb-4">
          <label className="block text-xs font-bold text-foreground">
            Preguntas frecuentes rápidas:
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {COMMON_INQUIRIES.map((topic) => {
              const isSelected = selectedTopic === topic;
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => {
                    setSelectedTopic(isSelected ? "" : topic);
                    if (!isSelected) setCustomMessage(topic);
                  }}
                  className={`text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                      : "bg-muted/30 text-foreground/80 border-border hover:bg-muted/70 hover:border-[#CBD5CE]"
                  }`}
                >
                  <span className="truncate pr-2">{topic}</span>
                  <MessageSquare className={`size-3.5 shrink-0 ${isSelected ? "text-emerald-600" : "text-muted-foreground"}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Message Textarea */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-foreground mb-1.5">
            O escribe tu inquietud detallada:
          </label>
          <textarea
            rows={3}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Escribe aquí tu duda sobre productos, horarios, cobertura..."
            className="w-full rounded-xl border border-border bg-white p-3 text-xs sm:text-sm outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/10 resize-none"
          />
        </div>

        {/* Action Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOpenWhatsApp}
          className="w-full h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 active:scale-95 cursor-pointer"
        >
          <WhatsAppIcon className="size-4.5" />
          <span>Iniciar Consulta por WhatsApp</span>
          <ArrowRight className="size-4" />
        </a>

        {/* Secondary Info Card */}
        <div className="mt-4 pt-3.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Phone className="size-3.5 text-primary" />
            <span className="font-semibold">+1 800 CONDI RICO</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground" />
            <span>8:00 AM – 8:00 PM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
