import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Fingerprint,
  Bell,
  MessageCircle,
  FileText,
  Lock,
  LogOut,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  Building,
  Navigation,
  KeyRound,
  ExternalLink,
  Database,
  Store,
  Globe,
  Server,
  AlertTriangle,
  ShoppingBag,
  TrendingUp,
  Package,
  Clock,
  DollarSign,
  Award,
  RefreshCw,
  ChevronRight,
  Receipt,
  Heart,
} from "lucide-react";
import { UserProfile } from "@/lib/auth";
import { updateSupabaseUserProfile, signOutSupabase } from "@/lib/supabase";
import { CondiRicoLogo } from "@/components/CondiRicoLogo";
import { BiometricFingerprintModal } from "@/components/BiometricFingerprintModal";
import {
  getCustomerPurchaseStats,
  CustomerPurchaseStats,
} from "@/services/orders";
import { Order } from "@/types/database";

interface UserProfileViewProps {
  currentUser: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onLogout: () => void;
  onNavigate: (page: "inicio" | "tienda") => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  onUpdateUser,
  onLogout,
  onNavigate,
}) => {
  // Active Tab: "compras" | "datos" | "seguridad"
  const [activeTab, setActiveTab] = useState<"compras" | "datos" | "seguridad">("compras");

  // Purchase statistics state
  const [stats, setStats] = useState<CustomerPurchaseStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Form fields
  const [name, setName] = useState(currentUser.name || "");
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [address, setAddress] = useState(currentUser.address || "");
  const [city, setCity] = useState(currentUser.preferences?.city || "Madrid");
  const [postalCode, setPostalCode] = useState(currentUser.preferences?.postalCode || "28001");
  const [deliveryInstructions, setDeliveryInstructions] = useState(
    currentUser.preferences?.deliveryInstructions || ""
  );

  // Preferences
  const [offersNewsletter, setOffersNewsletter] = useState(
    currentUser.preferences?.offersNewsletter ?? true
  );
  const [whatsappUpdates, setWhatsappUpdates] = useState(
    currentUser.preferences?.whatsappUpdates ?? true
  );
  const [preferredInvoiceType, setPreferredInvoiceType] = useState<"boleta" | "factura">(
    currentUser.preferences?.preferredInvoiceType || "boleta"
  );

  // Security / password change optional
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [biometricModalOpen, setBiometricModalOpen] = useState(false);

  // Fetch purchase stats from Supabase
  const loadPurchaseStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await getCustomerPurchaseStats(currentUser.id, currentUser.email);
      setStats(data);
    } catch (err) {
      console.error("[UserProfileView] Error loading stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    loadPurchaseStats();
  }, [currentUser.id, currentUser.email]);

  // Handle save changes to Supabase
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage("Por favor indica tu nombre completo.");
      return;
    }
    if (!phone.trim()) {
      setErrorMessage("Por favor indica un teléfono de contacto.");
      return;
    }
    if (!address.trim()) {
      setErrorMessage("Por favor especifica tu dirección de entrega.");
      return;
    }

    if (showPasswordChange && newPassword) {
      if (newPassword.length < 6) {
        setErrorMessage("La nueva contraseña debe tener al menos 6 caracteres.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage("Las contraseñas no coinciden. Por favor verifícalas.");
        return;
      }
    }

    setIsSaving(true);

    try {
      // 1. Update in Supabase Cloud
      const { user: updatedSbUser, error: sbError } = await updateSupabaseUserProfile({
        fullName: name,
        phone,
        address,
        city,
        postalCode,
        deliveryInstructions,
        offersNewsletter,
        whatsappUpdates,
        preferredInvoiceType,
        hasBiometrics: currentUser.hasBiometrics,
        newPassword: showPasswordChange && newPassword ? newPassword : undefined,
      });

      // Prepare updated local profile
      const updatedProfile: UserProfile = updatedSbUser || {
        ...currentUser,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        preferences: {
          city: city.trim(),
          postalCode: postalCode.trim(),
          deliveryInstructions: deliveryInstructions.trim(),
          offersNewsletter,
          whatsappUpdates,
          preferredInvoiceType,
        },
      };

      onUpdateUser(updatedProfile);

      setIsSaving(false);
      setSaveSuccessMessage(
        sbError
          ? "Perfil guardado localmente (aviso Supabase: " + sbError + ")"
          : "¡Tus datos y preferencias se han guardado exitosamente en Supabase Cloud!"
      );

      if (showPasswordChange && newPassword) {
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordChange(false);
      }

      setTimeout(() => {
        setSaveSuccessMessage(null);
      }, 4000);
    } catch (err: unknown) {
      setIsSaving(false);
      const msg = err instanceof Error ? err.message : "Error al actualizar perfil.";
      setErrorMessage(msg);
    }
  };

  const handleLogoutClick = async () => {
    await signOutSupabase();
    onLogout();
  };

  const userInitials = (name || currentUser.name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-extrabold">
            <CheckCircle2 className="size-3 text-emerald-600" />
            Entregado
          </span>
        );
      case "processing":
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[11px] font-extrabold">
            <Package className="size-3 text-blue-600" />
            En camino
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[11px] font-extrabold">
            <Clock className="size-3 text-amber-600" />
            Pendiente
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2.5 py-0.5 text-[11px] font-extrabold">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-800 px-2.5 py-0.5 text-[11px] font-extrabold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="relative min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center selection:bg-sun selection:text-brand-deep">
      {/* Background Volumetric Lights */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 -right-20 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-emerald-400/30 via-teal-300/20 to-transparent blur-[120px] animate-float-slow" />
        <div className="absolute bottom-1/4 -left-20 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-amber-300/30 via-orange-200/20 to-transparent blur-[120px] animate-float-reverse" />
      </div>

      {/* Top Nav & Breadcrumbs */}
      <div className="mx-auto w-full max-w-4xl mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate("tienda")}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs font-bold text-muted-foreground shadow-2xs backdrop-blur-md hover:text-foreground hover:bg-white active:scale-95 transition-all cursor-pointer"
        >
          <ChevronLeft className="size-4" />
          <span>Volver a la Tienda</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate("inicio")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors bg-white/60 border border-white/80 px-3.5 py-1.5 rounded-full shadow-2xs cursor-pointer"
          >
            <Store className="size-3.5" />
            <span>Inicio</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto w-full max-w-4xl">
        <div className="relative rounded-[36px] liquid-glass p-6 sm:p-9 shadow-[0_25px_60px_-15px_rgba(20,83,45,0.15)] border border-white/80 overflow-hidden">
          {/* Top Specular Line */}
          <div className="absolute inset-x-12 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

          {/* Profile Header Badge */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/60">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="grid size-14 sm:size-16 place-items-center rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 text-white font-black text-xl shadow-md border-2 border-white">
                  {userInitials}
                </div>
                <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                  <ShieldCheck className="size-3" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-brand-deep">
                    {name || "Mi Cuenta"}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Cliente CondiRico
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Mail className="size-3.5 text-muted-foreground" />
                  <span>{currentUser.email}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogoutClick}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/80 px-4 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-100 active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 pt-5 pb-6 overflow-x-auto border-b border-white/60">
            <button
              type="button"
              onClick={() => setActiveTab("compras")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === "compras"
                  ? "bg-primary text-white shadow-md shadow-primary/20 scale-100"
                  : "bg-white/60 hover:bg-white text-brand-deep/80 border border-white/80"
              }`}
            >
              <TrendingUp className="size-4" />
              <span>Mis Compras y Estadísticas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("datos")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === "datos"
                  ? "bg-primary text-white shadow-md shadow-primary/20 scale-100"
                  : "bg-white/60 hover:bg-white text-brand-deep/80 border border-white/80"
              }`}
            >
              <User className="size-4" />
              <span>Datos y Entrega</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("seguridad")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === "seguridad"
                  ? "bg-primary text-white shadow-md shadow-primary/20 scale-100"
                  : "bg-white/60 hover:bg-white text-brand-deep/80 border border-white/80"
              }`}
            >
              <Lock className="size-4" />
              <span>Seguridad y Preferencias</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {saveSuccessMessage && (
            <div className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50/95 p-4 text-xs font-bold text-emerald-900 shadow-sm flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p>{saveSuccessMessage}</p>
                <p className="text-[11px] font-medium text-emerald-800/80 mt-0.5">
                  Tus datos actualizados se han sincronizado con Supabase.
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 rounded-2xl border border-rose-300 bg-rose-50/95 p-4 text-xs font-bold text-rose-900 shadow-sm flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: MIS COMPRAS Y ESTADÍSTICAS */}
          {activeTab === "compras" && (
            <div className="mt-6 space-y-8 animate-in fade-in duration-200">
              {/* Key Statistics KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
                {/* Total Spent */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white/80 border border-white/90 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted-foreground mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Total Invertido</span>
                    <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-700 grid place-items-center">
                      <DollarSign className="size-4" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-brand-deep">
                    ${stats?.totalSpent?.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">Compras en CondiRico</p>
                </div>

                {/* Total Orders */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white/80 border border-white/90 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted-foreground mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Pedidos Totales</span>
                    <div className="size-8 rounded-xl bg-primary/10 text-primary grid place-items-center">
                      <ShoppingBag className="size-4" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-brand-deep">
                    {stats?.totalOrders || 0}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                    {stats?.deliveredOrders || 0} entregados exitosamente
                  </p>
                </div>

                {/* Average Ticket */}
                <div className="col-span-2 sm:col-span-1 p-4 sm:p-5 rounded-3xl bg-white/80 border border-white/90 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-muted-foreground mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Gasto Promedio</span>
                    <div className="size-8 rounded-xl bg-amber-500/10 text-amber-700 grid place-items-center">
                      <Receipt className="size-4" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-brand-deep">
                    ${stats?.averageTicket?.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">Por cada pedido realizado</p>
                </div>
              </div>

              {/* Top Bought Products Section */}
              <div className="rounded-3xl bg-white/70 border border-white/80 p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-white/80">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-xl bg-amber-500/10 text-amber-700 grid place-items-center">
                      <Award className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-brand-deep">
                        Tus Productos Más Comprados
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Tus condimentos, especias y víveres favoritos en la tienda
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate("tienda")}
                    className="text-xs font-extrabold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ir a Tienda</span>
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>

                <div className="mt-4">
                  {isLoadingStats ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <Loader2 className="size-6 text-primary animate-spin mb-2" />
                      <p className="text-xs text-muted-foreground font-semibold">Cargando tus productos favoritos...</p>
                    </div>
                  ) : !stats?.topProducts || stats.topProducts.length === 0 ? (
                    <div className="py-10 text-center rounded-2xl bg-white/40 border border-dashed border-white/90 p-6">
                      <ShoppingBag className="size-8 text-muted-foreground/60 mx-auto mb-2" />
                      <p className="text-xs font-bold text-brand-deep">Aún no tienes compras acumuladas</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Tus artículos comprados aparecerán aquí para facilitarte volver a pedirlos rápidamente.
                      </p>
                      <button
                        type="button"
                        onClick={() => onNavigate("tienda")}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
                      >
                        <Store className="size-3.5" />
                        <span>Explorar Catálogo</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {stats.topProducts.map((p, idx) => (
                        <div
                          key={p.product_id}
                          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/90 border border-white hover:shadow-md transition-all group"
                        >
                          <div className="relative size-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.product_name}
                                className="size-full object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="size-full grid place-items-center text-muted-foreground">
                                <Package className="size-5" />
                              </div>
                            )}
                            <span className="absolute top-0.5 left-0.5 size-4 rounded-full bg-brand-deep text-white text-[9px] font-black grid place-items-center">
                              {idx + 1}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-brand-deep truncate">
                              {p.product_name}
                            </h4>
                            <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                              {p.units_bought} {p.units_bought === 1 ? "unidad comprada" : "unidades compradas"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Total: ${p.total_spent.toFixed(2)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => onNavigate("tienda")}
                            className="size-8 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white grid place-items-center transition-colors shrink-0 cursor-pointer"
                            title="Volver a comprar"
                          >
                            <ShoppingBag className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Orders History Section */}
              <div className="rounded-3xl bg-white/70 border border-white/80 p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-white/80">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-xl bg-primary/10 text-primary grid place-items-center">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-brand-deep">
                        Historial de Últimas Compras
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Detalle de tus pedidos y estado de entrega
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={loadPurchaseStats}
                    className="p-2 rounded-xl bg-white/80 hover:bg-white text-muted-foreground hover:text-primary transition-all cursor-pointer shadow-2xs"
                    title="Actualizar pedidos"
                  >
                    <RefreshCw className={`size-3.5 ${isLoadingStats ? "animate-spin" : ""}`} />
                  </button>
                </div>

                <div className="mt-4 overflow-x-auto">
                  {isLoadingStats ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      Cargando historial de compras...
                    </div>
                  ) : !stats?.recentOrders || stats.recentOrders.length === 0 ? (
                    <div className="py-10 text-center text-xs text-muted-foreground">
                      No tienes compras registradas todavía. Cuando finalices un pedido aparecerá aquí con su estado en tiempo real.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-muted-foreground border-b border-white/80 pb-2">
                          <th className="pb-2.5 font-bold">Nº Pedido</th>
                          <th className="pb-2.5 font-bold">Fecha</th>
                          <th className="pb-2.5 font-bold">Estado</th>
                          <th className="pb-2.5 font-bold">Pago</th>
                          <th className="pb-2.5 font-bold text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/60">
                        {stats.recentOrders.map((o) => (
                          <tr key={o.id} className="hover:bg-white/50 transition-colors">
                            <td className="py-3 font-mono font-bold text-brand-deep">
                              #{o.id}
                            </td>
                            <td className="py-3 text-muted-foreground font-medium">
                              {new Date(o.created_at || "").toLocaleDateString([], {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className="py-3">
                              {getOrderStatusBadge(o.status)}
                            </td>
                            <td className="py-3 text-muted-foreground text-[11px] truncate max-w-[120px]">
                              {o.payment_method || "WhatsApp"}
                            </td>
                            <td className="py-3 text-right font-black text-brand-deep">
                              ${Number(o.total).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATOS PERSONALES Y ENTREGA */}
          {activeTab === "datos" && (
            <form onSubmit={handleSaveChanges} className="mt-6 space-y-6 animate-in fade-in duration-200">
              {/* SECCIÓN 1: DATOS PERSONALES */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    1
                  </span>
                  <h3 className="text-sm font-black text-brand-deep uppercase tracking-wider">
                    Datos Personales
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Nombre completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre y apellidos"
                        className="w-full h-11 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/75 text-xs text-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 shadow-inner transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Teléfono móvil / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+34 600 000 000"
                        className="w-full h-11 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/75 text-xs text-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 shadow-inner transition-all font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Correo electrónico (ID de cuenta)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="email"
                      disabled
                      value={currentUser.email}
                      className="w-full h-11 pl-10 pr-24 rounded-2xl border border-white/60 bg-muted/40 text-xs text-muted-foreground outline-none cursor-not-allowed font-medium"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5">
                      <CheckCircle2 className="size-3 text-emerald-600" />
                      Verificado
                    </span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: DIRECCIÓN Y ENTREGA */}
              <div className="space-y-4 pt-4 border-t border-white/60">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-lg bg-offer/20 text-offer-foreground text-xs font-black">
                    2
                  </span>
                  <h3 className="text-sm font-black text-brand-deep uppercase tracking-wider">
                    Dirección de Entrega Predeterminada
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Calle, número, piso y puerta
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ej. Av. de la Paz 45, Escalera B, 2º Izq."
                      className="w-full h-11 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/75 text-xs text-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 shadow-inner transition-all font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Ciudad / Población
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Madrid, Barcelona..."
                        className="w-full h-11 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/75 text-xs text-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 shadow-inner transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Código Postal
                    </label>
                    <div className="relative">
                      <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="28001"
                        className="w-full h-11 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/75 text-xs text-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 shadow-inner transition-all font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Instrucciones especiales para el repartidor (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    placeholder="Ej: Timbre no funciona bien, dejar con el conserje o llamar al llegar..."
                    className="w-full p-3 rounded-2xl border border-white/80 bg-white/75 text-xs text-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 shadow-inner transition-all resize-none"
                  />
                </div>
              </div>

              {/* Bottom Save Action */}
              <div className="pt-5 border-t border-white/80 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-black text-xs shadow-md shadow-primary/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Guardando en Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      <span>Guardar Datos de Entrega</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SEGURIDAD Y PREFERENCIAS */}
          {activeTab === "seguridad" && (
            <div className="mt-6 space-y-6 animate-in fade-in duration-200">
              {/* Preferencias de Notificaciones y Facturación */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-lg bg-emerald-500/20 text-emerald-800 text-xs font-black">
                    1
                  </span>
                  <h3 className="text-sm font-black text-brand-deep uppercase tracking-wider">
                    Preferencias de Compra y Notificaciones
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-white/80 bg-white/70 hover:bg-white transition-all cursor-pointer shadow-2xs">
                    <input
                      type="checkbox"
                      checked={whatsappUpdates}
                      onChange={(e) => setWhatsappUpdates(e.target.checked)}
                      className="mt-0.5 size-4 text-primary rounded-md focus:ring-primary"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-foreground flex items-center gap-1">
                        <MessageCircle className="size-3.5 text-emerald-600" />
                        Avisos por WhatsApp
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Recibe el estado de preparación y despacho de tu pedido directamente en WhatsApp.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-white/80 bg-white/70 hover:bg-white transition-all cursor-pointer shadow-2xs">
                    <input
                      type="checkbox"
                      checked={offersNewsletter}
                      onChange={(e) => setOffersNewsletter(e.target.checked)}
                      className="mt-0.5 size-4 text-primary rounded-md focus:ring-primary"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-foreground flex items-center gap-1">
                        <Bell className="size-3.5 text-offer" />
                        Ofertas y Promociones
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Alertas exclusivas de descuentos especiales y nuevos productos de temporada.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Invoice Type selection */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                    <FileText className="size-3.5 text-primary" />
                    <span>Comprobante de compra preferido</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPreferredInvoiceType("boleta")}
                      className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all active:scale-95 cursor-pointer ${
                        preferredInvoiceType === "boleta"
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                          : "border-white/80 bg-white/60 text-muted-foreground hover:bg-white"
                      }`}
                    >
                      <p className="font-black">Boleta de Venta</p>
                      <p className="text-[10px] opacity-80 mt-0.5">Para consumo personal / hogar</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreferredInvoiceType("factura")}
                      className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all active:scale-95 cursor-pointer ${
                        preferredInvoiceType === "factura"
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                          : "border-white/80 bg-white/60 text-muted-foreground hover:bg-white"
                      }`}
                    >
                      <p className="font-black">Factura con NIF/CIF</p>
                      <p className="text-[10px] opacity-80 mt-0.5">Para empresas y autónomos</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Biometrics Status Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/90 border border-emerald-200/80 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-emerald-600 text-white shadow-xs">
                    <Fingerprint className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <span>Acceso Biométrico WebAuthn</span>
                      {currentUser.hasBiometrics && (
                        <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                          Activo
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      {currentUser.hasBiometrics
                        ? "Tu huella dactilar está vinculada para inicio de sesión en un toque."
                        : "Vincula tu huella en este dispositivo para comprar sin escribir contraseñas."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBiometricModalOpen(true)}
                  className="rounded-full bg-white border border-emerald-300 px-3.5 py-1.5 text-xs font-extrabold text-emerald-900 shadow-2xs hover:bg-emerald-50 active:scale-95 shrink-0 transition-all cursor-pointer"
                >
                  {currentUser.hasBiometrics ? "Re-vincular" : "Activar"}
                </button>
              </div>

              {/* Password change */}
              <div className="pt-2 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary hover:underline cursor-pointer"
                >
                  <KeyRound className="size-3.5" />
                  <span>{showPasswordChange ? "Ocultar cambio de contraseña" : "Cambiar contraseña de Supabase"}</span>
                </button>

                {showPasswordChange && (
                  <div className="mt-3 p-4 rounded-2xl bg-white/70 border border-white/80 space-y-3 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">
                        Nueva contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full h-10 pl-10 pr-3 rounded-2xl border border-white/80 bg-white text-xs outline-none focus:ring-2 focus:ring-primary/20 shadow-inner"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1">
                        Confirmar nueva contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repite la nueva contraseña"
                          className="w-full h-10 pl-10 pr-3 rounded-2xl border border-white/80 bg-white text-xs outline-none focus:ring-2 focus:ring-primary/20 shadow-inner"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Save Preferences Button */}
              <div className="pt-4 border-t border-white/80">
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black text-xs shadow-md shadow-primary/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Guardando preferencias...</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      <span>Guardar Preferencias de Seguridad</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Biometric Fingerprint Modal */}
      <BiometricFingerprintModal
        isOpen={biometricModalOpen}
        onClose={() => setBiometricModalOpen(false)}
        onSuccess={() => {
          setBiometricModalOpen(false);
          const updated = { ...currentUser, hasBiometrics: true };
          onUpdateUser(updated);
          setSaveSuccessMessage("¡Huella dactilar activada y sincronizada!");
          setTimeout(() => setSaveSuccessMessage(null), 3500);
        }}
        mode="register"
        userEmail={currentUser.email}
        userName={currentUser.name}
      />
    </div>
  );
};
