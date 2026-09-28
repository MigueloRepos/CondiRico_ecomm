import React, { useState, useEffect } from "react";
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  ArrowRight,
  ExternalLink,
  Edit2,
  Check,
  Sparkles,
  MousePointerClick,
} from "lucide-react";
import {
  resendConfirmationLinkWithSupabase,
  checkEmailConfirmedWithSupabase,
  verifyOtpWithSupabase,
} from "@/lib/supabase";
import { UserProfile } from "@/lib/auth";

interface EmailConfirmationModalProps {
  isOpen: boolean;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  onChangeEmail?: () => void;
}

export const EmailConfirmationModal: React.FC<EmailConfirmationModalProps> = ({
  isOpen,
  email,
  fullName,
  phone,
  address,
  onClose,
  onSuccess,
  onChangeEmail,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Focus and timer initialization
  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setSuccessMsg("");
      setResendCooldown(60);
      setCanResend(false);
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

  // Open appropriate email web client based on domain
  const getEmailClientUrl = (userEmail: string) => {
    const domain = userEmail.split("@")[1]?.toLowerCase() || "";
    if (domain.includes("gmail")) return "https://mail.google.com";
    if (domain.includes("outlook") || domain.includes("hotmail") || domain.includes("live") || domain.includes("msn")) {
      return "https://outlook.live.com";
    }
    if (domain.includes("yahoo")) return "https://mail.yahoo.com";
    if (domain.includes("icloud")) return "https://www.icloud.com/mail";
    return `mailto:${userEmail}`;
  };

  const handleOpenEmailClient = () => {
    const url = getEmailClientUrl(email);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Re-check confirmation status
  const handleCheckConfirmation = async () => {
    setIsVerifying(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { confirmed, user } = await checkEmailConfirmedWithSupabase();
      if (confirmed && user) {
        setSuccessMsg("¡Correo confirmado con éxito! Redirigiendo...");
        setIsVerifying(false);
        setTimeout(() => {
          onSuccess(user);
        }, 800);
      } else {
        setIsVerifying(false);
        setErrorMsg("Aún no detectamos la confirmación. Por favor haz clic en el enlace enviado a tu correo.");
      }
    } catch (err: unknown) {
      setIsVerifying(false);
      setErrorMsg(err instanceof Error ? err.message : "Error al comprobar el estado de confirmación.");
    }
  };

  // Resend confirmation link
  const handleResendLink = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setErrorMsg("");
    setSuccessMsg("");

    const res = await resendConfirmationLinkWithSupabase(email);
    setIsResending(false);

    if (res.success) {
      setSuccessMsg("¡Nuevo enlace de confirmación enviado! Revisa tu bandeja de entrada o spam.");
      setResendCooldown(60);
      setCanResend(false);
    } else {
      setErrorMsg(res.error || "No se pudo reenviar el enlace. Intenta de nuevo.");
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
          aria-label="Cerrar modal de confirmación"
        >
          <X className="size-4" />
        </button>

        {/* Header Badge & Icon */}
        <div className="text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_10px_25px_rgba(16,185,129,0.35)] mb-3">
            <Mail className="size-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-1 text-[11px] font-black text-emerald-800">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            <span>Confirmación vía Enlace Directo</span>
          </div>

          <h3 className="text-2xl font-black text-brand-deep tracking-tight mt-2.5">
            Verifica tu Correo
          </h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Hemos enviado un <strong>enlace de confirmación</strong> a tu dirección:
          </p>

          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 border border-white/90 text-xs font-black text-foreground shadow-2xs">
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

        {/* Instructions Card */}
        <div className="mt-5 p-4 rounded-2xl bg-white/60 border border-white/80 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-start gap-2.5">
            <div className="grid size-5 place-items-center rounded-full bg-primary/10 text-primary font-extrabold text-[11px] shrink-0 mt-0.5">
              1
            </div>
            <p className="leading-snug">
              Abre tu correo electrónico y busca el mensaje de <strong>CondiRico</strong>.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="grid size-5 place-items-center rounded-full bg-primary/10 text-primary font-extrabold text-[11px] shrink-0 mt-0.5">
              2
            </div>
            <p className="leading-snug">
              Haz clic en el botón <strong>"Confirmar mi cuenta"</strong> en el correo.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="grid size-5 place-items-center rounded-full bg-primary/10 text-primary font-extrabold text-[11px] shrink-0 mt-0.5">
              3
            </div>
            <p className="leading-snug">
              Tu cuenta quedará activada e ingresarás automáticamente a la tienda.
            </p>
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

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={handleOpenEmailClient}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm shadow-lg shadow-primary/25 liquid-glass-button active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink className="size-4" />
            <span>Abrir mi Correo ({email.split("@")[1] || "Bandeja"})</span>
          </button>

          <button
            type="button"
            onClick={handleCheckConfirmation}
            disabled={isVerifying}
            className="w-full h-11 rounded-2xl bg-white/80 hover:bg-white text-brand-deep border border-white/90 font-bold text-xs shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>Comprobando estado con Supabase...</span>
              </>
            ) : (
              <>
                <MousePointerClick className="size-3.5 text-primary" />
                <span>Ya confirmé mi correo (Comprobar estado)</span>
              </>
            )}
          </button>
        </div>

        {/* Resend Confirmation Link Section */}
        <div className="mt-5 text-center pt-4 border-t border-white/60">
          <p className="text-xs text-muted-foreground">
            ¿No has recibido el enlace de confirmación?
          </p>

          <div className="mt-2 flex items-center justify-center gap-2">
            {canResend ? (
              <button
                type="button"
                onClick={handleResendLink}
                disabled={isResending}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors py-1.5 px-4 rounded-full bg-primary/10 hover:bg-primary/15 border border-primary/20 active:scale-95"
              >
                {isResending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                <span>Reenviar enlace de confirmación</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground bg-white/50 px-3.5 py-1 rounded-full border border-white/80">
                <RefreshCw className="size-3 animate-spin text-muted-foreground/60" />
                <span>Reenviar enlace disponible en {resendCooldown}s</span>
              </span>
            )}
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground/80 leading-relaxed">
            Por favor revisa también tu carpeta de <strong>Spam</strong> o <strong>Correo No Deseado</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
