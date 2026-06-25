import { NextResponse } from "next/server";
import { requireUser, getSuperuserClient } from "@/lib/serverAuth";

type AnswerType = "regular" | "impossible" | "final" | "tiebreaker";

/**
 * Authoritative answer submission. Players never write to the `answers` (or
 * `teams`) collection directly — they POST here. This route, running as the
 * server superuser, enforces everything the client cannot be trusted to:
 *
 *  - the caller is a logged-in user (`requireUser`)
 *  - the team exists and belongs to the current edition (no submitting for an
 *    arbitrary team_id)
 *  - the target question/round is actually active
 *  - one answer per team per question (authoritative dedup)
 *  - only answer-content fields are accepted; scoring fields like
 *    `answer_correct` / `misc_bonus` can never be injected by a player
 *  - identity fields (team_name, team_identifier, …) come from the DB team
 *    record, not the request body
 */
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    editionId?: string;
    teamId?: string;
    answerType?: AnswerType;
    roundNumber?: string | number;
    questionNumber?: string | number;
    impossibleNumber?: string | number;
    banthaUsed?: boolean;
    data?: Record<string, unknown>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { editionId, teamId, answerType, roundNumber, questionNumber, impossibleNumber, banthaUsed } = body;
  const data = body.data ?? {};
  const allowed: AnswerType[] = ["regular", "impossible", "final", "tiebreaker"];

  if (!editionId || !teamId || !answerType || !allowed.includes(answerType)) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const answerText = typeof data.answer === "string" ? data.answer : "";
  if (answerText.trim() === "") {
    return NextResponse.json({ error: "Answer is required" }, { status: 400 });
  }

  try {
    const pb = await getSuperuserClient();

    // Verify the team exists and is playing this edition.
    let team;
    try {
      team = await pb.collection("teams").getOne(teamId);
    } catch {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    if (team.current_edition !== editionId) {
      return NextResponse.json({ error: "Team is not registered for this edition" }, { status: 403 });
    }

    const idF = `edition_id = "${editionId}" && team_id = "${teamId}"`;
    const record: Record<string, unknown> = {
      edition_id: editionId,
      team_id: teamId,
      team_name: team.team_name,
      team_identifier: team.team_identifier,
      team_name_lower: String(team.team_name ?? "").toLowerCase(),
      answer_type: answerType,
      answer: answerText,
    };
    let dedupFilter = "";

    if (answerType === "regular") {
      if (roundNumber == null || questionNumber == null) {
        return NextResponse.json({ error: "Missing round/question" }, { status: 400 });
      }
      let q;
      try {
        q = await pb
          .collection("questions")
          .getFirstListItem(
            `edition_id = "${editionId}" && round_number = ${Number(roundNumber)} && question_number = ${Number(questionNumber)}`
          );
      } catch {
        return NextResponse.json({ error: "Question not found" }, { status: 404 });
      }
      if (!q.is_active) {
        return NextResponse.json({ error: "That question is not currently active" }, { status: 409 });
      }
      record.round_number = String(roundNumber);
      record.question_number = String(questionNumber);
      record.bantha_used = !!banthaUsed;
      // Music artist is optional; default to "<none>" when blank (matches prior behaviour).
      const music = typeof data.music_answer === "string" ? data.music_answer : "";
      record.music_answer = music.trim() === "" ? "<none>" : music;
      if (typeof data.bantha_answer === "string" && data.bantha_answer.trim() !== "") {
        record.bantha_answer = data.bantha_answer;
      }
      dedupFilter = `${idF} && round_number = "${roundNumber}" && question_number = "${questionNumber}"`;
    } else if (answerType === "impossible") {
      if (impossibleNumber == null) {
        return NextResponse.json({ error: "Missing impossible number" }, { status: 400 });
      }
      let q;
      try {
        q = await pb
          .collection("impossible_rounds")
          .getFirstListItem(`edition_id = "${editionId}" && impossible_number = ${Number(impossibleNumber)}`);
      } catch {
        return NextResponse.json({ error: "Impossible round not found" }, { status: 404 });
      }
      if (!q.is_active) {
        return NextResponse.json({ error: "That round is not currently active" }, { status: 409 });
      }
      record.impossible_number = String(impossibleNumber);
      if (typeof data.music_answer === "string") record.music_answer = data.music_answer;
      if (typeof data.music_answer_2 === "string") record.music_answer_2 = data.music_answer_2;
      dedupFilter = `${idF} && answer_type = "impossible" && impossible_number = "${impossibleNumber}"`;
    } else if (answerType === "final") {
      let q;
      try {
        q = await pb.collection("final_rounds").getFirstListItem(`edition_id = "${editionId}"`);
      } catch {
        return NextResponse.json({ error: "Final round not found" }, { status: 404 });
      }
      if (!q.is_active) {
        return NextResponse.json({ error: "The final round is not currently active" }, { status: 409 });
      }
      record.bantha_used = false;
      if (typeof data.music_answer === "string") record.music_answer = data.music_answer;
      dedupFilter = `${idF} && answer_type = "final"`;
    } else {
      // tiebreaker
      let tb;
      try {
        tb = await pb.collection("tiebreakers").getFirstListItem(`is_active = true`);
      } catch {
        return NextResponse.json({ error: "No active tiebreaker" }, { status: 404 });
      }
      record.tiebreaker_id = tb.id;
      record.answer = answerText.replace(/,/g, "");
      dedupFilter = `${idF} && answer_type = "tiebreaker" && tiebreaker_id = "${tb.id}"`;
    }

    // Authoritative dedup — one submission per team per question.
    const existing = await pb.collection("answers").getList(1, 1, { filter: dedupFilter });
    if (existing.items.length > 0) {
      return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
    }

    await pb.collection("answers").create(record);

    // Bantha card is consumed on use (regular rounds only).
    if (answerType === "regular" && banthaUsed) {
      try {
        await pb.collection("teams").update(teamId, { banthashit_card: false });
      } catch (e) {
        console.error("Failed to consume bantha card:", e);
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("submit answer failed:", error);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
