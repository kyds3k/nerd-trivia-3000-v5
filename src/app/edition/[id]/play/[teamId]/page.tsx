"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Button, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { toast, Flip } from "react-toastify";
import { usePrimeDirectives } from "@/hooks/usePrimeDirectives";
import { motion } from "framer-motion";
import { getPocketbaseClient } from "@/lib/pocketbase";
import { getPusherClient } from "@/lib/pusher/client";
import { sendDirective } from "@/app/utils/toolbox";
import { useAuth } from "@/hooks/useAuth";


interface Edition {
  title: string;
  date: string;
  edition_gif: string;
  blurb: string;
  home_song: string;
}

export default function TeamPage() {
  const pb = getPocketbaseClient();
  const router = useRouter();
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const [date, setDate] = useState<string | null>(null);
  const [editionTitle, setEditionTitle] = useState<string | null>(null);
  const { isAuthenticated, logout } = useAuth();
  const teamId = typeof params?.teamId === "string" ? params.teamId : undefined;
  const [teamName, setTeamName] = useState<string | null>(null);
  const [teamIdentifier, setTeamIdentifier] = useState<string | null>(null);
  const [teamWins, setTeamWins] = useState<number | null>(null);
  const [teamAllTimePoints, setTeamAllTimePoints] = useState<number | null>(null);
  const [teamLoaded, setTeamLoaded] = useState<boolean>(false);

  // Use the hook and pass the callback for question_toggle
  // Assuming active might be a string, convert it to a boolean
  usePrimeDirectives(
    "directives",
    editionId,
    teamId,
    (message, team) => {
      console.log("Received message:", message, "for team:", team);
      // Handle notification messages
    }
  );


  usePrimeDirectives("notifications", editionId, teamId, (message, team) => {
    console.log(`Notification received from team ${team}: ${message}`);
    if (team == teamId) return;
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
      transition: Flip,
    });
  });
  const getTeam = async () => {
    try {
      pb.autoCancellation(false)
      const team = await pb.collection("teams").getFirstListItem(`id="${teamId}"`);
      console.log("Team:", team);
      setTeamName(team.team_name);
      setTeamWins(team.wins);
      setTeamAllTimePoints(team.all_time_points);
      setTeamIdentifier(team.team_identifier);
      setTeamLoaded(true);
    } catch (error) {
      console.error("Failed to get team:", error);
    }
  }

  const logoutGoogle = async () => {
    await logout();
    router.push("/");
  }

  const getEdition = async () => {
    try {
      pb.autoCancellation(false)
      const edition = await pb.collection("editions").getFirstListItem(`is_active = true`);
      console.log("Edition:", edition);
      setEditionTitle(edition.title);
      if (edition.date) {
        const formattedDate = new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(new Date(edition.date));

        setDate(formattedDate);
      }
    } catch (error) {
      console.error("Failed to get edition:", error);
    }
  }


  useEffect(() => {
    // Load data once auth resolves. We don't redirect here on `false` because
    // `isAuthenticated` starts false and only flips true after useAuth's async
    // check — redirecting on the initial false bounced teams straight back to
    // the join screen. useAuth itself redirects to "/" if genuinely unauthed.
    if (isAuthenticated) {
      getEdition();
      getTeam();
    }
  }, [isAuthenticated]);

  // Reconnect: if a team lands here mid-game (e.g. they closed the browser and
  // logged back in), ask the presenter to re-announce where the game is. The
  // presenter re-broadcasts its current location and usePrimeDirectives (above)
  // navigates this team to the live question. We wait for the channel to be
  // subscribed so we don't miss the presenter's reply.
  useEffect(() => {
    if (!isAuthenticated) return;
    const channel = getPusherClient().subscribe("directives");
    const askWhereWeAre = () => {
      sendDirective("request_location", null, null, null).catch(() => {
        /* presenter may be offline; non-fatal */
      });
    };
    if (channel.subscribed) {
      askWhereWeAre();
    } else {
      channel.bind("pusher:subscription_succeeded", askWhereWeAre);
    }
    return () => {
      channel.unbind("pusher:subscription_succeeded", askWhereWeAre);
    };
  }, [isAuthenticated]);

  return (
    <div className="p-4 pb-10 md:p-10 flex flex-col items-center md:justify-center w-screen overflow-x-hidden">
      <h1 className="font-linebeam text-6xl md:text-8xl w-full uppercase text-center text-glow-blue-400 mb-4">Nerd Trivia 3000</h1>
      <h2 className="w-full text-center text-lg md:text-2xl mb-4 md:mb-2">{date}</h2>

      <h3 className="text-3xl md:text-5xl text-center md:text-left mb-10">{editionTitle}</h3>

      {teamLoaded && (
        <motion.div
          initial={{ scale: 0 }} // Starts at 0 size
          animate={{ scale: 1 }} // Animates to full size
          transition={{
            duration: 1, // Animation duration in seconds
            ease: "easeInOut", // Easing function
          }}
        >
          <div data-augmented-ui="tl-clip t-clip-xy bl-clip r-clip-xy both" className="p-8 md:p-10 w-11/12 md:w-full nerd-aug bluecard bluecard__alt">
            <h4 className="text-2xl md:text-left mb-8">Welcome, {teamName}!</h4>
            <p className="text-xl md:text-left mb-2">Wins: {teamWins}</p>
            <p className="text-xl md:text-left mb-2">All-time points: {teamAllTimePoints}</p>
            <p className="text-xl md:text-left mb-8">Team Identifier: {teamIdentifier} <Popover placement="top" backdrop="blur" classNames={{ base: "w-11/12 md:w-fit p-0 shadow-none border-none bg-none rounded-none", backdrop: "p-0 border-none bg-none rounded-none", content: "bg-transparent p-0 border-none shadow-none bg-none rounded-none" }}><PopoverTrigger><span className="text-cyan-500 text-sm underline cursor-pointer">(what's this?)</span></PopoverTrigger><PopoverContent><div className="p-4 w-11/12 md:w-fit bg-black border-1 border-cyan-500"><p>You can use this identifier to play as the same team in future games and save your stats!</p></div></PopoverContent></Popover></p>

            <p className="text-2xl md:text-left mb-12">Game will start soon! HOLD!!!</p>
            <Button
              onPress={logoutGoogle}
              size="lg"
              data-augmented-ui="both"
              className="w-fit border-none rounded-none text-white bg-black nerd-aug bluebutton motion-safe:animate-pulse"
            >Logout</Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
