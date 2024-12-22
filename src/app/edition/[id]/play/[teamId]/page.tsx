"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PocketBase from "pocketbase";
import { useRouter } from "next/navigation";
import { Button } from "@nextui-org/react";
import { toast } from "react-toastify";
import { Slide, Zoom, Flip, Bounce } from 'react-toastify';
import { usePrimeDirectives } from "@/hooks/usePrimeDirectives";


interface Edition {
  title: string;
  date: string;
  edition_gif: string;
  blurb: string;
  home_song: string;
  // Add other fields if needed, e.g., `id: string`, `description: string`, etc.
}

export default function TeamPage() {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const router = useRouter();
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const [date, setDate] = useState<string | null>(null);
  const [editionTitle, setEditionTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [googleAuth, setGoogleAuth] = useState<boolean>(false)
  const [googleUser, setGoogleUser] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [googleAvatar, setGoogleAvatar] = useState<string>("");
  const [action, setAction] = useState<string | null>(null);
  const teamId = typeof params?.teamId === "string" ? params.teamId : undefined;
  const [teamName, setTeamName] = useState<string | null>(null);
  const [teamWins, setTeamWins] = useState<number | null>(null);
  const [teamAllTimePoints, setTeamAllTimePoints] = useState<number | null>(null);

  usePrimeDirectives("directives", editionId, teamId);

  interface GoogleData {
    meta: {
      name: string;
      avatarURL: string;
      email: string;
    };
  }


  const getTeam = async () => {
    try {
      pb.autoCancellation(false)
      const team = await pb.collection("teams").getFirstListItem(`id="${teamId}"`);
      console.log("Team:", team);
      setTeamName(team.team_name);
      setTeamWins(team.wins);
      setTeamAllTimePoints(team.all_time_points);
    } catch (error) {
      console.error("Failed to get team:", error);
    }
  }

  const logoutGoogle = async () => {
    try {
      const response = await pb.authStore.clear();
      if (response !== null) {
        setGoogleAuth(false);
        localStorage.removeItem("google_data");
        router.push("/");
      }
      console.log("Logout response:", response);
    }
    catch (error) {
      console.error("Failed to logout:", error);
    }
  }

  const testToast = () => {
    toast.info("X-Men Gold Team just signed up!", {
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

  // Setup the real-time subscription for team events tags
  function teamWatch() {
    const subscription = pb.collection('teams').subscribe('*', (event) => {
      // Listen for "create", "update", and "delete" events on the 'imagetags' collection
      console.log('Event detected:', event.action);
      switch (event.action) {
        case 'create':
          console.log('Create event:', event.record);
          toast(`${event.record.team_name} has joined the game!`);
          break;
        case 'update':
          console.log('Update event:', event.record);
          break;
        case 'delete':
          console.log('Delete event:', event.record);
          break;
      }
    });

    pb.realtime.subscribe('example', (e) => {
      console.log(e)
    })
  }


  useEffect(() => {
    console.log("pb.authStore", pb.authStore);
    console.log("teamId", teamId);
    // if pocketbase_auth is in localstorage, use it to authenticate
    if (pb.authStore.isValid) {
      setGoogleAuth(true);

      // Retrieve and parse the data from localStorage
      const authData = localStorage.getItem("pocketbase_auth");
      const googleData = localStorage.getItem("google_data");

      if (authData) {

        const fetchUser = async () => {
          try {
            // Parse the JSON
            const parsedData = JSON.parse(authData);

            // Access the `id`
            const id = parsedData.record.id;

            // Fetch user data asynchronously
            pb.autoCancellation(false)
            const user = await pb.collection("users").getOne(id);


            // You can set additional state here if needed
            if (googleData) {
              setGoogleAuth(true);
              try {

                // Parse the JSON and type it as GoogleData
                const parsedGoogleData: GoogleData = JSON.parse(googleData);

                // Access properties safely
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

        // Call the async function
        fetchUser();
        getEdition();
        getTeam();
        teamWatch();

      } else {
        console.log("No pocketbase_auth data found in localStorage.");
      }
    } else {
      router.push("/");
    }

    // Dependencies (add necessary dependencies here, or an empty array if no dependencies)
  }, []);
  
  return (
    <div className="p-4 md:p-10 flex flex-col md:justify-center">
      <h3 className="font-reboot text-xl md:text-4xl text-center text-glow-blue-400">Nerd Trivia 3000</h3>
      <h4 className="text-xl text-center mb-4">{date}</h4>
      <h1 className="text-3xl md:text-5xl text-center md:text-left mb-5">{editionTitle}</h1>

      <h4 className="text-2xl md:text-left mb-8">Welcome, {teamName}!</h4>
      <p className="text-xl md:text-left mb-2">Wins: {teamWins}</p>
      <p className="text-xl md:text-left mb-8">All-time points: {teamAllTimePoints}</p>
      <p className="text-2xl md:text-left mb-4">Game will start soon! HOLD!!!</p>
      <Button
        onPress={logoutGoogle}
        size="sm"
        className="mt-4 w-fit"
      >Logout</Button>

      <Button
        onPress={testToast}
        size="sm"
        className="mt-4 w-fit"
      >Test Toast</Button>

    </div>
  );
}
