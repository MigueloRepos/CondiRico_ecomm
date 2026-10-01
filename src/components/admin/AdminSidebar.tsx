import React from "react";
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  Tag,
  Image as ImageIcon,
  ShoppingBag,
  Users,
  Mail,
  MessageSquare,
  Activity,
  Bell,
  Settings,
  X,
  Store,
  ChevronRight,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { CondiRicoLogo } from "@/components/CondiRicoLogo";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number | string | null;
  badgeColor?: "warning" | "danger" | "info" | "success";
}

interface AdminSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  counts?: {
    pendingOrders?: number;
    lowStock?: number;
    unreadMessages?: number;
  };
  onNavigateHome: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  counts,
  onNavigateHome,
}) => {
  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: "Principal",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Catálogo",
      items: [
        { id: "products", label: "Productos", icon: Package },
        { id: "categories", label: "Categorías", icon: Layers },
        {
          id: "inventory",
          label: "Inventario",
          icon: Boxes,
          badge: counts?.lowStock && counts.lowStock > 0 ? counts.lowStock : null,
          badgeColor: "warning",
        },
        { id: "promotions", label: "Promociones", icon: Tag },
        { id: "banners", label: "Banners", icon: ImageIcon },
      ],
    },
    {
      title: "Ventas & Finanzas",
      items: [
        {
          id: "orders",
          label: "Pedidos",
          icon: ShoppingBag,
          badge: counts?.pendingOrders && counts.pendingOrders > 0 ? counts.pendingOrders : null,
          badgeColor: "danger",
        },
        {
          id: "payments",
          label: "Pagos & Pasarelas",
          icon: CreditCard,
        },
      ],
    },
    {
      title: "Clientes",
      items: [
        { id: "customers", label: "Clientes", icon: Users },
        { id: "newsletter", label: "Newsletter", icon: Mail },
        {
          id: "messages",
          label: "Mensajes",
          icon: MessageSquare,
          badge: counts?.unreadMessages && counts.unreadMessages > 0 ? counts.unreadMessages : null,
          badgeColor: "info",
        },
      ],
    },
    {
      title: "Sistema",
      items: [
        { id: "activity", label: "Actividad", icon: Activity },
        { id: "notifications", label: "Notificaciones", icon: Bell },
        { id: "settings", label: "Configuración", icon: Settings },
      ],
    },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-slate-900 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <CondiRicoLogo className="h-8 w-auto" light={true} />
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full font-bold uppercase">
              Admin
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-10rem)]">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 shadow-xs"
                          : "text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`size-4 transition-colors ${
                            isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== null && item.badge !== undefined && (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            item.badgeColor === "danger"
                              ? "bg-rose-950 text-rose-400 border-rose-800/80"
                              : item.badgeColor === "warning"
                              ? "bg-amber-950 text-amber-400 border-amber-800/80"
                              : "bg-teal-950 text-teal-400 border-teal-800/80"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Quick Action: Return to Public Store */}
      <div className="p-3 border-t border-slate-800">
        <button
          type="button"
          onClick={onNavigateHome}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-xs border border-slate-700/60"
        >
          <div className="flex items-center gap-2">
            <Store className="size-4 text-emerald-400" />
            <span className="font-semibold">Ir a la tienda</span>
          </div>
          <ChevronRight className="size-4 text-slate-500" />
        </button>

        <div className="mt-2.5 flex items-center justify-between px-2 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-3 text-emerald-500" />
            <span>RLS Active</span>
          </div>
          <span className="font-mono">v1.2.0</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-300 z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
