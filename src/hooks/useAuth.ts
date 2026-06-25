"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getPocketbaseClient } from "@/lib/pocketbase";
import type { GoogleData } from "@/types/pocketbase";

interface UseAuthOptions {
  /** If true, redirects to "/" when not authenticated. Default: true */
  requireAuth?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  googleUser: string;
  googleAvatar: string;
  userEmail: string;
  /** Call this to clear auth and redirect to "/" */
  logout: () => void;
}

/**
 * Centralizes the repeated localStorage → PocketBase auth check pattern.
 * Fixes audit items #10 (logout void bug), #11 (PB singleton), #18 (de-duplication).
 */
export function useAuth({ requireAuth = true }: UseAuthOptions = {}): AuthState {
  const router = useRouter();
  const pb = getPocketbaseClient();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [googleUser, setGoogleUser] = useState("");
  const [googleAvatar, setGoogleAvatar] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    let cancelled = false;

    const runCheck = async () => {
      if (!pb.authStore.isValid) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        if (requireAuth) router.push("/");
        return;
      }

      const authData = localStorage.getItem("pocketbase_auth");
      if (!authData) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        if (requireAuth) router.push("/");
        return;
      }

      try {
        const parsedAuth = JSON.parse(authData);
        const userId: string = parsedAuth.record?.id;
        if (!userId) return;

        pb.autoCancellation(false);
        // requestKey: null opts out of auto-cancellation so navigating between
        // pages (which can fire a competing users.getOne) can't abort this and
        // leave the user stuck/unauthenticated.
        const user = await pb.collection("users").getOne(userId, { requestKey: null });
        if (cancelled) return;

        setIsAuthenticated(true);
        setIsAdmin(!!user.is_admin);

        const googleDataStr = localStorage.getItem("google_data");
        if (googleDataStr) {
          const googleData: GoogleData = JSON.parse(googleDataStr);
          setGoogleUser(googleData.meta.name ?? "");
          setGoogleAvatar(googleData.meta.avatarURL ?? "");
          setUserEmail(googleData.meta.email ?? "");
        }
      } catch (err) {
        console.error("Failed to initialize auth:", err);
      }
    };

    runCheck();

    // Re-run whenever the auth token changes (login / logout) so the UI updates
    // immediately, without needing a manual page reload.
    const unsubscribe = pb.authStore.onChange(() => runCheck());
    return () => {
      cancelled = true;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(() => {
    // pb.authStore.clear() returns void — no need to check the return value (#10)
    pb.authStore.clear();
    setIsAuthenticated(false);
    setIsAdmin(false);
    localStorage.removeItem("google_data");
    localStorage.removeItem("pocketbase_auth");
    router.push("/");
  }, [pb, router]);

  return { isAuthenticated, isAdmin, googleUser, googleAvatar, userEmail, logout };
}
