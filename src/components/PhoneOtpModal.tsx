import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { verifyPhoneOtp, signInWithPhoneOtp } from "@/lib/supabase";
import { UserProfile } from "@/lib/auth";
import { findCountryByCode } from "@/data/countryCodes";

interface PhoneOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  countryCode: string;
  onSuccess: (user: UserProfile) => void;
  onBackToEditPhone?: () => void;
}

export const PhoneOtpModal: React.FC<PhoneOtpModalProps> = ({
  isOpen,
  onClose,
  phone,
  countryCode,
  onSuccess,
  onBackToEditPhone,
}) => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCode(["", "", "", "", "", ""]);
      setError(null);
      setSuccessMsg(null);
      setCountdown(60);
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 200);
    }
  }, [isOpen, phone]);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (!isOpen || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  const handleInputChange = (index: number, value: string) => {
    // Handle paste of complete 6-digit code
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newCode = [...code];
      digits.forEach((d, i) => {
        if (i < 6) newCode[i] = d;
      });
      setCode(newCode);
      const nextFocus = Math.min(digits.length, 5);
      inputsRef.current[nextFocus]?.focus();
      if (digits.length === 6) {
        verifyCode(newCode.join(""));
      }
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-advance
    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto submit on last digit
    if (digit && index === 5) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (otpToken: string) => {
    if (otpToken.length !== 6) {
      setError("Por favor ingresa los 6 dígitos del código SMS.");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const { user, error: verifyErr } = await verifyPhoneOtp({
        phone,
        token: otpToken,
        defaultCountryCode: countryCode,
      });

      if (verifyErr || !user) {
        setError(verifyErr || "Código incorrecto o expirado. Inténtalo nuevamente.");
        setIsVerifying(false);
        return;
      }

      setSuccessMsg("¡Código verificado con éxito!");
      setIsVerifying(false);
      setTimeout(() => {
        onSuccess(user);
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al validar el código SMS.");
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    setError(null);

    try {
      const { error: resendErr } = await signInWithPhoneOtp({
        phone,
        defaultCountryCode: countryCode,
      });

      if (resendErr) {
        setError(resendErr);
      } else {
        setSuccessMsg("Se ha enviado un nuevo código SMS a tu teléfono.");
        setCountdown(60);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reenviar el SMS.");
    } finally {
      setIsResending(false);
    }
  };

  const isComplete = code.every((d) => d !== "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-border shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all cursor-pointer"
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto size-14 rounded-2xl bg-primary/10 border border-primary/20 grid place-items-center mb-3">
            <Phone className="size-7 text-primary" />
          </div>
          <h3 className="text-xl font-black text-brand-deep">
            Verificación por SMS
          </h3>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Ingresa el código de 6 dígitos que enviamos por mensaje de texto al número:
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-3 py-1 text-xs font-bold text-brand-deep">
            {findCountryByCode(countryCode)?.flag && (
              <span className="text-sm">{findCountryByCode(countryCode)?.flag}</span>
            )}
            <span>{countryCode} {phone}</span>
            {onBackToEditPhone && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBackToEditPhone();
                }}
                className="text-[11px] text-primary hover:underline ml-1 cursor-pointer"
              >
                (Cambiar)
              </button>
            )}
          </div>
        </div>

        {/* Feedback notices */}
        {error && (
          <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-800 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 6 Digit Inputs */}
        <div className="flex justify-center gap-2 sm:gap-3 mb-6">
          {code.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputsRef.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="size-11 sm:size-12 rounded-2xl border-2 border-border bg-muted/20 text-center text-lg sm:text-xl font-extrabold text-brand-deep outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/15 transition-all"
            />
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => verifyCode(code.join(""))}
            disabled={!isComplete || isVerifying}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isVerifying ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Verificando código...</span>
              </>
            ) : (
              <>
                <span>Verificar e Ingresar</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>¿No recibiste el código?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className="font-bold text-primary hover:underline disabled:text-muted-foreground disabled:no-underline cursor-pointer flex items-center gap-1"
            >
              {isResending ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : countdown > 0 ? (
                <span>Reenviar en {countdown}s</span>
              ) : (
                <>
                  <RefreshCw className="size-3" />
                  <span>Reenviar SMS</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          <span>Autenticación protegida por Supabase Phone Auth</span>
        </div>
      </div>
    </div>
  );
};
