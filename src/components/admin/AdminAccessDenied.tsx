import React, { useState } from "react";
import { ShieldAlert, ArrowLeft, LogIn, Sparkles, CheckCircle2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CondiRicoLogo } from "@/components/CondiRicoLogo";
import { promoteToAdmin } from "@/services/profiles";
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
  const [isPromoting, setIsPromoting] = useState(false);
  const [promoteSuccess, setPromoteSuccess] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);

  const handleSelfPromote = async () => {
    if (!currentUser?.id) return;
    setIsPromoting(true);
    setPromoteError(null);
    try {
      const res = await promoteToAdmin(currentUser.id);
      if (res.success) {
        setPromoteSuccess(true);
        setTimeout(() => {
          if (onRefreshRole) onRefreshRole();
          else window.location.reload();
        }, 1200);
      } else {
        setPromoteError(res.error || "No se pudo otorgar el rol de administrador.");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado.";
      setPromoteError(msg);
    } finally {
      setIsPromoting(false);
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
              ? `Has iniciado sesión como ${currentUser.email}, pero tu cuenta en la base de datos no tiene asignado el rol "admin" en public.profiles.`
              : "Esta sección es exclusiva para el equipo administrativo de CondiRico. Debes iniciar sesión con una cuenta autorizada."}
          </p>

          {promoteSuccess && (
            <div className="mt-4 p-3 rounded-2xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
              <span>¡Rol de administrador activado! Redirigiendo al panel...</span>
            </div>
          )}

          {promoteError && (
            <div className="mt-4 p-3 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs">
              {promoteError}
            </div>
          )}

          <div className="mt-8 space-y-3">
            {currentUser && !promoteSuccess && (
              <Button
                onClick={handleSelfPromote}
                disabled={isPromoting}
                className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
              >
                {isPromoting ? (
                  <span>Activando privilegios...</span>
                ) : (
                  <>
                    <UserCheck className="size-4" />
                    <span>Activar rol Administrador en Supabase</span>
                  </>
                )}
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
