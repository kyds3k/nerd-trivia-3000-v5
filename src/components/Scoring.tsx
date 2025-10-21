"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Pocketbase from "pocketbase";
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

// Define types for the `handleSelectSubmit` function parameters
type HandleSelectSubmit = (round: string, question: string) => Promise<void>;

export default function Scoring() {
  const params = useParams();
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL || "");
  const editionId = typeof params?.id === "string" ? params.id : undefined;

  const [roundType, setRoundType] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<string | null>(null);
  const [questionNumber, setQuestionNumber] = useState<string | null>(null);
  const [scoreMultiplier, setScoreMultiplier] = useState<number>(1);

  const [regularAnswers, setRegularAnswers] = useState<Answer[]>([]);
  const [wagerAnswers, setWagerAnswers] = useState<Wager[]>([]);

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
    }[round] || "";

    setRoundType(newRoundType);

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

      console.log("Answers:", answers);
      console.log("Wagers:", wagers);
    } catch (error) {
      console.error("Error fetching answer/wager data:", error);
    }
  };

  const scoreSubmit = async (data: any) => {
    if (!roundType) return console.error("No round type selected.");

    // We'll compute differential points (new - previous) and apply the delta to the team
    // For impossible, fetch the point value once to use for both previous and new calculations
    let impossiblePointValue: number | null = null;
    if (roundType === "impossible") {
      const impossibleNumber = parseInt(questionNumber || "1");
      try {
        const impossibleValue = await pb
          .collection("impossible_rounds")
          .getFirstListItem(`edition_id = "${editionId}" && impossible_number = ${impossibleNumber}`);
        impossiblePointValue = impossibleValue?.point_value || null;
        if (impossiblePointValue) setScoreMultiplier(impossiblePointValue);
      } catch {
        console.error("Impossible point value not found");
        return;
      }
    }

    const answerId = data.id;
    const answer = regularAnswers.find((a) => a.id === answerId);
    if (!answer) return console.error("Answer not found");

    // Fetch the original answer from database to get true previous state
    const originalAnswer = await pb.collection("answers").getOne(answerId);
    const updatedAnswer = { ...originalAnswer, ...data };
    updatedAnswer.edition_id = editionId;
    updatedAnswer.team_id= data.team_id;
    updatedAnswer.answer_correct = data.answer_correct;
    updatedAnswer.music_correct = data.music_correct;
    updatedAnswer.music_2_correct = data.music_2_correct;
    updatedAnswer.misc_bonus = data.misc_bonus;
    updatedAnswer.bantha_used = data.bantha_used;
    updatedAnswer.excelsior = data.excelsior;
    updatedAnswer.impossible_number = parseInt(questionNumber || "");
    updatedAnswer.impossible_correct_count = data.correct_answers;
    console.log("Updated answer:", updatedAnswer);

    try {
      pb.autoCancellation(false);
      // Calculate previous points based on existing stored values (answer)
      const calculateRegularPoints = (a: any): number => {
        let p = 0;
        // Calculate multiplier based on current round and question
        // Round 3 has doubled point values
        let multiplier = currentRound === "impossible" ? 100 : currentRound === "final" ? 1 : parseInt(questionNumber || "1") || 1;
        if (currentRound === "3") multiplier *= 2; // Round 3 doubles all point values
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

      // Persist the updated answer before adjusting team totals
      await pb.collection("answers").update(updatedAnswer.id, updatedAnswer);

      const team = await pb.collection("teams").getFirstListItem(`id = "${updatedAnswer.team_id}"`);
      const newTeamData = {
        points_for_game: team.points_for_game + delta,
        all_time_points: team.all_time_points + delta,
        banthashit_used: updatedAnswer.bantha_used ? team.banthashit_used + 1 : team.banthashit_used,
        banthashit_card: updatedAnswer.bantha_answer_correct ? true : team.banthashit_card,
      };

      await pb.collection("teams").update(updatedAnswer.team_id, newTeamData);
      console.log("Team score updated via delta:", { prevPoints, newPoints, delta });
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

    console.log("Updated wager:", updatedWager);

    try {
      pb.autoCancellation(false);
      // differential points for wager music bonus (100 if correct)
      const prevPoints = wager.music_correct ? 100 : 0;
      const newPoints = updatedWager.music_correct ? 100 : 0;
      const delta = newPoints - prevPoints;

      await pb.collection("wagers").update(`${updatedWager.id}`, updatedWager);

      const team = await pb.collection("teams").getOne(updatedWager.team_id);
      const newTeamData = {
        points_for_game: team.points_for_game + delta,
        all_time_points: team.all_time_points + delta,
        wager: updatedWager.wager
      };

      await pb.collection("teams").update(updatedWager.team_id, newTeamData);
      console.log("Team score updated via delta:", { prevPoints, newPoints, delta });
    } catch (error) {
      console.error("Error updating wager or team score:", error);
    }
  }

  return (
    <div>
      <RoundSelects onSubmit={handleSelectSubmit} />
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
    </div>
  );

}
