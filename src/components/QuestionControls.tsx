import React, { useState } from 'react';
import { Button, Switch } from '@nextui-org/react';

interface QuestionControlsProps {
  toggleActive: (
    isActive: boolean,
    type: 'round' | 'question',
    round: number | null,
    question: number | null
  ) => void;
  sendDirective: (type: string, round: string, question: string) => void;
}

const QuestionControls: React.FC<QuestionControlsProps> = ({ toggleActive, sendDirective }) => {
  // Initialize state dynamically for 3 rounds and 5 questions per round
  const [switchStates, setSwitchStates] = useState<{ [key: string]: boolean }>(() => {
    const initialState: { [key: string]: boolean } = {};
    for (let round = 1; round <= 3; round++) {
      for (let question = 1; question <= 5; question++) {
        initialState[`round-${round}-question-${question}`] = false;
      }
    }
    return initialState;
  });

  // Toggle handler
  const handleToggle = (round: number, question: number, value: boolean) => {
    const key = `round-${round}-question-${question}`;
    setSwitchStates((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Call toggleActive function from props
    toggleActive(value, 'question', round, question);
  };

  // Render dynamically
  return (
    <div className="flex flex-col gap-6">
      {[...Array(3)].map((_, roundIndex) => {
        const roundNumber = roundIndex + 1;
        return (
          <div key={`round-${roundNumber}`} className="flex flex-col gap-4">
            <h4>Round {roundNumber}</h4>
            <div className="flex gap-6">
              {[...Array(5)].map((_, questionIndex) => {
                const questionNumber = questionIndex + 1;
                const key = `round-${roundNumber}-question-${questionNumber}`;
                return (
                  <div key={key} className="flex flex-col gap-2">
                    <Button
                      onPress={() =>
                        sendDirective('question_jump', String(roundNumber), String(questionNumber))
                      }
                      size="sm"
                    >
                      Question {questionNumber}
                    </Button>
                    <Switch
                      checked={switchStates[key]}
                      onValueChange={(value) => handleToggle(roundNumber, questionNumber, value)}
                    >
                      Active
                    </Switch>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuestionControls;
