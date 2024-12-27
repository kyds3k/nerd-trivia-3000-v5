"use client";

import React from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Input, Form, Button, Divider, Switch } from "@nextui-org/react";

interface WagerProps {
  wager: any; // Replace `any` with the correct `Wager` type
  onSubmit: (data: any) => void;
}

export default function WagerCard({ wager, onSubmit }: WagerProps) {
  return (
    <Card className="bg-gray-600 w-1/3 max-w-80" key={wager.id}>
      <Form
        id={wager.id}
        onSubmit={(e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.currentTarget));
          onSubmit(data);
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
            <span className="text-md">Correct:</span>
            <Switch
              name="music_correct"
              isSelected={wager.music_correct}
              onValueChange={(isSelected) => {
                const newValue = isSelected ? "true" : "false";
                document
                  .getElementById(`music_correct_${wager.id}`)
                  ?.setAttribute("value", newValue);
              }}
              aria-label="Music Correct"
            />
            <Input
              type="hidden"
              id={`music_correct_${wager.id}`}
              name="music_correct"
              value={wager.music_correct ? "true" : "false"}
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
