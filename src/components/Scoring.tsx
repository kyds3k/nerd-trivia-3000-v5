"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import DOMPurify from "dompurify";
import { getPocketbaseClient } from "@/lib/pocketbase";
import { getAppleMusicTrack } from "@/lib/appleMusic";
import RoundSelects from "./RoundSelects";
import { Switch, Button, Divider, Input, Form, Checkbox } from "@heroui/react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import RegularAnswerCard from "@/components/RegularAnswerCard";
import ImpossibleAnswerCard from "@/components/ImpossibleAnswerCard";
import WagerCard from "@/components/WagerCard";

// Define types for the answer objects
interface Answer {
  id: string;
  team_name?: string;
  answer?: string;
  answer_correct?: boolean;
  bantha_answer?: string;
  bantha_answer_correct?: boolean;
  music_answer?: string;
  music_correct?: boolean;
  music_answer_2?: string;
  music_2_correct?: boolean;
  misc_bonus?: number;
  bantha_used?: boolean;
  excelsior?: boolean;
  team_id?: string;
}

interface Wager {
  id: string;
  team_name?: string;
  team_id?: string;
  wager?: number;
  music_answer?: string;
  music_correct?: boolean;
}

interface TiebreakerResult {
  teamName: string;
  teamAnswer: number;
  difference: number;
  isWinner: boolean;
}

// Define types for the `handleSelectSubmit` function parameters
type HandleSelectSubmit = (round: string, question: string) => Promise<void>;

