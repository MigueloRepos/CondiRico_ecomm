import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/lib/auth";
import { getProfile, checkIsAdmin } from "@/services/profiles";
import { syncLocalCartToSupabase } from "@/services/cart";

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync Supabase Auth Session strictly from official Supabase Auth engine
  const refreshUserSession = useCallback(async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setCurrentUser(null);
        return;
      }

      const user = session.user;
      const profile = await getProfile(user.id);
      let verifiedRole = profile?.role || "customer";

      // If profile not yet populated or missing role, perform secure lookup
      if (!profile?.role) {
        const isAdmin = await checkIsAdmin(user.id);
        if (isAdmin) verifiedRole = "admin";
      }

      const mappedUser: UserProfile = {
        id: user.id,
        name:
          profile?.full_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Usuario",
        email: user.email || "",
        phone: profile?.phone || user.user_metadata?.phone || "",
        address: profile?.address || user.user_metadata?.address || "",
        hasBiometrics: profile?.has_biometrics || Boolean(user.user_metadata?.hasBiometrics),
        createdAt: profile?.created_at || user.created_at || new Date().toISOString(),
        role: verifiedRole,
        preferences: {
          city: profile?.city || undefined,
          postalCode: profile?.postal_code || undefined,
          deliveryInstructions: profile?.delivery_instructions || undefined,
          offersNewsletter: profile?.offers_newsletter ?? true,
          whatsappUpdates: profile?.whatsapp_updates ?? true,
          preferredInvoiceType: (profile?.preferred_invoice_type as "boleta" | "factura") || "boleta",
        },
      };

      setCurrentUser(mappedUser);
    } catch (err) {
      console.error("[useAuth] Error refreshing session from Supabase:", err);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUserSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await refreshUserSession();
        if (event === "SIGNED_IN") {
          syncLocalCartToSupabase(session.user.id).catch(console.warn);
        }
      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUserSession]);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[useAuth] Sign out error:", err);
    }
    setCurrentUser(null);
  };

  return {
    currentUser,
    setCurrentUser,
    isLoading,
    logout,
    refreshUserSession,
  };
}
