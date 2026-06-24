"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname, useParams } from "next/navigation";
import { useTransitionRouter } from "next-transition-router";
import { sendDirective } from "@/app/utils/toolbox";
import { usePrimeDirectives } from "@/hooks/usePrimeDirectives";
import { getPusherClient } from "@/lib/pusher/client";
import { toast, Flip } from "react-toastify";

export default function PresenterBroadcaster() {
  const pathname = usePathname();
  const params = useParams();
  // Use the transition router so admin-driven navigation plays the same
  // interstitial animation as the presenter's own Ctrl+arrow navigation.
  const router = useTransitionRouter();
  const editionId = typeof params?.id === "string" ? params.id : undefined;

  // Keep the latest pathname in a ref so the directives listener (subscribed
  // once) can compare against it without re-subscribing on every navigation.
  const pathnameRef = useRef(pathname);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  // Broadcast the presenter's current location as a navigation directive.
  // Reused on navigation AND when the admin (re)loads and asks where we are.
  const broadcastLocation = useCallback((p: string | null) => {
    if (!p || !p.includes("/present")) return;
    const parts = p.split("/");
    let type = "";
    let round: string | null = null;
    let question: string | null = null;

    if (p.includes("/round/")) {
      const roundIndex = parts.indexOf("round");
      if (roundIndex !== -1 && parts[roundIndex + 1]) {
        round = parts[roundIndex + 1];
        if (p.includes("/question/")) {
          const questionIndex = parts.indexOf("question");
          if (questionIndex !== -1 && parts[questionIndex + 1]) {
            question = parts[questionIndex + 1];
            type = "question_jump";
          }
        } else {
          type = "round_jump";
        }
      }
    } else if (p.includes("/impossible/")) {
      const impossibleIndex = parts.indexOf("impossible");
      if (impossibleIndex !== -1 && parts[impossibleIndex + 1]) {
        round = parts[impossibleIndex + 1];
        type = "impossible_jump";
      }
    } else if (p.includes("/wager")) {
      type = "wager_jump";
    } else if (p.includes("/final")) {
      type = "final_jump";
    } else if (p.includes("/tiebreaker")) {
      type = "tiebreaker_jump";
    }

    if (type) {
      sendDirective(type, round, question, true);
    }
  }, []);

  // Follow navigation directives (e.g. from the admin's nav buttons) by moving
  // the presenter to the matching present page. Guarded against the broadcast
  // effect below (which re-broadcasts on navigation) by only moving when the
  // target differs from where we already are.
  useEffect(() => {
    if (!editionId) return;
    const pusher = getPusherClient();
    const channel = pusher.subscribe("directives");

    const handleEvent = (data: { type: string; round?: string; question?: string }) => {
      // The admin (re)loaded and is asking where we are — re-announce so it can
      // restore the highlighted "current" question.
      if (data.type === "request_location") {
        broadcastLocation(pathnameRef.current);
        return;
      }
      let path: string | null = null;
      switch (data.type) {
        case "question_jump":
          path = `/edition/${editionId}/present/round/${data.round}/question/${data.question}`;
          break;
        case "round_jump":
          path = `/edition/${editionId}/present/round/${data.round}`;
          break;
        case "impossible_jump":
          path = `/edition/${editionId}/present/impossible/${data.round}`;
          break;
        case "wager_jump":
          path = `/edition/${editionId}/present/wager`;
          break;
        case "final_jump":
          path = `/edition/${editionId}/present/final`;
          break;
        case "tiebreaker_jump":
          path = `/edition/${editionId}/present/tiebreaker`;
          break;
      }
      if (path && path !== pathnameRef.current) {
        router.push(path);
      }
    };

    channel.bind("evt::direct", handleEvent);
    return () => {
      channel.unbind("evt::direct", handleEvent);
    };
  }, [editionId, router, broadcastLocation]);

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

  // Broadcast our location whenever the presenter navigates.
  useEffect(() => {
    broadcastLocation(pathname);
  }, [pathname, broadcastLocation]);

  return null; // This component renders nothing
}
