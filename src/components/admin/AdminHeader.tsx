import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  Search,
  Bell,
  ExternalLink,
  LogOut,
  Settings,
  User,
  ShoppingBag,
  Package,
  Users,
  Check,
  X,
  ChevronDown,
} from "lucide-react";
import { UserProfile } from "@/lib/auth";
import { AdminNotification } from "@/types/admin";
import { getAdminNotifications, markNotificationRead, markAllNotificationsRead } from "@/services/admin/notifications";
import { supabase } from "@/lib/supabase";

interface AdminHeaderProps {
  currentUser: UserProfile | null;
  onOpenMobileSidebar: () => void;
  onNavigateTab: (tab: string) => void;
  onNavigateHome: () => void;
  onLogout: () => void;
}

interface SearchResultItem {
  id: string | number;
  type: "product" | "order" | "customer";
  title: string;
  subtitle: string;
  tab: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentUser,
  onOpenMobileSidebar,
  onNavigateTab,
  onNavigateHome,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Load notifications
  useEffect(() => {
    getAdminNotifications(10).then((items) => {
      setNotifications(items);
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Global search across products, orders, customers
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const q = searchQuery.trim();
      const results: SearchResultItem[] = [];

      try {
        const [
          { data: prods },
          { data: orders },
          { data: profiles },
        ] = await Promise.all([
          supabase.from("products").select("id, name, price").ilike("name", `%${q}%`).limit(3),
          supabase.from("orders").select("id, customer_name, total").or(`customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`).limit(3),
          supabase.from("profiles").select("id, full_name, phone").ilike("full_name", `%${q}%`).limit(3),
        ]);

        if (prods) {
          prods.forEach((p) => {
            results.push({
              id: p.id,
              type: "product",
              title: p.name,
              subtitle: `$${Number(p.price).toFixed(2)}`,
              tab: "products",
            });
          });
        }

        if (orders) {
          orders.forEach((o) => {
            results.push({
              id: o.id,
              type: "order",
              title: `Pedido #${o.id} - ${o.customer_name}`,
              subtitle: `$${Number(o.total).toFixed(2)}`,
              tab: "orders",
            });
          });
        }

        if (profiles) {
          profiles.forEach((pr) => {
            results.push({
              id: pr.id,
              type: "customer",
              title: pr.full_name || "Cliente",
              subtitle: pr.phone || pr.id.slice(0, 8),
              tab: "customers",
            });
          });
        }

        setSearchResults(results);
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (item: SearchResultItem) => {
    onNavigateTab(item.tab);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleNotificationClick = async (notif: AdminNotification) => {
    if (!notif.is_read) {
      await markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }
    if (notif.link) {
      onNavigateTab(notif.link);
    } else {
      onNavigateTab("notifications");
    }
    setNotificationsOpen(false);
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </button>

        {/* Omnibox Search Bar */}
        <div ref={searchRef} className="relative flex-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar productos, pedidos o clientes..."
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              className="w-full h-10 rounded-2xl bg-slate-800/80 border border-slate-700/80 pl-10 pr-9 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/60 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchOpen && searchQuery.trim().length >= 2 && (
            <div className="absolute top-12 left-0 right-0 rounded-2xl border border-slate-750 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                {isSearching ? "Buscando en Supabase..." : `Resultados (${searchResults.length})`}
              </div>

              {searchResults.length === 0 && !isSearching && (
                <div className="p-4 text-center text-xs text-slate-400">
                  No se encontraron coincidencias para "{searchQuery}"
                </div>
              )}

              <div className="mt-1 space-y-1 max-h-64 overflow-y-auto">
                {searchResults.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => handleSelectResult(item)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-7 rounded-lg grid place-items-center bg-slate-800 text-slate-300 group-hover:text-emerald-400 shrink-0">
                        {item.type === "product" && <Package className="size-3.5" />}
                        {item.type === "order" && <ShoppingBag className="size-3.5" />}
                        {item.type === "customer" && <Users className="size-3.5" />}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-200 truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-md shrink-0">
                      {item.type === "product" ? "Producto" : item.type === "order" ? "Pedido" : "Cliente"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Go to Store, Notifications, Admin Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Back to Public Store */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-800/60 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all"
          title="Ver tienda pública"
        >
          <ExternalLink className="size-3.5" />
          <span>Ver tienda</span>
        </button>

        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative size-10 grid place-items-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
            aria-label="Notificaciones"
          >
            <Bell className="size-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 size-2 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-pulse" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl border border-slate-750 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Notificaciones</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {unreadCount} nuevas
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-medium text-emerald-400 hover:underline"
                  >
                    Marcar todas
                  </button>
                )}
              </div>

              <div className="mt-2 space-y-1.5 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No tienes notificaciones pendientes
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-start gap-2.5 ${
                        n.is_read ? "bg-slate-800/30 hover:bg-slate-800/60" : "bg-emerald-950/20 border border-emerald-900/40 hover:bg-emerald-950/40"
                      }`}
                    >
                      <div
                        className={`size-2 rounded-full mt-1.5 shrink-0 ${
                          n.is_read ? "bg-slate-600" : "bg-emerald-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{n.title}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{n.message}</p>
                        <span className="text-[9px] text-slate-500 mt-1 block">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab("notifications");
                    setNotificationsOpen(false);
                  }}
                  className="text-xs font-bold text-slate-300 hover:text-white transition-colors"
                >
                  Ver todas las notificaciones
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 p-1 sm:pl-2 sm:pr-3 rounded-2xl hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700/60"
          >
            <div className="size-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs grid place-items-center shadow-md shadow-emerald-950">
              {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-200 leading-tight">
                {currentUser?.name || "Administrador"}
              </p>
              <span className="text-[10px] text-emerald-400 font-mono font-medium">
                Admin
              </span>
            </div>
            <ChevronDown className="size-3.5 text-slate-400 hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-12 w-56 rounded-2xl border border-slate-750 bg-slate-900/95 backdrop-blur-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-slate-800">
                <p className="text-xs font-bold text-white truncate">{currentUser?.name || "Administrador"}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser?.email}</p>
              </div>

              <div className="mt-1 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab("settings");
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 text-left transition-colors"
                >
                  <Settings className="size-3.5 text-slate-400" />
                  <span>Configuración del negocio</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onNavigateHome();
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 text-left transition-colors md:hidden"
                >
                  <ExternalLink className="size-3.5 text-slate-400" />
                  <span>Ir a la tienda</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-left transition-colors"
                >
                  <LogOut className="size-3.5" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
