import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { UserProfile, getCurrentSessionUser, setSessionUser } from "@/lib/auth";
import { getProfile } from "@/services/profiles";
import { syncLocalCartToSupabase } from "@/services/cart";

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentSessionUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync Supabase Auth Session
  const refreshUserSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        const mappedUser: UserProfile = {
          id: session.user.id,
          name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Usuario",
          email: session.user.email || "",
          phone: profile?.phone || "",
          address: profile?.address || "",
          hasBiometrics: profile?.has_biometrics || false,
          createdAt: profile?.created_at || session.user.created_at || new Date().toISOString(),
          role: profile?.role || "customer",
          preferences: {
            city: profile?.city || undefined,
            deliveryInstructions: profile?.delivery_instructions || undefined,
            offersNewsletter: profile?.offers_newsletter || false,
            whatsappUpdates: profile?.whatsapp_updates || false,
          },
        };
        setCurrentUser(mappedUser);
        setSessionUser(mappedUser);
      } else {
        const stored = getCurrentSessionUser();
        setCurrentUser(stored);
      }
    } catch (err) {
      console.error("[useAuth] Error refreshing session:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await refreshUserSession();
        // Background sync cart
        syncLocalCartToSupabase(session.user.id).catch(console.warn);
      } else {
        setCurrentUser(null);
        setSessionUser(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [refreshUserSession]);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    setSessionUser(null);
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
