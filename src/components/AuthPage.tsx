import React, { useState, useEffect } from "react";
import {
  Fingerprint,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Store,
  ChevronLeft,
  Database,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  UserProfile,
  hasDeviceBiometricKey,
  getBiometricKeyInfo,
  registerWebAuthnBiometrics,
} from "@/lib/auth";
import {
  signInWithSupabase,
  signInWithPhonePassword,
  signInWithPhoneOtp,
  signUpWithSupabase,
  signInWithSupabaseOAuth,
  getSupabaseConfig,
  normalizePhoneNumber,
} from "@/lib/supabase";
import { BiometricFingerprintModal } from "@/components/BiometricFingerprintModal";
import { SupabaseConfigModal } from "@/components/SupabaseConfigModal";
import { EmailConfirmationModal } from "@/components/EmailConfirmationModal";
import { PhoneOtpModal } from "@/components/PhoneOtpModal";
import { UserProfileView } from "@/components/UserProfileView";
import { CondiRicoLogo } from "@/components/CondiRicoLogo";
import { getProfile, checkIsAdmin } from "@/services";

const COUNTRY_CODES = [
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+58", country: "Venezuela", flag: "🇻🇪" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+51", country: "Perú", flag: "🇵🇪" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+52", country: "México", flag: "🇲🇽" },
  { code: "+1", country: "EE.UU. / Canadá", flag: "🇺🇸" },
  { code: "+34", country: "España", flag: "🇪🇸" },
  { code: "+593", country: "Ecuador", flag: "🇪🇨" },
  { code: "+591", country: "Bolivia", flag: "🇧🇴" },
  { code: "+507", country: "Panamá", flag: "🇵🇦" },
];

