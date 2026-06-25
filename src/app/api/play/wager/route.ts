import { NextResponse } from "next/server";
import { requireUser, getSuperuserClient } from "@/lib/serverAuth";

/**
 * Authoritative wager submission. Mirrors /api/play/answer but for the `wagers`
 * collection: validates the logged-in user, the team/edition, that the wager
 * round is active, that the wager is within the team's current points, and
 * dedups one wager per team. Identity comes from the DB team record.
 */
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { editionId?: string; teamId?: string; data?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { editionId, teamId } = body;
  const data = body.data ?? {};
  if (!editionId || !teamId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const wagerNum = Number(data.wager);
  if (!Number.isFinite(wagerNum) || wagerNum < 0) {
    return NextResponse.json({ error: "Invalid wager" }, { status: 400 });
  }

  try {
    const pb = await getSuperuserClient();

    let team;
    try {
      team = await pb.collection("teams").getOne(teamId);
    } catch {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    if (team.current_edition !== editionId) {
      return NextResponse.json({ error: "Team is not registered for this edition" }, { status: 403 });
    }

    // Can't wager more than you have.
    const maxWager = Number(team.points_for_game ?? 0);
    if (wagerNum > maxWager) {
      return NextResponse.json({ error: `Wager exceeds your ${maxWager} points` }, { status: 400 });
    }

    // Wager round must be active.
    let round;
    try {
      round = await pb.collection("wager_rounds").getFirstListItem(`edition_id = "${editionId}"`);
    } catch {
      return NextResponse.json({ error: "Wager round not found" }, { status: 404 });
    }
    if (!round.is_active) {
      return NextResponse.json({ error: "The wager round is not currently active" }, { status: 409 });
    }

    // One wager per team.
    const existing = await pb
      .collection("wagers")
      .getList(1, 1, { filter: `edition_id = "${editionId}" && team_id = "${teamId}"` });
    if (existing.items.length > 0) {
      return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
    }

    const record: Record<string, unknown> = {
      edition_id: editionId,
      team_id: teamId,
      team_name: team.team_name,
      wager: wagerNum,
    };
    if (typeof data.music_answer === "string") record.music_answer = data.music_answer;

    await pb.collection("wagers").create(record);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("submit wager failed:", error);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
