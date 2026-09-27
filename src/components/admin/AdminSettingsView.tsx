import React, { useState, useEffect } from "react";
import {
  Settings,
  Store,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  DollarSign,
  ShieldAlert,
  Save,
  CheckCircle2,
  RefreshCw,
  Building,
  Truck,
  Image as ImageIcon,
} from "lucide-react";
import { AdminSettings } from "@/types/admin";
import { getAdminSettings, updateAdminSettings } from "@/services/admin/settings";
import { Button } from "@/components/ui/button";

export const AdminSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [minOrderAmount, setMinOrderAmount] = useState("10");
  const [logoUrl, setLogoUrl] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [whatsappOrdersEnabled, setWhatsappOrdersEnabled] = useState(true);
  const [newsletterEnabled, setNewsletterEnabled] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminSettings();
      setSettings(data);
      setBusinessName(data.business_name);
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setWhatsapp(data.whatsapp || "");
      setAddress(data.address || "");
      setCity(data.city || "");
      setCurrency(data.currency || "EUR");
      setMinOrderAmount(String(data.min_order_amount ?? 10));
      setLogoUrl(data.logo_url || "");
      setMaintenanceMode(Boolean(data.maintenance_mode));
      setWhatsappOrdersEnabled(data.whatsapp_orders_enabled !== false);
      setNewsletterEnabled(data.newsletter_enabled !== false);
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateAdminSettings({
        business_name: businessName,
        email,
        phone,
        whatsapp,
        address,
        city,
        currency,
        min_order_amount: parseFloat(minOrderAmount) || 0,
        logo_url: logoUrl,
        maintenance_mode: maintenanceMode,
        whatsapp_orders_enabled: whatsappOrdersEnabled,
        newsletter_enabled: newsletterEnabled,
      });

      if (res.success) {
        showToast("Configuración guardada exitosamente en Supabase.");
        if (res.data) setSettings(res.data);
      } else {
        alert(res.error || "No se pudo guardar la configuración.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado.";
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-emerald-600 text-white px-5 py-3 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="size-5 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500">
              Sistema y Operaciones
            </span>
            <span className="size-1 rounded-full bg-slate-700" />
            <span className="text-xs text-slate-400 font-mono">
              admin_settings
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <Settings className="size-7 text-emerald-400" />
            Configuración del Negocio
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Datos comerciales, moneda, políticas de pedido y conmutadores operativos.
          </p>
        </div>

        <Button
          onClick={loadData}
          variant="outline"
          className="h-10 px-3 rounded-xl border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white self-start sm:self-auto"
        >
          <RefreshCw className={`size-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Restablecer
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-16 text-center text-slate-500">
          <RefreshCw className="size-8 animate-spin mx-auto text-emerald-500 mb-2" />
          Cargando configuración...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Datos de la Empresa */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="size-10 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 grid place-items-center text-emerald-400">
                <Building className="size-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Identidad y Contacto Comercial
                </h3>
                <p className="text-xs text-slate-400">
                  Información visible para los compradores en la tienda y facturación.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre de la Tienda / Negocio *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Correo Electrónico de Contacto
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Teléfono Principal
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  WhatsApp de Pedidos
                </label>
                <input
                  type="text"
                  placeholder="+56 9 1234 5678"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Dirección Física
                </label>
                <input
                  type="text"
                  placeholder="Av. Providencia 1234, Local 5"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ciudad / Comuna
                </label>
                <input
                  type="text"
                  placeholder="Santiago"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                URL del Logo Personalizado (opcional)
              </label>
              <input
                type="url"
                placeholder="https://... o dejar vacío para el logo estándar"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Card 2: Políticas Comerciales y Operativas */}
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="size-10 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 grid place-items-center text-emerald-400">
                <Truck className="size-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Reglas de Compra y Operación
                </h3>
                <p className="text-xs text-slate-400">
                  Restricciones de pedido mínimo, moneda de pago y pasarelas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Moneda de la Tienda
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="EUR">Euros (€ EUR)</option>
                  <option value="USD">Dólares ($ USD)</option>
                  <option value="CLP">Pesos Chilenos ($ CLP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Monto Mínimo por Pedido
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Recepción de Pedidos vía WhatsApp
                  </h4>
                  <p className="text-xs text-slate-400">
                    Permite a los usuarios enviar su carrito formateado directamente al WhatsApp de ventas.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={whatsappOrdersEnabled}
                  onChange={(e) => setWhatsappOrdersEnabled(e.target.checked)}
                  className="size-5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Formulario de Suscripción a Newsletter
                  </h4>
                  <p className="text-xs text-slate-400">
                    Muestra el cajón de captación de emails en el pie de página de la tienda.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={newsletterEnabled}
                  onChange={(e) => setNewsletterEnabled(e.target.checked)}
                  className="size-5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-950/30 border border-rose-900/50">
                <div>
                  <h4 className="text-sm font-bold text-rose-300 flex items-center gap-1.5">
                    <ShieldAlert className="size-4" />
                    Modo Mantenimiento
                  </h4>
                  <p className="text-xs text-rose-400/80">
                    Al activarlo, sólo los administradores tendrán acceso completo a la tienda.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="size-5 rounded border-rose-700 bg-slate-900 text-rose-500 focus:ring-rose-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSaving}
              className="h-12 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 shadow-xl shadow-emerald-950/50"
            >
              <Save className="size-4" />
              {isSaving ? "Guardando en Supabase..." : "Guardar Configuración"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
