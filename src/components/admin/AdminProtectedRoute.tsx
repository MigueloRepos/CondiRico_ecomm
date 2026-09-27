import React from "react";
import { UserProfile } from "@/lib/auth";
import { AdminRouteGuard } from "./AdminRouteGuard";

interface AdminProtectedRouteProps {
  currentUser: UserProfile | null;
  onNavigateHome: () => void;
  onNavigateLogin: (notice?: string) => void;
  children: React.ReactNode;
}

/**
 * Route protection guard wrapper for /admin
 * Delegates directly to AdminRouteGuard for robust Supabase active session
 * and public.profiles role validation.
 */
export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  currentUser,
  onNavigateHome,
  onNavigateLogin,
  children,
}) => {
  return (
    <AdminRouteGuard
      currentUser={currentUser}
      onNavigateHome={onNavigateHome}
      onNavigateLogin={onNavigateLogin}
      redirectTo="login"
    >
      {children}
    </AdminRouteGuard>
  );
};

export { AdminRouteGuard };