export default function Scoring() {
  const params = useParams();
  const pb = getPocketbaseClient();
  const editionId = typeof params?.id === "string" ? params.id : undefined;

  const [roundType, setRoundType] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<string | null>(null);
  const [questionNumber, setQuestionNumber] = useState<string | null>(null);
  const [scoreMultiplier, setScoreMultiplier] = useState<number>(1);

  const [regularAnswers, setRegularAnswers] = useState<Answer[]>([]);
  const [wagerAnswers, setWagerAnswers] = useState<Wager[]>([]);

  // Tiebreaker review (read-only): the closest numeric guess to the correct
  // answer wins. The presenter scoreboard still records the official winner.
  const [tiebreakerResults, setTiebreakerResults] = useState<TiebreakerResult[]>([]);
  const [tiebreakerCorrect, setTiebreakerCorrect] = useState<number | null>(null);

  // The official correct answer for the currently-selected question, shown
  // above the answer cards so the host can score against it.
  const [correctAnswer, setCorrectAnswer] = useState<{
    label: string;
    answer?: string;
    answers?: string[];
    bantha?: string;
    songs?: string[];
  } | null>(null);

  const handleSelectSubmit: HandleSelectSubmit = async (round, question) => {
    setCurrentRound(round);
    setQuestionNumber(question);

    const newRoundType = {
      "1": "regular",
      "2": "regular",
      "3": "regular",
      impossible: "impossible",
      wager: "wager",
      final: "final",
      tiebreaker: "tiebreaker",
    }[round] || "";

    setRoundType(newRoundType);

    // Tiebreaker is its own read-only review: closest numeric guess wins. Load it
    // here and bail before the regular answer/wager fetch path below.
    if (round === "tiebreaker") {
      setRegularAnswers([]);
      setWagerAnswers([]);
      setCorrectAnswer(null);
      try {
        pb.autoCancellation(false);
        const tbList = await pb
          .collection("tiebreakers")
          .getFullList({ filter: "is_active = true" });
        const tb = tbList[0];
        if (!tb) {
          setTiebreakerCorrect(null);
          setTiebreakerResults([]);
          return;
        }
        const correct = parseFloat(tb.answer);
        setTiebreakerCorrect(Number.isNaN(correct) ? null : correct);

        const ans = await pb.collection("answers").getFullList({
          filter: `edition_id = "${editionId}" && answer_type = "tiebreaker" && tiebreaker_id = "${tb.id}"`,
          expand: "team_id",
        });

        const calc: TiebreakerResult[] = ans.map((r) => {
          const teamAnswer = parseFloat(r.answer);
          const valid = !Number.isNaN(teamAnswer) && !Number.isNaN(correct);
          return {
            teamName: r.team_name || r.expand?.team_id?.team_name || "Unknown Team",
            teamAnswer: Number.isNaN(teamAnswer) ? NaN : teamAnswer,
            // Invalid/blank guesses sort to the bottom rather than winning.
            difference: valid ? Math.abs(teamAnswer - correct) : Infinity,
            isWinner: false,
          };
        });

        calc.sort((a, b) => a.difference - b.difference);
        if (calc.length > 0 && Number.isFinite(calc[0].difference)) {
          const winningDiff = calc[0].difference;
          calc.forEach((r) => {
            if (r.difference === winningDiff) r.isWinner = true;
          });
        }
        setTiebreakerResults(calc);
      } catch (error) {
        console.error("Error fetching tiebreaker data:", error);
        setTiebreakerCorrect(null);
        setTiebreakerResults([]);
      }
      return;
    }

    const multiplier = round === "impossible" ? 100 : round === "final" ? 1 : parseInt(question) || 1;
    setScoreMultiplier(multiplier);

    try {
      pb.autoCancellation(false);

      let answers: Answer[] = [];
      let wagers: Wager[] = [];

      if (round === "impossible" || round === "final") {
        const answerType = round === "impossible" ? "impossible" : "final";
        let filter = `edition_id = "${editionId}" && answer_type = "${answerType}"`;

        if (answerType === "impossible") {
          filter += ` && impossible_number = "${question}"`;
        }

        answers = await pb
          .collection("answers")
          .getFullList<Answer>({ filter });

      } else if (round === "wager") {
        wagers = await pb
          .collection("wagers")
          .getFullList<Wager>({ filter: `edition_id = "${editionId}"` });
      } else {
        answers = await pb
          .collection("answers")
          .getFullList<Answer>({
            filter: `edition_id = "${editionId}" && round_number = "${round}" && question_number = "${question}"`,
          });
      }

      setRegularAnswers(answers);
      setWagerAnswers(wagers);

      // Load the official correct answer + song(s) for this selection so the
      // host can score against it. Wrapped separately so a song-lookup hiccup
      // never blocks the team answers from showing.
      try {
        const resolveSongs = async (ids: (string | undefined)[]): Promise<string[]> => {
          const out: string[] = [];
          for (const id of ids) {
            if (!id) continue;
            try {
              const track = await getAppleMusicTrack(id);
              out.push(track ? `${track.title} — ${track.artist}` : id);
            } catch {
              out.push(id);
            }
          }
          return out;
        };

        if (round === "impossible") {
          const imp = await pb.collection("impossible_rounds").getFirstListItem(
            `edition_id = "${editionId}" && impossible_number = "${question}"`
          );
          setCorrectAnswer({
            label: `Impossible ${question}`,
            answers: Object.values(imp.answers || {}) as string[],
            songs: await resolveSongs(Object.values(imp.apple_music_ids || {}) as string[]),
          });
        } else if (round === "final") {
          const fin = await pb.collection("final_rounds").getFirstListItem(`edition_id = "${editionId}"`);
          setCorrectAnswer({
            label: "Final",
            answer: fin.answer,
            songs: await resolveSongs([fin.final_song_apple]),
          });
        } else if (round === "wager") {
          const wag = await pb.collection("wager_rounds").getFirstListItem(`edition_id = "${editionId}"`);
          setCorrectAnswer({
            label: "Wager",
            songs: await resolveSongs([wag.wager_song_apple]),
          });
        } else {
          const q = await pb.collection("questions").getFirstListItem(
            `edition_id = "${editionId}" && round_number = "${round}" && question_number = "${question}"`
          );
          setCorrectAnswer({
            label: `Round ${round} · Question ${question}`,
            answer: q.answer,
            bantha: round === "1" && question === "3" ? q.bantha_answer : undefined,
            songs: await resolveSongs([q.song_apple]),
          });
        }
      } catch (e) {
        console.error("Failed to fetch correct answer:", e);
        setCorrectAnswer(null);
      }
    } catch (error) {
      console.error("Error fetching answer/wager data:", error);
    }
  };

  const scoreSubmit = async (data: any) => {
    if (!roundType) return console.error("No round type selected.");

    // Compute differential points (new - previous) and apply the delta to the team.
    try {
      pb.autoCancellation(false);

      // For impossible rounds, fetch the per-round point value first.
      let impossiblePointValue: number | null = null;
      if (roundType === "impossible") {
        const impossibleNumber = parseInt(questionNumber || "1");
        const impossibleValue = await pb
          .collection("impossible_rounds")
          .getFirstListItem(`edition_id = "${editionId}" && impossible_number = ${impossibleNumber}`);
        impossiblePointValue = impossibleValue?.point_value || null;
        if (impossiblePointValue) setScoreMultiplier(impossiblePointValue);
      }

      const calculateRegularPoints = (a: any): number => {
        let p = 0;
        // Round 3 doubles all point values.
        let multiplier = currentRound === "impossible" ? 100 : currentRound === "final" ? 1 : parseInt(questionNumber || "1") || 1;
        if (currentRound === "3") multiplier *= 2;
        if (a.answer_correct) p = 100 * multiplier;
        if (a.bantha_used) p /= 2;
        if (a.music_correct) p += 100;
        if (a.music_2_correct) p += 100;
        if (a.misc_bonus) p += parseInt(a.misc_bonus, 10);
        if (a.excelsior) p += 25;
        return p;
      };

      const calculateImpossiblePoints = (a: any): number => {
        const base = (impossiblePointValue || scoreMultiplier) * (a.impossible_correct_count || 0);
        let p = base;
        if (a.music_correct) p += 100;
        if (a.music_2_correct) p += 100;
        if (a.misc_bonus) p += parseInt(a.misc_bonus, 10);
        if (a.excelsior) p += 25;
        return p;
      };

      const calculateFinalPoints = async (a: any): Promise<number> => {
        const teamForWager = await pb.collection("teams").getFirstListItem(`id = "${a.team_id}"`);
        const finalWager = teamForWager.wager || 0;
        let p = a.answer_correct ? finalWager : -finalWager;
        if (a.music_correct) p += 100;
        return p;
      };

      const originalAnswer: any = regularAnswers.find((a) => a.id === data.id) || {};
      const updatedAnswer: any = { ...originalAnswer, ...data };

      let prevPoints = 0;
      let newPoints = 0;

      if (roundType === "impossible") {
        prevPoints = calculateImpossiblePoints(originalAnswer);
        newPoints = calculateImpossiblePoints(updatedAnswer);
      } else if (roundType === "final") {
        prevPoints = await calculateFinalPoints(originalAnswer);
        newPoints = await calculateFinalPoints(updatedAnswer);
      } else {
        prevPoints = calculateRegularPoints(originalAnswer);
        newPoints = calculateRegularPoints(updatedAnswer);
      }

      const delta = newPoints - prevPoints;

      // Persist the updated answer before adjusting team totals.
      await pb.collection("answers").update(updatedAnswer.id, updatedAnswer);

      const team = await pb.collection("teams").getFirstListItem(`id = "${updatedAnswer.team_id}"`);
      const newTeamData = {
        points_for_game: team.points_for_game + delta,
        all_time_points: team.all_time_points + delta,
        banthashit_used: updatedAnswer.bantha_used ? team.banthashit_used + 1 : team.banthashit_used,
        banthashit_card: updatedAnswer.bantha_answer_correct ? true : team.banthashit_card,
      };

      await pb.collection("teams").update(updatedAnswer.team_id, newTeamData);

      // Keep the in-memory answer in sync with what we just saved, so an
      // immediate re-score uses the correct "previous" baseline (otherwise the
      // delta would be computed against the stale pre-score values).
      setRegularAnswers((prev) => prev.map((a) => (a.id === updatedAnswer.id ? updatedAnswer : a)));
    } catch (error) {
      console.error("Error updating answer or team score:", error);
    }
  };

  const wagerSubmit = async (data: any) => {
    if (!roundType) return console.error("No round type selected.");

    const wagerId = data.id;
    const wager = wagerAnswers.find((w) => w.id === wagerId);
    if (!wager) return console.error("Wager not found");

    const updatedWager = { ...wager, ...data };
    updatedWager.music_correct = data.music_correct;

    try {
      pb.autoCancellation(false);
      // differential points for wager music bonus (100 if correct)
      const prevPoints = wager.music_correct ? 100 : 0;
      const newPoints = updatedWager.music_correct ? 100 : 0;
      const delta = newPoints - prevPoints;

      await pb.collection("wagers").update(`${updatedWager.id}`, updatedWager);

      const team = await pb.collection("teams").getOne(updatedWager.team_id || "");
      const newTeamData = {
        points_for_game: team.points_for_game + delta,
        all_time_points: team.all_time_points + delta,
        wager: updatedWager.wager
      };

      await pb.collection("teams").update(updatedWager.team_id || "", newTeamData);

      // Sync in-memory wager so an immediate re-score uses the correct baseline.
      setWagerAnswers((prev) => prev.map((w) => (w.id === updatedWager.id ? updatedWager : w)));
    } catch (error) {
      console.error("Error updating wager or team score:", error);
    }
  };

  return (
    <div>
      <RoundSelects onSubmit={handleSelectSubmit} />

      {correctAnswer && (
        <Card className="w-full mt-6 bg-black border-2 border-cyan-500 rounded-none shadow-[0_0_12px_rgba(6,182,212,0.4)]">
          <CardHeader className="flex flex-col items-start gap-0 pb-0">
            <h3 className="font-linebeam text-2xl text-glow-blue-400 uppercase tracking-wide">Correct Answer</h3>
            <span className="text-sm text-gray-400">{correctAnswer.label}</span>
          </CardHeader>
          <CardBody className="gap-4">
            {correctAnswer.answer && (
              <div
                className="text-2xl text-white [&_p]:m-0 [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:ml-6 [&_ul]:ml-6"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(correctAnswer.answer) }}
              />
            )}

            {correctAnswer.answers && correctAnswer.answers.length > 0 && (
              <ol className="list-decimal list-inside text-2xl text-white space-y-1">
                {correctAnswer.answers.map((a, i) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(a) }} />
                ))}
              </ol>
            )}

            {correctAnswer.bantha && (
              <div className="pt-3 border-t border-cyan-900">
                <h4 className="text-glow-blue-400 text-lg mb-1 uppercase">Bantha Answer</h4>
                <div
                  className="text-xl text-white [&_p]:m-0"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(correctAnswer.bantha) }}
                />
              </div>
            )}

            {correctAnswer.songs && correctAnswer.songs.filter(Boolean).length > 0 && (
              <div className="pt-3 border-t border-cyan-900">
                <h4 className="text-glow-blue-400 text-lg mb-1 uppercase">
                  {correctAnswer.songs.filter(Boolean).length > 1 ? "Songs" : "Song"}
                </h4>
                <ul className="text-lg text-white space-y-1">
                  {correctAnswer.songs.filter(Boolean).map((s, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-cyan-500">♪</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {roundType === "tiebreaker" && (
        <div className="mt-6">
          <Card className="w-full bg-black border-2 border-cyan-500 rounded-none shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            <CardHeader className="flex flex-col items-start gap-0 pb-0">
              <h3 className="font-linebeam text-2xl text-glow-blue-400 uppercase tracking-wide">Tiebreaker</h3>
              <span className="text-sm text-gray-400">Closest guess wins</span>
            </CardHeader>
            <CardBody className="gap-4">
              <div className="text-xl text-white">
                Correct answer:{" "}
                <span className="text-2xl text-green-400 font-mono">
                  {tiebreakerCorrect !== null ? tiebreakerCorrect.toLocaleString() : "—"}
                </span>
              </div>

              {tiebreakerResults.filter((r) => r.isWinner).length > 1 && (
                <div className="p-3 border-2 border-yellow-500 bg-yellow-900/20">
                  <p className="text-yellow-400 font-bold">
                    ⚠️ Still tied — these teams are the same distance from the answer. You&apos;ll need to pick a winner or run another tiebreaker.
                  </p>
                </div>
              )}

              {tiebreakerResults.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {tiebreakerResults.map((r, i) => (
                    <div
                      key={i}
                      className={`flex justify-between items-center p-4 border-2 rounded-none ${
                        r.isWinner
                          ? "border-green-500 bg-green-900/30"
                          : "border-gray-700 bg-gray-900/50"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className={`text-2xl font-bold ${r.isWinner ? "text-green-400" : "text-white"}`}>
                          {r.teamName}
                          {r.isWinner && (
                            <span className="ml-3 align-middle text-xs uppercase tracking-widest bg-green-500 text-black px-2 py-1 rounded-full">
                              Winner
                            </span>
                          )}
                        </span>
                        <span className="text-base text-gray-400">
                          Guessed: {Number.isNaN(r.teamAnswer) ? "—" : r.teamAnswer.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-500 uppercase tracking-widest">Difference</span>
                        <span className={`text-3xl font-mono ${r.isWinner ? "text-green-400" : "text-red-400"}`}>
                          {Number.isFinite(r.difference) ? r.difference.toLocaleString() : "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center w-full text-gray-500">No tiebreaker answers submitted yet.</p>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {roundType !== "tiebreaker" && (
      <div className="flex flex-wrap gap-4 mt-8">
        {roundType !== "wager" ? (
          regularAnswers.length > 0 ? (
            regularAnswers.map((answer) =>
              roundType === "impossible" ? (
                <ImpossibleAnswerCard
                  key={answer.id}
                  answer={answer}
                  onSubmit={scoreSubmit}
                />
              ) : (
                <RegularAnswerCard
                  key={answer.id}
                  answer={answer}
                  currentRound={currentRound}
                  questionNumber={questionNumber}
                  roundType={roundType}
                  onSubmit={scoreSubmit}
                />
              )
            )
          ) : (
            <p className="text-center w-full text-gray-500">No answers to display.</p>
          )
        ) : (
          wagerAnswers.length > 0 ? (
            wagerAnswers.map((wager) => (
              <WagerCard key={wager.id} wager={wager} onSubmit={wagerSubmit} />
            ))
          ) : (
            <p className="text-center w-full text-gray-500">No wagers to display.</p>
          )
        )}
      </div>
      )}
    </div>
  );

}
