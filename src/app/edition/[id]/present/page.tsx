"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Pocketbase from "pocketbase";
import { Image, Progress } from "@heroui/react";
import DOMPurify from "dompurify"; // Import the sanitizer
import SpotifyPlayer from "@/components/SpotifyPlayer";
import { useHotkeys } from "react-hotkeys-hook";
import { useTimer } from "react-timer-hook";
import { set } from "lodash";
import ShallNotPass from "@/components/ShallNotPass";
import { useSession } from "next-auth/react";
import { refreshSpotifyToken } from "@/hooks/refreshSpotifyToken";
import { useTransitionRouter } from "next-transition-router";


interface Edition {
  title: string;
  date: string;
  edition_gif: string;
  blurb: string;
  home_song: string;
}

interface session {
  accessToken: string;
  user: {
    name: string;
    email: string;
    image: string;
  }
}

export default function EditionPage() {
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const params = useParams();
  const router = useTransitionRouter();
  const editionId = useMemo(() => {
    return typeof params?.id === "string" ? params.id : undefined;
  }, [params]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      console.log("Edition ID:", editionId);
    }
  }, [editionId]);


  const [date, setDate] = useState<string | null>(null);
  const [editionTitle, setEditionTitle] = useState<string | null>(null);
  const [editionGif, setEditionGif] = useState<string | null>(null);
  const [blurb, setBlurb] = useState<string | null>(null);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [pageSong, setPageSong] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [googleAuth, setGoogleAuth] = useState<boolean>(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [hasSession, setHasSession] = useState<boolean>(false);
  const { data: session } = useSession();

  interface SpotTimerProps {
    expiryTimestamp: Date;
  }


  useHotkeys("ctrl+ArrowRight", () => {
    // Navigate to the first round, aka adding /round/1 to the URL
    router.push(`/edition/${editionId}/present/round/1`)
  });


  const time = new Date();
  time.setSeconds(time.getSeconds() + 600);

  useEffect(() => {
    const initializeApp = async () => {
      if (!pb.authStore.isValid) {
        setGoogleAuth(false);
        setLoading(false);
        return;
      }

      console.log("Authenticated with Pocketbase successfully.");
      const authData = localStorage.getItem("pocketbase_auth");

      if (!authData) {
        setGoogleAuth(false);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const parsedAuth = JSON.parse(authData);
      if (!parsedAuth.record.is_admin) {
        setGoogleAuth(false);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      console.log("Admin authenticated.");
      setIsAdmin(true);
      setGoogleAuth(true);
      setLoading(false);
      if (session)
        console.log('session:', session);
      else 
        console.log('no session');
      refreshSpotifyToken(setSpotifyToken);

    };

    const convertSpotifyUrlToUri = (url: string): string | null => {
      const match = url.match(/track\/([a-zA-Z0-9]+)/);
      return match ? `spotify:track:${match[1]}` : null;
    };

    const fetchEdition = async (id: string) => {
      try {
        const randomRequestKey = Math.random().toString(36).substring(7);
        const response = await pb
          .collection("editions")
          .getOne<Edition>(id, { requestKey: randomRequestKey });

        if (response.date) {
          const formattedDate = new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(new Date(response.date));
          setDate(formattedDate);
        }

        setEditionTitle(response.title);
        setEditionGif(response.edition_gif);
        setPageSong(convertSpotifyUrlToUri(response.home_song));

        if (response.blurb) {
          const sanitizedHtml = DOMPurify.sanitize(response.blurb);
          setBlurb(sanitizedHtml);
        }
      } catch (error) {
        console.error("Failed to fetch edition:", error);
      }
    };

    // initializeApp();
    if (editionId) {
      initializeApp();
      fetchEdition(editionId);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-5 justify-center items-center h-screen w-screen">
        <Progress isIndeterminate aria-label="Loading..." className="max-w-md" size="sm" />
        <h3 className="text-2xl">Loading...</h3>
      </div>
    );
  }


  return (
    <div className="p-4">
      <div className="p-2 flex flex-col items-center justify-center">
        <h3 className="text-8xl mb-4 font-linebeam text-glow-blue-400 uppercase">Nerd Trivia 3000</h3>
        <p className="text-3xl mb-4">{date}</p>
        <h1 className="text-5xl">{editionTitle}</h1>
        {editionGif && (
          <Image
            src={editionGif}
            alt="Edition GIF"
            width="600"
            className="my-16"
          />
        )}
        {blurb && (
          <div
            className="text-3xl mb-8 w-3/4 text-center"
            dangerouslySetInnerHTML={{ __html: blurb }}
          />
        )}
        {spotifyToken && (
          <div>
            <SpotifyPlayer token={spotifyToken} song={pageSong} songs={null} />
          </div>
        )}
      </div>
    </div>
  );
}
