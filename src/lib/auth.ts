// CondiRico Auth & WebAuthn Biometric Service
// Authoritative sessions are managed exclusively by Supabase Auth (supabase.auth.getSession / onAuthStateChange)

export interface UserPreferences {
  offersNewsletter?: boolean;
  whatsappUpdates?: boolean;
  preferredInvoiceType?: "boleta" | "factura";
  deliveryInstructions?: string;
  city?: string;
  postalCode?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  hasBiometrics: boolean;
  biometricCredentialId?: string;
  avatarUrl?: string | null;
  createdAt: string;
  preferences?: UserPreferences;
  role?: "customer" | "user" | "admin" | string;
}

const BIOMETRIC_CRED_KEY = "condirico_biometric_device_v1";

/**
 * Check if the current browser and platform support native WebAuthn
 */
export function isWebAuthnSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.PublicKeyCredential &&
    typeof navigator?.credentials?.create === "function" &&
    typeof navigator?.credentials?.get === "function" &&
    window.isSecureContext
  );
}

/**
 * Check if device has a registered biometric credential locally
 */
export function hasDeviceBiometricKey(): boolean {
  try {
    return Boolean(localStorage.getItem(BIOMETRIC_CRED_KEY));
  } catch {
    return false;
  }
}

/**
 * Get device biometric registration metadata
 */
export function getBiometricKeyInfo(): { email: string; credentialId: string } | null {
  try {
    const raw = localStorage.getItem(BIOMETRIC_CRED_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Store device biometric registration metadata
 */
export function setBiometricKey(email: string, credentialId: string) {
  try {
    localStorage.setItem(BIOMETRIC_CRED_KEY, JSON.stringify({ email: email.toLowerCase().trim(), credentialId }));
  } catch (err) {
    console.error("Error setting biometric key:", err);
  }
}

/**
 * Clear device biometric registration
 */
export function clearBiometricKey() {
  try {
    localStorage.removeItem(BIOMETRIC_CRED_KEY);
  } catch (err) {
    console.error("Error clearing biometric key:", err);
  }
}

function bufferFromStr(str: string): BufferSource {
  const encoder = new TextEncoder();
  const uint8 = encoder.encode(str);
  const copy = new ArrayBuffer(uint8.byteLength);
  new Uint8Array(copy).set(uint8);
  return copy;
}

/**
 * WebAuthn Biometrics: Register fingerprint credential using real browser WebAuthn API
 * Never returns false positives or fake successes.
 */
export async function registerWebAuthnBiometrics(
  user: UserProfile
): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  if (!isWebAuthnSupported()) {
    return {
      success: false,
      error: "La autenticación biométrica (WebAuthn / Passkeys) no está disponible en este navegador o contexto.",
    };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const userIdBuffer = bufferFromStr(user.id);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: "CondiRico Ecommerce",
          id: window.location.hostname === "localhost" ? "localhost" : undefined,
        },
        user: {
          id: userIdBuffer,
          name: user.email,
          displayName: user.name,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Touch ID / Face ID / Windows Hello / Android Biometric
          userVerification: "preferred",
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (credential && credential.id) {
      setBiometricKey(user.email, credential.id);
      return { success: true, credentialId: credential.id };
    }

    return {
      success: false,
      error: "No se recibió respuesta válida del sensor biométrico del dispositivo.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al registrar credencial biométrica.";
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * WebAuthn Biometrics: Authenticate with fingerprint using real browser WebAuthn API
 * If the user cancels or the biometric challenge fails, it strictly returns an error.
 */
export async function verifyWebAuthnBiometrics(
  targetEmail?: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  const bioInfo = getBiometricKeyInfo();
  const emailToVerify = (targetEmail || bioInfo?.email)?.toLowerCase().trim();

  if (!emailToVerify) {
    return {
      success: false,
      error: "No hay ninguna credencial biométrica registrada en este dispositivo.",
    };
  }

  if (!isWebAuthnSupported()) {
    return {
      success: false,
      error: "La autenticación biométrica no es compatible con este navegador o dispositivo.",
    };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        userVerification: "preferred",
        timeout: 60000,
      },
    });

    if (assertion) {
      return { success: true, email: emailToVerify };
    }

    return {
      success: false,
      error: "Fallo de autenticación biométrica. No se pudo verificar la huella.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Fallo en la autenticación biométrica.";
    return {
      success: false,
      error: msg,
    };
  }
}
