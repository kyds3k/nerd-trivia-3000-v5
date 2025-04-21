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

  // Fetch scores from PocketBase
  const getScores = async () => {
    console.log("editionId", editionId);
    pb.autoCancellation(false);
    const scoreList = await pb.collection("teams").getFullList({
      filter: `current_edition = "${editionId}"`,
      sort: "-points_for_game",
      fields: "team_name, points_for_game",
    });
    console.log(scoreList);
    setScores(scoreList);
  };

  // Fetch localStorage data on the client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(localStorage.getItem("scoreBoardOrigin"));
    }
  }, []);

  // Handle hotkeys
  useHotkeys(
    "ctrl+ArrowRight",
    () => {
      if (origin === "1") {
        router.push(`/edition/${editionId}/present/round/2`);
      } else if (origin === "round3") {
        router.push(`/edition/${editionId}/present/wager`);
      } else if (origin === "final") {
        router.push(`/edition/${editionId}/present/closing`);
      } else if (origin === "2")
        router.push(`/edition/${editionId}/present/round/3/question/1`);
    },
    [origin]
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
                        animationDelay: `${(scores.length - index - 1) * 3}s`, // Delay based on reverse index
                      }}
                    >
                      <TableCell className="text-2xl">{score.team_name}</TableCell>
                      <TableCell className="text-2xl">{score.points_for_game}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