interface AuthPageProps {
  onSuccessAuth: (user: UserProfile) => void;
  onNavigate: (page: "inicio" | "tienda") => void;
  intendedActionNotice?: string;
  cartCount?: number;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onSuccessAuth,
  onNavigate,
  intendedActionNotice,
  cartCount = 0,
  currentUser,
  onLogout,
}) => {
  const [tab, setTab] = useState<"login" | "register">("login");

  // Login form state
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginCountryCode, setLoginCountryCode] = useState("+56");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Phone OTP state
  const [phoneOtpModalOpen, setPhoneOtpModalOpen] = useState(false);
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);

  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerAddress, setRegisterAddress] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [enableBiometricsOnRegister, setEnableBiometricsOnRegister] = useState(true);
  const [registerError, setRegisterError] = useState("");

  // Loading & status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);

  // Email OTP Verification modal state
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpPendingEmail, setOtpPendingEmail] = useState("");
  const [otpPendingName, setOtpPendingName] = useState("");
  const [otpPendingPhone, setOtpPendingPhone] = useState("");
  const [otpPendingAddress, setOtpPendingAddress] = useState("");
  const [otpPendingEnableBio, setOtpPendingEnableBio] = useState(true);

  // Biometrics modal state
  const [biometricModalOpen, setBiometricModalOpen] = useState(false);
  const [biometricMode, setBiometricMode] = useState<"register" | "verify">("verify");
  const [pendingUserForBio, setPendingUserForBio] = useState<UserProfile | null>(null);

  // Success toast
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const deviceHasBiometric = hasDeviceBiometricKey();
  const bioKeyInfo = getBiometricKeyInfo();
  const sbConfig = getSupabaseConfig();

  // Common finalize login flow: fetch profile role, setup biometrics or redirect
  const finalizeLogin = async (user: UserProfile) => {
    try {
      const dbProfile = await getProfile(user.id);
      if (dbProfile?.role) {
        user.role = dbProfile.role;
      } else {
        const isAdmin = await checkIsAdmin(user.id);
        if (isAdmin) user.role = "admin";
        else user.role = "customer";
      }
    } catch (err) {
      console.warn("[AuthPage] Failed to fetch role:", err);
    }

    setIsSubmitting(false);

    if (!user.hasBiometrics && !deviceHasBiometric) {
      setPendingUserForBio(user);
      setBiometricMode("register");
      setBiometricModalOpen(true);
    } else {
      const destName = user.role === "admin" ? "Panel Administrativo (/admin)" : "Catálogo y Perfil de Cliente";
      setFeedbackSuccess(`¡Bienvenido de vuelta, ${user.name}! Redirigiendo a ${destName}...`);
      setTimeout(() => {
        onSuccessAuth(user);
      }, 600);
    }
  };

  // Submit Login with Email & Password
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const targetEmail = loginEmail.trim().toLowerCase();

    if (!targetEmail || !loginPassword.trim()) {
      setLoginError("Por favor completa tu correo y contraseña.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Authenticate with Supabase Cloud
      const { user: sbUser, error: sbError } = await signInWithSupabase({
        email: targetEmail,
        password: loginPassword,
      });

      if (sbUser) {
        await finalizeLogin(sbUser);
        return;
      }

      // Check if email not confirmed error to prompt verification
      if (sbError && (sbError.includes("confirmar") || sbError.includes("confirmed"))) {
        setIsSubmitting(false);
        setOtpPendingEmail(targetEmail);
        setOtpPendingName(targetEmail.split("@")[0]);
        setLoginError("Debes confirmar tu correo electrónico con el enlace enviado a tu bandeja de entrada.");
        setOtpModalOpen(true);
        return;
      }

      // Supabase authentication failed
      setIsSubmitting(false);
      setLoginError(
        sbError || "Credenciales incorrectas. Si eres nuevo usuario, haz clic en 'Registrarme'."
      );
    } catch (err: unknown) {
      setIsSubmitting(false);
      setLoginError(err instanceof Error ? err.message : "Error al conectar con Supabase");
    }
  };

  // Submit Login with Phone & Password
  const handlePhoneLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginPhone.trim() || !loginPassword.trim()) {
      setLoginError("Por favor ingresa tu número de teléfono y contraseña.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { user: sbUser, error: sbError } = await signInWithPhonePassword({
        phone: loginPhone.trim(),
        password: loginPassword,
        defaultCountryCode: loginCountryCode,
      });

      if (sbUser) {
        await finalizeLogin(sbUser);
        return;
      }

      setIsSubmitting(false);
      setLoginError(sbError || "No se pudo iniciar sesión con este número de teléfono.");
    } catch (err: unknown) {
      setIsSubmitting(false);
      setLoginError(err instanceof Error ? err.message : "Error al iniciar sesión con teléfono.");
    }
  };

  // Request Phone SMS OTP verification code
  const handleRequestPhoneOtp = async () => {
    setLoginError("");
    if (!loginPhone.trim()) {
      setLoginError("Por favor ingresa tu número de teléfono antes de solicitar el código SMS.");
      return;
    }

    setIsSendingPhoneOtp(true);

    try {
      const { error: otpErr } = await signInWithPhoneOtp({
        phone: loginPhone.trim(),
        defaultCountryCode: loginCountryCode,
      });

      setIsSendingPhoneOtp(false);

      if (otpErr) {
        setLoginError(otpErr);
        return;
      }

      setPhoneOtpModalOpen(true);
    } catch (err: unknown) {
      setIsSendingPhoneOtp(false);
      setLoginError(err instanceof Error ? err.message : "Error al solicitar código OTP por SMS.");
    }
  };

  // Handle successful Phone OTP verification
  const handlePhoneOtpSuccess = async (verifiedUser: UserProfile) => {
    setPhoneOtpModalOpen(false);
    await finalizeLogin(verifiedUser);
  };

  // Submit Register with Supabase Cloud & trigger confirmation link
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");

    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim()) {
      setRegisterError("Por favor completa tu nombre, correo y contraseña.");
      return;
    }

    if (registerPassword.length < 6) {
      setRegisterError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Sign up on Supabase Cloud
      const { error: sbError } = await signUpWithSupabase({
        email: registerEmail.trim(),
        password: registerPassword,
        fullName: registerName.trim(),
        phone: registerPhone.trim(),
        address: registerAddress.trim(),
      });

      if (sbError) {
        setIsSubmitting(false);
        setRegisterError(sbError);
        return;
      }

      setIsSubmitting(false);

      // Open Confirmation Link Modal
      setOtpPendingEmail(registerEmail.trim());
      setOtpPendingName(registerName.trim());
      setOtpPendingPhone(registerPhone.trim());
      setOtpPendingAddress(registerAddress.trim());
      setOtpPendingEnableBio(enableBiometricsOnRegister);
      setOtpModalOpen(true);

      setFeedbackSuccess("¡Enlace de confirmación enviado! Revisa tu correo electrónico para activar tu cuenta.");
    } catch (err: unknown) {
      setIsSubmitting(false);
      setRegisterError(err instanceof Error ? err.message : "Error al registrar en Supabase");
    }
  };

  // Handle successful OTP verification from modal
  const handleOtpSuccess = async (verifiedUser: UserProfile) => {
    setOtpModalOpen(false);

    setFeedbackSuccess(`¡Correo verificado con éxito! Bienvenido, ${verifiedUser.name}.`);

    if (otpPendingEnableBio && !deviceHasBiometric) {
      setPendingUserForBio(verifiedUser);
      setBiometricMode("register");
      setBiometricModalOpen(true);
    } else {
      setTimeout(() => {
        onSuccessAuth(verifiedUser);
      }, 700);
    }
  };

  // Initiate Biometric Fingerprint Login
  const handleStartBiometricLogin = async () => {
    const targetEmail = bioKeyInfo?.email;
    if (!targetEmail) {
      setLoginError("No hay huella registrada en este dispositivo. Inicia sesión con contraseña para activarla.");
      return;
    }

    setBiometricMode("verify");
    setBiometricModalOpen(true);
  };

  // On biometric modal success
  const handleBiometricSuccess = async () => {
    setBiometricModalOpen(false);

    if (biometricMode === "register" && pendingUserForBio) {
      const regRes = await registerWebAuthnBiometrics(pendingUserForBio);
      if (regRes.success) {
        const updatedUser = { ...pendingUserForBio, hasBiometrics: true };
        setFeedbackSuccess("¡Huella dactilar activada! Acceso biométrico configurado.");
        setTimeout(() => {
          onSuccessAuth(updatedUser);
        }, 700);
      }
    } else {
      // For verify mode, refresh current session from Supabase
      if (currentUser) {
        setFeedbackSuccess(`¡Identidad biométrica confirmada! Hola, ${currentUser.name}.`);
        setTimeout(() => {
          onSuccessAuth(currentUser);
        }, 700);
      }
    }
  };

  // If user is already authenticated, show the User Profile View
  if (currentUser) {
    return (
      <UserProfileView
        currentUser={currentUser}
        onUpdateUser={onSuccessAuth}
        onLogout={onLogout || (() => {})}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="relative min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-center selection:bg-sun selection:text-brand-deep">
      {/* Top back navigation */}
      <div className="mx-auto w-full max-w-md mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate("tienda")}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs font-bold text-muted-foreground shadow-2xs backdrop-blur-md hover:text-foreground hover:bg-white active:scale-95 transition-all cursor-pointer"
        >
          <ChevronLeft className="size-4" />
          <span>Volver a la Tienda</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("inicio")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <span>Ir a Inicio</span>
        </button>
      </div>

      {/* Main Auth Container */}
      <div className="mx-auto w-full max-w-md">
        {/* Notice for required login to purchase */}
        {intendedActionNotice && (
          <div className="mb-4 rounded-2xl border border-amber-300/80 bg-amber-50/90 p-4 backdrop-blur-md shadow-xs animate-in slide-in-from-top duration-300">
            <div className="flex items-start gap-3">
              <div className="grid size-8 place-items-center rounded-xl bg-amber-200 text-amber-900 shrink-0">
                <ShoppingBag className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-900">
                  Acceso Requerido para Comprar
                </h4>
                <p className="mt-0.5 text-[11px] text-amber-800 leading-snug">
                  {intendedActionNotice}
                </p>
                {cartCount > 0 && (
                  <span className="mt-1.5 inline-block text-[10px] font-bold text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded-full">
                    {cartCount} {cartCount === 1 ? "producto guardado" : "productos guardados"} en tu carrito
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Liquid Glass Card */}
        <div className="relative rounded-[36px] liquid-glass p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(20,83,45,0.12)] border border-white/80 overflow-hidden">
          {/* Specular Highlight line */}
          <div className="absolute inset-x-12 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

          {/* Logo & Heading */}
          <div className="text-center">
            <div className="mx-auto flex justify-center mb-3">
              <CondiRicoLogo className="h-10 sm:h-12 w-auto" />
            </div>
            <h1 className="text-2xl font-black text-brand-deep tracking-tight">
              {tab === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {tab === "login"
                ? "Accede a tu cuenta de CondiRico para confirmar tu pedido y envíos en 24h"
                : "Regístrate en CondiRico para comprar y habilitar acceso biométrico"}
            </p>
          </div>

          {/* Biometrics One-Tap Banner for Returning Users */}
          {tab === "login" && bioKeyInfo && (
            <div className="mt-6">
              <button
                type="button"
                onClick={handleStartBiometricLogin}
                className="group relative w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-4 text-white shadow-[0_10px_25px_rgba(16,185,129,0.35)] active:scale-98 transition-all hover:shadow-[0_14px_30px_rgba(16,185,129,0.45)] border border-emerald-400/40 text-left overflow-hidden cursor-pointer"
              >
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-12 place-items-center rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-xs group-hover:scale-110 transition-transform">
                      <Fingerprint className="size-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full text-white">
                          Rápido y Seguro
                        </span>
                        <Sparkles className="size-3 text-amber-300" />
                      </div>
                      <h4 className="font-black text-sm text-white mt-0.5">
                        Ingresar con Huella Dactilar
                      </h4>
                      <p className="text-[11px] text-white/80">
                        {`Huella vinculada a ${bioKeyInfo.email}`}
                      </p>
                    </div>
                  </div>
                  <div className="grid size-8 place-items-center rounded-full bg-white/20 group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="size-4 text-white" />
                  </div>
                </div>
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/60" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  <span className="bg-white/80 px-3 rounded-full backdrop-blur-xs">
                    o con tu cuenta
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tabs Pill Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-muted/60 border border-white/80 backdrop-blur-md mb-6 mt-4">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setLoginError("");
                setRegisterError("");
              }}
              className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                tab === "login"
                  ? "bg-white text-brand-deep shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("register");
                setLoginError("");
                setRegisterError("");
              }}
              className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                tab === "register"
                  ? "bg-white text-brand-deep shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Registrarme
            </button>
          </div>

          {/* Feedback message banner */}
          {feedbackSuccess && (
            <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-300 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>{feedbackSuccess}</span>
            </div>
          )}

          {tab === "login" ? (
            <div className="space-y-4">
              {/* Sub-tab: Correo vs Teléfono */}
              <div className="flex p-1 rounded-2xl bg-muted/50 border border-white/80 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("email");
                    setLoginError("");
                  }}
                  className={`flex-1 py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    loginMethod === "email"
                      ? "bg-white text-brand-deep shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Mail className="size-3.5" />
                  <span>Correo Electrónico</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("phone");
                    setLoginError("");
                  }}
                  className={`flex-1 py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    loginMethod === "phone"
                      ? "bg-white text-brand-deep shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Phone className="size-3.5 text-primary" />
                  <span>Número de Teléfono</span>
                </button>
              </div>

              {loginError && (
                <div className="rounded-2xl bg-rose-50 border border-rose-300 p-3 text-xs font-bold text-rose-800 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginMethod === "email" ? (
                /* Login with Email Form */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-foreground mb-1.5">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="tu.correo@ejemplo.com"
                        className="w-full h-11 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/70 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-foreground mb-1.5">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/70 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end text-xs pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      Garantía de compra segura SSL
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm shadow-lg shadow-primary/25 liquid-glass-button active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Iniciando sesión...</span>
                      </>
                    ) : (
                      <>
                        <span>Acceder a mi cuenta</span>
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Login with Phone Form */
                <form onSubmit={handlePhoneLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-foreground mb-1.5">
                      Número de Teléfono / Celular
                    </label>
                    <div className="flex gap-2">
                      {/* Country code selector */}
                      <div className="relative w-32 shrink-0">
                        <select
                          value={loginCountryCode}
                          onChange={(e) => setLoginCountryCode(e.target.value)}
                          className="w-full h-11 px-2.5 rounded-2xl border border-white/80 bg-white/80 text-xs font-bold text-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-inner cursor-pointer"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.code}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Phone number digits */}
                      <div className="relative flex-1">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                          type="tel"
                          required
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
                          placeholder="9 1234 5678"
                          className="w-full h-11 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/70 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 block">
                      Ingresa tu número con o sin código de país (ej. 987654321)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-foreground mb-1.5">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/70 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm shadow-lg shadow-primary/25 liquid-glass-button active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Verificando datos...</span>
                      </>
                    ) : (
                      <>
                        <span>Iniciar Sesión con Teléfono</span>
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>

                  {/* SMS OTP alternative button */}
                  <div className="pt-2">
                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/60" />
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                        <span className="bg-white/80 px-2 rounded-full backdrop-blur-xs">
                          o sin contraseña
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRequestPhoneOtp}
                      disabled={isSendingPhoneOtp || !loginPhone.trim()}
                      className="w-full h-11 rounded-2xl border border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSendingPhoneOtp ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Enviando código SMS...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3.5 text-amber-500" />
                          <span>Recibir código de acceso por SMS / WhatsApp</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {registerError && (
                <div className="rounded-2xl bg-rose-50 border border-rose-300 p-3 text-xs font-bold text-rose-800 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{registerError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-foreground mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full h-11 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/70 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-foreground mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="juan.perez@ejemplo.com"
                    className="w-full h-11 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/70 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-foreground mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="+34 600 000 000"
                      className="w-full h-11 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/70 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-foreground mb-1">
                    Dirección de Entrega
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={registerAddress}
                      onChange={(e) => setRegisterAddress(e.target.value)}
                      placeholder="Calle, número, piso"
                      className="w-full h-11 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/70 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-foreground mb-1">
                  Contraseña (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/70 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Biometrics Toggle Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/60 border border-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableBiometricsOnRegister}
                  onChange={(e) => setEnableBiometricsOnRegister(e.target.checked)}
                  className="rounded text-primary focus:ring-primary size-4"
                />
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Fingerprint className="size-4 text-emerald-600" />
                  <span>Activar acceso con huella dactilar al registrarme</span>
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm shadow-lg shadow-primary/25 liquid-glass-button active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Creando cuenta...</span>
                  </>
                ) : (
                  <>
                    <span>Crear Cuenta en CondiRico</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Social OAuth Providers */}
          <div className="mt-6 pt-5 border-t border-white/60">
            <p className="text-center text-[11px] font-bold text-muted-foreground mb-3 uppercase tracking-wider">
              o continúa con
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => signInWithSupabaseOAuth("google")}
                className="h-11 rounded-2xl bg-white/80 border border-white hover:bg-white text-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                <svg className="size-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => signInWithSupabaseOAuth("github")}
                className="h-11 rounded-2xl bg-white/80 border border-white hover:bg-white text-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                <svg className="size-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Biometric Fingerprint Modal */}
      <BiometricFingerprintModal
        isOpen={biometricModalOpen}
        onClose={() => setBiometricModalOpen(false)}
        onSuccess={handleBiometricSuccess}
        mode={biometricMode}
        userEmail={pendingUserForBio?.email || bioKeyInfo?.email || loginEmail}
        userName={pendingUserForBio?.name || undefined}
        currentUser={pendingUserForBio || null}
      />

      {/* Supabase Config Modal (Settings & Diagnostics) */}
      <SupabaseConfigModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
        onConfigSaved={() => {
          setFeedbackSuccess("Configuración de Supabase actualizada exitosamente.");
        }}
      />

      {/* Email Confirmation Link Verification Modal */}
      <EmailConfirmationModal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        email={otpPendingEmail}
        fullName={otpPendingName}
        phone={otpPendingPhone}
        address={otpPendingAddress}
        onSuccess={handleOtpSuccess}
      />

      {/* Phone SMS OTP Verification Modal */}
      <PhoneOtpModal
        isOpen={phoneOtpModalOpen}
        onClose={() => setPhoneOtpModalOpen(false)}
        phone={loginPhone}
        countryCode={loginCountryCode}
        onSuccess={handlePhoneOtpSuccess}
      />
    </div>
  );
};
