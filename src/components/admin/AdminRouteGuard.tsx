import React, { useEffect, useState } from "react";
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
 * Robust Admin Route Guard based on active Supabase Auth session & public.profiles role
 * 1. Checks current active Supabase session (supabase.auth.getSession())
 * 2. Verifies public.profiles role === 'admin'
 * 3. Listens to real-time auth changes (onAuthStateChange)
 * 4. Automatically redirects unauthorized or unauthenticated users to login or home
 */
export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({
  currentUser,
  onNavigateHome,
  onNavigateLogin,
  redirectTo = "login",
  children,
}) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performRedirection = (reason: "unauthenticated" | "unauthorized") => {
    const notice =
      reason === "unauthenticated"
        ? "Inicia sesión con tu cuenta de administrador para acceder a esta sección."
        : "Tu cuenta no tiene privilegios de administrador. Contacta al superusuario para obtener acceso.";

    if (redirectTo === "login" && onNavigateLogin) {
      onNavigateLogin(notice);
      return;
    }

    if (redirectTo === "home" && onNavigateHome) {
      onNavigateHome();
      return;
    }

    // Default fallback via window hash navigation
    if (reason === "unauthenticated") {
      window.location.hash = "#auth";
    } else {
      window.location.hash = "#inicio";
    }
  };

  const verifySupabaseSessionAndRole = async () => {
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      // 1. Get real active session directly from Supabase Auth engine
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

      // 2. Query public.profiles table for authoritative role verification
      const profile = await getProfile(userId);

      if (profile && profile.role === "admin") {
        setIsAuthorized(true);
        setIsVerifying(false);
        return;
      }

      // 3. Secondary check using checkIsAdmin helper
      const isAdminRole = await checkIsAdmin(userId);
      if (isAdminRole) {
        setIsAuthorized(true);
        setIsVerifying(false);
        return;
      }

      // 4. Fallback check: user metadata or prop role
      const userMetaRole = session.user.user_metadata?.role;
      if (userMetaRole === "admin" || currentUser?.role === "admin") {
        setIsAuthorized(true);
        setIsVerifying(false);
        return;
      }

      // If all checks fail -> User is authenticated but NOT an admin
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
  };

  useEffect(() => {
    verifySupabaseSessionAndRole();

    // Listen to real-time Supabase auth state changes
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
  }, [currentUser]);

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="size-14 rounded-2xl bg-emerald-950/90 border border-emerald-800/80 grid place-items-center text-emerald-400 mb-4 shadow-2xl animate-pulse">
          <RefreshCw className="size-7 animate-spin text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">Verificando Sesión Supabase</h2>
        <p className="text-xs font-mono text-slate-400 mt-2 max-w-sm">
          Validando token de sesión activa y rol 'admin' en public.profiles...
        </p>
      </div>
    );
  }

  // Unauthorized state (if redirection is pending or manual override)
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
