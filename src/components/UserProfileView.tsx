import React, { useState } from "react";
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
} from "lucide-react";
import { UserProfile } from "@/lib/auth";
import { updateSupabaseUserProfile, signOutSupabase } from "@/lib/supabase";
import { CondiRicoLogo } from "@/components/CondiRicoLogo";
import { BiometricFingerprintModal } from "@/components/BiometricFingerprintModal";
import {
  getUserClientIP,
  recordUserSecurityIP,
  verifyUserSecurityIP,
} from "@/lib/userSecurity";

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

  // User_Sec IP state
  const [userRegisteredIp, setUserRegisteredIp] = useState<string>("Cargando...");
  const [currentNetworkIp, setCurrentNetworkIp] = useState<string>("Cargando...");
  const [isUpdatingIp, setIsUpdatingIp] = useState(false);

  React.useEffect(() => {
    getUserClientIP().then((ip) => {
      setCurrentNetworkIp(ip);
      verifyUserSecurityIP(currentUser.email, ip).then((res) => {
        if (res.registeredIp) {
          setUserRegisteredIp(res.registeredIp);
        } else {
          setUserRegisteredIp(ip);
          recordUserSecurityIP(currentUser.email, ip).catch(console.warn);
        }
      });
    });
  }, [currentUser.email]);

  const handleUpdateAuthorizedIp = async () => {
    setIsUpdatingIp(true);
    const res = await recordUserSecurityIP(currentUser.email, currentNetworkIp);
    setIsUpdatingIp(false);
    if (res.success) {
      setUserRegisteredIp(res.registeredIp);
      setSaveSuccessMessage("¡Dirección IP autorizada actualizada con éxito en Supabase User_Sec!");
      setTimeout(() => setSaveSuccessMessage(null), 3500);
    }
  };

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

  return (
    <div className="relative min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center selection:bg-sun selection:text-brand-deep">
      {/* Background Volumetric Lights */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 -right-20 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-emerald-400/30 via-teal-300/20 to-transparent blur-[120px] animate-float-slow" />
        <div className="absolute bottom-1/4 -left-20 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-amber-300/30 via-orange-200/20 to-transparent blur-[120px] animate-float-reverse" />
      </div>

      {/* Top Nav & Breadcrumbs */}
      <div className="mx-auto w-full max-w-2xl mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate("tienda")}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs font-bold text-muted-foreground shadow-2xs backdrop-blur-md hover:text-foreground hover:bg-white active:scale-95 transition-all"
        >
          <ChevronLeft className="size-4" />
          <span>Volver a la Tienda</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate("inicio")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors bg-white/60 border border-white/80 px-3 py-1.5 rounded-full shadow-2xs"
          >
            <Store className="size-3.5" />
            <span>Inicio</span>
          </button>
        </div>
      </div>

      {/* Main Profile Container */}
      <div className="mx-auto w-full max-w-2xl">
        <div className="relative rounded-[36px] liquid-glass p-6 sm:p-9 shadow-[0_25px_60px_-15px_rgba(20,83,45,0.15)] border border-white/80 overflow-hidden">
          {/* Top Specular Line */}
          <div className="absolute inset-x-12 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

          {/* Profile Header Badge and Cloud Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/60">
            <div className="flex items-center gap-3">
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
                    {name || "Mi Perfil"}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Supabase Cloud
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
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/80 px-3.5 py-1.5 text-xs font-extrabold text-rose-700 hover:bg-rose-100 active:scale-95 transition-all shadow-2xs"
            >
              <LogOut className="size-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveChanges} className="mt-6 space-y-6">
            {/* Feedback Alerts */}
            {saveSuccessMessage && (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50/95 p-4 text-xs font-bold text-emerald-900 shadow-sm flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p>{saveSuccessMessage}</p>
                  <p className="text-[11px] font-medium text-emerald-800/80 mt-0.5">
                    Tus próximos pedidos por WhatsApp y envíos usarán estos datos actualizados.
                  </p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-2xl border border-rose-300 bg-rose-50/95 p-4 text-xs font-bold text-rose-900 shadow-sm flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

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

            {/* SECCIÓN 3: PREFERENCIAS DE CUENTA */}
            <div className="space-y-4 pt-4 border-t border-white/60">
              <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-lg bg-emerald-500/20 text-emerald-800 text-xs font-black">
                  3
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
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all active:scale-95 ${
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
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all active:scale-95 ${
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
                  className="rounded-full bg-white border border-emerald-300 px-3 py-1.5 text-xs font-extrabold text-emerald-900 shadow-2xs hover:bg-emerald-50 active:scale-95 shrink-0 transition-all"
                >
                  {currentUser.hasBiometrics ? "Re-vincular" : "Activar"}
                </button>
              </div>

              {/* IP Security Shield (User_Sec) Card */}
              <div className="p-4 rounded-2xl bg-stone-900 text-stone-200 border border-white/10 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-9 place-items-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                      <ShieldCheck className="size-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-white">
                          Escudo Anti-Intrusos (Supabase User_Sec)
                        </h4>
                        <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Activo
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Tu cuenta bloquea automáticamente cualquier intento de inicio de sesión desde una dirección IP no autorizada.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-black/40 p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="text-stone-400 text-[10px] block uppercase font-bold">IP Autorizada en User_Sec</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">{userRegisteredIp}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block uppercase font-bold">IP Actual de tu Red</span>
                    <span className="font-mono font-bold text-white text-xs">{currentNetworkIp}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-stone-400">¿Cambiaste de red wifi o ubicación?</span>
                  <button
                    type="button"
                    onClick={handleUpdateAuthorizedIp}
                    disabled={isUpdatingIp}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isUpdatingIp ? (
                      <>
                        <Loader2 className="size-3 animate-spin" />
                        <span>Actualizando...</span>
                      </>
                    ) : (
                      <>
                        <Server className="size-3" />
                        <span>Autorizar mi IP actual</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* SECCIÓN 4: CAMBIO DE CONTRASEÑA */}
            <div className="pt-4 border-t border-white/60">
              <button
                type="button"
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary hover:underline"
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

            {/* Bottom Save Action */}
            <div className="pt-5 border-t border-white/80 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:flex-1 h-13 rounded-2xl bg-primary text-primary-foreground font-black text-sm shadow-xl shadow-primary/25 liquid-glass-button active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4.5 animate-spin" />
                    <span>Guardando en Supabase...</span>
                  </>
                ) : (
                  <>
                    <Save className="size-4.5" />
                    <span>Guardar Cambios en Supabase</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onNavigate("tienda")}
                className="w-full sm:w-auto h-13 px-6 rounded-2xl border border-white/80 bg-white/80 text-brand-deep font-extrabold text-xs shadow-xs hover:bg-white active:scale-95 transition-all"
              >
                Ir a la Tienda
              </button>
            </div>
          </form>
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
