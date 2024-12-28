"use client";

import React, { useState} from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Input, Form, Button, Divider, Switch } from "@nextui-org/react";

interface WagerProps {
  wager: any; // Replace `any` with the correct `Wager` type
  onSubmit: (data: any) => void;
}

export default function WagerCard({ wager, onSubmit }: WagerProps) {
  const [musicCorrect, setMusicCorrect] = useState(wager.music_correct || false);

  return (
    <Card className="bg-gray-600 w-1/3 max-w-80" key={wager.id}>
      <Form
        id={wager.id}
        onSubmit={(e) => {
          e.preventDefault();
          const data = {
            id: wager.id,
            music_correct: musicCorrect
          }
          onSubmit(data);
          console.log('data from card:', data);
        }}
      >
        <Input type="hidden" name="id" value={wager.id} />
        <CardHeader>
          <h3 className="text-lg font-bold">{wager.team_name}</h3>
        </CardHeader>
        <Divider className="h-px bg-slate-500" />
        <CardBody className="flex flex-col gap-6">
          <div>
            <p className="text-md">
              <strong>Wager:</strong>
            </p>
            <pre>{wager.wager}</pre>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-md">
              <strong>Wager Music Answer:</strong>
            </p>
            <p>{wager.music_answer}</p>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-md">Wager Music Correct:</span>
            <Switch
              name="music_correct"
              isSelected={musicCorrect}
              onValueChange={(isSelected) => setMusicCorrect(isSelected)}
              aria-label="Wager Music Correct"
            />
          </div>
        </CardBody>
        <CardFooter>
          <Button size="sm" type="submit">
            Submit
          </Button>
        </CardFooter>
      </Form>
    </Card >
  );
}
