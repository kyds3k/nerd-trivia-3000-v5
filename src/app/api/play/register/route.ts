import { NextResponse } from "next/server";
import { requireUser, getSuperuserClient } from "@/lib/serverAuth";
import type PocketBase from "pocketbase";

const ATTRIBUTES = ["str", "dex", "con", "int", "wis", "cha"];

async function generateUniqueIdentifier(pb: PocketBase): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const attr = ATTRIBUTES[Math.floor(Math.random() * ATTRIBUTES.length)];
    const candidate = `${Math.floor(10000 + Math.random() * 90000)}-${attr}`;
    const clash = await pb.collection("teams").getList(1, 1, { filter: `team_identifier = "${candidate}"` });
    if (clash.items.length === 0) return candidate;
  }
  // Extremely unlikely fallback.
  return `${Date.now()}-${ATTRIBUTES[0]}`;
}

/**
 * Team registration + captaining, server-side. Players never create or mutate
 * `teams` directly. `create` makes a new team (server-generated identifier,
 * name-uniqueness enforced); `captain` re-points an existing team at the current
 * edition by its identifier. Requires a logged-in user.
 */
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    action?: "create" | "captain";
    editionId?: string;
    teamName?: string;
    teamIdentifier?: string;
    userEmail?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { action, editionId } = body;
  if (!editionId || (action !== "create" && action !== "captain")) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  try {
    const pb = await getSuperuserClient();

    if (action === "create") {
      const teamName = String(body.teamName ?? "").trim();
      if (!teamName) return NextResponse.json({ error: "Team name is required" }, { status: 400 });
      const teamNameLower = teamName.toLowerCase();

      const exists = await pb
        .collection("teams")
        .getList(1, 1, { filter: `team_name_lower = "${teamNameLower}"` });
      if (exists.totalItems > 0) {
        return NextResponse.json({ error: "exists" }, { status: 409 });
      }

      const teamIdentifier = await generateUniqueIdentifier(pb);
      const team = await pb.collection("teams").create({
        team_name: teamName,
        team_name_lower: teamNameLower,
        current_edition: editionId,
        team_identifier: teamIdentifier,
        user_email: typeof body.userEmail === "string" ? body.userEmail : "",
      });

      return NextResponse.json(
        { ok: true, teamId: team.id, teamName: team.team_name, teamIdentifier: team.team_identifier },
        { status: 200 }
      );
    }

    // captain
    const teamIdentifier = String(body.teamIdentifier ?? "").trim();
    if (!teamIdentifier) return NextResponse.json({ error: "Team identifier is required" }, { status: 400 });

    let team;
    try {
      team = await pb.collection("teams").getFirstListItem(`team_identifier = "${teamIdentifier}"`);
    } catch {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await pb.collection("teams").update(team.id, { current_edition: editionId });
    return NextResponse.json(
      { ok: true, teamId: team.id, teamName: team.team_name, teamIdentifier: team.team_identifier },
      { status: 200 }
    );
  } catch (error) {
    console.error("register failed:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
