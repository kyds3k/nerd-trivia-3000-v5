"use client";

import { useCallback, useEffect, useState } from "react";
import { getPocketbaseClient } from "@/lib/pocketbase";
import { getPusherClient } from "@/lib/pusher/client";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/react";

interface Team {
  id: string;
  team_name: string;
}

interface Target {
  kind: "regular" | "impossible" | "wager" | "final" | "tiebreaker";
  round?: string;
  question?: string;
  impossibleNumber?: string;
  label: string;
}

// Translate the admin's current `activeButton` (the question it last navigated to)
// into a query target. Returns null for a whole-round selection or nothing active,
// since there's no single question to track submissions against.
function parseActiveButton(activeButton: string | null): Target | null {
  if (!activeButton) return null;
  if (activeButton.startsWith("question_jump_")) {
    const rest = activeButton.slice("question_jump_".length);
    // round + question are single digits concatenated (e.g. "13" = R1 Q3).
    const round = rest.slice(0, 1);
    const question = rest.slice(1);
    if (!round || !question) return null;
    return { kind: "regular", round, question, label: `Round ${round} · Question ${question}` };
  }
  if (activeButton.startsWith("impossible_jump_")) {
    const n = activeButton.slice("impossible_jump_".length);
    return { kind: "impossible", impossibleNumber: n, label: `Impossible ${n}` };
  }
  if (activeButton === "wager") return { kind: "wager", label: "Wager" };
  if (activeButton === "final") return { kind: "final", label: "Final" };
  if (activeButton === "tiebreaker") return { kind: "tiebreaker", label: "Tiebreaker" };
  return null;
}

export default function SubmissionTracker({
  editionId,
  activeButton,
}: {
  editionId?: string;
  activeButton: string | null;
}) {
  const pb = getPocketbaseClient();
  const [teams, setTeams] = useState<Team[]>([]);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());

  const target = parseActiveButton(activeButton);

  // Load the team roster once per edition.
  useEffect(() => {
    if (!editionId) return;
    let cancelled = false;
    (async () => {
      try {
        pb.autoCancellation(false);
        const list = await pb.collection("teams").getFullList({
          filter: `current_edition = "${editionId}"`,
          fields: "id, team_name",
          sort: "team_name",
        });
        if (!cancelled) setTeams(list as unknown as Team[]);
      } catch (e) {
        console.error("SubmissionTracker: failed to load teams", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editionId]);

  const refresh = useCallback(async () => {
    if (!editionId || !target) {
      setSubmittedIds(new Set());
      return;
    }
    try {
      pb.autoCancellation(false);
      let ids: string[] = [];
      if (target.kind === "wager") {
        const rows = await pb.collection("wagers").getFullList({
          filter: `edition_id = "${editionId}"`,
          fields: "team_id",
        });
        ids = rows.map((r) => r.team_id as string);
      } else {
        let filter = `edition_id = "${editionId}"`;
        if (target.kind === "regular") {
          filter += ` && round_number = "${target.round}" && question_number = "${target.question}"`;
        } else if (target.kind === "impossible") {
          filter += ` && answer_type = "impossible" && impossible_number = "${target.impossibleNumber}"`;
        } else if (target.kind === "final") {
          filter += ` && answer_type = "final"`;
        } else if (target.kind === "tiebreaker") {
          filter += ` && answer_type = "tiebreaker"`;
        }
        const rows = await pb.collection("answers").getFullList({ filter, fields: "team_id" });
        ids = rows.map((r) => r.team_id as string);
      }
      setSubmittedIds(new Set(ids.filter(Boolean)));
    } catch (e) {
      console.error("SubmissionTracker: failed to load submissions", e);
    }
    // target is derived from activeButton; depend on its primitive parts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editionId, target?.kind, target?.round, target?.question, target?.impossibleNumber]);

  // Refetch when the active question changes.
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refetch the moment any team submits — players broadcast an "answer"
  // notification on submit, so we just re-query on each one.
  useEffect(() => {
    const channel = getPusherClient().subscribe("notifications");
    const handler = () => refresh();
    channel.bind("evt::notify", handler);
    return () => {
      channel.unbind("evt::notify", handler);
    };
  }, [refresh]);

  if (!target) return null;

  const submittedCount = teams.filter((t) => submittedIds.has(t.id)).length;
  const total = teams.length;
  const allIn = total > 0 && submittedCount === total;

  return (
    <Card className="w-full mb-6 bg-black border-2 border-cyan-500 rounded-none shadow-[0_0_12px_rgba(6,182,212,0.4)]">
      <CardHeader className="flex items-center justify-between gap-4">
        <div className="flex flex-col items-start gap-0">
          <h3 className="font-linebeam text-2xl text-glow-blue-400 uppercase tracking-wide">Submissions</h3>
          <span className="text-sm text-gray-400">{target.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-mono ${allIn ? "text-green-400" : "text-white"}`}>
            {submittedCount} / {total}
          </span>
          <Button size="sm" variant="bordered" onPress={refresh}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        {allIn && (
          <p className="text-green-400 font-bold mb-3 motion-safe:animate-pulse">✓ All teams are in!</p>
        )}
        {total === 0 ? (
          <p className="text-gray-500">No teams registered for this edition yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {teams.map((t) => {
              const submitted = submittedIds.has(t.id);
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-none ${
                    submitted ? "border-green-600 bg-green-900/20 text-green-300" : "border-gray-700 text-gray-400"
                  }`}
                >
                  <span className="text-lg">{submitted ? "✓" : "○"}</span>
                  <span className="truncate">{t.team_name}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
