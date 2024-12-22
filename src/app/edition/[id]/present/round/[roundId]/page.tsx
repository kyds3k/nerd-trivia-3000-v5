"use client"

import React from 'react';
import { useSession } from "next-auth/react";
import { useEffect, useState } from 'react';
import { useParams } from "next/navigation";
import pb from "@/lib/pocketbase";
import { Image } from "@nextui-org/react";
import { useHotkeys } from "react-hotkeys-hook";
import { Spinner } from '@nextui-org/react';
import { useRouter } from "next/navigation";

interface Round {
  edition_id: string;
  round_gif: string;
}

export default function Round() {
  const router = useRouter();
  const { data: session } = useSession();
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const roundId = Array.isArray(params?.roundId) 
  ? parseInt(params.roundId[0], 10) 
  : params?.roundId 
  ? parseInt(params.roundId, 10) 
  : undefined;
  const [roundGif, setRoundGif] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useHotkeys("ctrl+ArrowRight", () => {
    // Navigate to the first question in that round
    router.push(`/edition/${editionId}/present/round/${roundId}/question/1`);
  });

  useHotkeys("ctrl+ArrowLeft", () => {
    if (typeof roundId === "number" && roundId > 1) {
      // Navigate to the previous round
      router.push(`/edition/${editionId}/impossible/${roundId - 1}`);
    } else if (roundId === 1) {
      // Navigate to the 'present' page
      router.push(`/edition/${editionId}/present`);
    } else {
      console.error("Invalid roundId:", roundId);
    }
  });

  useEffect(() => {
    if (session) {
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
    }
  }, [session]);
  

  return (
    <div className="flex h-screen justify-center items-center">
      {!roundGif ? (
        <Spinner size="lg" />
      ) : (
      <div className="roundContainer flex flex-col gap-4 items-center">
        <h1 className="text-8xl">Round {roundId}</h1>
        <Image src={roundGif} alt="Round Gif" height={500} />
      </div>
      )}
    </div>
  );
}