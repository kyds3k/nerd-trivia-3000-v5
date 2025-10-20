"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Pocketbase from "pocketbase";
import { useRouter } from "next/navigation";
import { Image, Form, Input, Button, Alert } from "@heroui/react";
import DOMPurify from "dompurify"; // Import the sanitizer
import { set } from "lodash";
import { sendMessage } from "@/app/utils/toolbox";
import { send } from "process";


interface Edition {
  title: string;
  date: string;
  edition_gif: string;
  blurb: string;
  home_song: string;
  // Add other fields if needed, e.g., `id: string`, `description: string`, etc.
}

export default function EditionPage() {
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const router = useRouter();
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const [date, setDate] = useState<string | null>(null);
  const [editionTitle, setEditionTitle] = useState<string | null>(null);
  const [blurb, setBlurb] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [googleAuth, setGoogleAuth] = useState<boolean>(false)
  const [googleUser, setGoogleUser] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [googleAvatar, setGoogleAvatar] = useState<string>("");
  const [action, setAction] = useState<string | null>(null);
  const attributes = ["str", "dex", "con", "dex", "int", "wis", "cha"];
  const randomAttribute = attributes[Math.floor(Math.random() * attributes.length)];
  const teamId = Math.floor(10000 + Math.random() * 90000) + "-" + randomAttribute;

  const [submitResults, setSubmitResults] = useState<boolean>(false);
  const [teamCreated, setTeamCreated] = useState<boolean>(false);
  const [teamExists, setTeamExists] = useState<boolean>(false);

  const [searchResults, setSearchResults] = useState<boolean>(false);
  const [teamSearched, setTeamSearched] = useState<boolean>(false);
  const [teamFound, setTeamFound] = useState<boolean>(false);

  interface GoogleData {
    meta: {
      name: string;
      avatarURL: string;
      email: string;
    };
  }

  const logoutGoogle = async () => {
    try {
      const response = await pb.authStore.clear();
      if (response !== null) {
        setGoogleAuth(false);
        localStorage.removeItem("google_data");
      }
      console.log("Logout response:", response);
    }
    catch (error) {
      console.error("Failed to logout:", error);
    }
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
      setBlurb(DOMPurify.sanitize(edition.blurb));
    } catch (error) {
      console.error("Failed to get edition:", error);
    }
  }

  const submitTeam = async (data: any) => {
    try {
      pb.autoCancellation(false)

      // add "team_name_lower" field to data
      data.team_name_lower = data.team_name.toLowerCase();
      data.current_edition = editionId;

      const exists = await pb.collection("teams").getList(1, 100, { filter: `team_name_lower = "${data.team_name_lower}"` });
      console.log("Team exists:", exists);
      if (exists.totalItems > 0) {
        setSubmitResults(true);
        setTeamExists(true);
        return;
      } else {
        const team = await pb.collection("teams").create(data);
        console.log("Team created:", team);
        setSubmitResults(true);
        setTeamCreated(true);
        sendMessage("team", `A new team! ${data.team_name} has joined the fray!`, team.id);
        setTimeout(() => {
          router.push(`/edition/${editionId}/play/${team.id}`);
        }, 4000);
      }
    } catch (error) {
      console.log("Failed to create team:", error);
    }
  }

  const captainTeam = async (data: any) => {
    setTeamSearched(true);
    try {
      pb.autoCancellation(false)
      let team = await pb.collection('teams').getFirstListItem(`team_identifier = "${data.team_identifier}"`);
      if (team) {
        setSearchResults(true);
        setTeamFound(true);
        sendMessage("team", `Team ${team.team_name} is back for more!`, team.id);
        // update current_edition field in team
        try {
          const updatedTeam = await pb.collection('teams').update(team.id, {
            current_edition: editionId
          });
          console.log("Team updated:", updatedTeam);
          setTimeout(() => {
            router.push(`/edition/${editionId}/play/${team.id}`);
          }, 3000);
        } catch (error) {
          console.log("Failed to update team:", error);
        }
      }


    } catch (error) {
      setSearchResults(true);
      setTeamFound(false);
      console.log("Team not found: ", error);
    }
  }

  useEffect(() => {
    console.log("pb.authStore", pb.authStore);
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
      } else {
        console.log("No pocketbase_auth data found in localStorage.");
      }
    } else {
      router.push("/");
    }

    // Dependencies (add necessary dependencies here, or an empty array if no dependencies)
  }, []);


  return (
    <div className="p-4 pb-10 md:p-10 flex flex-col items-center md:justify-center w-screen overflow-x-hidden">
      <h1 className="font-linebeam text-6xl md:text-8xl w-full uppercase text-center text-glow-blue-400 mb-4">Nerd Trivia 3000</h1>
      <h2 className="w-full text-center text-lg md:text-2xl mb-4 md:mb-2">{date}</h2>

      <h3 className="text-3xl md:text-4xl text-center w-full mb-6 md:mb-10">{editionTitle}</h3>


      <div className="w-11/12 md:px-0 md:w-1/2">
        <h5 className="text-2xl text-center md:text-left mb-10 md:mb-10 w-full">Register your team</h5>

        <Form
          className="w-full md:max-w-screen-xl flex flex-col gap-4"
          validationBehavior="native"
          onReset={() => setAction("reset")}
          onSubmit={(e) => {
            e.preventDefault();
            let data = Object.fromEntries(new FormData(e.currentTarget));
            console.log("data", data);
            submitTeam(data);
          }}
        >
          <Input
            isRequired
            errorMessage="Please enter a valid team name"
            label="Team Name"
            labelPlacement="outside"
            name="team_name"
            placeholder="Enter your team name"
            type="text"
            size="lg"
            classNames={{
              inputWrapper:
                "border-2 border-cyan-500 focus-within:border-cyan-500 focus-within:animate-neon bg-black text-white focus-visible:border-cyan-500 !border-cyan-500",
              input: "placeholder-gray-400 text-white focus-visible:outline-none",
            }}
            radius="none" // Removes rounded edges
            variant="bordered"            
          />

          <input type="hidden" name="user_email" value={userEmail} />

          <input type="hidden" name="team_identifier" value={teamId} />

          <div className="flex gap-2">
            <Button
              color="primary"
              type="submit"
              data-augmented-ui="both"
              className="w-fit border-none rounded-none text-white bg-black nerd-aug bluebutton motion-safe:animate-pulse"
            >
              Submit
            </Button>
            <Button
              type="reset"
              variant="flat"
              data-augmented-ui="both"
              className="w-fit border-none rounded-none text-white bg-black nerd-aug blackbutton"
            >
              Reset
            </Button>
          </div>
        </Form>
        {submitResults && (
          <>
            <Alert title="Sorry!" description="Team name already exists. Please choose another." color="warning" isVisible={!teamCreated} classNames={{ "base": "mt-6 w-fit" }} />
            <Alert title="Great Success!" description="You are a unique flower! Team created - redirecting you to the game..." color="success" isVisible={teamCreated} classNames={{ "base": "mt-6 w-fit" }} />
          </>
        )}


        <p className="text-2xl md:text-4xl text-center my-8 w-full">- OR -</p>

        <h5 className="text-xl text-center md:text-left mb-4">Captain an existing team</h5>

        <Form
          className="w-full md:max-w-screen-xl flex flex-col gap-4"
          validationBehavior="native"
          onReset={() => setAction("reset")}
          onSubmit={(e) => {
            e.preventDefault();
            let data = Object.fromEntries(new FormData(e.currentTarget));
            captainTeam(data);
          }}
        >

          <Input
            isRequired
            errorMessage="Please enter a valid identifier"
            label="Team Identifier"
            labelPlacement="outside"
            name="team_identifier"
            placeholder="Enter your team identifier"
            type="text"
            size="lg"
            classNames={{
              inputWrapper:
                "border-2 border-cyan-500 focus-within:border-cyan-500 focus-within:animate-neon bg-black text-white focus-visible:border-cyan-500 !border-cyan-500",
              input: "placeholder-gray-400 text-white focus-visible:outline-none",
            }}
            radius="none" // Removes rounded edges
            variant="bordered"            
          />
          <div className="flex gap-2">
            <Button
              color="primary"
              type="submit"
              data-augmented-ui="both"
              className="w-fit border-none rounded-none text-white bg-black nerd-aug bluebutton motion-safe:animate-pulse"
            >
              Submit
            </Button>
            <Button
              type="reset"
              variant="flat"
              data-augmented-ui="both"
              className="w-fit border-none rounded-none text-white bg-black nerd-aug blackbutton"
            >
              Reset
            </Button>
          </div>
        </Form>
        {searchResults && (
          <>
            <Alert title="Sorry!" description="Team not found! Please try again." color="warning" isVisible={!teamFound} classNames={{ "base": "mt-6 w-fit" }} />
            <Alert title="Great Success!" description="Team found! Redirecting you to the game..." color="success" isVisible={teamFound} classNames={{ "base": "mt-6 w-fit" }} />
          </>
        )}
      </div>
    </div>
  );
}
