import React, { useState, useEffect } from "react";
import {
  Database,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Key,
  Globe,
  Loader2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
} from "@/lib/supabase";

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url || "");
      setAnonKey(config.anonKey || "");
      setTestResult(null);
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: "Por favor ingresa tanto la URL de Supabase como la Anon Key.",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(url, anonKey);
    setIsTesting(false);
    setTestResult(res);
  };

  const handleSave = () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: "Ingresa la URL y la Anon Key antes de guardar.",
      });
      return;
    }

    saveSupabaseConfig(url, anonKey);
    setIsSaved(true);
    onConfigSaved?.();
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleResetToDefault = () => {
    clearSupabaseConfig();
    const def = getSupabaseConfig();
    setUrl(def.url);
    setAnonKey(def.anonKey);
    setTestResult({
      success: true,
      message: "Restablecido a la instancia predeterminada de CondiRico.",
    });
    onConfigSaved?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 backdrop-blur-md p-4 transition-opacity animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-[36px] liquid-glass p-7 sm:p-9 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Specular Edge Line */}
        <div className="absolute inset-x-12 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

        {/* Ambient Glow */}
        <div className="pointer-events-none absolute -top-24 right-0 size-48 rounded-full bg-emerald-400/20 blur-3xl" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-white/70 text-muted-foreground hover:text-foreground border border-white/80 shadow-xs transition-all active:scale-90"
          aria-label="Cerrar modal de configuración"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="grid size-11 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-600 border border-emerald-500/20 shadow-xs">
            <Database className="size-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black text-emerald-700">
              <Zap className="size-3 fill-current" />
              <span>Conexión Real Supabase</span>
            </div>
            <h3 className="text-xl font-black text-brand-deep">
              Configurar Supabase Auth & BD
            </h3>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
          Conecta tu propio proyecto de <strong>Supabase</strong> para sincronizar usuarios, contraseñas cifradas y sesiones persistentes en la nube en tiempo real.
        </p>

        {/* Form Fields */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1 flex items-center gap-1.5">
              <Globe className="size-3.5 text-primary" />
              <span>Project URL de Supabase</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setTestResult(null);
                setIsSaved(false);
              }}
              placeholder="https://tu-proyecto.supabase.co"
              className="h-11 w-full rounded-2xl border border-white/80 bg-white/75 px-4 text-xs font-mono outline-none shadow-inner backdrop-blur-md transition-all focus:bg-white focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1 flex items-center gap-1.5">
              <Key className="size-3.5 text-primary" />
              <span>Project API Anon Key (Public)</span>
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => {
                setAnonKey(e.target.value);
                setTestResult(null);
                setIsSaved(false);
              }}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="h-11 w-full rounded-2xl border border-white/80 bg-white/75 px-4 text-xs font-mono outline-none shadow-inner backdrop-blur-md transition-all focus:bg-white focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
            />
          </div>
        </div>

        {/* Status / Test feedback */}
        {testResult && (
          <div
            className={`mt-4 rounded-2xl border p-3.5 text-xs font-semibold backdrop-blur-md flex items-start gap-2.5 animate-in fade-in ${
              testResult.success
                ? "border-emerald-200 bg-emerald-50/90 text-emerald-900"
                : "border-rose-200 bg-rose-50/90 text-rose-900"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <p className="flex-1">{testResult.message}</p>
          </div>
        )}

        {isSaved && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in zoom-in-95">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>¡Configuración de Supabase guardada y activa correctamente!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/60">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="size-3.5" />
            <span>Restablecer</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-bold text-brand-deep shadow-2xs hover:bg-white active:scale-95 transition-all disabled:opacity-50"
            >
              {isTesting ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                  <span>Probando...</span>
                </span>
              ) : (
                <span>Probar conexión</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 liquid-glass-button active:scale-95 transition-all hover:scale-105"
            >
              Guardar y Conectar
            </button>
          </div>
        </div>

        {/* Footer Quick Guide */}
        <div className="mt-4 rounded-2xl bg-white/50 border border-white/70 p-3 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>¿Necesitas un proyecto gratuito?</span>
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
          >
            <span>Crear en Supabase.com</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
