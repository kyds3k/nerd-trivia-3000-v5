"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Pocketbase from "pocketbase";
import RoundSelects from "./RoundSelects";
import { Switch, Button, Divider, Input, Form, Checkbox } from "@nextui-org/react";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
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

    if (roundType === "impossible") {
      const impossibleNumber = parseInt(questionNumber || "1");
      try {
        const impossibleValue = await pb
          .collection("impossible_rounds")
          .getFirstListItem(`edition_id = "${editionId}" && impossible_number = ${impossibleNumber}`);
        if (impossibleValue?.point_value) setScoreMultiplier(impossibleValue.point_value);
      } catch {
        console.error("Impossible point value not found");
        return;
      }
    }

    const answerId = data.id;
    const answer = regularAnswers.find((a) => a.id === answerId);
    if (!answer) return console.error("Answer not found");

    const updatedAnswer = { ...answer, ...data };
    updatedAnswer.edition_id = editionId;
    updatedAnswer.team_id= data.team_id;
    updatedAnswer.answer_correct = data.answer_correct;
    updatedAnswer.music_correct = data.music_correct;
    updatedAnswer.music_2_correct = data.music_2_correct;
    updatedAnswer.misc_bonus = data.misc_bonus;
    updatedAnswer.bantha_used = data.bantha_used;
    updatedAnswer.excelsior = data.excelsior;
    updatedAnswer.impossible_number = parseInt(questionNumber || "1");
    updatedAnswer.impossible_correct_count = data.correct_answers;
    console.log("Updated answer:", updatedAnswer);

    try {
      pb.autoCancellation(false);
      await pb.collection("answers").update(updatedAnswer.id, updatedAnswer);

      let points = 0;

      switch (roundType) {
        case "impossible":
          points = scoreMultiplier * (data.correct_answers || 0);
          if (updatedAnswer.music_correct) points += 100;
          if (updatedAnswer.music_2_correct) points += 100;
          if (updatedAnswer.misc_bonus) points += parseInt(updatedAnswer.misc_bonus, 10);
          if (updatedAnswer.excelsior) points += 25;
          break;

        case "final":
          console.log("Team id:", updatedAnswer.team_id);
          const team = await pb.collection("teams").getFirstListItem(`id = "${updatedAnswer.team_id}"`);
          const finalWager = team.wager || 0; // Ensure finalWager has a default value
          console.log("Final wager:", finalWager);
          if (updatedAnswer.answer_correct) {
            points = finalWager;
          } else {
            points = -finalWager;
          }
          if (updatedAnswer.music_correct) points += 100;

          console.log("Final points:", points);

          break;

        default:
          if (updatedAnswer.answer_correct) points = 100 * scoreMultiplier;
          if (updatedAnswer.bantha_used) points /= 2;
          if (updatedAnswer.music_correct) points += 100;
          if (updatedAnswer.music_2_correct) points += 100;
          if (updatedAnswer.misc_bonus) points += parseInt(updatedAnswer.misc_bonus, 10);
          if (updatedAnswer.excelsior) points += 25;
          break;
      }

      console.log("updated answer with points:", updatedAnswer);

      const team = await pb.collection("teams").getFirstListItem(`id = "${updatedAnswer.team_id}"`);
      const newTeamData = {
        points_for_game: team.points_for_game + points,
        all_time_points: team.all_time_points + points,
        banthashit_used: updatedAnswer.bantha_used ? team.banthashit_used + 1 : team.banthashit_used,
        banthashit_card: updatedAnswer.bantha_answer_correct ? true : team.banthashit_card,
      };

      await pb.collection("teams").update(updatedAnswer.team_id, newTeamData);
      console.log("Team score updated!");
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
      await pb.collection("wagers").update(`${updatedWager.id}`, updatedWager);

      let points = 0;
      if (updatedWager.music_correct) points = 100;

      const team = await pb.collection("teams").getOne(updatedWager.team_id);
      const newTeamData = {
        points_for_game: team.points_for_game + points,
        all_time_points: team.all_time_points + points,
        wager: updatedWager.wager
      };

      await pb.collection("teams").update(updatedWager.team_id, newTeamData);
      console.log("Team score updated!");
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
