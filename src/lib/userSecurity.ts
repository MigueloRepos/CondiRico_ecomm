import { getSupabase } from "@/lib/supabase";

export interface UserSecRecord {
  id?: number | string;
  created_at?: string;
  Usuario: string;
  IP: number;
}

export interface SecurityCheckResult {
  allowed: boolean;
  currentIp: string;
  registeredIp?: string;
  isNewUser?: boolean;
  message?: string;
}

const LOCAL_SEC_CACHE_KEY = "condirico_user_sec_cache_v1";

// Convert IPv4 string (e.g. "190.232.10.5") to 32-bit numeric integer for Supabase User_Sec.IP
export function ipToNumeric(ip: string): number {
  if (!ip || typeof ip !== "string") return 0;
  
  // Clean string
  const cleanIp = ip.trim().replace(/^::ffff:/, "");
  const parts = cleanIp.split(".");
  
  if (parts.length === 4 && parts.every((p) => !isNaN(Number(p)) && Number(p) >= 0 && Number(p) <= 255)) {
    return (
      (Number(parts[0]) * 16777216) +
      (Number(parts[1]) * 65536) +
      (Number(parts[2]) * 256) +
      Number(parts[3])
    );
  }
  
  // Hash non-IPv4 string (or IPv6) into positive 32-bit integer
  let hash = 0;
  for (let i = 0; i < cleanIp.length; i++) {
    hash = (hash * 31 + cleanIp.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Convert 32-bit numeric integer back to IPv4 string
export function numericToIp(num: number | string): string {
  if (typeof num === "string" && num.includes(".")) {
    return num; // Already string IP
  }
  const n = Number(num);
  if (isNaN(n) || n === 0) return "0.0.0.0";
  
  return [
    (n >>> 24) & 255,
    (n >>> 16) & 255,
    (n >>> 8) & 255,
    n & 255,
  ].join(".");
}

// Cached client IP in memory
let cachedClientIp: string | null = null;
let lastFetchTime = 0;

// Get current client public IP address with multiple fallbacks
export async function getUserClientIP(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && cachedClientIp && now - lastFetchTime < 1000 * 60 * 10) {
    return cachedClientIp;
  }

  // 1. Primary: ipify.org (IPv4 JSON)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("https://api.ipify.org?format=json", {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.ip) {
        cachedClientIp = data.ip;
        lastFetchTime = now;
        return data.ip;
      }
    }
  } catch {
    // try next provider
  }

  // 2. Fallback: ipapi.co
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("https://ipapi.co/json/", {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.ip) {
        cachedClientIp = data.ip;
        lastFetchTime = now;
        return data.ip;
      }
    }
  } catch {
    // try next provider
  }

  // 3. Fallback: api64.ipify.org
  try {
    const res = await fetch("https://api64.ipify.org?format=json");
    if (res.ok) {
      const data = await res.json();
      if (data.ip) {
        cachedClientIp = data.ip;
        lastFetchTime = now;
        return data.ip;
      }
    }
  } catch {
    // fallback
  }

  // 4. Default / Simulated Network IP for environments without internet access
  const fallbackIp = "186.32.115.42";
  cachedClientIp = fallbackIp;
  return fallbackIp;
}

