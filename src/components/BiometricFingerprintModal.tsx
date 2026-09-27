import React, { useState, useEffect } from "react";
import { Fingerprint, CheckCircle2, AlertCircle, X, ShieldCheck, Sparkles } from "lucide-react";

interface BiometricFingerprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "register" | "verify";
  userEmail?: string;
  userName?: string;
}

export const BiometricFingerprintModal: React.FC<BiometricFingerprintModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  userEmail,
  userName,
}) => {
  const [scanState, setScanState] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const autoScanTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const scanTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const successTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = () => {
    if (autoScanTimerRef.current) clearTimeout(autoScanTimerRef.current);
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
  };

  useEffect(() => {
    if (isOpen) {
      setScanState("idle");
      setErrorMessage("");
      autoScanTimerRef.current = setTimeout(() => {
        handleTriggerScan();
      }, 500);
    }
    return () => {
      clearAllTimers();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTriggerScan = () => {
    if (scanState === "scanning" || scanState === "success") return;
    setScanState("scanning");
    setErrorMessage("");

    scanTimerRef.current = setTimeout(() => {
      setScanState("success");
      successTimerRef.current = setTimeout(() => {
        onSuccess();
      }, 900);
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-[32px] liquid-glass p-7 shadow-[0_25px_60px_-15px_rgba(20,83,45,0.3)] text-center animate-in zoom-in-95 duration-300 overflow-hidden border border-white/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Specular Sheen */}
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-white/70 text-muted-foreground border border-white shadow-xs hover:bg-white active:scale-90 transition-all"
          aria-label="Cerrar ventana de biometría"
        >
          <X className="size-4" />
        </button>

        {/* Header Icon Badge */}
        <div className="mx-auto mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold shadow-2xs">
          <ShieldCheck className="size-3.5" />
          <span>Biometría Segura CondiRico</span>
        </div>

        <h3 className="text-xl font-black text-brand-deep tracking-tight">
          {mode === "register" ? "Vincular Huella Dactilar" : "Acceso con Huella Dactilar"}
        </h3>
        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
          {mode === "register"
            ? `Coloca tu dedo en el sensor para activar las compras con un solo toque para ${userName || userEmail || "tu cuenta"}.`
            : `Verifica tu identidad para ingresar a tu cuenta ${userName || userEmail ? `(${userName || userEmail})` : ""}.`}
        </p>

        {/* Interactive Fingerprint Scanner Pedestal */}
        <div className="my-8 flex flex-col items-center justify-center">
          <div
            onClick={handleTriggerScan}
            role="button"
            tabIndex={0}
            aria-label="Escanear huella dactilar"
            className="group relative cursor-pointer select-none"
          >
            {/* Ripples when scanning */}
            {scanState === "scanning" && (
              <>
                <div className="absolute inset-0 rounded-full bg-emerald-400/25 animate-ping duration-1000" />
                <div className="absolute -inset-3 rounded-full border-2 border-emerald-500/40 animate-pulse" />
              </>
            )}

            {scanState === "success" && (
              <div className="absolute -inset-3 rounded-full bg-emerald-500/20 animate-pulse" />
            )}

            {/* Central biometric button */}
            <div
              className={`relative grid size-28 place-items-center rounded-3xl border-2 transition-all duration-400 shadow-xl overflow-hidden ${
                scanState === "scanning"
                  ? "bg-emerald-50 border-emerald-500 shadow-emerald-500/30 scale-105"
                  : scanState === "success"
                  ? "bg-emerald-600 border-emerald-500 shadow-emerald-600/40 text-white scale-105"
                  : scanState === "error"
                  ? "bg-rose-50 border-rose-400 shadow-rose-500/20"
                  : "bg-white/80 border-white hover:border-emerald-300 hover:bg-white active:scale-95"
              }`}
            >
              {/* Laser scanning beam */}
              {scanState === "scanning" && (
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,1)] animate-bounce duration-700" />
              )}

              {scanState === "success" ? (
                <CheckCircle2 className="size-14 text-white animate-in zoom-in duration-300" />
              ) : scanState === "error" ? (
                <AlertCircle className="size-14 text-rose-500 animate-in zoom-in duration-300" />
              ) : (
                <Fingerprint
                  className={`size-14 transition-all duration-300 ${
                    scanState === "scanning"
                      ? "text-emerald-600 scale-110 animate-pulse"
                      : "text-brand-deep/70 group-hover:text-emerald-600 group-hover:scale-105"
                  }`}
                />
              )}
            </div>
          </div>

          {/* Status Text Prompt */}
          <div className="mt-4 min-h-[3rem] flex items-center justify-center">
            {scanState === "idle" && (
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-sun animate-pulse" />
                <span>Toca el sensor o coloca tu dedo en el lector</span>
              </p>
            )}
            {scanState === "scanning" && (
              <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 animate-pulse">
                <span>Escaneando huella biométrica...</span>
              </p>
            )}
            {scanState === "success" && (
              <p className="text-xs font-black text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="size-4" />
                <span>
                  {mode === "register"
                    ? "¡Huella vinculada con éxito!"
                    : "¡Autenticación biométrica exitosa!"}
                </span>
              </p>
            )}
            {scanState === "error" && (
              <div className="text-center">
                <p className="text-xs font-bold text-rose-600">{errorMessage}</p>
                <button
                  type="button"
                  onClick={handleTriggerScan}
                  className="mt-1 text-[11px] font-extrabold text-primary underline"
                >
                  Volver a intentar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/60">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-2xl bg-white/70 border border-white/80 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-98 transition-all"
          >
            {mode === "register" ? "Hacerlo más tarde" : "Usar contraseña tradicional"}
          </button>
        </div>
      </div>
    </div>
  );
};
