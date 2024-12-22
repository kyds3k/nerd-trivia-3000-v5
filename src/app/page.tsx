 "use client";

import { useEffect, useState } from "react";
import { Button, Image, Link } from "@nextui-org/react";
import PocketBase from "pocketbase";
import { useRouter } from "next/navigation";


export default function HomePage() {
  const pb = new PocketBase('https://nerd-trivia-3k.pockethost.io');
  console.log('pb:', pb);
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
      const randomRequestKey = Math.random().toString(36).substring(7);
      const authData = await pb.collection("users").authWithOAuth2({
        requestKey: randomRequestKey,
        provider: "google"
      });

      console.log("authData", authData);

      if (authData.meta) {
        console.log("Authenticated with Google successfully:", authData.meta.name);
        setGoogleUser(authData.meta.name);
        setGoogleAvatar(authData.meta.avatarURL);
        localStorage.setItem("google_data", JSON.stringify(authData));


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
    }

    // Dependencies (add necessary dependencies here, or an empty array if no dependencies)
  }, []);

  return (
    <div className="p-4 md:p-10 w-screen">
      <h1 className="text-2xl pb-6">Welcome to Nerd Trivia 3000!</h1>
      {googleAuth ? (
        <>
          <div className="user flex items-center gap-4 mb-4">
            {googleAvatar && <Image src={googleAvatar} referrerPolicy="no-referrer" width="50" height="50" alt="User Avatar" />}
            <p>{googleUser}</p>
          </div>
          <div className="mt-6 flex flex-col">
            <h4 className="text-2xl mb-2">Join the game!</h4>
            <Link underline="always" className="mb-4" href={`/edition/${editionId}/play`}>{editionTitle}</Link>
            {isAdmin && (
              <Button as={Link} className="w-fit" href="/dashboard">Admin Dashboard</Button>
            )}
            <Button className="w-fit mt-6" onPress={() => logoutGoogle()}>Logout</Button>
          </div>
        </>
      ) : (
        <>
          <Button onPress={() => loginGoogle()}>Login with Google</Button>
        </>
      )}
    </div>
  );
}