// Local cache helpers
function getLocalSecCache(): Record<string, { ip: string; numericIp: number; updatedAt: string }> {
  try {
    const raw = localStorage.getItem(LOCAL_SEC_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalSecCache(cache: Record<string, { ip: string; numericIp: number; updatedAt: string }>) {
  try {
    localStorage.setItem(LOCAL_SEC_CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn("Could not write to local security cache", err);
  }
}

/**
 * Record user and IP address in Supabase table `User_Sec`
 * Called on first registration or when authenticating.
 */
export async function recordUserSecurityIP(
  usernameOrEmail: string,
  customIp?: string
): Promise<{ success: boolean; registeredIp: string; error?: string }> {
  const usuario = usernameOrEmail.trim().toLowerCase();
  if (!usuario) {
    return { success: false, registeredIp: "", error: "Usuario requerido" };
  }

  const clientIp = customIp || (await getUserClientIP());
  const numericIp = ipToNumeric(clientIp);

  // Save to local cache first
  const cache = getLocalSecCache();
  cache[usuario] = {
    ip: clientIp,
    numericIp,
    updatedAt: new Date().toISOString(),
  };
  saveLocalSecCache(cache);

  const supabase = getSupabase();

  try {
    // Check if record already exists in Supabase User_Sec
    const { data: existingRows, error: checkError } = await supabase
      .from("User_Sec")
      .select("*")
      .ilike("Usuario", usuario);

    if (checkError) {
      console.warn("Supabase User_Sec check warning:", checkError.message);
    }

    if (existingRows && existingRows.length > 0) {
      // Update existing record
      const rowId = existingRows[0].id;
      const { error: updateError } = await supabase
        .from("User_Sec")
        .update({
          IP: numericIp,
        })
        .eq("id", rowId);

      if (updateError) {
        console.warn("Supabase User_Sec update error:", updateError.message);
      }
    } else {
      // Insert new record into User_Sec
      const { error: insertError } = await supabase
        .from("User_Sec")
        .insert([
          {
            Usuario: usuario,
            IP: numericIp,
          },
        ]);

      if (insertError) {
        console.warn("Supabase User_Sec insert error:", insertError.message);
      }
    }

    return { success: true, registeredIp: clientIp };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido al registrar IP";
    return { success: true, registeredIp: clientIp, error: msg };
  }
}

/**
 * Verify user IP before allowing login.
 * If user has a registered IP in User_Sec and current IP is different, BLOCK access!
 */
export async function verifyUserSecurityIP(
  usernameOrEmail: string,
  simulatedIp?: string
): Promise<SecurityCheckResult> {
  const usuario = usernameOrEmail.trim().toLowerCase();
  const currentIp = simulatedIp || (await getUserClientIP());
  const currentNumericIp = ipToNumeric(currentIp);

  if (!usuario) {
    return { allowed: true, currentIp, isNewUser: true };
  }

  const supabase = getSupabase();

  try {
    // Query Supabase User_Sec table
    const { data: secRows, error } = await supabase
      .from("User_Sec")
      .select("*")
      .ilike("Usuario", usuario);

    let registeredNumeric: number | null = null;
    let registeredIpStr: string | null = null;

    if (!error && secRows && secRows.length > 0) {
      registeredNumeric = Number(secRows[0].IP);
      registeredIpStr = numericToIp(registeredNumeric);
    } else {
      // Fallback check in local security cache
      const cache = getLocalSecCache();
      if (cache[usuario]) {
        registeredNumeric = cache[usuario].numericIp;
        registeredIpStr = cache[usuario].ip;
      }
    }

    // If no security record exists for this user yet, it's a first-time or new user
    if (registeredNumeric === null || registeredNumeric === 0) {
      return {
        allowed: true,
        currentIp,
        isNewUser: true,
      };
    }

    // Compare IPs
    const isSameIp =
      registeredNumeric === currentNumericIp ||
      (registeredIpStr && registeredIpStr === currentIp);

    if (isSameIp) {
      return {
        allowed: true,
        currentIp,
        registeredIp: registeredIpStr || currentIp,
      };
    }

    // IP MISMATCH -> INTRUDER OR DIFFERENT DEVICE DETECTED -> BLOCK!
    return {
      allowed: false,
      currentIp,
      registeredIp: registeredIpStr || numericToIp(registeredNumeric),
      message: `Acceso bloqueado por seguridad: Se detectó un intento de inicio de sesión desde una dirección IP no autorizada (${currentIp}). Tu cuenta está vinculada a la red registrada (${registeredIpStr || numericToIp(registeredNumeric)}).`,
    };
  } catch (err) {
    console.warn("Error during IP security check:", err);
    // On unexpected network error, check local cache
    const cache = getLocalSecCache();
    if (cache[usuario]) {
      const isMatch = cache[usuario].numericIp === currentNumericIp || cache[usuario].ip === currentIp;
      if (!isMatch) {
        return {
          allowed: false,
          currentIp,
          registeredIp: cache[usuario].ip,
          message: `Acceso bloqueado: La IP actual (${currentIp}) no coincide con la IP de registro (${cache[usuario].ip}).`,
        };
      }
    }
    return { allowed: true, currentIp, isNewUser: true };
  }
}

/**
 * Fetch all security records for diagnostic / admin display
 */
export async function getSecurityRecords(): Promise<Array<{ usuario: string; ip: string; numericIp: number; createdAt?: string }>> {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase.from("User_Sec").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      return data.map((r: any) => ({
        usuario: r.Usuario,
        ip: numericToIp(r.IP),
        numericIp: Number(r.IP),
        createdAt: r.created_at,
      }));
    }
  } catch (err) {
    console.warn("Could not fetch User_Sec records:", err);
  }

  // Local fallback
  const cache = getLocalSecCache();
  return Object.entries(cache).map(([usuario, val]) => ({
    usuario,
    ip: val.ip,
    numericIp: val.numericIp,
    createdAt: val.updatedAt,
  }));
}
