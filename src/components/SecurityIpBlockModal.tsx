import React, { useState } from "react";
import {
  ShieldAlert,
  X,
  Lock,
  Globe,
  AlertTriangle,
  Server,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface SecurityIpBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  currentIp: string;
  registeredIp: string;
  onAuthorizeCurrentIp?: () => void;
}

export const SecurityIpBlockModal: React.FC<SecurityIpBlockModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  currentIp,
  registeredIp,
  onAuthorizeCurrentIp,
}) => {
  const [showUnlockForm, setShowUnlockForm] = useState(false);
  const [unlockCode, setUnlockCode] = useState("");
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const [unlockError, setUnlockError] = useState("");

  if (!isOpen) return null;

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError("");

    // Simulate verification or password unlock
    if (unlockCode.trim().length >= 4) {
      setUnlockSuccess(true);
      setTimeout(() => {
        onAuthorizeCurrentIp?.();
        onClose();
      }, 1200);
    } else {
      setUnlockError("Ingresa tu código de seguridad o contraseña para autorizar esta red.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 backdrop-blur-md p-4 transition-opacity animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-[36px] bg-gradient-to-b from-stone-900 via-stone-950 to-black p-7 sm:p-9 shadow-[0_30px_90px_rgba(239,68,68,0.35)] border border-red-500/40 animate-in zoom-in-95 duration-300 text-left overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glowing Edge */}
        <div className="absolute inset-x-12 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-56 rounded-full bg-red-600/25 blur-3xl" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-white/10 text-white/70 hover:text-white border border-white/10 shadow-xs transition-all active:scale-90"
          aria-label="Cerrar aviso de seguridad"
        >
          <X className="size-4" />
        </button>

        {/* Header with Alarm Icon */}
        <div className="flex items-center gap-3.5">
          <div className="grid size-14 place-items-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 shadow-lg shadow-red-500/20 animate-pulse">
            <ShieldAlert className="size-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-300 border border-red-500/30">
              <AlertTriangle className="size-3 text-red-400" />
              <span>Protección Anti-Intrusos User_Sec</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
              Acceso Bloqueado por Seguridad
            </h3>
          </div>
        </div>

        {/* Main Alert Message */}
        <p className="mt-4 text-xs sm:text-sm text-stone-300 leading-relaxed">
          Se ha bloqueado el inicio de sesión para la cuenta{" "}
          <strong className="text-white underline">{userEmail}</strong> debido a que
          la dirección IP del dispositivo actual no coincide con la IP de seguridad
          registrada en <strong>Supabase (<code className="text-red-400">User_Sec</code>)</strong>.
        </p>

        {/* IP Comparison Shield Card */}
        <div className="mt-5 rounded-2xl bg-stone-900/90 border border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
            <span className="text-stone-400 flex items-center gap-1.5">
              <Globe className="size-3.5 text-red-400" />
              <span>IP Actual del Intento:</span>
            </span>
            <span className="font-mono font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
              {currentIp}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400 flex items-center gap-1.5">
              <Server className="size-3.5 text-emerald-400" />
              <span>IP Autorizada en Supabase:</span>
            </span>
            <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              {registeredIp}
            </span>
          </div>
        </div>

        {/* Safety Explanation */}
        <div className="mt-4 rounded-xl bg-red-950/40 border border-red-800/40 p-3 text-xs text-red-200/90 flex items-start gap-2.5">
          <Lock className="size-4 text-red-400 shrink-0 mt-0.5" />
          <p className="leading-snug">
            Esta regla impide que terceros o intrusos accedan a tus pedidos o datos desde redes o dispositivos externos no autorizados.
          </p>
        </div>

        {/* Unlock or Authorize Section */}
        {unlockSuccess ? (
          <div className="mt-5 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs flex items-center gap-3">
            <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
            <span>¡Red autorizada con éxito! Actualizando registro en Supabase User_Sec...</span>
          </div>
        ) : showUnlockForm ? (
          <form onSubmit={handleUnlockSubmit} className="mt-5 space-y-3">
            <label className="block text-xs font-bold text-stone-300">
              ¿Eres el dueño de la cuenta? Ingresa tu contraseña o código de confirmación:
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={unlockCode}
                onChange={(e) => setUnlockCode(e.target.value)}
                placeholder="Contraseña de la cuenta"
                className="flex-1 h-11 px-3.5 rounded-xl bg-stone-800 border border-white/20 text-xs text-white placeholder:text-stone-500 outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all shrink-0"
              >
                Autorizar IP
              </button>
            </div>
            {unlockError && <p className="text-[11px] text-red-400 font-bold">{unlockError}</p>}
          </form>
        ) : (
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => setShowUnlockForm(true)}
              className="w-full sm:flex-1 h-12 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>Soy el titular (Autorizar esta red)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg shadow-red-600/30 transition-all active:scale-95"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
