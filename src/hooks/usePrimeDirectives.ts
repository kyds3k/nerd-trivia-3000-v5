import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getPusherClient } from "@/lib/pusher/client";

export interface Message {
  data: string;
  type: string;
  round: string;
  question: string;
  active: boolean;
  tiedTeamIds?: string[];
}

const activeChannels: Record<string, boolean> = {};

export function usePrimeDirectives(
  channelName: string,
  editionId?: string,
  teamId?: string | null,
  onMessage?: (message: string, team: string) => void, // Handle notification messages
  onQuestionToggle?: (active: boolean) => void // Handle question toggling
) {
  const router = useRouter();
  const [navigationPath, setNavigationPath] = useState<string | null>(null);
  const currentPath = usePathname();

  // Keep the consumer callbacks in refs so the Pusher effect doesn't re-subscribe
  // every render. Consumers almost always pass inline functions (new identity each
  // render); listing them as effect deps churned the subscription — unbinding and
  // rebinding constantly, with a brief window where a directive could slip through.
  const onMessageRef = useRef(onMessage);
  const onQuestionToggleRef = useRef(onQuestionToggle);
  useEffect(() => {
    onMessageRef.current = onMessage;
    onQuestionToggleRef.current = onQuestionToggle;
  });

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);

    const handleEvent = (data: Message) => {

      switch (data.type) {
        case "question_jump":
          setNavigationPath(
            `/edition/${editionId}/play/${teamId}/round/${data.round}/question/${data.question}`
          );
          break;
        case "round_jump":
          setNavigationPath(
            `/edition/${editionId}/play/${teamId}/round/${data.round}`
          );
          break;
        case "impossible_jump":
          setNavigationPath(
            `/edition/${editionId}/play/${teamId}/impossible/${data.round}`
          );
          break;
        case "wager_jump":
          setNavigationPath(`/edition/${editionId}/play/${teamId}/wager`);
          break;
        case "final_jump":
          setNavigationPath(`/edition/${editionId}/play/${teamId}/final`);
          break;
        case "tiebreaker_jump":
          if (data.tiedTeamIds && teamId && data.tiedTeamIds.includes(teamId)) {
            setNavigationPath(`/edition/${editionId}/play/${teamId}/tiebreaker`);
          } else {
            console.log("Not part of the tiebreaker. Staying put.");
            // Optionally navigate to a "waiting" or "spectator" screen if needed,
            // but per requirements, we just don't navigate them to the input screen.
            // If we want them to see the scoreboard or something else, we'd handle it here.
            // For now, we do nothing, so they stay on the Final screen (or wherever they are).
          }
          break;
        case "question_toggle":
          if (onQuestionToggleRef.current) {
            onQuestionToggleRef.current(data.active);
          }
          break;
        case "request_location":
          // Only the presenter responds to this; ignore elsewhere.
          break;
        default:
          console.warn(`Unhandled directive type: ${data.type}`);
      }
    };

    const handleNotification = (data: { type: string; message: string; team: string }) => {
      if (onMessageRef.current) {
        onMessageRef.current(data.message, data.team);
      }
    };

    channel.bind("evt::direct", handleEvent);
    channel.bind("evt::notify", handleNotification);

    return () => {
      // Only unbind THIS instance's handlers. Don't unsubscribe the whole
      // channel — it's a shared singleton (e.g. PresenterBroadcaster also binds
      // to "directives"), and unsubscribing would tear down everyone's handlers.
      channel.unbind("evt::direct", handleEvent);
      channel.unbind("evt::notify", handleNotification);
    };
  }, [channelName, editionId, teamId]);

  useEffect(() => {
    if (navigationPath && !currentPath.includes("present")) {
      localStorage.setItem("answerSubmitted", "false");
      router.push(navigationPath);
    }
  }, [navigationPath, router]);
}
