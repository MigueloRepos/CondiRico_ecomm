import React, { useState } from "react";
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
  KeyRound,
  Database,
  Loader2,
  Settings2,
  AlertCircle,
} from "lucide-react";
import {
  UserProfile,
  getStoredUsers,
  saveStoredUsers,
  setSessionUser,
  hasDeviceBiometricKey,
  getBiometricKeyInfo,
  registerWebAuthnBiometrics,
} from "@/lib/auth";
import {
  signInWithSupabase,
  signUpWithSupabase,
  signInWithSupabaseOAuth,
  getSupabaseConfig,
} from "@/lib/supabase";
import { BiometricFingerprintModal } from "@/components/BiometricFingerprintModal";
import { SupabaseConfigModal } from "@/components/SupabaseConfigModal";
import { EmailOtpVerificationModal } from "@/components/EmailOtpVerificationModal";
import { SecurityIpBlockModal } from "@/components/SecurityIpBlockModal";
import { UserProfileView } from "@/components/UserProfileView";
import { CondiRicoLogo } from "@/components/CondiRicoLogo";
import {
  getUserClientIP,
  recordUserSecurityIP,
  verifyUserSecurityIP,
} from "@/lib/userSecurity";

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
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

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

  // IP Security & Anti-Intruder (User_Sec) state
  const [detectedClientIp, setDetectedClientIp] = useState("186.32.115.42");
  const [securityBlockModalOpen, setSecurityBlockModalOpen] = useState(false);
  const [securityBlockedEmail, setSecurityBlockedEmail] = useState("");
  const [securityCurrentIp, setSecurityCurrentIp] = useState("");
  const [securityRegisteredIp, setSecurityRegisteredIp] = useState("");
  const [isSimulatingIntruder, setIsSimulatingIntruder] = useState(false);
  const [simulatedIntruderIp, setSimulatedIntruderIp] = useState("198.51.100.88");

  // Load client IP on mount
  React.useEffect(() => {
    getUserClientIP().then((ip) => {
      setDetectedClientIp(ip);
    });
  }, []);

  // Biometrics modal state
  const [biometricModalOpen, setBiometricModalOpen] = useState(false);
  const [biometricMode, setBiometricMode] = useState<"register" | "verify">("verify");
  const [pendingUserForBio, setPendingUserForBio] = useState<UserProfile | null>(null);

  // Success toast
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const deviceHasBiometric = hasDeviceBiometricKey();
  const bioKeyInfo = getBiometricKeyInfo();
  const sbConfig = getSupabaseConfig();

  // Quick fill demo user
  const handleQuickDemoFill = () => {
    setLoginEmail("miguelo.glez91@gmail.com");
    setLoginPassword("condirico2026");
    setLoginError("");
  };

  // Submit Login with Supabase Cloud & User_Sec IP Security Verification
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const targetEmail = loginEmail.trim();

    if (!targetEmail || !loginPassword.trim()) {
      setLoginError("Por favor completa tu correo y contraseña.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. IP Security Check against Supabase User_Sec table
      const activeIp = isSimulatingIntruder ? simulatedIntruderIp : undefined;
      const secCheck = await verifyUserSecurityIP(targetEmail, activeIp);

      if (!secCheck.allowed) {
        setIsSubmitting(false);
        setSecurityBlockedEmail(targetEmail);
        setSecurityCurrentIp(secCheck.currentIp);
        setSecurityRegisteredIp(secCheck.registeredIp || "Desconocida");
        setSecurityBlockModalOpen(true);
        setLoginError(
          `Acceso bloqueado por seguridad: IP no autorizada (${secCheck.currentIp}). Tu cuenta está vinculada a la red (${secCheck.registeredIp}).`
        );
        return;
      }

      // 2. Authenticate with Supabase Cloud
      const { user: sbUser, error: sbError } = await signInWithSupabase({
        email: targetEmail,
        password: loginPassword,
      });

      if (sbUser) {
        // Record or refresh security IP in Supabase User_Sec
        recordUserSecurityIP(sbUser.email, secCheck.currentIp).catch(console.warn);

        setSessionUser(sbUser);
        setIsSubmitting(false);

        // Sync local users cache
        const localUsers = getStoredUsers();
        if (!localUsers.some((u) => u.email.toLowerCase() === sbUser.email.toLowerCase())) {
          localUsers.push(sbUser);
          saveStoredUsers(localUsers);
        }

        if (!sbUser.hasBiometrics && !deviceHasBiometric) {
          setPendingUserForBio(sbUser);
          setBiometricMode("register");
          setBiometricModalOpen(true);
        } else {
          setFeedbackSuccess(`¡Bienvenido de vuelta, ${sbUser.name}! IP autorizada.`);
          setTimeout(() => {
            onSuccessAuth(sbUser);
          }, 600);
        }
        return;
      }

      // Check if email not confirmed error to prompt verification
      if (sbError && (sbError.includes("confirmar") || sbError.includes("confirmed"))) {
        setIsSubmitting(false);
        setOtpPendingEmail(targetEmail);
        setOtpPendingName(targetEmail.split("@")[0]);
        setLoginError("Debes confirmar tu correo electrónico con el código de 6 dígitos.");
        return;
      }

      // If Supabase returns an error or demo offline mode fallback
      const users = getStoredUsers();
      const found = users.find(
        (u) => u.email.toLowerCase() === targetEmail.toLowerCase()
      );

      if (found) {
        // Record in User_Sec
        recordUserSecurityIP(found.email, secCheck.currentIp).catch(console.warn);

        setSessionUser(found);
        setIsSubmitting(false);

        if (!found.hasBiometrics && !deviceHasBiometric) {
          setPendingUserForBio(found);
          setBiometricMode("register");
          setBiometricModalOpen(true);
        } else {
          setFeedbackSuccess(`¡Bienvenido de vuelta, ${found.name}!`);
          setTimeout(() => {
            onSuccessAuth(found);
          }, 600);
        }
        return;
      }

      // If error from Supabase and not found locally
      setIsSubmitting(false);
      setLoginError(
        sbError || "Credenciales incorrectas. Si eres nuevo usuario, haz clic en 'Registrarme'."
      );
    } catch (err: unknown) {
      setIsSubmitting(false);
      setLoginError(err instanceof Error ? err.message : "Error al conectar con Supabase");
    }
  };

  // Submit Register with Supabase Cloud & trigger 6-digit OTP verification email & User_Sec registration
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
      // 1. Sign up on Supabase Cloud (triggers email dispatch with confirmation code)
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

      // 2. Pre-record IP security association in Supabase User_Sec
      const activeIp = isSimulatingIntruder ? simulatedIntruderIp : detectedClientIp;
      await recordUserSecurityIP(registerEmail.trim(), activeIp);

      setIsSubmitting(false);

      // Open the OTP Verification Modal for the user to enter the 6-digit code
      setOtpPendingEmail(registerEmail.trim());
      setOtpPendingName(registerName.trim());
      setOtpPendingPhone(registerPhone.trim());
      setOtpPendingAddress(registerAddress.trim());
      setOtpPendingEnableBio(enableBiometricsOnRegister);
      setOtpModalOpen(true);

      setFeedbackSuccess("¡Código de verificación enviado! Revisa tu correo electrónico.");
    } catch (err: unknown) {
      setIsSubmitting(false);
      setRegisterError(err instanceof Error ? err.message : "Error al registrar en Supabase");
    }
  };

  // Handle successful OTP verification from modal
  const handleOtpSuccess = async (verifiedUser: UserProfile) => {
    setOtpModalOpen(false);

    // Record user & IP into Supabase User_Sec
    const activeIp = isSimulatingIntruder ? simulatedIntruderIp : detectedClientIp;
    await recordUserSecurityIP(verifiedUser.email, activeIp);

    // Save user to active session
    const users = getStoredUsers();
    if (!users.some((u) => u.email.toLowerCase() === verifiedUser.email.toLowerCase())) {
      users.push(verifiedUser);
      saveStoredUsers(users);
    }
    setSessionUser(verifiedUser);

    setFeedbackSuccess(`¡Correo verificado y red asegurada en User_Sec! Bienvenido, ${verifiedUser.name}.`);

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

  // Initiate Biometric Fingerprint Login with IP security check
  const handleStartBiometricLogin = async () => {
    const targetEmail = bioKeyInfo?.email || "miguelo.glez91@gmail.com";
    const activeIp = isSimulatingIntruder ? simulatedIntruderIp : undefined;
    const secCheck = await verifyUserSecurityIP(targetEmail, activeIp);

    if (!secCheck.allowed) {
      setSecurityBlockedEmail(targetEmail);
      setSecurityCurrentIp(secCheck.currentIp);
      setSecurityRegisteredIp(secCheck.registeredIp || "Desconocida");
      setSecurityBlockModalOpen(true);
      setLoginError(
        `Acceso biométrico bloqueado por seguridad: IP no autorizada (${secCheck.currentIp}).`
      );
      return;
    }

    setBiometricMode("verify");
    setBiometricModalOpen(true);
  };

  // On biometric modal success
  const handleBiometricSuccess = async () => {
    setBiometricModalOpen(false);

    if (biometricMode === "register" && pendingUserForBio) {
      await registerWebAuthnBiometrics(pendingUserForBio);
      const users = getStoredUsers().map((u) =>
        u.id === pendingUserForBio.id ? { ...u, hasBiometrics: true } : u
      );
      saveStoredUsers(users);
      const updatedUser = { ...pendingUserForBio, hasBiometrics: true };
      setSessionUser(updatedUser);
      setFeedbackSuccess("¡Huella dactilar activada! Acceso biométrico configurado.");
      setTimeout(() => {
        onSuccessAuth(updatedUser);
      }, 700);
    } else {
      // Biometric login verified
      const users = getStoredUsers();
      const targetEmail = bioKeyInfo?.email || "miguelo.glez91@gmail.com";
      const user = users.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase()) || users[0];
      setSessionUser(user);
      setFeedbackSuccess(`¡Identidad biométrica confirmada! Hola, ${user.name}.`);
      setTimeout(() => {
        onSuccessAuth(user);
      }, 700);
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
      {/* Volumetric background lights */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 -right-20 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-emerald-400/35 via-teal-300/25 to-transparent blur-[120px] animate-float-slow" />
        <div className="absolute bottom-1/4 -left-20 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-amber-300/35 via-orange-200/25 to-transparent blur-[120px] animate-float-reverse" />
      </div>

      {/* Top back navigation */}
      <div className="mx-auto w-full max-w-md mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate("tienda")}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs font-bold text-muted-foreground shadow-2xs backdrop-blur-md hover:text-foreground hover:bg-white active:scale-95 transition-all"
        >
          <ChevronLeft className="size-4" />
          <span>Volver a la Tienda</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("inicio")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
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

          {/* Supabase Cloud Connection Status Badge & Settings Trigger */}
          <div className="flex flex-col gap-2 mb-4 border-b border-white/60 pb-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-extrabold text-emerald-800 backdrop-blur-md">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Supabase Cloud Auth</span>
              </div>
              <button
                type="button"
                onClick={() => setSupabaseModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors bg-white/60 border border-white/80 px-2.5 py-1 rounded-full shadow-2xs active:scale-95"
                title="Configurar proyecto Supabase (URL + Anon Key)"
              >
                <Database className="size-3 text-emerald-600" />
                <span>Conexión BD</span>
              </button>
            </div>

            {/* IP Security Shield Indicator (User_Sec) */}
            <div className="flex items-center justify-between rounded-xl bg-stone-900/85 text-stone-200 px-3 py-2 text-[11px] border border-white/10 shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-extrabold text-white">Escudo IP User_Sec:</span>{" "}
                  <span className="font-mono text-emerald-400 font-bold">{isSimulatingIntruder ? simulatedIntruderIp : detectedClientIp}</span>
                </div>
              </div>

              {/* Simulation test button */}
              <button
                type="button"
                onClick={() => setIsSimulatingIntruder(!isSimulatingIntruder)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                  isSimulatingIntruder
                    ? "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse"
                    : "bg-white/10 text-stone-300 border-white/20 hover:bg-white/20"
                }`}
                title="Probar qué sucede si un intruso intenta acceder desde otra IP no autorizada"
              >
                {isSimulatingIntruder ? "🔴 Modo Intruso ON" : "🛡️ Probar Intruso"}
              </button>
            </div>

            {isSimulatingIntruder && (
              <div className="rounded-lg bg-red-950/70 border border-red-500/40 p-2 text-[11px] text-red-200">
                <p className="font-bold flex items-center gap-1 text-red-300">
                  <AlertCircle className="size-3 text-red-400 shrink-0" />
                  Simulación de intruso activa: IP ficticia <code className="font-mono text-white">{simulatedIntruderIp}</code>
                </p>
                <p className="text-[10px] text-red-200/80 mt-0.5">
                  Si intentas iniciar sesión con una cuenta registrada, el sistema la bloqueará automáticamente por seguridad.
                </p>
              </div>
            )}
          </div>

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
                ? "Accede a tu cuenta de Supabase para confirmar tu pedido y envíos en 24h"
                : "Regístrate en Supabase para comprar en CondiRico y habilitar acceso biométrico"}
            </p>
          </div>

          {/* Biometrics One-Tap Banner for Returning Users */}
          {tab === "login" && (
            <div className="mt-6">
              <button
                type="button"
                onClick={handleStartBiometricLogin}
                className="group relative w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-4 text-white shadow-[0_10px_25px_rgba(16,185,129,0.35)] active:scale-98 transition-all hover:shadow-[0_14px_30px_rgba(16,185,129,0.45)] border border-emerald-400/40 text-left overflow-hidden"
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
                        {bioKeyInfo ? `Huella vinculada a ${bioKeyInfo.email}` : "Autenticación biométrica Fingerprint"}
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
                    o con Supabase Auth
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tabs Pill Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-muted/60 border border-white/80 backdrop-blur-md mb-6">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setLoginError("");
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                tab === "login"
                  ? "bg-white text-primary shadow-xs scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("register");
                setRegisterError("");
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                tab === "register"
                  ? "bg-white text-primary shadow-xs scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Registrarme
            </button>
          </div>

          {/* Feedback Success Message */}
          {feedbackSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span>{feedbackSuccess}</span>
            </div>
          )}

          {/* Login Form */}
          {tab === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                  {loginError.includes("confirmar") && (
                    <button
                      type="button"
                      onClick={() => {
                        setOtpPendingEmail(loginEmail.trim());
                        setOtpPendingName(loginEmail.trim().split("@")[0]);
                        setOtpModalOpen(true);
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Mail className="size-3.5" />
                      <span>Ingresar código de 6 dígitos ahora</span>
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ejemplo@condirico.com"
                    className="w-full h-11 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/70 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
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

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleQuickDemoFill}
                  className="inline-flex items-center gap-1 font-bold text-primary hover:underline text-[11px]"
                >
                  <KeyRound className="size-3" />
                  <span>Rellenar usuario demo</span>
                </button>
                <span className="text-[11px] text-muted-foreground">
                  Garantía de compra segura
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm shadow-lg shadow-primary/25 liquid-glass-button active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Conectando con Supabase...</span>
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
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {registerError && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{registerError}</span>
                </p>
              )}

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Ej. Carlos Mendoza"
                    className="w-full h-10 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/70 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="+34 600 000 000"
                      className="w-full h-10 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/70 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full h-10 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/70 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Dirección de entrega habitual
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={registerAddress}
                    onChange={(e) => setRegisterAddress(e.target.value)}
                    placeholder="Calle, número, piso o urbanización"
                    className="w-full h-10 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/70 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Contraseña de acceso
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full h-10 pl-10 pr-3 rounded-2xl border border-white/80 bg-white/70 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Biometrics Opt-in feature */}
              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableBiometricsOnRegister}
                  onChange={(e) => setEnableBiometricsOnRegister(e.target.checked)}
                  className="mt-0.5 size-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <span className="font-extrabold text-emerald-950 flex items-center gap-1">
                    <Fingerprint className="size-3.5 text-emerald-600" />
                    Activar huella dactilar al entrar por primera vez
                  </span>
                  <p className="text-[11px] text-emerald-800/80 mt-0.5">
                    Podrás ingresar en un toque mediante biometría fingerprint en tus próximas compras.
                  </p>
                </div>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm shadow-lg shadow-primary/25 liquid-glass-button active:scale-98 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Registrando en Supabase...</span>
                  </>
                ) : (
                  <>
                    <span>Crear Cuenta en Supabase</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Safety note */}
          <div className="mt-6 pt-4 border-t border-white/60 text-center">
            <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span>Compras protegidas con cifrado y verificación de identidad</span>
            </p>
          </div>
        </div>
      </div>

      {/* Biometric Fingerprint Modal */}
      <BiometricFingerprintModal
        isOpen={biometricModalOpen}
        onClose={() => setBiometricModalOpen(false)}
        onSuccess={handleBiometricSuccess}
        mode={biometricMode}
        userEmail={pendingUserForBio?.email || bioKeyInfo?.email}
        userName={pendingUserForBio?.name}
      />

      {/* Supabase 6-digit Email OTP Verification Modal */}
      <EmailOtpVerificationModal
        isOpen={otpModalOpen}
        email={otpPendingEmail}
        fullName={otpPendingName}
        phone={otpPendingPhone}
        address={otpPendingAddress}
        onClose={() => setOtpModalOpen(false)}
        onSuccess={handleOtpSuccess}
        onChangeEmail={() => {
          setOtpModalOpen(false);
          setTab("register");
        }}
      />

      {/* Supabase Config Modal */}
      <SupabaseConfigModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />

      {/* Anti-Intruder IP Security Block Modal */}
      <SecurityIpBlockModal
        isOpen={securityBlockModalOpen}
        onClose={() => setSecurityBlockModalOpen(false)}
        userEmail={securityBlockedEmail}
        currentIp={securityCurrentIp}
        registeredIp={securityRegisteredIp}
        onAuthorizeCurrentIp={async () => {
          if (securityBlockedEmail && securityCurrentIp) {
            await recordUserSecurityIP(securityBlockedEmail, securityCurrentIp);
            setFeedbackSuccess("¡IP autorizada y actualizada en Supabase User_Sec!");
          }
        }}
      />
    </div>
  );
};
