"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PocketBase from "pocketbase";
import { useRouter } from "next/navigation";
import { Image, Form, Input, Button, Divider, user } from "@nextui-org/react";
import DOMPurify from "dompurify"; // Import the sanitizer
import { set } from "lodash";

interface Edition {
  title: string;
  date: string;
  edition_gif: string;
  blurb: string;
  home_song: string;
  // Add other fields if needed, e.g., `id: string`, `description: string`, etc.
}

export default function EditionPage() {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
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
  const teamId = Math.floor(10000 + Math.random() * 90000) + "-" + ["str", "dex", "con", "dex", "int", "wis", "cha"][Math.floor(Math.random() * 10)];


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
      
      const exists = await pb.collection("teams").getList(1,100, {filter: `team_name_lower = "${data.team_name_lower}"`});
      console.log("Team exists:", exists);
      if (exists.totalItems > 0) {
        alert("Team name already exists. Please choose another.");
        return;
      } else {
        const team = await pb.collection("teams").create(data);
        console.log("Team created:", team);
        router.push(`/edition/${editionId}/play/${team.id}`);
      }
    } catch (error) {
      console.error("Failed to create team:", error);
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
    <div className="p-4 md:p-10 flex flex-col items-center md:justify-center">
      <h3 className="text-xl md:text-4xl text-center mb-4">Nerd Trivia 3000<br></br> {date}</h3>
      <h1 className="text-3xl md:text-5xl text-center md:text-left mb-5">{editionTitle}</h1>

      <h4 className="text-2xl text-center md:text-left mb-4">Welcome, {googleUser}!</h4>
      <h5 className="text-xl text-center md:text-left mb-4">Register your team</h5>
      <Form
        className="w-full max-w-xs flex flex-col gap-4"
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
        />

        <input type="hidden" name="user_email" value={userEmail} />

        <input type="hidden" name="team_identifier" value={teamId} />

        <div className="flex gap-2">
          <Button color="primary" type="submit">
            Submit
          </Button>
          <Button type="reset" variant="flat">
            Reset
          </Button>
        </div>
      </Form>

        <p className="text-xl text-center my-8 w-screen">- OR -</p>
      
        <h5 className="text-xl text-center md:text-left mb-4">Captain an existing team</h5>

        <Form
        className="w-full max-w-xs flex flex-col gap-4"
        validationBehavior="native"
        onReset={() => setAction("reset")}
        onSubmit={(e) => {
          e.preventDefault();
          let data = Object.fromEntries(new FormData(e.currentTarget));
          setAction(`submit ${JSON.stringify(data)}`);
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
        />
        <div className="flex gap-2">
          <Button color="primary" type="submit">
            Submit
          </Button>
          <Button type="reset" variant="flat">
            Reset
          </Button>
        </div>
      </Form>
      
    </div>
  );
}
