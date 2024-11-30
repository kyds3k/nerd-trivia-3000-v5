"use client"

import React from 'react';
import { useParams } from "next/navigation";

export default function Question() {

  const params = useParams();
  const questionId = typeof params?.questionId === "string" ? params.questionId : undefined;
  const roundId = typeof params?.roundId === "string" ? params.roundId : undefined;

  return (
    <div>
      <h1>Round {roundId} Question {questionId}</h1>
    </div>
  );
}