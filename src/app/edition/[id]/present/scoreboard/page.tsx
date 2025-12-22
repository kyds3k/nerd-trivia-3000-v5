"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Pocketbase, { RecordModel } from "pocketbase";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/react";
import { useHotkeys } from "react-hotkeys-hook";
import { useTransitionRouter } from "next-transition-router";
import { motion } from "framer-motion";

interface Edition {
  title: string;
  date: string;
  edition_gif: string;
  blurb: string;
  home_song: string;
  // Add other fields if needed, e.g., `id: string`, `description: string`, etc.
}

export default function Scoreboard() {
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const params = useParams();
  const router = useTransitionRouter();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const [scores, setScores] = useState<RecordModel[]>([]);
  const [origin, setOrigin] = useState<string | null>(null);
  const [isTie, setIsTie] = useState<boolean>(false);
  const [tiedTeamIds, setTiedTeamIds] = useState<string[]>([]);

  // Fetch scores from PocketBase
  const getScores = async () => {
    console.log("editionId", editionId);
    pb.autoCancellation(false);
    const scoreList = await pb.collection("teams").getFullList({
      filter: `current_edition = "${editionId}"`,
      sort: "-points_for_game",
      fields: "id, team_name, points_for_game, team_identifier",
    });
    console.log(scoreList);
    setScores(scoreList);

    // Check for tie
    if (scoreList.length > 1) {
      const firstPlaceScore = scoreList[0].points_for_game;
      const secondPlaceScore = scoreList[1].points_for_game;
      if (firstPlaceScore === secondPlaceScore) {
        setIsTie(true);
        // Calculate tied teams
        const tied = scoreList.filter(team => team.points_for_game === firstPlaceScore);
        setTiedTeamIds(tied.map(team => team.id));
      }
    }
  };

  // Record the winner if this is the final scoreboard
  useEffect(() => {
    const recordWinner = async () => {
      if (origin === "final" && scores.length > 0 && editionId && !isTie) {
        const winner = scores[0];
        console.log("Recording winner:", winner);
        try {
          await pb.collection("editions").update(editionId, {
            winning_team: winner.team_name,
            winning_team_identifier: winner.team_identifier,
            winning_team_id: winner.id,
          });
          console.log("Winner recorded successfully.");
        } catch (err) {
          console.error("Failed to record winner:", err);
        }
      }
    };
    recordWinner();
  }, [scores, origin, editionId, isTie]);

  // Fetch localStorage data on the client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(localStorage.getItem("scoreBoardOrigin"));
    }
  }, []);

  const sendTiebreakerDirective = async () => {
    try {
      await fetch('/api/direct/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'tiebreaker_jump',
          tiedTeamIds: tiedTeamIds
        }),
      });
    } catch (error) {
      console.error("Failed to send tiebreaker directive:", error);
    }
  };

  // Handle hotkeys
  useHotkeys(
    "ctrl+ArrowRight",
    () => {
      if (origin === "1") {
        router.push(`/edition/${editionId}/present/round/2`);
      } else if (origin === "round3") {
        router.push(`/edition/${editionId}/present/wager`);
      } else if (origin === "final") {
        if (isTie) {
          sendTiebreakerDirective(); // Send directive to teams
          router.push(`/edition/${editionId}/present/tiebreaker`);
        } else {
          router.push(`/edition/${editionId}/present/closing`);
        }
      } else if (origin === "2")
        router.push(`/edition/${editionId}/present/round/3`);
    },
    [origin, isTie, tiedTeamIds]
  );

  useHotkeys(
    "ctrl+ArrowLeft",
    () => {
      if (origin === "1" || origin === "2")
        router.push(`/edition/${editionId}/present/impossible/${origin}`);
      else
        router.push(`/edition/${editionId}/present/round/3/question/5`);
    },
    [origin]
  );

  // Fetch scores when the component mounts
  useEffect(() => {
    getScores();
  }, []);

  return (
    <motion.div
      initial={{ scale: 0 }} // Starts at 0 size
      animate={{ scale: 1 }} // Animates to full size
      transition={{
        duration: 1, // Animation duration in seconds
        ease: "easeInOut", // Easing function
      }}
    >
      <div className="flex flex-col justify-center items-center h-screen">
        <div data-augmented-ui="tl-clip t-clip-xy bl-clip r-clip-xy both" className="p-4 md:p-10 nerd-aug bluecard bluecard__alt w-3/4">
          <div className="p-4 pb-10 md:p-10">
            <h1 className="text-4xl text-center mb-10">Scoreboard</h1>
            <div className="flex justify-center">
              <Table className="table-auto w-full" radius="none" classNames={{
                wrapper:
                  "border-2 border-cyan-500 focus-within:border-cyan-500 focus-within:animate-neon bg-black text-white focus-visible:border-cyan-500 !border-cyan-500",
                td: "animate-neon",
                th: "rounded-none",
                thead: "rounded-none"
              }}>
                <TableHeader>
                  <TableColumn className="px-4 py-2 text-3xl">Team</TableColumn>
                  <TableColumn className="px-4 py-2 text-3xl">Points</TableColumn>
                </TableHeader>
                <TableBody>
                  {scores.map((score, index) => (
                    <TableRow
                      key={index}
                      className="fade-in-up"
                      style={{
                        animationDelay: `${3 + (scores.length - index - 1) * 3}s`, // Base 3s delay + reverse index delay
                      }}
                    >
                      <TableCell className="text-2xl">{score.team_name}</TableCell>
                      <TableCell className="text-2xl">{score.points_for_game}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {isTie && origin === "final" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 5 + (scores.length * 3) }} // Show after all scores have appeared
                className="mt-10 text-center"
              >
                <h2 className="text-5xl font-bold text-red-500 animate-pulse font-linebeam">TIEBREAKER PROTOCOL INITIATED</h2>
                <p className="text-xl mt-4 text-white">Please wait for the Tiebreaker Round...</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
