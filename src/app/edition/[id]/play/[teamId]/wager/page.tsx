"use client";

import React, { useEffect } from 'react';
import { useParams } from "next/navigation";
import { usePrimeDirectives } from "@/hooks/usePrimeDirectives";

export default function Wager() {
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const teamId = typeof params?.teamId === "string" ? params.teamId : undefined;

  const { primeDirectives } = usePrimeDirectives({
    pbUrl: process.env.NEXT_PUBLIC_POCKETBASE_URL!,
    editionId: editionId!,
    teamId: teamId!,
  });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Setup the subscription
    primeDirectives()
      .then((unsub) => {
        unsubscribe = unsub; // Store the unsubscribe function
      })
      .catch((error) => {
        console.error("Failed to set up directives subscription:", error);
      });

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
        console.log("Unsubscribed from directives");
      }
    };
  }, [primeDirectives]);

  return (
    <div>
      <h1>Wager Round</h1>
    </div>
  );
}
