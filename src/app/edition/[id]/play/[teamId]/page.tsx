"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useParams } from "next/navigation";
import Pocketbase from "pocketbase";
import { useRouter } from "next/navigation";
import { Button, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";
import { toast } from "react-toastify";
import { Flip } from "react-toastify";
import { usePrimeDirectives } from "@/hooks/usePrimeDirectives";
import { motion } from "framer-motion";
import DailyIframe from '@daily-co/daily-js';

const ROOM_URL = 'https://nerdtrivia.daily.co/the-cantina';

interface Edition {
  title: string;
  date: string;
  edition_gif: string;
  blurb: string;
  home_song: string;
}

export default function TeamPage() {
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const router = useRouter();
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const teamId = typeof params?.teamId === "string" ? params.teamId : undefined;

  const [date, setDate] = useState<string | null>(null);
  const [editionTitle, setEditionTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [googleAuth, setGoogleAuth] = useState<boolean>(false);
  const [googleUser, setGoogleUser] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [googleAvatar, setGoogleAvatar] = useState<string>("");
  const [action, setAction] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [teamIdentifier, setTeamIdentifier] = useState<string | null>(null);
  const [teamWins, setTeamWins] = useState<number | null>(null);
  const [teamAllTimePoints, setTeamAllTimePoints] = useState<number | null>(null);
  const [teamLoaded, setTeamLoaded] = useState<boolean>(false);

  // domReady state and refs for Daily iframe
  const [domReady, setDomReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<any>(null);

  interface GoogleData {
    meta: {
      name: string;
      avatarURL: string;
      email: string;
    };
  }

  // usePrimeDirectives hooks
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
      pb.autoCancellation(false);
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
  };

  const logoutGoogle = async () => {
    try {
      const response = await pb.authStore.clear();
      if (response !== null) {
        setGoogleAuth(false);
        localStorage.removeItem("google_data");
        router.push("/");
      }
      console.log("Logout response:", response);
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const getEdition = async () => {
    try {
      pb.autoCancellation(false);
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
  };

  // On mount: auth + data loading
  useEffect(() => {
    console.log("pb.authStore", pb.authStore);
    console.log("teamId", teamId);

    if (pb.authStore.isValid) {
      setGoogleAuth(true);

      const authData = localStorage.getItem("pocketbase_auth");
      const googleData = localStorage.getItem("google_data");

      if (authData) {
        const fetchUser = async () => {
          try {
            const parsedData = JSON.parse(authData);
            const id = parsedData.record.id;
            pb.autoCancellation(false);
            const user = await pb.collection("users").getOne(id);

            if (googleData) {
              setGoogleAuth(true);
              try {
                const parsedGoogleData: GoogleData = JSON.parse(googleData);
                setGoogleUser(parsedGoogleData.meta.name);
                setGoogleAvatar(parsedGoogleData.meta.avatarURL);
                setUserEmail(parsedGoogleData.meta.email);
              } catch (error) {
                console.error("Error parsing google_data:", error);
              }
            }
          } catch (error) {
            console.error("Error parsing pocketbase_auth data or fetching user:", error);
          }
        };

        fetchUser();
        getEdition();
        getTeam();
      } else {
        console.log("No pocketbase_auth data found in localStorage.");
      }
    } else {
      router.push("/");
    }
  }, []);

  // Set domReady on mount as before
  useEffect(() => {
    setDomReady(true);
  }, []);

  // Use useLayoutEffect here to ensure DOM is ready before DailyIframe init
  useLayoutEffect(() => {


    setTimeout(() => {
      if (!containerRef.current) return;


      const callFrame = DailyIframe.createFrame(containerRef.current, {
        showLeaveButton: false,
        iframeStyle: {
          width: "100%",
          height: "100%",
          border: "0",
        },
      });

      callFrame
        .join({
          url: ROOM_URL,
          audioSource: true,
          videoSource: false,
        })
        .then(() => console.log("Joined room successfully!"))
        .catch((err) => console.error("Join failed:", err));

      callFrameRef.current = callFrame;

      return () => {
        console.log("Cleaning up Daily iframe");
        callFrame.leave();
        callFrame.destroy();
        callFrameRef.current = null;
      };
    }, 2000);
  }, [domReady]);

  return (
    <div className="p-4 pb-10 md:p-10 flex flex-col items-center md:justify-center w-screen overflow-x-hidden">
      <h1 className="font-linebeam text-6xl md:text-8xl w-full uppercase text-center text-glow-blue-400 mb-4">
        Nerd Trivia 3000
      </h1>
      <h2 className="w-full text-center text-lg md:text-2xl mb-4 md:mb-2">{date}</h2>

      <h3 className="text-3xl md:text-5xl text-center md:text-left mb-10">{editionTitle}</h3>

      {teamLoaded && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          <div
            data-augmented-ui="tl-clip t-clip-xy bl-clip r-clip-xy both"
            className="p-8 md:p-10 w-11/12 md:w-full nerd-aug bluecard bluecard__alt"
          >
            <h4 className="text-2xl md:text-left mb-8">Welcome, {teamName}!</h4>
            <p className="text-xl md:text-left mb-2">Wins: {teamWins}</p>
            <p className="text-xl md:text-left mb-2">All-time points: {teamAllTimePoints}</p>
            <p className="text-xl md:text-left mb-8">
              Team Identifier: {teamIdentifier}{" "}
              <Popover
                placement="top"
                backdrop="blur"
                classNames={{
                  base: "w-11/12 md:w-fit p-0 shadow-none border-none bg-none rounded-none",
                  backdrop: "p-0 border-none bg-none rounded-none",
                  content: "bg-transparent p-0 border-none shadow-none bg-none rounded-none",
                }}
              >
                <PopoverTrigger>
                  <span className="text-cyan-500 text-sm underline cursor-pointer">(what's this?)</span>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="p-4 w-11/12 md:w-fit bg-black border-1 border-cyan-500">
                    <p>You can use this identifier to play as the same team in future games and save your stats!</p>
                  </div>
                </PopoverContent>
              </Popover>
            </p>

            <p className="text-2xl md:text-left mb-12">Game will start soon! HOLD!!!</p>
            {/* Render containerRef div unconditionally so it exists when useLayoutEffect runs */}
            <div
              ref={containerRef}
              className="w-full h-[300px] border-2 border-cyan-500 relative mb-10"
            />


            <Button
              onPress={logoutGoogle}
              size="lg"
              data-augmented-ui="both"
              className="w-fit border-none rounded-none text-white bg-black nerd-aug bluebutton motion-safe:animate-pulse"
            >
              Logout
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
