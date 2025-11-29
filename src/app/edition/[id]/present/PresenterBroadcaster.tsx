"use client";

import { useEffect } from "react";
import { usePathname, useParams } from "next/navigation";
import { sendDirective } from "@/app/utils/toolbox";
import { usePrimeDirectives } from "@/hooks/usePrimeDirectives";
import { toast, Flip } from "react-toastify";

export default function PresenterBroadcaster() {
  const pathname = usePathname();
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;

  usePrimeDirectives("notifications", editionId, "presenter", (message, team) => {
    console.log(`Notification received from team ${team}: ${message}`);
    toast.info(message, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
      transition: Flip,
      className: "presentation-toast",
    });
  });

  useEffect(() => {
    if (!pathname) return;

    // Debounce or just send? Let's send immediately for responsiveness, 
    // but maybe check if it's a valid "game" path.

    const parts = pathname.split("/");
    // Expected format: /edition/[id]/present/...

    // Check if we are in the present section
    if (!pathname.includes("/present")) return;

    // Determine the directive type based on the path
    let type = "";
    let round = null;
    let question = null;

    if (pathname.includes("/round/")) {
      const roundIndex = parts.indexOf("round");
      if (roundIndex !== -1 && parts[roundIndex + 1]) {
        round = parts[roundIndex + 1];

        if (pathname.includes("/question/")) {
          const questionIndex = parts.indexOf("question");
          if (questionIndex !== -1 && parts[questionIndex + 1]) {
            question = parts[questionIndex + 1];
            type = "question_jump";
          }
        } else {
          type = "round_jump";
        }
      }
    } else if (pathname.includes("/impossible/")) {
      const impossibleIndex = parts.indexOf("impossible");
      if (impossibleIndex !== -1 && parts[impossibleIndex + 1]) {
        round = parts[impossibleIndex + 1];
        type = "impossible_jump";
      }
    } else if (pathname.includes("/wager")) {
      type = "wager_jump";
    } else if (pathname.includes("/final")) {
      type = "final_jump";
    }

    // Only send if we have a valid type
    if (type) {
      console.log(`Broadcasting navigation: ${type} (Round: ${round}, Question: ${question})`);
      sendDirective(type, round, question, true);
    }

  }, [pathname]);

  return null; // This component renders nothing
}
