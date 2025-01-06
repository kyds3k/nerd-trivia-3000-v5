"use client"

import React from 'react';

import { useEffect, useState } from 'react';
import { useParams } from "next/navigation";
import Pocketbase from "pocketbase";
import { Image } from "@nextui-org/react";
import { useHotkeys } from "react-hotkeys-hook";
import { Spinner, Progress } from '@nextui-org/react';
import { useTransitionRouter } from "next-transition-router";
import ShallNotPass from "@/components/ShallNotPass";

interface Round {
  edition_id: string;
  round_gif: string;
}

export default function Round() {
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const router = useTransitionRouter();
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const roundId = Array.isArray(params?.roundId) 
  ? parseInt(params.roundId[0], 10) 
  : params?.roundId 
  ? parseInt(params.roundId, 10) 
  : undefined;
  const [roundGif, setRoundGif] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);


  useHotkeys("ctrl+ArrowRight", () => {
    // Navigate to the first question in that round
    router.push(`/edition/${editionId}/present/round/${roundId}/question/1`);
  });

  useHotkeys("ctrl+ArrowLeft", () => {
    if (typeof roundId === "number" && roundId > 1) {
      // Navigate to the previous round
      router.push(`/edition/${editionId}/present/scoreboard`);
    } else if (roundId === 1) {
      // Navigate to the 'present' page
      router.push(`/edition/${editionId}/present`);
    } else {
      console.error("Invalid roundId:", roundId);
    }
  });

  useEffect(() => {
    
    const initializeApp = async () => {
      if (!pb.authStore.isValid) {
        console.log("Not authenticated with Pocketbase.");
        setLoading(false);
        return;
      }
  
      console.log("Authenticated with Pocketbase successfully.");
      const authData = localStorage.getItem("pocketbase_auth");
  
      if (!authData) {
        console.error("No auth data found.");
        setLoading(false);
        setIsAdmin(false);
        return;
      }
  
      const parsedAuth = JSON.parse(authData);
      console.log("Parsed auth data:", parsedAuth);
      if (!parsedAuth.record.is_admin) {
        console.log("Not an admin.");
        setLoading(false);
        setIsAdmin(false);
        return;
      }
  
      console.log("Admin authenticated.");
      setIsAdmin(true);
      setLoading(false);
    };
  

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
        initializeApp();
        fetchRound();
      }
    
  }, [editionId]);
  


  return (
    <div className="flex h-screen justify-center items-center">
      {loading ? (
        <Progress isIndeterminate aria-label="Loading..." className="max-w-md" size="sm" />
      ) : !isAdmin ? (
        <ShallNotPass />
      ) : !roundGif ? (
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