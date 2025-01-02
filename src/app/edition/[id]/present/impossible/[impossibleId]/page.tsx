"use client"

import React, { use } from 'react';

import { useEffect, useState, useRef } from 'react';
import { useParams } from "next/navigation";
import Pocketbase from "pocketbase";
import Image from 'next/image';
import DOMPurify from "dompurify"; // Import the sanitizer
import SpotifyPlayer from "@/components/SpotifyPlayer";
import useEmblaCarousel from 'embla-carousel-react'
import Fade from 'embla-carousel-fade'
import { useHotkeys } from "react-hotkeys-hook";
import DynamicText from "@/components/DynamicText"; // Correct for default exports
import { Spinner } from '@nextui-org/react';
import { useRouter } from "next/navigation";
import { set } from 'lodash';
import local from 'next/font/local';
import { usePrimeDirectives } from "@/hooks/usePrimeDirectives";
import ShallNotPass from "@/components/ShallNotPass";

interface Impossible {
  edition_id: string;
  impossible_number: number;
  intro_gif: string;
  theme: string;
  theme_gif: string;
  point_value: number;
  question_text: string;
  answers: string[];
  answer_gifs: string[];
  spotify_ids: string[];
  is_active: boolean;
}

export default function Impossible() {
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const router = useRouter();
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const impossibleId = typeof params?.impossibleId === "string" ? params.impossibleId : undefined;
  const [introGif, setIntroGif] = useState<string | null>(null);
  const [theme, setTheme] = useState<string | null>(null);
  const [themeGif, setThemeGif] = useState<string | null>(null);
  const [pointValue, setPointValue] = useState<number | null>(null);
  const [questionText, setQuestionText] = useState<string>("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [answerGifs, setAnswerGifs] = useState<string[]>([]);
  const [songs, setSongs] = useState<string[]>([]);
  const [songArtists, setSongArtists] = useState<string[]>([]);
  const [songTitles, setSongTitles] = useState<string[]>([]);
  const [songAlbumArts, setSongAlbumArts] = useState<string[]>([]);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [googleAuth, setGoogleAuth] = useState<boolean>(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false);


  useHotkeys("ctrl+ArrowRight", () => {
    localStorage.setItem("scoreBoardOrigin", `${impossibleId}`);
    router.push(`/edition/${editionId}/present/scoreboard`);
  });


  useHotkeys("ctrl+ArrowLeft", () => {
    // If Impossible 1, go to round 1 question 5, if Impossible 2 go to round 2 question 5
    if (impossibleId === "1") {
      router.push(`/edition/${editionId}/present/round/1/question/5`);
    } else {
      router.push(`/edition/${editionId}/present/round/2/question/5`);
    }
  });


  const questionRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (questionRef.current) {
      const container = questionRef.current;
      const parentWidth = container.offsetWidth;
      const parentHeight = container.offsetHeight;

      // Start with a large font size and reduce it until the text fits
      let fontSize = 100; // Initial font size
      container.style.fontSize = `${fontSize}px`;

      while (
        container.scrollWidth > parentWidth ||
        container.scrollHeight > parentHeight
      ) {
        fontSize -= 1; // Reduce font size
        container.style.fontSize = `${fontSize}px`;
      }
    }
  }, [questionText]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false }, [Fade()])

  useHotkeys("left", () => {
    emblaApi?.scrollPrev()
  });

  useHotkeys("right", () => {
    emblaApi?.scrollNext()
  });

  useEffect(() => {
    if (emblaApi) {
      console.log(emblaApi.slideNodes()) // Access API
    }
  }, [emblaApi])

  const refreshSpotifyAuth = async () => {
    console.log("refreshSpotifyAuth called");
    // Check if a valid token exists in localStorage
    const savedToken = localStorage.getItem("spotifyAuthToken");
    console.log("Saved token from localStorage:", savedToken);

    const savedTokenExpiry = localStorage.getItem("spotifyAuthTokenExpiry");
    const savedRefreshToken = localStorage.getItem("spotifyAuthRefreshToken");

    // if token is expired, refresh it
    if (savedToken && savedTokenExpiry && savedRefreshToken) {
      console.log('Token:', savedToken);
      console.log('Expiry:', savedTokenExpiry);
      console.log('Refresh Token:', savedRefreshToken);
      const expiry = parseInt(savedTokenExpiry);
      const now = Date.now();
      console.log('expiry:', expiry);
      console.log('now:', now);
      if (expiry < now) {
        console.log('expiret! gotta refresh!')
        try {
          const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${btoa(`${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET}`)}`,

            },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: savedRefreshToken,
              client_id: `${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}`
            }),
          });

          if (response.ok) {
            const data = await response.json();
            localStorage.setItem("spotifyAuthToken", data.access_token);
            setSpotifyToken(data.access_token);
            localStorage.setItem("spotifyAuthTokenExpiry", (Date.now() + data.expires_in * 1000).toString());
            localStorage.setItem("spotifyAuthRefreshToken", data.refresh_token);
            console.log("Refreshed Spotify token successfully:", data.access_token);
          } else {
            console.error("Failed to refresh Spotify token:", await response.json());
          }
        } catch (error) {
          console.error("Failed to refresh Spotify token:", error);
          // if error contains "revoked", clear the token and do the oAuth flow again
          if (console.error.toString().includes("revoked")) {
            console.log("Token was revoked, clearing local storage");
            localStorage.removeItem("spotifyAuthToken");
            localStorage.removeItem("spotifyAuthTokenExpiry");
            localStorage.removeItem("spotifyAuthRefreshToken");
            refreshSpotifyAuth();
          }
        }
      } else {
        console.log("Token is still valid");
        setSpotifyToken(savedToken);
      }
    } else {
      // If no valid token, initiate OAuth
      try {
        const randomRequestKey = Math.random().toString(36).substring(7);
        const authData = await pb.collection("users").authWithOAuth2({
          requestKey: randomRequestKey,
          provider: "spotify",
          scopes: [
            "streaming user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-modify-private user-read-playback-position user-read-email"
          ],
        });

        console.log("authData", authData);

        // Save token and user info in localStorage
        if (authData.meta?.accessToken) {
          localStorage.setItem("spotifyAuthToken", authData.meta.accessToken);
          setSpotifyToken(authData.meta.accessToken);
          localStorage.setItem("spotifyAuthRefreshToken", authData.meta.refreshToken);
          localStorage.setItem("spotifyAuthTokenExpiry", authData.meta.expiry);
          console.log("Authenticated with Spotify successfully:", authData.meta.name);
        }

      } catch (error) {
        console.error("Failed to refresh Spotify auth state:", error);
      }
    }
  }

  // // function to grab the album art, song name, and artist name from the Spotify API
  const getSongsInfo = async () => {
    // Temporary arrays to collect the song data
    const artists: string[] = [];
    const titles: string[] = [];
    const albumArts: string[] = [];

    // Iterate over each song URL in the `songs` array
    for (const song of songs) {
      const songId = song.split("/track/")[1].split("?")[0]; // Extract the song ID from the Spotify URL
      try {
        const response = await fetch(`https://api.spotify.com/v1/tracks/${songId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${spotifyToken}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Song info:", data);

          // Collect song information
          artists.push(data.artists[0].name);
          titles.push(data.name);
          albumArts.push(data.album.images[0].url);
        } else {
          console.error("Failed to fetch song info:", await response.json());
        }
      } catch (error) {
        console.error("Error fetching song info:", error);
      }
    }

    // Update state with the collected data
    setSongArtists(artists);
    setSongTitles(titles);
    setSongAlbumArts(albumArts);
  };


  useEffect(() => {

    const initializeApp = async () => {
      if (!pb.authStore.isValid) {
        console.log("Not authenticated with Pocketbase.");
        setLoading(false);
        setGoogleAuth(false);
        return;
      }

      console.log("Authenticated with Pocketbase successfully.");
      const authData = localStorage.getItem("pocketbase_auth");

      if (!authData) {
        console.error("No auth data found.");
        setLoading(false);
        setGoogleAuth(false);
        setIsAdmin(false);
        return;
      }

      const parsedAuth = JSON.parse(authData);
      if (!parsedAuth.is_admin) {
        console.log("Not an admin.");
        setLoading(false);
        setGoogleAuth(false);
        setIsAdmin(false);
        return;
      }

      console.log("Admin authenticated.");
      setIsAdmin(true);
      setGoogleAuth(true);
      refreshSpotifyAuth();
    };


    const convertSpotifyUrlToUri = (url: string): string | null => {
      const match = url.match(/track\/([a-zA-Z0-9]+)/); // Extract the track ID using a regex
      return match ? `spotify:track:${match[1]}` : null; // Return the Spotify URI or null if invalid
    };

    const fetchQuestion = async () => {
      try {
        const randomRequestKey = Math.random().toString(36).substring(7);
        pb.autoCancellation(false);
        const response = await pb
          .collection("impossible_rounds")
          .getFirstListItem<Impossible>(`edition_id = "${editionId}" && impossible_number = ${impossibleId}`);

        console.log("Question fetched:", response);

        setIntroGif(response.intro_gif);
        setTheme(response.theme);
        setThemeGif(response.theme_gif);

        const sanitizedQuestionText = DOMPurify.sanitize(response.question_text); // Clean the HTML
        setQuestionText(sanitizedQuestionText);

        // loop through response.answers (a JSON object) and sanitize each answer and set it in the state
        const sanitizedAnswers = response.answers.map((answer) => DOMPurify.sanitize(answer));
        setAnswers(sanitizedAnswers);

        setAnswerGifs(response.answer_gifs);

        console.log('response.spotify_ids:', response.spotify_ids);

        if (Array.isArray(response.spotify_ids)) {
          setSongs(response.spotify_ids);
        } else {
          const ids = Object.values(response.spotify_ids).map((id) => id as string);
          console.log('ids:', ids); // Ensure ids are correctly parsed
          setSongs(ids);
        }

        setIsActive(response.is_active);

      } catch (error) {
        console.error("Failed to fetch edition:", error);
      }
    };

    if (editionId) {
      initializeApp();
      fetchQuestion();
      refreshSpotifyAuth();
    }

  }, []);

  useEffect(() => {
    if (songs) {
      getSongsInfo();
    }
  }, [songs]);


  // if (!isAdmin) {
  //   return <ShallNotPass />;
  // }

  return (
    <div className="overflow-y-hidden h-dvh">
      <div className="flex justify-between p-4">
        <h1 className="py-4 pl-4 text-2xl">Impossible Question {impossibleId} </h1>
        {spotifyToken && (
          <div>
            <SpotifyPlayer token={spotifyToken} songs={songs} song={null} />
          </div>
        )}
      </div>
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          <div className="embla__slide p-4 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
            <h3 className="text-6xl">IMPOSSIBLE QUESTION {impossibleId} </h3>
            <div className="flex items-center justify-center w-full grow relative">
              {introGif ? (
                <Image src={introGif} alt="Intro GIF" fill={true} unoptimized={true} className="h-full w-auto object-contain" />
              ) : (
                <Spinner size="lg" />
              )}
            </div>
          </div>
          <div className="embla__slide p-4 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
            <h3 className="text-6xl">{theme}</h3>
            <div className="flex items-center justify-center w-full grow relative">
              {themeGif ? (
                <Image src={themeGif} alt="Theme GIF" fill={true} unoptimized={true} className="h-full w-auto object-contain" />
              ) : (
                <Spinner size="lg" />
              )}
            </div>
          </div>
          <div className="embla__slide p-4 h-[calc(100vh-4rem)]">
            <DynamicText
              html={questionText}
              maxFontSize={80}
              className="p-8 h-[calc(100vh-4rem)]"
            />
          </div>
          {answers.map((answer, index) => (
            <div className="embla__slide p-4 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4" key={index}>
              <h3 className="text-6xl flex justify-items-center" dangerouslySetInnerHTML={{ __html: answer }}></h3>
              <div className="flex items-center justify-center w-full grow relative">
                {answerGifs[index] ? (
                  <Image src={answerGifs[index]} className="h-full w-auto object-contain" alt="Answer GIF" fill={true} unoptimized={true} />
                ) : (
                  <p>Loading GIF...</p>
                )}
              </div>
            </div>
          ))}
          <div className="embla__slide p-8 h-[calc(100vh-4rem)] flex items-center justify-center gap-10">
            {songAlbumArts.length > 0 ? (
              songAlbumArts.map((albumArt, index) => (
                <div key={index} className="song-info flex flex-col gap-4 items-center">
                  <Image src={albumArt} alt={`Album Art for ${songTitles[index]}`} width="600" height="600" />
                  <h3 className="text-3xl">"{songTitles[index]}" by {songArtists[index]}</h3>
                </div>
              ))
            ) : (
              <Spinner size="lg" />
            )}

          </div>
        </div>
      </div>
    </div>
  );
}