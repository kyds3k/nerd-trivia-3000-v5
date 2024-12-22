"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from "next/navigation";
import Pocketbase from 'pocketbase';
import { Image } from "@nextui-org/react";
import NextImage from "next/image";
import { useHotkeys } from "react-hotkeys-hook";
import { Spinner } from '@nextui-org/react';
import { usePrimeDirectives } from "@/hooks/usePrimeDirectives";

interface Round {
  edition_id: string;
  round_gif: string;
}

export default function Round() {
  // const params = useParams();
  // const editionId = typeof params?.id === "string" ? params.id : undefined;
  // const roundId = typeof params?.roundId === "string" ? params.roundId : undefined;
  //const teamId = typeof params?.teamId === "string" ? params.teamId : undefined;
  const params = useParams();
  const editionId = params?.id as string;
  const roundId = parseInt(params?.roundId as string);
  const teamId = params?.teamId as string;  
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

  const [roundGif, setRoundGif] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  usePrimeDirectives("directives", editionId, teamId);

  useEffect(() => {
    const fetchRound = async () => {
      pb.autoCancellation(false);
      try {
        const round = await pb.collection('rounds').getFirstListItem(
          `edition_id = "${editionId}" && round = ${roundId}` // Removed quotes around roundId
        );
        if (round) {
          setRoundGif(round.round_gif);
        }
      } catch (error) {
        console.error("Failed to fetch round:", error);
      }
    };

    if (editionId) {
      fetchRound();
    }
  }, []);

  return (
    <div className="flex flex-col h-svh justify-center items-center">
      {!roundGif ? (
        <Spinner size="lg" />
      ) : (
        <div className="roundContainer w-screen flex flex-col gap-4 items-center justify-items-center">
          <h1 className="text-8xl">Round {roundId}</h1>
          <Image src={roundGif} radius='none' removeWrapper width="auto" className='w-4/5 h-auto my-auto block' alt="Round Gif" />
        </div>
      )}
    </div>
  );
}
