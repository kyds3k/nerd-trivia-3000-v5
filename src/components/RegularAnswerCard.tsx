"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Input, Form, Button, Divider, Switch, Image } from "@nextui-org/react";

interface RegularAnswerProps {
  answer: any; // Replace `any` with the correct `Answer` type
  currentRound: string | null;
  questionNumber: string | null;
  roundType: string | null;
  onSubmit: (data: any) => void;
}

export default function RegularAnswerCard({
  answer,
  currentRound,
  questionNumber,
  roundType,
  onSubmit,
}: RegularAnswerProps) {
  // State management for controlled inputs
  const [answerCorrect, setAnswerCorrect] = useState(answer.answer_correct || false);
  const [musicCorrect, setMusicCorrect] = useState(answer.music_correct || false);
  const [banthaAnswerCorrect, setBanthaAnswerCorrect] = useState(
    answer.bantha_answer_correct || false
  );
  const [miscBonus, setMiscBonus] = useState(answer.misc_bonus || 0);
  const [excelsior, setExcelsior] = useState(answer.excelsior || false);

  return (
    <Card className="bg-gray-600 w-1/3 max-w-80" key={answer.id}>
      <Form
        id={answer.id}
        onSubmit={(e) => {
          e.preventDefault();
          const data = {
            id: answer.id,
            answer_correct: answerCorrect,
            music_correct: musicCorrect,
            bantha_answer_correct: banthaAnswerCorrect,
            misc_bonus: miscBonus,
            excelsior: excelsior,
            team_identifier: answer.team_identifier,
            team_id: answer.team_id,
          };
          console.log('data from card:', data);
          onSubmit(data);
        }}
      >
        <CardHeader>
          <h3 className="text-lg font-bold">{answer.team_name}</h3>
        </CardHeader>
        <Divider className="h-px bg-slate-500" />
        <CardBody className="flex flex-col gap-6">
          {answer.bantha_used ? (
            <div className="flex gap-4 w-full items-center">
              <Image src="https://i.imgur.com/pWDb7GL.gif" width="89" height="64" alt="Bantha Card" />
              <div className="flex flex-col gap-2">
                <pre className="whitespace-pre-wrap">Answer: {answer.answer}</pre>
                <p>Bantha used!!!</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-md">
                <strong>Answer:</strong>
              </p>
              <pre className="whitespace-pre-wrap">{answer.answer}</pre>
              <div className="flex justify-between items-center">
                <span className="text-md">Correct:</span>
                <Switch
                  isSelected={answerCorrect}
                  onValueChange={(isSelected) => setAnswerCorrect(isSelected)}
                  aria-label="Answer Correct"
                />
              </div>
            </div>

          )}
          {currentRound === "1" && questionNumber === "3" && (
            <>
              <p className="text-md">
                <strong>Bantha answer:</strong> {answer.bantha_answer}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-md">Bantha Answer Correct:</span>
                <Switch
                  isSelected={banthaAnswerCorrect}
                  onValueChange={(isSelected) =>
                    setBanthaAnswerCorrect(isSelected)
                  }
                  aria-label="Bantha Answer Correct"
                />
              </div>
            </>
          )}
          <p className="text-md">
            <strong>Music Answer:</strong> {answer.music_answer}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-md">Music Correct:</span>
            <Switch
              isSelected={musicCorrect}
              onValueChange={(isSelected) => setMusicCorrect(isSelected)}
              aria-label="Music Correct"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-md">
              <strong>Misc Bonus:</strong>
            </label>
            <Input
              type="number"
              value={miscBonus}
              onValueChange={setMiscBonus}
              size="sm"
              className="w-16"
              aria-label="Misc Bonus"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-md">Excelsior:</span>
            <Switch
              isSelected={excelsior}
              onValueChange={(isSelected) => setExcelsior(isSelected)}
              aria-label="Excelsior"
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
  );
}
