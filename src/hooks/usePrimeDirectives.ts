import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher/client";

export interface Message {
  data: string;
  type: string;
  round: string;
  question: string;
  active: boolean;
}

const activeChannels: Record<string, boolean> = {};

export function usePrimeDirectives(
  channelName: string,
  editionId?: string,
  teamId?: string,
  onMessage?: (message: string, team: string) => void, // Handle notification messages
  onQuestionToggle?: (active: boolean) => void // Handle question toggling
) {
  const router = useRouter();
  const [navigationPath, setNavigationPath] = useState<string | null>(null);

  useEffect(() => {
    if (activeChannels[channelName]) {
      console.log(`Already subscribed to channel: ${channelName}`);
      return;
    }

    console.log(`Subscribing to Pusher channel: ${channelName}`);
    activeChannels[channelName] = true;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);

    const handleEvent = (data: Message) => {
      console.log("Event received:", data);

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
        case "question_toggle":
          if (onQuestionToggle) {
            onQuestionToggle(data.active);
          }
          break;
        default:
          console.warn(`Unhandled directive type: ${data.type}`);
      }
    };

    const handleNotification = (data: { type: string; message: string; team: string }) => {
      console.log("Notification received:", data);
      if (onMessage) {
        onMessage(data.message, data.team); // Pass the message to the provided callback
      }
    };

    channel.bind("evt::direct", handleEvent);
    channel.bind("evt::notify", handleNotification); // Bind to evt::notify

    return () => {
      console.log(`Unsubscribing from Pusher channel: ${channelName}`);
      channel.unbind("evt::direct", handleEvent);
      channel.unbind("evt::notify", handleNotification); // Unbind notification
      pusher.unsubscribe(channelName);
      activeChannels[channelName] = false;
    };
  }, [channelName, editionId, teamId, onMessage, onQuestionToggle]);

  useEffect(() => {
    if (navigationPath) {
      localStorage.setItem("answerSubmitted", "false");
      router.push(navigationPath);
    }
  }, [navigationPath, router]);
}
