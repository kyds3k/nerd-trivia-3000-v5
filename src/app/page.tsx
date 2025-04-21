"use client";

import { useEffect, useState } from "react";
import { Button, Image, Link } from "@heroui/react";
import Pocketbase from "pocketbase";
import { useRouter } from "next/navigation";


export default function HomePage() {
  const pb = new Pocketbase('https://nerd-trivia-3k.pockethost.io');
  const [googleAuth, setGoogleAuth] = useState<boolean>(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [googleUser, setGoogleUser] = useState<string>("");
  const [googleAvatar, setGoogleAvatar] = useState<string>("");
  const [editionTitle, setEditionTitle] = useState<string>("");
  const [editionId, setEditionId] = useState<string>("");
  const router = useRouter();

  interface GoogleData {
    meta: {
      name: string;
      avatarURL: string;
    };
  }

  const loginGoogle = async () => {
    try {
      pb.autoCancellation(false);
      const authData = await pb.collection("users").authWithOAuth2({
        provider: "google"
      });

      console.log("authData", authData);

      if (authData.meta) {
        console.log("Authenticated with Google successfully:", authData.meta.name);
        localStorage.setItem("google_data", JSON.stringify(authData));
        setGoogleUser(authData.meta.name);
        setGoogleAvatar(authData.meta.avatarURL);
        setGoogleAuth(true);

        if (authData.record.is_admin === true)
          router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to login with Google:", error);
    }
  }

  const logoutGoogle = async () => {
    try {
      const response = await pb.authStore.clear();
      if (response !== null) {
        setGoogleAuth(false);
        localStorage.removeItem("google_data");
        localStorage.removeItem("spotifyAuthToken");
        localStorage.removeItem("spotifyAuthTokenExpiry");
        localStorage.removeItem("spotifyAuthRefreshToken");
        localStorage.removeItem("pocketbase_auth");
      }
      console.log("Logout response:", response);
    }
    catch (error) {
      console.error("Failed to logout:", error);
    }
  }

  const getEdition = async () => {
    try {
      const edition = await pb.collection("editions").getFirstListItem(`is_active = true`);
      console.log("Edition:", edition);
      setEditionTitle(edition.title);
      setEditionId(edition.id);
    } catch (error) {
      console.error("Failed to get edition:", error);
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

            console.log("ID:", id);
            if (user.is_admin)
              router.push("/dashboard");

            // You can set additional state here if needed
            if (googleData) {
              setGoogleAuth(true);
              try {

                // Parse the JSON and type it as GoogleData
                const parsedGoogleData: GoogleData = JSON.parse(googleData);

                // Access properties safely
                setGoogleUser(parsedGoogleData.meta.name);
                setGoogleAvatar(parsedGoogleData.meta.avatarURL);
              } catch (error) {
                console.error("Error parsing google_data:", error);
              }
            }

            if (user.is_admin) {
              setIsAdmin(true);
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
      console.log('Time . . . to log in.')
    }

    // Dependencies (add necessary dependencies here, or an empty array if no dependencies)
  }, [googleAuth]);

  return (
    <div className="p-4 pb-10 md:p-10 w-screen flex flex-col pt-10 md:pt-0 md:justify-center items-center h-svh">
      <h1 className="font-linebeam text-6xl flex md:text-8xl text-center text-glow-blue-400 mb-10 uppercase">Nerd Trivia 3000</h1>
      {googleAuth ? (
        <>
          <div className="user flex items-center gap-4 mb-4">
            {googleAvatar && <Image src={googleAvatar} referrerPolicy="no-referrer" width="100" height="100" alt="User Avatar" />}
            <p>{googleUser}</p>
          </div>
          <div className="mt-6 flex flex-col">
            <h4 className="text-2xl mb-2">Join the game!</h4>
            <Link 
              underline="always" 
              className="text-cyan-500" 
              size="lg" 
              href={`/edition/${editionId}/play`}
            >
              {editionTitle}
            </Link>
            {isAdmin && (
              <Button 
                as={Link} 
                className="w-fit" 
                href="/dashboard">Admin Dashboard
              </Button>
            )}
            <Button
            data-augmented-ui="both"
            className="mt-6 w-fit border-none rounded-none text-white bg-black nerd-aug bluebutton motion-safe:animate-pulse" 
            size="lg" 
            variant="bordered"            
              onPress={() => logoutGoogle()}
            >
              Logout
            </Button>
          </div>
        </>
      ) : (
        <>
          <Button 
            data-augmented-ui="both"
            className="w-fit  border-none rounded-none text-white bg-black nerd-aug bluebutton motion-safe:animate-pulse" 
            size="lg" 
            variant="bordered"            
            onPress={() => loginGoogle()}
          >
            Login with Google
          </Button>
        </>
      )}
    </div>
  );
}
