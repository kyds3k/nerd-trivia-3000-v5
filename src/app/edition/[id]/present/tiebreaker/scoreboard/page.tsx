"use client";

import React, { useEffect, useState, use } from 'react';
import { useParams, useRouter } from "next/navigation";
import Pocketbase from "pocketbase";
import { Spinner } from "@heroui/react";
import { motion } from "framer-motion";
import { useHotkeys } from "react-hotkeys-hook";

interface TiebreakerResult {
  teamName: string;
  teamAnswer: number;
  difference: number;
  isWinner: boolean;
}

export default function TiebreakerScoreboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: editionId } = use(params);
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const router = useRouter();

  const [results, setResults] = useState<TiebreakerResult[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        pb.autoCancellation(false);

        // 1. Get the active tiebreaker question
        const tiebreakerList = await pb.collection("tiebreakers").getFullList({
          filter: 'is_active = true',
        });
        const tiebreakerRecord = tiebreakerList[0];

        if (!tiebreakerRecord) {
          console.error("No tiebreaker found");
          setLoading(false);
          return;
        }

        const answerValue = tiebreakerRecord.answer;
        setCorrectAnswer(answerValue);

        // 2. Get all answers for this tiebreaker
        // We filter by answer_type="tiebreaker" and tiebreaker_id
        console.log(`Fetching answers for edition: ${editionId}, tiebreaker: ${tiebreakerRecord.id}`);
        const answers = await pb.collection("answers").getFullList({
          filter: `edition_id = "${editionId}" && answer_type = "tiebreaker" && tiebreaker_id = "${tiebreakerRecord.id}"`,
          expand: "team_id"
        });
        console.log("Fetched answers:", answers);

        // 3. Calculate differences
        const calculatedResults: TiebreakerResult[] = answers.map((record) => {
          const teamAnswer = parseFloat(record.answer); // Assuming answer is stored as string
          const diff = Math.abs(teamAnswer - answerValue);

          console.log("Processing answer record:", record);

          // Use the directly submitted team_name if available, otherwise try expand, otherwise fallback
          const teamName = record.team_name || record.expand?.team_id?.team_name || "Unknown Team";

          return {
            teamName: teamName,
            teamAnswer: teamAnswer,
            difference: diff,
            isWinner: false // Will determine next
          };
        });

        // 4. Sort by difference (ascending)
        calculatedResults.sort((a, b) => a.difference - b.difference);

        // 5. Mark winner(s)
        if (calculatedResults.length > 0) {
          const winningDiff = calculatedResults[0].difference;
          calculatedResults.forEach(r => {
            if (r.difference === winningDiff) {
              r.isWinner = true;
            }
          });
        }

        setResults(calculatedResults);
        setLoading(false);

      } catch (error) {
        console.error("Failed to fetch tiebreaker results:", error);
        setLoading(false);
      }
    };

    if (editionId) {
      fetchResults();
    }
  }, [editionId]);

  useHotkeys("ctrl+ArrowRight", () => {
    router.push(`/edition/${editionId}/present/closing`);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col items-center min-h-screen bg-black text-white">
      <h1 className="text-6xl mb-4 font-linebeam text-glow-blue-400">TIEBREAKER RESULTS</h1>
      <h2 className="text-4xl mb-12">Correct Answer: <span className="text-green-400">{correctAnswer?.toLocaleString()}</span></h2>

      <div className="w-full max-w-4xl flex flex-col gap-6">
        {results.map((result, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={result.isWinner ? {
              opacity: [1, 0.5, 1],
              y: 0,
            } : { opacity: 1, y: 0 }}
            transition={result.isWinner ? {
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            } : { delay: index * 0.5 }}
            className={`p-6 rounded-lg border-2 flex justify-between items-center ${result.isWinner
              ? "border-green-500 bg-green-900/30"
              : "border-gray-700 bg-gray-900/50"
              }`}
          >
            <div className="flex flex-col">
              <span className={`text-3xl font-bold ${result.isWinner ? "text-green-400" : "text-white"}`}>
                {result.teamName}
              </span>
              <span className="text-xl text-gray-400">
                Guessed: {result.teamAnswer.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-sm text-gray-500 uppercase tracking-widest">Difference</span>
              <span className={`text-4xl font-mono ${result.isWinner ? "text-green-400" : "text-red-400"}`}>
                {result.difference.toLocaleString()}
              </span>
            </div>

            {result.isWinner && (
              <div className="absolute -right-4 -top-4 bg-green-500 text-black font-bold px-4 py-1 rounded-full transform rotate-12 shadow-lg">
                WINNER!
              </div>
            )}
          </motion.div>
        ))}

        {results.length === 0 && (
          <p className="text-center text-2xl text-gray-500">No answers submitted yet.</p>
        )}
      </div>
    </div>
  );
}
