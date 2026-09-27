import React, { useEffect, useState } from "react";
import { UserProfile } from "@/lib/auth";
import { getProfile, checkIsAdmin } from "@/services/profiles";
import { AdminAccessDenied } from "./AdminAccessDenied";
import { RefreshCw } from "lucide-react";

interface AdminProtectedRouteProps {
  currentUser: UserProfile | null;
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
  children: React.ReactNode;
}

/**
 * Route protection guard for /admin
 * 1. Checks if user is authenticated (currentUser !== null)
 * 2. Queries public.profiles in Supabase to verify profiles.role === 'admin'
 * 3. Shows access denied screen or redirects to login if unauthenticated or non-admin
 */
export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  currentUser,
  onNavigateHome,
  onNavigateLogin,
  children,
}) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const verifyAccess = async () => {
    if (!currentUser) {
      setIsAdmin(false);
      setIsVerifying(false);
      return;
    }

    setIsVerifying(true);
    try {
      // Authoritative check against Supabase public.profiles table
      const profile = await getProfile(currentUser.id);
      if (profile && profile.role === "admin") {
        setIsAdmin(true);
      } else {
        const isAdminRole = await checkIsAdmin(currentUser.id);
        setIsAdmin(isAdminRole || currentUser.role === "admin");
      }
    } catch (err) {
      console.error("[AdminProtectedRoute] Error verifying admin role in Supabase:", err);
      setIsAdmin(currentUser?.role === "admin");
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    verifyAccess();
  }, [currentUser]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="size-14 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 grid place-items-center text-emerald-400 mb-4 shadow-2xl">
          <RefreshCw className="size-7 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">Verificando Privilegios Administrativos</h2>
        <p className="text-xs font-mono text-slate-400 mt-1">
          Consultando el rol 'admin' en public.profiles de Supabase...
        </p>
      </div>
    );
  }

  // If user is not authenticated or does not have role = 'admin'
  if (!currentUser || !isAdmin) {
    return (
      <AdminAccessDenied
        currentUser={currentUser}
        onNavigateHome={onNavigateHome}
        onNavigateLogin={onNavigateLogin}
        onRefreshRole={verifyAccess}
      />
    );
  }

  // Authenticated & profiles.role === 'admin' -> grant access
  return <>{children}</>;
};
