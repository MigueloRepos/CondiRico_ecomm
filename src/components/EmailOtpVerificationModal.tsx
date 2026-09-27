import React, { useState, useEffect, useRef } from "react";
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  ArrowRight,
  Sparkles,
  ExternalLink,
  KeyRound,
  Edit2,
} from "lucide-react";
import {
  verifyOtpWithSupabase,
  resendVerificationOtpWithSupabase,
} from "@/lib/supabase";
import { UserProfile } from "@/lib/auth";

interface EmailOtpVerificationModalProps {
  isOpen: boolean;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  onChangeEmail?: () => void;
}

export const EmailOtpVerificationModal: React.FC<EmailOtpVerificationModalProps> = ({
  isOpen,
  email,
  fullName,
  phone,
  address,
  onClose,
  onSuccess,
  onChangeEmail,
}) => {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input and manage countdown timer when opened
  useEffect(() => {
    if (isOpen) {
      setDigits(["", "", "", "", "", ""]);
      setErrorMsg("");
      setSuccessMsg("");
      setResendCooldown(60);
      setCanResend(false);

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [isOpen, email]);

  // Cooldown countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, resendCooldown]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    setErrorMsg("");

    // Handle paste of complete 6-digit code
    if (value.length > 1) {
      const cleaned = value.replace(/\D/g, "").slice(0, 6);
      if (cleaned.length > 0) {
        const newDigits = [...digits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = cleaned[i] || "";
        }
        setDigits(newDigits);
        const nextFocusIndex = Math.min(cleaned.length, 5);
        inputRefs.current[nextFocusIndex]?.focus();

        if (cleaned.length === 6) {
          triggerVerification(cleaned);
        }
      }
      return;
    }

    // Only allow digits
    const cleanChar = value.replace(/\D/g, "");
    const newDigits = [...digits];
    newDigits[index] = cleanChar;
    setDigits(newDigits);

    // Auto-advance to next input
    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    const fullCode = newDigits.join("");
    if (fullCode.length === 6 && !newDigits.includes("")) {
      triggerVerification(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const triggerVerification = async (tokenCode: string) => {
    if (tokenCode.length !== 6) {
      setErrorMsg("Por favor ingresa los 6 dígitos del código.");
      return;
    }

    setIsVerifying(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { user, error } = await verifyOtpWithSupabase({
        email,
        token: tokenCode,
        userDataFallback: {
          fullName,
          phone,
          address,
        },
      });

      if (error || !user) {
        setIsVerifying(false);
        setErrorMsg(
          error || "Código incorrecto o expirado. Verifica el correo e inténtalo de nuevo."
        );
        return;
      }

      setSuccessMsg("¡Correo verificado con éxito! Bienvenido a CondiRico.");
      setIsVerifying(false);

      setTimeout(() => {
        onSuccess(user);
      }, 800);
    } catch (err: unknown) {
      setIsVerifying(false);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Error al validar el código de verificación con Supabase."
      );
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = digits.join("");
    triggerVerification(fullCode);
  };

  const handleResendOtp = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setErrorMsg("");
    setSuccessMsg("");

    const res = await resendVerificationOtpWithSupabase(email);
    setIsResending(false);

    if (res.success) {
      setSuccessMsg("Nuevo código enviado. Revisa tu bandeja de entrada o spam.");
      setResendCooldown(60);
      setCanResend(false);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } else {
      setErrorMsg(res.error || "No se pudo reenviar el código. Intenta de nuevo.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-md p-4 transition-opacity animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-[36px] liquid-glass p-7 sm:p-9 shadow-[0_30px_70px_-15px_rgba(20,83,45,0.3)] border border-white/80 animate-in zoom-in-95 duration-300 overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Specular edge top highlight */}
        <div className="absolute inset-x-12 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

        {/* Ambient Glow */}
        <div className="pointer-events-none absolute -top-24 right-0 size-48 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-0 size-48 rounded-full bg-amber-400/15 blur-3xl" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-white/70 text-muted-foreground hover:text-foreground border border-white/80 shadow-xs transition-all active:scale-90"
          aria-label="Cerrar modal de verificación"
        >
          <X className="size-4" />
        </button>

        {/* Header Badge & Icon */}
        <div className="text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_10px_25px_rgba(16,185,129,0.35)] mb-3">
            <Mail className="size-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3 py-0.5 text-[11px] font-black text-emerald-800">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            <span>Verificación de Seguridad Supabase</span>
          </div>

          <h3 className="text-2xl font-black text-brand-deep tracking-tight mt-2">
            Ingresa tu Código
          </h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Hemos enviado un código de confirmación de 6 dígitos a:
          </p>

          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-white/90 text-xs font-black text-foreground shadow-2xs">
            <span className="truncate max-w-[240px]">{email}</span>
            {onChangeEmail && (
              <button
                type="button"
                onClick={onChangeEmail}
                className="text-[11px] text-primary hover:underline flex items-center gap-0.5 ml-1"
                title="Cambiar correo"
              >
                <Edit2 className="size-3" />
                <span>Editar</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-destructive/10 border border-destructive/25 text-xs text-destructive flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-bold">{successMsg}</span>
          </div>
        )}

        {/* 6-Digit OTP Form */}
        <form onSubmit={handleManualSubmit} className="mt-6">
          <div className="flex justify-center gap-2 sm:gap-2.5">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isVerifying}
                className="size-11 sm:size-12 rounded-2xl border border-white/90 bg-white/80 text-center text-lg sm:text-xl font-black text-foreground shadow-inner focus:bg-white focus:ring-3 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all disabled:opacity-50"
              />
            ))}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isVerifying || digits.join("").length !== 6}
            className="w-full mt-6 h-12 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm shadow-lg shadow-primary/25 liquid-glass-button active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Verificando con Supabase...</span>
              </>
            ) : (
              <>
                <span>Confirmar y Acceder</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        {/* Resend OTP Section & Timer */}
        <div className="mt-5 text-center pt-4 border-t border-white/60">
          <p className="text-xs text-muted-foreground">
            ¿No has recibido el código en tu bandeja?
          </p>

          <div className="mt-2 flex items-center justify-center gap-2">
            {canResend ? (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors py-1 px-3 rounded-full bg-primary/10 hover:bg-primary/15 border border-primary/20 active:scale-95"
              >
                {isResending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                <span>Reenviar código de verificación</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-white/50 px-3 py-1 rounded-full border border-white/80">
                <RefreshCw className="size-3 animate-spin text-muted-foreground/60" />
                <span>Reenviar disponible en {resendCooldown}s</span>
              </span>
            )}
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground/80 leading-relaxed">
            Revisa también tu carpeta de <strong>Spam</strong> o <strong>Promociones</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
