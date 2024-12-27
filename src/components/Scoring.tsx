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
    console.log("Selected Round:", round);
    console.log("Selected Question:", question);
    setCurrentRound(round);
    setQuestionNumber(question);
    switch (round) {
      case "1":
      case "2":
      case "3":
        setScoreMultiplier(parseInt(question));
        setRoundType("regular");
        break;
      case "impossible":
        setScoreMultiplier(100);
        setRoundType("impossible");
        break;
      case "wager":
        setRoundType("wager");
        break;
      case "final":
        setScoreMultiplier(1);
        setRoundType("final");
        break;
    }

    const newRoundType = (() => {
      switch (round) {
        case "1":
        case "2":
        case "3":
          return "regular";
        case "impossible":
          return "impossible";
        case "wager":
          return "wager";
        case "final":
          return "final";
        default:
          return "";
      }
    })();

    setRoundType(newRoundType);
    console.log("Round Type:", newRoundType);

    try {
      pb.autoCancellation(false);

      let answers: Answer[] = [];
      let wagers: Wager[] = [];
      if (round === "impossible") {
        answers = await pb
          .collection("answers")
          .getFullList<Answer>({
            filter: `edition_id = "${editionId}" && answer_type = "impossible"`,
          });
        // } else if (round === "wager") {
        //   answers = await pb
        //     .collection("wagers")
        //     .getFullList<Answer>({ filter: `edition_id = "${editionId}"` });
      } else if (round === "final") {
        answers = await pb
          .collection("answers")
          .getFullList<Answer>({
            filter: `edition_id = "${editionId}" && answer_type = "final"`,
          });
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
    console.log("data", data);

    if (roundType === "impossible") {
      // get the point_value from the impossible_answers collection
      pb.autoCancellation(false);
      const impossibleNumber = questionNumber != null ? parseInt(questionNumber) : 1;
      const impossibleValue = await pb.collection("impossible_rounds").getFirstListItem(`edition_id = "${editionId}"`, { filter: `impossible_number = ${impossibleNumber}` });
      if (!impossibleValue) {
        console.error("Impossible point value not found");
        return;
      } else {
        console.log("Impossible point value", impossibleValue.point_value);
        setScoreMultiplier(impossibleValue.point_value);
      }
    }

    const answerId = data.id;
    const answer = regularAnswers.find((a) => a.id === answerId);
    if (!answer) {
      console.error("Answer not found");
      return;
    }

    if (roundType === "impossible") {
      data.correct_answers = parseInt(data.correct_answers);
    }

    const updatedAnswer = { ...answer, ...data };
    updatedAnswer.answer_correct = data.answer_correct;
    updatedAnswer.music_correct = data.music_correct;
    updatedAnswer.music_2_correct = data.music_2_correct;
    updatedAnswer.misc_bonus = data.misc_bonus;
    updatedAnswer.bantha_used = data.bantha_used;
    updatedAnswer.excelsior = data.excelsior;

    try {
      console.log("updating answer!");
      pb.autoCancellation(false);
      await pb.collection("answers").update(`${updatedAnswer.id}`, updatedAnswer);

      console.log("Answer updated!");

      let newScore = 0;
      let points = 0;


      if (roundType === "impossible") {
        console.log("Correct answers:", data.correct_answers);
        console.log('scoreMultiplier:', scoreMultiplier);
        points = scoreMultiplier * data.correct_answers;
      } else {
        if (updatedAnswer.answer_correct)
          points = 100 * scoreMultiplier;
      }

      console.log('music_correct:', updatedAnswer.music_correct);
      console.log('music_2_correct:', updatedAnswer.music_2_correct);

      if (updatedAnswer.bantha_used)
        points = (100 * scoreMultiplier) / 2;
      if (updatedAnswer.music_correct)
        points += 100;
      if (updatedAnswer.music_2_correct)
        points += 100;
      if (updatedAnswer.misc_bonus)
        points += parseInt(updatedAnswer.misc_bonus);
      if (updatedAnswer.excelsior)
        points += 25;

      newScore = points;

      console.log("New Score:", newScore);

      try {
        const team = await pb.collection("teams").getOne(`${updatedAnswer.team_id}`, { fields: "banthashit_card, points_for_game, all_time_points, banthashit_used" });
        const currentScore = team.score;
        const newTotal = currentScore + newScore;

        let banthaStatus = false;

        if (currentRound === "1" && questionNumber === "3") {
          banthaStatus = data.bantha_answer_correct;
        } else {
          banthaStatus = updatedAnswer.bantha_used ? false : team.banthashit_card
        }

        const newData = {
          points_for_game: team.points_for_game + newScore,
          all_time_points: team.all_time_points + newScore,
          banthashit_used: updatedAnswer.bantha_used ? team.banthashit_used + 1 :
            team.banthashit_used,
          banthashit_card: banthaStatus,
        };

        await pb.collection("teams").update(`${updatedAnswer.team_id}`, newData);
        console.log("Team score updated!");
      }
      catch (error) {
        console.error("Error updating team score:", error);
      }
    } catch (error) {
      console.error("Error updating answer:", error);
    }
  }

  const wagerSubmit = async (data: any) => {
    console.log("data", data);

    const wagerId = data.id;
    const wager = wagerAnswers.find((a) => a.id === wagerId);
    if (!wager) {
      console.error("Wager not found");
      return;
    }

    data.music_correct = data.music_correct === "true";

    const updatedWager = { ...wager, ...data };
    updatedWager.music_correct = data.music_correct;

    try {
      console.log("updating wager!");
      pb.autoCancellation(false);
      await pb.collection("wagers").update(`${updatedWager.id}`, updatedWager);

      console.log("Wager updated!");

    } catch (error) {
      console.error("Error updating wager:", error);
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

