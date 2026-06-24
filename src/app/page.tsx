"use client";

import { useEffect, useState } from "react";
import { Button, Image, Link } from "@heroui/react";
import { getPocketbaseClient } from "@/lib/pocketbase";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const pb = getPocketbaseClient();
  const router = useRouter();
  const { isAuthenticated, isAdmin, googleUser, googleAvatar, logout } = useAuth({ requireAuth: false });
  const [editionTitle, setEditionTitle] = useState<string>("");
  const [editionId, setEditionId] = useState<string>("");

  const loginGoogle = async () => {
    try {
      pb.autoCancellation(false);
      const authData = await pb.collection("users").authWithOAuth2({
        provider: "google"
      });

      if (authData.meta) {
        localStorage.setItem("google_data", JSON.stringify(authData));
        if (authData.record.is_admin === true)
          router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to login with Google:", error);
    }
  }

  const getEdition = async () => {
    try {
      pb.autoCancellation(false);
      const edition = await pb.collection("editions").getFirstListItem(`is_active = true`);
      setEditionTitle(edition.title);
      setEditionId(edition.id);
    } catch (error) {
      console.error("Failed to get edition:", error);
    }
  }

  // Only fetch edition data once we're authenticated (#14 — was re-running on every googleAuth change)
  useEffect(() => {
    if (isAuthenticated) {
      getEdition();
      if (isAdmin) {
        router.push("/dashboard");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin]);

  return (
    <div className="p-4 pb-10 md:p-10 w-screen flex flex-col pt-10 md:pt-0 md:justify-center items-center h-svh">
      <h1 className="font-linebeam text-6xl flex md:text-8xl text-center text-glow-blue-400 mb-10 uppercase">Nerd Trivia 3000</h1>
      {isAuthenticated ? (
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
              onPress={logout}
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
