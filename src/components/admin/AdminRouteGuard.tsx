import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getProfile, checkIsAdmin } from "@/services/profiles";
import { UserProfile } from "@/lib/auth";
import { RefreshCw, ShieldAlert, ArrowLeft, LogIn } from "lucide-react";

export interface AdminRouteGuardProps {
  currentUser?: UserProfile | null;
  onNavigateHome?: () => void;
  onNavigateLogin?: (notice?: string) => void;
  redirectTo?: "login" | "home";
  children: React.ReactNode;
}

/**
 * Robust, hardened Admin Route Guard based strictly on active Supabase Auth session & authoritative public.profiles role
 * 1. Verifies real active Supabase Auth session (supabase.auth.getSession())
 * 2. Queries public.profiles and runs checkIsAdmin RPC to verify role === 'admin'
 * 3. Never trusts client-side state, user_metadata, or localStorage
 * 4. Listens to real-time auth changes (onAuthStateChange)
 */
export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({
  onNavigateHome,
  onNavigateLogin,
  redirectTo = "login",
  children,
}) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performRedirection = useCallback((reason: "unauthenticated" | "unauthorized") => {
    const notice =
      reason === "unauthenticated"
        ? "Inicia sesión con tu cuenta de administrador para acceder a esta sección."
        : "Tu cuenta no tiene privilegios de administrador. Se requiere rol 'admin' verificado en Supabase.";

    if (redirectTo === "login" && onNavigateLogin) {
      onNavigateLogin(notice);
      return;
    }

    if (redirectTo === "home" && onNavigateHome) {
      onNavigateHome();
      return;
    }

    if (reason === "unauthenticated") {
      window.location.hash = "#auth";
    } else {
      window.location.hash = "#inicio";
    }
  }, [onNavigateHome, onNavigateLogin, redirectTo]);

  const verifySupabaseSessionAndRole = useCallback(async () => {
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      // 1. Authoritative check: Get real active session directly from Supabase Auth engine
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session || !session.user) {
        setIsAuthorized(false);
        setIsVerifying(false);
        performRedirection("unauthenticated");
        return;
      }

      const userId = session.user.id;

      // 2. Authoritative check: Query public.profiles and run checkIsAdmin
      const [profile, isAdminFromRpc] = await Promise.all([
        getProfile(userId),
        checkIsAdmin(userId),
      ]);

      if (isAdminFromRpc || profile?.role === "admin") {
        setIsAuthorized(true);
        setIsVerifying(false);
        return;
      }

      // If checks fail -> User is authenticated but NOT an authorized admin
      setIsAuthorized(false);
      setErrorMessage("No tienes permisos de administrador para acceder al panel.");
      performRedirection("unauthorized");
    } catch (err) {
      console.error("[AdminRouteGuard] Error validando sesión y rol en Supabase:", err);
      setIsAuthorized(false);
      setErrorMessage("Ocurrió un error al verificar tu sesión con Supabase.");
    } finally {
      setIsVerifying(false);
    }
  }, [performRedirection]);

  useEffect(() => {
    verifySupabaseSessionAndRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setIsAuthorized(false);
        performRedirection("unauthenticated");
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        verifySupabaseSessionAndRole();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [verifySupabaseSessionAndRole, performRedirection]);

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="size-14 rounded-2xl bg-emerald-950/90 border border-emerald-800/80 grid place-items-center text-emerald-400 mb-4 shadow-2xl animate-pulse">
          <RefreshCw className="size-7 animate-spin text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">Verificando Credenciales de Administrador</h2>
        <p className="text-xs font-mono text-slate-400 mt-2 max-w-sm">
          Validando token de sesión criptográfico y permisos en Supabase...
        </p>
      </div>
    );
  }

  // Unauthorized state
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900/90 border border-red-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="size-16 rounded-2xl bg-red-950/80 border border-red-800/80 grid place-items-center text-red-400 mx-auto mb-5 shadow-inner">
            <ShieldAlert className="size-8 text-red-400" />
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight">Acceso Restringido</h1>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            {errorMessage || "Debes iniciar sesión con una cuenta autorizada con el rol 'admin' para acceder al panel administrativo."}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (onNavigateLogin) {
                  onNavigateLogin("Inicia sesión como administrador.");
                } else {
                  window.location.hash = "#auth";
                }
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <LogIn className="size-4" />
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                if (onNavigateHome) {
                  onNavigateHome();
                } else {
                  window.location.hash = "#inicio";
                }
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-slate-700 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="size-4" />
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
