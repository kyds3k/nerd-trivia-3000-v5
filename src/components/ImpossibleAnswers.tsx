"use client"; // This ensures the component is treated as a Client Component

import React, { useState } from "react";
import ImpossibleAnswers from "./ImpossibleAnswers";

const ParentComponent: React.FC = () => {
  const [numAnswers, setNumAnswers] = useState<number>(1);
  const [round, setRound] = useState<number>(1);

  const handleNumAnswersChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNumAnswers(parseInt(e.target.value));
  };

  const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRound(parseInt(e.target.value));
  };

  return (
    <div>
      {/* Select to change the number of answers */}
      <label htmlFor="numAnswersSelect">Number of Answers: </label>
      <select
        id="numAnswersSelect"
        value={numAnswers}
        onChange={handleNumAnswersChange}
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>

      {/* Select to change the round number */}
      <label htmlFor="roundSelect" className="ml-4">
        Round: 
      </label>
      <select
        id="roundSelect"
        value={round}
        onChange={handleRoundChange}
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <option key={value} value={value}>
            Round {value}
          </option>
        ))}
      </select>

      {/* Render the ImpossibleAnswers component with the selected values */}
      <ImpossibleAnswers numAnswers={numAnswers} round={round} />
    </div>
  );
};

export default ParentComponent;
