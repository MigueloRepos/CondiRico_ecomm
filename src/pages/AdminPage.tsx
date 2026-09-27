import React from "react";
import { UserProfile } from "@/lib/auth";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

interface AdminPageProps {
  currentUser: UserProfile | null;
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
  onLogout: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  currentUser,
  onNavigateHome,
  onNavigateLogin,
  onLogout,
}) => {
  return (
    <AdminProtectedRoute
      currentUser={currentUser}
      onNavigateHome={onNavigateHome}
      onNavigateLogin={onNavigateLogin}
    >
      <AdminDashboard
        currentUser={currentUser}
        onNavigateHome={onNavigateHome}
        onNavigateLogin={onNavigateLogin}
        onLogout={onLogout}
      />
    </AdminProtectedRoute>
  );
};
