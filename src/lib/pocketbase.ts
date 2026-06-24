import PocketBase, { BaseAuthStore, LocalAuthStore } from "pocketbase";

let pbClient: PocketBase | null = null;

/**
 * Returns a shared, module-level PocketBase client instance.
 * This prevents a new instance from being created on every component render.
 */
export function getPocketbaseClient(): PocketBase {
  if (!pbClient) {
    pbClient = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  }
  return pbClient;
}

/**
 * Returns a PocketBase client that can be elevated to a superuser session
 * (via `elevateAuth`) WITHOUT clobbering the user's persisted login.
 *
 * It uses an in-memory auth store seeded from the persisted "pocketbase_auth"
 * (so `elevateAuth` can present the user's token to the server), but any
 * elevated token written to it stays in memory and is never persisted to
 * localStorage. That keeps the shared user session intact for the rest of the
 * app (nav, admin broadcast auth, etc.).
 *
 * Use this on admin pages that perform privileged writes (new / edit / dashboard).
 */
export function getElevatableClient(): PocketBase {
  const memoryStore = new BaseAuthStore();

  if (typeof window !== "undefined") {
    // Seed from the persisted user session without keeping it linked.
    const persisted = new LocalAuthStore();
    if (persisted.token) {
      memoryStore.save(persisted.token, persisted.record);
    }
  }

  return new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL, memoryStore);
}
