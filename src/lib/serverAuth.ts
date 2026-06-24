import PocketBase from "pocketbase";

const PB_URL =
  process.env.POCKETBASE_URL ?? process.env.NEXT_PUBLIC_POCKETBASE_URL ?? "";

/**
 * Server-only PocketBase client authenticated as a superuser.
 * Credentials never leave the server. Use for privileged writes inside
 * route handlers only.
 */
export async function getSuperuserClient(): Promise<PocketBase> {
  const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
  const adminPass = process.env.POCKETBASE_ADMIN_PW;

  if (!adminEmail || !adminPass) {
    throw new Error("POCKETBASE_ADMIN_EMAIL / POCKETBASE_ADMIN_PW are not set");
  }

  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  await pb.collection("_superusers").authWithPassword(adminEmail, adminPass, {
    cache: "no-store",
  });
  return pb;
}

/**
 * Validates the caller's PocketBase *user* token (sent as a Bearer token) and
 * confirms the user is an admin. Returns the user record on success, or null
 * if the token is missing/invalid or the user is not an admin.
 *
 * This lets route handlers gate privileged actions on the logged-in user
 * without ever trusting a client-side `is_admin` flag.
 */
export async function requireAdmin(
  req: Request
): Promise<{ id: string; is_admin: boolean } | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;

  try {
    const pb = new PocketBase(PB_URL);
    pb.autoCancellation(false);
    pb.authStore.save(token, null);
    // authRefresh re-validates the token against the server and returns the record.
    const result = await pb.collection("users").authRefresh();
    const record = result.record as unknown as { id: string; is_admin?: boolean };
    if (!record?.is_admin) return null;
    return { id: record.id, is_admin: true };
  } catch {
    return null;
  }
}

/**
 * Validates the caller's PocketBase *user* token (sent as a Bearer token) without
 * requiring admin. Returns the user id on success, or null if missing/invalid.
 *
 * Used for low-stakes actions any logged-in player may take — e.g. a reconnecting
 * team asking the presenter to re-announce its location (`request_location`).
 */
export async function requireUser(
  req: Request
): Promise<{ id: string } | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;

  try {
    const pb = new PocketBase(PB_URL);
    pb.autoCancellation(false);
    pb.authStore.save(token, null);
    const result = await pb.collection("users").authRefresh();
    const record = result.record as unknown as { id: string };
    if (!record?.id) return null;
    return { id: record.id };
  } catch {
    return null;
  }
}
