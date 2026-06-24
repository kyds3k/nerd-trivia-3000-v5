import type PocketBase from "pocketbase";

/**
 * Upgrades the current PocketBase session to an elevated (superuser) token by
 * asking the server, which validates that the logged-in user is an admin.
 *
 * The superuser password no longer lives in the client bundle — the server
 * holds it and only hands back a token to verified admins.
 *
 * Requires the user to be logged in (Google OAuth) as an admin. If they are
 * not, the existing session is left untouched.
 *
 * @returns true if the session was elevated, false otherwise.
 */
export async function elevateAuth(pb: PocketBase): Promise<boolean> {
  const userToken = pb.authStore.token;
  if (!userToken) {
    console.warn("Cannot elevate: not logged in.");
    return false;
  }

  try {
    const res = await fetch("/api/pb-elevate", {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
    });

    if (!res.ok) {
      // 403 = logged in but not an admin; keep the existing user session.
      return false;
    }

    const { token, record } = await res.json();
    pb.authStore.save(token, record);
    return true;
  } catch (error) {
    console.error("Failed to elevate auth state:", error);
    return false;
  }
}
