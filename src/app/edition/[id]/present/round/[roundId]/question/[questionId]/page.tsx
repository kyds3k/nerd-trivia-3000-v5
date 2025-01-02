"use client"

import React, { use } from 'react';
import { useEffect, useState, useRef } from 'react';
import { useEffectOnce } from 'react-use';
import { useParams } from "next/navigation";
import Pocketbase from "pocketbase";
// import { Image } from "@nextui-org/react";
import Image from 'next/image';
import DOMPurify from "dompurify"; // Import the sanitizer
import SpotifyPlayer from "@/components/SpotifyPlayer";
import useEmblaCarousel from 'embla-carousel-react'
import Fade from 'embla-carousel-fade'
import { useHotkeys } from "react-hotkeys-hook";
import DynamicText from "@/components/DynamicText"; // Correct for default exports
import { Spinner } from '@nextui-org/react';
import { useRouter } from "next/navigation";
import Typed from "typed.js";
import { usePrimeDirectives } from "@/hooks/usePrimeDirectives";
import ShallNotPass from '@/components/ShallNotPass';

interface Question {
  edition_id: string;
  round_number: number;
  question_number: number;
  question_text: string;
  answer: string;
  answer_gif: string;
  is_banthashit_question: boolean;
  bantha_answer: string;
  bantha_answer_gif: string;
  song: string;
  bonus_answers: string[];
  is_active: boolean;
}

