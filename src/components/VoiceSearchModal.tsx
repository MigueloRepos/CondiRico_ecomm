import React, { useEffect, useState } from "react";
import {
  Mic,
  MicOff,
  X,
  Search,
  Sparkles,
  Volume2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { useVoiceSearch, VoiceCommandResult } from "@/hooks/useVoiceSearch";
import { CategoryId } from "@/data/products";

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchQuery: (query: string) => void;
  onNavigateToCategory?: (categoryId: CategoryId) => void;
  onNavigateToOffers?: () => void;
  onNavigateToStore?: () => void;
}

const VOICE_TIPS = [
  "“Buscar aceite de oliva virgen”",
  "“Arroz grano largo”",
  "“Detergente líquido para ropa”",
  "“Ver productos de limpieza”",
  "“Ir a ofertas”",
];

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onSearchQuery,
  onNavigateToCategory,
  onNavigateToOffers,
  onNavigateToStore,
}) => {
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleVoiceResult = (result: VoiceCommandResult) => {
    setSuccessNotice(result.cleanQuery || result.rawTranscript);

    setTimeout(() => {
      if (result.action === "navigate_store") {
        onNavigateToStore?.();
      } else if (result.action === "navigate_offers") {
        onNavigateToOffers?.();
      } else if (result.action === "category" && result.targetCategory) {
        onNavigateToCategory?.(result.targetCategory);
      } else if (result.cleanQuery) {
        onSearchQuery(result.cleanQuery);
      }
      onClose();
      setSuccessNotice(null);
    }, 650);
  };

  const {
    isListening,
    transcript,
    isSupported,
    errorMessage,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceSearch({
    onResult: handleVoiceResult,
    autoStopDelay: 1500,
  });

  // Start listening automatically when opened
  useEffect(() => {
    if (isOpen) {
      resetTranscript();
      setSuccessNotice(null);
      // Small delay to ensure modal DOM is mounted
      const timer = setTimeout(() => {
        startListening();
      }, 200);
      return () => clearTimeout(timer);
    } else {
      stopListening();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualExecute = () => {
    if (transcript.trim()) {
      stopListening();
      onSearchQuery(transcript.trim());
      onClose();
    }
  };

  const handleQuickTip = (text: string) => {
    const clean = text.replace(/[“”"]/g, "");
    stopListening();
    onSearchQuery(clean);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 backdrop-blur-md p-4 transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-[36px] liquid-glass p-7 sm:p-9 text-center shadow-[0_30px_70px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Specular Edge Line */}
        <div className="absolute inset-x-12 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

        {/* Ambient Glow Orb */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-48 rounded-full bg-emerald-400/25 blur-3xl" />

        {/* Header close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-white/70 text-muted-foreground hover:text-foreground border border-white/80 shadow-xs transition-all active:scale-90"
          aria-label="Cerrar modal de voz"
        >
          <X className="size-4" />
        </button>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/75 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-primary shadow-2xs backdrop-blur-md">
          <Sparkles className="size-3 text-offer" />
          <span>Búsqueda por Voz CondiRico</span>
        </div>

        {/* Title */}
        <h3 className="mt-4 text-xl sm:text-2xl font-black text-brand-deep">
          {successNotice
            ? "¡Comando entendido!"
            : isListening
            ? "Te estamos escuchando..."
            : errorMessage
            ? "Atención al micrófono"
            : "Di lo que buscas"}
        </h3>

        {/* Microphone Ripple Visualizer Area */}
        <div className="relative my-7 flex flex-col items-center justify-center min-h-[150px]">
          {/* Concentric Pulse Rings when listening */}
          {isListening && (
            <>
              <div className="absolute size-36 rounded-full bg-primary/15 animate-ping opacity-60 pointer-events-none" />
              <div className="absolute size-28 rounded-full bg-primary/20 animate-pulse pointer-events-none" />
              <div className="absolute size-24 rounded-full bg-offer/20 blur-sm pointer-events-none" />
            </>
          )}

          {/* Central Mic Button */}
          <button
            type="button"
            onClick={() => {
              if (isListening) {
                stopListening();
              } else {
                startListening();
              }
            }}
            className={`relative z-10 grid size-20 sm:size-22 place-items-center rounded-full border-2 transition-all duration-500 shadow-xl active:scale-95 ${
              isListening
                ? "bg-gradient-to-tr from-primary to-emerald-400 border-white text-white shadow-primary/40 scale-105"
                : errorMessage
                ? "bg-gradient-to-tr from-amber-500 to-rose-500 border-white text-white shadow-rose-500/30"
                : "bg-white/90 border-primary/30 text-primary shadow-md hover:scale-105"
            }`}
            aria-label={isListening ? "Detener grabación de voz" : "Iniciar grabación de voz"}
          >
            {successNotice ? (
              <CheckCircle2 className="size-9 animate-in zoom-in text-white" />
            ) : isListening ? (
              <Mic className="size-9 animate-pulse" />
            ) : (
              <MicOff className="size-9" />
            )}
          </button>

          {/* Equalizer Sound Wave Bars when active */}
          {isListening && (
            <div className="mt-5 flex items-center justify-center gap-1.5 h-6">
              {[0.4, 0.9, 0.6, 1, 0.7, 0.3, 0.8, 0.5, 0.9, 0.4].map((scale, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full animate-pulse"
                  style={{
                    height: `${Math.max(6, scale * 24)}px`,
                    animationDuration: `${0.4 + (i % 4) * 0.2}s`,
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              ))}
            </div>
          )}

          {!isListening && !errorMessage && !successNotice && (
            <p className="mt-4 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Volume2 className="size-3.5 text-primary" />
              <span>Toca el micrófono para comenzar a hablar</span>
            </p>
          )}
        </div>

        {/* Transcript Live Box */}
        {(transcript || successNotice) && (
          <div className="mb-5 rounded-2xl border border-white/90 bg-white/80 p-4 shadow-sm backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Texto reconocido:
            </p>
            <p className="mt-1 text-base sm:text-lg font-black text-brand-deep break-words">
              “{successNotice || transcript}”
            </p>
          </div>
        )}

        {/* Error Notice */}
        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-left text-xs font-semibold text-rose-800 shadow-xs backdrop-blur-md">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <p>{errorMessage}</p>
                <button
                  type="button"
                  onClick={() => startListening()}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-rose-500 active:scale-95"
                >
                  <RotateCcw className="size-3" />
                  <span>Reintentar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Button if transcript exists and not yet submitted */}
        {transcript && !successNotice && (
          <div className="mb-5 flex gap-2 justify-center">
            <button
              type="button"
              onClick={handleManualExecute}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-black text-primary-foreground shadow-md shadow-primary/30 liquid-glass-button active:scale-95"
            >
              <Search className="size-3.5" />
              <span>Buscar “{transcript}”</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        )}

        {/* Voice Command Examples */}
        <div className="border-t border-white/60 pt-4 text-left">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="size-3 text-offer" />
            <span>Ejemplos que puedes decir:</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {VOICE_TIPS.map((tip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickTip(tip)}
                className="rounded-full border border-white/80 bg-white/60 px-3 py-1 text-[11px] font-medium text-foreground/80 hover:bg-white hover:text-primary transition-all active:scale-95 shadow-2xs"
              >
                {tip}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
