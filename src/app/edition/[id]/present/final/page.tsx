"use client"

import React, { use } from 'react';
import { useEffect, useState, useRef } from 'react';
import { useParams } from "next/navigation";
import pb from "@/lib/pocketbase";
import { Image } from "@nextui-org/react";
import DOMPurify from "dompurify"; // Import the sanitizer
import SpotifyPlayer from "@/components/SpotifyPlayer";
import useEmblaCarousel from 'embla-carousel-react'
import Fade from 'embla-carousel-fade'
import { useHotkeys } from "react-hotkeys-hook";
import DynamicText from "@/components/DynamicText"; // Correct for default exports
import { Spinner } from '@nextui-org/react';
import { useRouter } from "next/navigation";

interface Question {
  edition_id: string;
  question_text: string;
  answer: string;
  final_answer_gif: string;
  final_song: string;
  end_gif_1: string;
  end_gif_2: string;
  is_active: boolean;
}

export default function Question() {
  const router = useRouter();
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const [questionText, setQuestionText] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [answerGif, setAnswerGif] = useState<string | null>(null);
  const [song, setSong] = useState<string | null>(null);
  const [songArtist, setSongArtist] = useState<string | null>(null);
  const [songTitle, setSongTitle] = useState<string | null>(null);
  const [songAlbumArt, setSongAlbumArt] = useState<string | null>(null);
  const [endGif1, setEndGif1] = useState<string | null>(null);
  const [endGif2, setEndGif2] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);


  useHotkeys("ctrl+ArrowLeft", () => {
    router.push(`/edition/${editionId}/present/wager/`);
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

  useEffect(() => {
      refreshSpotifyAuth();
      

      const convertSpotifyUrlToUri = (url: string): string | null => {
        const match = url.match(/track\/([a-zA-Z0-9]+)/); // Extract the track ID using a regex
        return match ? `spotify:track:${match[1]}` : null; // Return the Spotify URI or null if invalid
      };


      const fetchQuestion = async () => {
        try {
          pb.autoCancellation(false);
          const response = await pb
            .collection("final_rounds")
            .getFirstListItem<Question>(`edition_id = "${editionId}"`);

          console.log("Question fetched:", response);



          setAnswerGif(response.final_answer_gif);
          setIsActive(response.is_active);

          // Sanitize and set HTML content
          if (response.question_text) {
            const sanitizedQuestion = DOMPurify.sanitize(response.question_text); // Clean the HTML
            setQuestionText(sanitizedQuestion);
          }

          if (response.answer) {
            const sanitizedAnswer = DOMPurify.sanitize(response.answer); // Clean the HTML
            setAnswer(sanitizedAnswer);
          }

          setSong(convertSpotifyUrlToUri(response.final_song));

          setEndGif1(`https://nerdtriviabucket.s3.us-east-1.amazonaws.com/hvunkxgg0yziid1/u215tr37ub999gz/${response.end_gif_1}`);
          setEndGif2(`https://nerdtriviabucket.s3.us-east-1.amazonaws.com/hvunkxgg0yziid1/u215tr37ub999gz/${response.end_gif_2}`);

          setIsActive(response.is_active);

        } catch (error) {
          console.error("Failed to fetch edition:", error);
        }
      };

      if (editionId) {
        fetchQuestion();
      }
  }, []);

  useEffect(() => {
    if (song) {
      getSongInfo(song);
    }
  }, [song]);

  return (
    <div>
      <h1 className="py-4 pl-4 text-2xl">FINAL QUESTION</h1>
      {spotifyToken && (
        <div>
          <SpotifyPlayer token={spotifyToken} song={song} songs={null} />
        </div>
      )}
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          <div className="embla__slide p-4 h-[calc(100vh-4rem)]">
            <DynamicText
              html={questionText}
              maxFontSize={80}
              className="p-8 h-[calc(100vh-4rem)] flex flex-col items-center justify-start"
            />
          </div>
          <div className="embla__slide p-4 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
            <div className="p-8 flex items-center justify-center">
              <h3 className="text-6xl flex justify-items-center" dangerouslySetInnerHTML={{ __html: answer }}></h3>
            </div>
            <div className="flex items-center justify-center w-full">
              {answerGif ? (
                <Image src={answerGif} alt="Answer GIF" width="800" />
              ) : (
                <>
                  <Spinner size="lg" />
                </>
              )}
            </div>
          </div>
          <div className="embla__slide p-8 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
            {songAlbumArt ? (
              <>
                <Image src={songAlbumArt} alt="Song Album Art" width="600" />
                <h3 className="text-3xl">"{songTitle}" by {songArtist}</h3>
              </>
            ) : (
              <>
                <Spinner size="lg" />
              </>
            )}
          </div>
          <div className="embla__slide p-4 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
            <div className="flex items-center justify-center w-full">
              {endGif1 ? (
                <Image src={endGif1} alt="End GIF 1" width="1000" />
              ) : (
                <>
                  <Spinner size="lg" />
                </>
              )}
            </div>
          </div>                  
          <div className="embla__slide p-4 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
            <div className="flex items-center justify-center w-full">
              {endGif2 ? (
                <Image src={endGif2} alt="End GIF 2" width="1000" />
              ) : (
                <>
                  <Spinner size="lg" />
                </>
              )}
            </div>
          </div>                            
        </div>
      </div>
    </div>
  );
}