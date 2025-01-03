"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Input, Form, Button, Divider, Switch } from "@nextui-org/react";

interface ImpossibleAnswerProps {
  answer: any; // Replace `any` with the correct `Answer` type
  onSubmit: (data: any) => void;
}

export default function ImpossibleAnswerCard({
  answer,
  onSubmit,
}: ImpossibleAnswerProps) {
  // State management for controlled inputs
  const [correctAnswers, setCorrectAnswers] = useState<number>(answer.correct_answers || 0);
  const [musicCorrect, setMusicCorrect] = useState(answer.music_correct || false);
  const [music2Correct, setMusic2Correct] = useState(answer.music_2_correct || false);
  const [miscBonus, setMiscBonus] = useState(answer.misc_bonus || 0);

  return (
    <Card className="bg-gray-600 w-1/3 max-w-80" key={answer.id}>
      <Form
        id={answer.id}
        onSubmit={(e) => {
          e.preventDefault();
          const data = {
            id: answer.id,
            correct_answers: correctAnswers,
            music_correct: musicCorrect,
            music_2_correct: music2Correct,
            misc_bonus: miscBonus,
            team_id: answer.team_id
          };
          onSubmit(data);
        }}
      >
        <CardHeader>
          <h3 className="text-lg font-bold">{answer.team_name}</h3>
        </CardHeader>
        <Divider className="h-px bg-slate-500" />
        <CardBody className="flex flex-col gap-6">
          <div>
            <p className="text-md">
              <strong>Answer:</strong>
            </p>
            <pre className="whitespace-pre-wrap">{answer.answer}</pre>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-md">Number of Correct Answers:</span>
            <Input
              type="number"
              value={correctAnswers.toString()} // Convert the number to a string
              onChange={(e) => {
                const value = e.target.value;
                setCorrectAnswers(value === "" ? 0 : parseInt(value)); // Handle empty string as 0
              }}
              size="sm"
              className="w-16"
              aria-label="Number of Correct Answers"
            />
          </div>
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
          <p className="text-md">
            <strong>Music Answer 2:</strong> {answer.music_answer_2}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-md">Music 2 Correct:</span>
            <Switch
              isSelected={music2Correct}
              onValueChange={(isSelected) => setMusic2Correct(isSelected)}
              aria-label="Music 2 Correct"
            />
          </div>
          <div className="flex justify-between">
            <label className="text-md">
              <strong>Misc Bonus:</strong>
            </label>
            <Input
              type="number"
              value={miscBonus}
              onChange={(e) => setMiscBonus(parseInt(e.target.value) || 0)}
              size="sm"
              className="w-16"
              aria-label="Misc Bonus"
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
