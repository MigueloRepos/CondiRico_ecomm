import React, { useState, useEffect } from "react";
import { UserProfile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { checkIsAdmin, getProfile } from "@/services/profiles";
import { getAdminSummary } from "@/services/admin/dashboard";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminAccessDenied } from "./AdminAccessDenied";
import { DashboardOverview } from "./DashboardOverview";
import { AdminProductsView } from "./AdminProductsView";
import { AdminCategoriesView } from "./AdminCategoriesView";
import { AdminOrdersView } from "./AdminOrdersView";
import { AdminCustomersView } from "./AdminCustomersView";
import { AdminInventoryView } from "./AdminInventoryView";
import { AdminPromotionsView } from "./AdminPromotionsView";
import { AdminBannersView } from "./AdminBannersView";
import { AdminNewsletterView } from "./AdminNewsletterView";
import { AdminMessagesView } from "./AdminMessagesView";
import { AdminNotificationsView } from "./AdminNotificationsView";
import { AdminActivityView } from "./AdminActivityView";
import { AdminSettingsView } from "./AdminSettingsView";
import { AdminPaymentsView } from "./AdminPaymentsView";
import { RefreshCw } from "lucide-react";

interface AdminDashboardProps {
  currentUser: UserProfile | null;
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onNavigateHome,
  onNavigateLogin,
  onLogout,
}) => {
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [targetOrderId, setTargetOrderId] = useState<number | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Security role verification against Supabase public.profiles
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null);

  // Counts for badge notifications
  const [counts, setCounts] = useState<{
    pendingOrders?: number;
    lowStock?: number;
    unreadMessages?: number;
  }>({});

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash.startsWith("admin")) {
        const parts = hash.split("/");
        if (parts[1]) {
          setCurrentTab(parts[1]);
          if (parts[2]) {
            const num = parseInt(parts[2], 10);
            if (!isNaN(num)) setTargetOrderId(num);
          }
        }
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleSelectTab = (tab: string, param?: string | number) => {
    setCurrentTab(tab);
    if (tab === "orders" && param) {
      setTargetOrderId(typeof param === "number" ? param : parseInt(param, 10));
      window.location.hash = `admin/orders/${param}`;
    } else if (tab === "products" && param === "new") {
      setTargetOrderId(null);
      window.location.hash = `admin/products/new`;
    } else {
      setTargetOrderId(null);
      window.location.hash = `admin/${tab}`;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Verify Role directly from Supabase
  const verifyAdminRole = async () => {
    try {
      setIsCheckingRole(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setHasAdminAccess(false);
        setIsCheckingRole(false);
        return;
      }

      const userId = session.user.id;
      const [profile, isAdmin] = await Promise.all([
        getProfile(userId),
        checkIsAdmin(userId),
      ]);

      setHasAdminAccess(isAdmin || profile?.role === "admin");
    } catch (err) {
      console.error("[AdminDashboard] Error checking role:", err);
      setHasAdminAccess(false);
    } finally {
      setIsCheckingRole(false);
    }
  };

  useEffect(() => {
    verifyAdminRole();
  }, [currentUser]);

  // Load badge counts
  useEffect(() => {
    if (!hasAdminAccess) return;

    getAdminSummary().then((sum) => {
      setCounts({
        pendingOrders: sum.pending_orders,
        lowStock: sum.low_stock_products,
        unreadMessages: sum.unread_messages,
      });
    });
  }, [hasAdminAccess, currentTab]);

  // If role is checking
  if (isCheckingRole) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="size-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 grid place-items-center text-emerald-400 mb-4 shadow-xl">
          <RefreshCw className="size-6 animate-spin" />
        </div>
        <p className="text-sm font-mono text-slate-400">
          Verificando credenciales administrativas en Supabase...
        </p>
      </div>
    );
  }

  // If not authenticated or not admin -> Access Denied
  if (!currentUser || hasAdminAccess === false) {
    return (
      <AdminAccessDenied
        currentUser={currentUser}
        onNavigateHome={onNavigateHome}
        onNavigateLogin={onNavigateLogin}
        onRefreshRole={verifyAdminRole}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-emerald-500 selection:text-white">
      {/* Sidebar Desktop & Mobile Drawer */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        counts={counts}
        onNavigateHome={onNavigateHome}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Header */}
        <AdminHeader
          currentUser={currentUser}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigateTab={handleSelectTab}
          onNavigateHome={onNavigateHome}
          onLogout={onLogout}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {currentTab === "dashboard" && (
            <DashboardOverview
              onNavigateTab={handleSelectTab}
              onOpenOrderModal={(orderId) => handleSelectTab("orders", orderId)}
            />
          )}

          {currentTab === "products" && (
            <AdminProductsView initialOpenCreate={window.location.hash.includes("/new")} />
          )}

          {currentTab === "categories" && <AdminCategoriesView />}

          {currentTab === "orders" && (
            <AdminOrdersView initialOrderId={targetOrderId} />
          )}

          {currentTab === "payments" && <AdminPaymentsView />}

          {currentTab === "customers" && <AdminCustomersView />}

          {currentTab === "inventory" && <AdminInventoryView />}

          {currentTab === "promotions" && <AdminPromotionsView />}

          {currentTab === "banners" && <AdminBannersView />}

          {currentTab === "newsletter" && <AdminNewsletterView />}

          {currentTab === "messages" && <AdminMessagesView />}

          {currentTab === "activity" && <AdminActivityView />}

          {currentTab === "notifications" && (
            <AdminNotificationsView onNavigateTab={handleSelectTab} />
          )}

          {currentTab === "settings" && <AdminSettingsView />}
        </main>

        {/* Admin Footer */}
        <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500 font-mono">
          <span>CondiRico &bull; Panel de Control Administrativo Conectado a Supabase Real</span>
        </footer>
      </div>
    </div>
  );
};