export default function Question() {
  const router = useRouter();
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const questionId = typeof params?.questionId === "string" ? params.questionId : undefined;
  const roundId = typeof params?.roundId === "string" ? params.roundId : undefined;
  const [questionText, setQuestionText] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [answerGif, setAnswerGif] = useState<string | null>(null);
  const [isBanthaShitQuestion, setIsBanthaShitQuestion] = useState<boolean | null>(null);
  const [banthaAnswer, setBanthaAnswer] = useState<string>("");
  const [banthaAnswerGif, setBanthaAnswerGif] = useState<string | null>(null);
  const [song, setSong] = useState<string | null>(null);
  const [songArtist, setSongArtist] = useState<string | null>(null);
  const [songTitle, setSongTitle] = useState<string | null>(null);
  const [songAlbumArt, setSongAlbumArt] = useState<string | null>(null);
  const [bonusAnswers, setBonusAnswers] = useState<string[] | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [questionActive, setQuestionActive] = useState<boolean>(false);
  const [loadingQuote, setLoadingQuote] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [googleAuth, setGoogleAuth] = useState<boolean>(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false);


  // Use the hook and pass the callback for question_toggle
  // Assuming active might be a string, convert it to a boolean
  usePrimeDirectives(
    "directives",
    editionId,
    null,
    (message, team) => {
      console.log("Received message:", message, "for team:", team);
      // Handle notification messages
    },
    (active) => {
      console.log("Question active status:", active);
      setQuestionActive(active); // Ensure the type matches
    }
  );


  useHotkeys("ctrl+ArrowRight", () => {
    const questionIdStr = questionId!; // Assert that questionId is not undefined
    if (questionIdStr === "5" && (roundId === "1" || roundId === "2")) {
      router.push(`/edition/${editionId}/present/impossible/${roundId}`);
    } else if (questionIdStr === "5" && roundId === "3") {
      localStorage.setItem("scoreBoardOrigin", "round3");
      router.push(`/edition/${editionId}/present/scoreboard`);
    } else {
      // Navigate to the next question in that round
      router.push(
        `/edition/${editionId}/present/round/${roundId}/question/${parseInt(questionIdStr) + 1}`
      );
    }
  });

  useHotkeys("ctrl+ArrowLeft", () => {
    const questionIdStr = questionId!; // Assert that questionId is not undefined
    // if questionId is 1, go to the previous round page. if questionId is 2-5, go to the previous question page.
    if (questionIdStr === "1") {
      router.push(`/edition/${editionId}/present/round/${parseInt(roundId!)}`);
    } else {
      router.push(
        `/edition/${editionId}/present/round/${roundId}/question/${parseInt(questionIdStr) - 1}`
      );
    }
  });

  const getLoadingQuote = async () => {
    try {
      pb.autoCancellation(false);
      const loadingQuotes = await pb.collection("loading_quotes").getFullList();
      const listCount = loadingQuotes.length;
      const randomIndex = Math.floor(Math.random() * listCount);
      setLoadingQuote(loadingQuotes[randomIndex].quote);
    } catch (error) {
      console.error("Failed to get loading quote:", error);
    }
  };

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

            console.log("Token was revoked, clearing local storage");
            localStorage.removeItem("spotifyAuthToken");
            localStorage.removeItem("spotifyAuthTokenExpiry");
            localStorage.removeItem("spotifyAuthRefreshToken");
            refreshSpotifyAuth();

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

  // function to grab the album art, song name, and artist name from the Spotify API
  const getSongInfo = async (song: string) => {
    const songId = song.split(":")[2];
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
      setSongArtist(data.artists[0].name);
      setSongTitle(data.name);
      setSongAlbumArt(data.album.images[0].url);
    } else {
      console.error("Failed to fetch song info:", await response.json());
    }
  }

  const convertSpotifyUrlToUri = (url: string): string | null => {
    const match = url.match(/track\/([a-zA-Z0-9]+)/); // Extract the track ID using a regex
    return match ? `spotify:track:${match[1]}` : null; // Return the Spotify URI or null if invalid
  };


  const fetchQuestion = async () => {
    try {
      pb.autoCancellation(false);
      const response = await pb
        .collection("questions")
        .getFirstListItem<Question>(`edition_id = "${editionId}" && question_number = "${questionId}" && round_number = "${roundId}"`);

      console.log("Question fetched:", response);

      setAnswerGif(response.answer_gif);
      setIsBanthaShitQuestion(response.is_banthashit_question);
      setBanthaAnswerGif(response.bantha_answer_gif);
      setSong(response.song);
      setBonusAnswers(response.bonus_answers);
      setIsActive(response.is_active);

      // Sanitize and set HTML content
      if (response.question_text) {
        const sanitizedQuestion = DOMPurify.sanitize(response.question_text); // Clean the HTML
        setQuestionText(sanitizedQuestion);
        setQuestionActive(response.is_active);
      }

      if (response.answer) {
        const sanitizedAnswer = DOMPurify.sanitize(response.answer); // Clean the HTML
        setAnswer(sanitizedAnswer);
      }

      if (response.bantha_answer) {
        const sanitizedBanthaAnswer = DOMPurify.sanitize(response.bantha_answer); // Clean the HTML
        setBanthaAnswer(sanitizedBanthaAnswer);
      }

      setBanthaAnswerGif(response.bantha_answer_gif);

      setSong(convertSpotifyUrlToUri(response.song));

      if (response.bonus_answers) {
        const sanitizedBonusAnswers = response.bonus_answers.map((answer) => DOMPurify.sanitize(answer));
        setBonusAnswers(sanitizedBonusAnswers);
      }

      setIsActive(response.is_active);

    } catch (error) {
      console.error("Failed to fetch edition:", error);
    }
  };

  useEffect(() => {

    const initializeApp = async () => {
      if (!pb.authStore.isValid) {
        console.error("Not authenticated with Pocketbase.");
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



      if (editionId) {
        //initializeApp();
      }
    };

    setIsAdmin(true);
    fetchQuestion();
    refreshSpotifyAuth();

  }, []);

  useEffect(() => {
    if (song && isAdmin) {
      getSongInfo(song);
    }
  }, [song, isAdmin]);

  useEffectOnce(() => {
    getLoadingQuote();
  });

  const el = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (el.current && questionActive && questionText) {
      const typed = new Typed(el.current, {
        strings: [questionText],
        typeSpeed: 20,
        backSpeed: 30,
        showCursor: false,
        loop: false,
      });

      return () => typed.destroy(); // Cleanup Typed.js instance on unmount or rerun
    }
  }, [questionText, questionActive]);

  // if (!isAdmin) {
  //   return <ShallNotPass />;
  // }

  return (
    <div>
      <div className="flex justify-between p-4">
        <h1 className="text-2xl">
          Round {roundId} Question {questionId} -
          <span className={`${roundId === "3" ? "font-reboot text-glow-blue-600" : ""} px-2 inline-block`}>{Number(questionId) * (roundId === "3" ? 200 : 100)}</span> points
        </h1>

        {spotifyToken && (
          <div>
            <SpotifyPlayer token={spotifyToken} song={song} songs={null} />
          </div>
        )}
      </div>
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          <div className="embla__slide p-4 h-[calc(100vh-4rem)]">
            {questionActive ? (
              // <span ref={el} className="text-2xl"></span>
              <DynamicText
                html={questionText}
                maxFontSize={80}
                className="p-8 h-[calc(100vh-4rem)] flex flex-col items-center justify-start"
              />
            ) : (
              <p className="text-2xl flex">{loadingQuote}</p>
            )}
          </div>
          <div className="embla__slide p-4 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
            <div className="p-8 flex items-center justify-center">
              <h3
                className="text-6xl flex justify-items-center"
                dangerouslySetInnerHTML={{ __html: answer }}
              ></h3>
            </div>
            <div className="flex items-center justify-center w-full grow relative">
              {answerGif ? (
                <Image
                  src={answerGif}
                  alt="Answer GIF"
                  fill={true}
                  unoptimized={true}
                  className="object-contain"
                />
              ) : (
                <p>Loading GIF...</p>
              )}
            </div>
          </div>

          {isBanthaShitQuestion && (
            <div className="embla__slide p-4 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
              <div className="p-8 flex items-center justify-center">
                <h3 className="text-6xl flex justify-center" dangerouslySetInnerHTML={{ __html: banthaAnswer }}></h3>
              </div>
              <div className="flex items-center justify-center w-full">
                {banthaAnswerGif ? (
                  <Image className="h-full w-auto object-contain" src={banthaAnswerGif} alt="Bantha Answer GIF" unoptimized={true} fill={true} />
                ) : (
                  <p>Loading GIF...</p>
                )}
              </div>
            </div>
          )}
          <div className="embla__slide p-8 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
            {songAlbumArt ? (
              <>
                <Image src={songAlbumArt} alt="Song Album Art" width="600" height="600" />
                <h3 className="text-3xl">"{songTitle}" by {songArtist}</h3>
              </>
            ) : (
              <>
                <Spinner size="lg" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}