"use client"

import React from "react";

// Assuming Editor and Input components are imported here
import { Editor } from "@/components/DynamicEditor";
import {Input} from "@nextui-org/react";

interface QuestionProps {
  round: number;
  question: number;
}

const EditorQuestion: React.FC<QuestionProps> = ({ round, question }) => {
  // Create identifiers based on round and question props
  const questionIdentifier = `r${round}q${question}`;
  const answerIdentifier = `r${round}a${question}`;
  const gifIdentifier = `r${round}g${question}`;
  const songIdentifier = `r${round}s${question}`;

  return (
    <div>
      <h3 className="mb-4 text-lg">Question {question}</h3>
      <div className="ml-5">
        <div className="mb-4">
          <h4 className="mb-2">Question:</h4>
          <Editor dataIdentifier={questionIdentifier} dataType="question" classNames="py-10 w-3/4" />
        </div>

        <div className="mb-4">
          <h4 className="mb-2">Answer:</h4>
          <Editor dataIdentifier={answerIdentifier} dataType="answer" classNames="py-10 w-3/4" />
        </div>

        <div className="mb-4">
          <h4 className="mb-2">Answer GIF:</h4>
          <Input data-identifier={gifIdentifier} data-type="gif" className="w-1/2" />
        </div>

        <div className="mb-4">
          <h4 className="mb-2">Song:</h4>
          <Input data-identifier={songIdentifier} data-type="song" className="w-1/2" />
        </div>
      </div>
    </div>
  );
};

export default EditorQuestion;
