"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Pocketbase from "pocketbase";
import RoundSelects from "./RoundSelects";
import { Switch, Button, Divider, Input, Form } from "@nextui-org/react";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { set } from "lodash";

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

// Define types for the `handleSelectSubmit` function parameters
type HandleSelectSubmit = (round: string, question: string) => Promise<void>;

export default function Scoring() {
  const params = useParams();
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL || "");
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const [roundType, setRoundType] = useState<string | null>(null);
  const [roundNumber, setRoundNumber] = useState<string | null>(null);
  const [questionNumber, setQuestionNumber] = useState<string | null>(null);
  const [scoreMultiplier, setScoreMultiplier] = useState<number>(1);

  const [regularAnswers, setRegularAnswers] = useState<Answer[]>([]);

  const handleSelectSubmit: HandleSelectSubmit = async (round, question) => {
    console.log("Selected Round:", round);
    console.log("Selected Question:", question);
    setRoundNumber(round);
    setQuestionNumber(question);
    switch (round) {
      case "1":
      case "2":
      case "3":
        setScoreMultiplier(parseInt(question));
        setRoundType("regular");
        break;
      case "impossible":
        setScoreMultiplier(1);
        setRoundType("impossible");
        break;
      case "wager":
        setScoreMultiplier(1);
        setRoundType("wager");
        break;
      case "final":
        setScoreMultiplier(1);
        setRoundType("final");
        break;
    }

    try {
      pb.autoCancellation(false);

      let answers: Answer[] = [];
      if (round === "impossible") {
        answers = await pb
          .collection("answers")
          .getFullList<Answer>({
            filter: `edition_id = "${editionId}" && answer_type = "impossible"`,
          });
      } else if (round === "wager") {
        answers = await pb
          .collection("wagers")
          .getFullList<Answer>({ filter: `edition_id = "${editionId}"` });
      } else if (round === "final") {
        answers = await pb
          .collection("finals")
          .getFullList<Answer>({ filter: `edition_id = "${editionId}"` });
      } else {
        answers = await pb
          .collection("answers")
          .getFullList<Answer>({
            filter: `edition_id = "${editionId}" && round_number = "${round}" && question_number = "${question}"`,
          });
      }

      setRegularAnswers(answers);
      console.log("Answers:", answers);
    } catch (error) {
      console.error("Error fetching answers:", error);
    }
  };

  const scoreSubmit = async (data: any) => {
    console.log("data", data);
    const answerId = data.id;
    const answer = regularAnswers.find((a) => a.id === answerId);
    if (!answer) {
      console.error("Answer not found");
      return;
    }

    data.answer_correct = data.answer_correct === "true";
    data.music_correct = data.music_correct === "true";
    data.music_2_correct = data.music_2_correct === "true";
    data.bantha_used = data.bantha_used === "true";
    data.bantha_answer_correct = data.bantha_answer_correct === "true";
    data.excelsior = data.excelsior === "true";

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

      if (updatedAnswer.answer_correct)
        points = 100 * scoreMultiplier;
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

        if (roundNumber === "1" && questionNumber === "3") {
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

  return (
    <div>
      <RoundSelects onSubmit={handleSelectSubmit} />
      <div className="flex flex-wrap gap-4 mt-8">
        {regularAnswers.length > 0 ? (
          regularAnswers.map((answer) => (
            <Card className="bg-gray-600 w-1/3 max-w-80" key={answer.id}
            >
              <Form
                id={answer.id}
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = Object.fromEntries(new FormData(e.currentTarget));
                  scoreSubmit(data); // Replace with your submit logic
                }}
              >
                <Input type="hidden" name="id" value={answer.id} />
                <div
                  key={answer.id}
                  className="bg-gray-600 flex-1 w-auto border rounded-lg"
                ></div>
                <CardHeader>
                  <h3 className="text-lg font-bold">{answer.team_name}</h3>
                </CardHeader>
                <Divider className="h-px bg-slate-500" />
                <CardBody className="flex flex-col gap-6">
                  <p className="text-md">
                    <strong>Answer:</strong> {answer.answer}
                  </p>
                  {/* Answer Correct */}
                  <div className="flex justify-between items-center">
                    <span className="text-md">Correct:</span>
                    <Switch
                      name="answer_correct"
                      checked={answer.answer_correct}
                      onChange={(e) => {
                        const newValue = e.target.checked ? "true" : "false";
                        document
                          .getElementById(`answer_correct_${answer.id}`)
                          ?.setAttribute("value", newValue);
                      }}
                      aria-label="Answer Correct"
                    />
                    <Input
                      type="hidden"
                      id={`answer_correct_${answer.id}`}
                      name="answer_correct"
                      value={answer.answer_correct ? "true" : "false"}
                    />
                  </div>
                  {roundNumber === "1" && questionNumber === "3" && (
                    <>
                    <p className="text-md">
                      <strong>Bantha answer:</strong> {answer.bantha_answer}
                    </p>
                    {/* Bantha Answer Correct */}
                    <div className="flex justify-between items-center">
                      <span className="text-md">Bantha answer correct:</span>
                      <Switch
                        name="bantha_answer_correct"
                        checked={answer.bantha_answer_correct}
                        onChange={(e) => {
                          const newValue = e.target.checked ? "true" : "false";
                          document
                            .getElementById(`bantha_answer_correct_${answer.id}`)
                            ?.setAttribute("value", newValue);
                        }}
                        aria-label="Bantha Answer Correct"
                      />
                      <Input
                        type="hidden"
                        id={`bantha_answer_correct_${answer.id}`}
                        name="bantha_answer_correct"
                        value={answer.bantha_answer_correct ? "true" : "false"}
                      />
                    </div>          
                    </>        
                  )}
                  {/* Music Correct */}
                  <p className="text-md">
                    <strong>Music Answer:</strong> {answer.music_answer}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-md">Music Correct:</span>
                    <Switch
                      name="music_correct"
                      checked={answer.music_correct}
                      onChange={(e) => {
                        const newValue = e.target.checked ? "true" : "false";
                        document
                          .getElementById(`music_correct_${answer.id}`)
                          ?.setAttribute("value", newValue);
                      }}
                      aria-label="Music Correct"
                    />
                    <Input
                      type="hidden"
                      id={`music_correct_${answer.id}`}
                      name="music_correct"
                      value={answer.music_correct ? "true" : "false"}
                    />
                  </div>
                  {/* Music 2 Correct (if roundType is "impossible") */}
                  {roundType === "impossible" && (
                    <>
                      <p className="text-md">
                        <strong>Music Answer 2:</strong> {answer.music_answer_2}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-md">Music 2 Correct:</span>
                        <Switch
                          name="music_2_correct"
                          checked={answer.music_2_correct}
                          onChange={(e) => {
                            const newValue = e.target.checked ? "true" : "false";
                            document
                              .getElementById(`music_2_correct_${answer.id}`)
                              ?.setAttribute("value", newValue);
                          }}
                          aria-label="Music 2 Correct"
                        />
                        <Input
                          type="hidden"
                          id={`music_2_correct_${answer.id}`}
                          name="music_2_correct"
                          value={answer.music_2_correct ? "true" : "false"}
                        />
                      </div>
                    </>
                  )}
                  {/* Misc Bonus */}
                  <div className="flex justify-between items-center">
                    <p className="text-md">
                      <strong>Misc Bonus:</strong>
                    </p>
                    <Input
                      name="misc_bonus"
                      type="number"
                      placeholder="0"
                      className="w-16"
                      size="sm"
                    />
                  </div>
                  {/* Bantha Used */}
                  <div className="flex justify-between items-center">
                    <p className="text-md">
                      <strong>Bantha Used:</strong>
                    </p>
                    <Switch
                      name="bantha_used"
                      checked={answer.bantha_used}
                      onChange={(e) => {
                        const newValue = e.target.checked ? "true" : "false";
                        document
                          .getElementById(`bantha_used_${answer.id}`)
                          ?.setAttribute("value", newValue);
                      }}
                      aria-label="Bantha Used"
                    />
                    <Input
                      type="hidden"
                      id={`bantha_used_${answer.id}`}
                      name="bantha_used"
                      value={answer.bantha_used ? "true" : "false"}
                    />
                  </div>
                  {/* Excelsior */}
                  <div className="flex justify-between items-center">
                    <p className="text-md">
                      <strong>Excelsior:</strong>
                    </p>
                    <Switch
                      name="excelsior"
                      checked={answer.excelsior}
                      onChange={(e) => {
                        const newValue = e.target.checked ? "true" : "false";
                        document
                          .getElementById(`excelsior_${answer.id}`)
                          ?.setAttribute("value", newValue);
                      }}
                      aria-label="Excelsior"
                    />
                    <Input
                      type="hidden"
                      id={`excelsior_${answer.id}`}
                      name="excelsior"
                      value={answer.excelsior ? "true" : "false"}
                    />
                  </div>
                </CardBody>
                <CardFooter>
                  <Button size="sm" type="submit">
                    Submit
                  </Button>
                </CardFooter>
              </Form>
            </Card>
          ))
        ) : (
          <p className="text-center w-full text-gray-500">No answers to display.</p>
        )}
      </div>
    </div >
  );
}
