import React, { useState } from "react";
import { ShieldAlert, ArrowLeft, LogIn, RefreshCw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CondiRicoLogo } from "@/components/CondiRicoLogo";
import { UserProfile } from "@/lib/auth";

interface AdminAccessDeniedProps {
  currentUser: UserProfile | null;
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
  onRefreshRole?: () => void;
}

export const AdminAccessDenied: React.FC<AdminAccessDeniedProps> = ({
  currentUser,
  onNavigateHome,
  onNavigateLogin,
  onRefreshRole,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyRole = async () => {
    setIsVerifying(true);
    try {
      if (onRefreshRole) {
        await onRefreshRole();
      } else {
        window.location.reload();
      }
    } finally {
      setTimeout(() => setIsVerifying(false), 800);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block">
            <CondiRicoLogo className="h-10 w-auto mx-auto" light={true} />
          </div>
          <span className="mt-3 inline-block text-[11px] font-mono tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full uppercase">
            Área Administrativa
          </span>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/85 backdrop-blur-xl p-8 shadow-2xl text-center">
          <div className="grid size-16 place-items-center rounded-2xl bg-rose-950/50 border border-rose-800/60 text-rose-400 mx-auto mb-5 shadow-inner">
            <ShieldAlert className="size-8" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Acceso Restringido
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
            {currentUser
              ? `Has iniciado sesión como ${currentUser.email}, pero tu cuenta no cuenta con rol de "admin" verificado en la base de datos Supabase.`
              : "Esta sección es exclusiva para el equipo administrativo de CondiRico. Debes iniciar sesión con una cuenta autorizada."}
          </p>

          <div className="mt-5 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Lock className="size-3.5 text-amber-400" />
              <span>Seguridad RLS Supabase</span>
            </div>
            <p className="text-[11px] leading-normal text-slate-400">
              Los roles administrativos son gestionados exclusivamente en la tabla <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">public.profiles</code> y protegidos mediante políticas de seguridad Row Level Security.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {currentUser && (
              <Button
                onClick={handleVerifyRole}
                disabled={isVerifying}
                className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
              >
                <RefreshCw className={`size-4 ${isVerifying ? "animate-spin" : ""}`} />
                <span>{isVerifying ? "Verificando permisos..." : "Reintentar verificación de rol"}</span>
              </Button>
            )}

            {!currentUser && (
              <Button
                onClick={onNavigateLogin}
                className="w-full h-11 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <LogIn className="size-4" />
                <span>Iniciar sesión como Administrador</span>
              </Button>
            )}

            <Button
              variant="outline"
              onClick={onNavigateHome}
              className="w-full h-11 rounded-2xl border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <ArrowLeft className="size-4" />
              <span>Volver a la Tienda Pública</span>
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Protegido por Supabase Row Level Security &middot; CondiRico Cloud
        </p>
      </div>
    </div>
  );
};
