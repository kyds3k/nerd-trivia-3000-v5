import { NextResponse } from "next/server";
import { requireAdmin, getSuperuserClient } from "@/lib/serverAuth";

/**
 * Returns an elevated (superuser) PocketBase auth token to callers who prove
 * they are a logged-in admin by presenting their own PocketBase user token in
 * the Authorization header.
 *
 * Replaces the old pattern of embedding NEXT_PUBLIC_POCKETBASE_ADMIN_* in the
 * client bundle. The superuser password now stays on the server.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const pb = await getSuperuserClient();
    return NextResponse.json(
      { token: pb.authStore.token, record: pb.authStore.record },
      { status: 200 }
    );
  } catch (error) {
    console.error("Elevation failed:", error);
    return NextResponse.json({ error: "Elevation failed" }, { status: 500 });
  }
}
