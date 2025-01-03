"use client"

import React, { use } from 'react';
import { useEffect, useState, useRef } from 'react';
import { useEffectOnce } from 'react-use';
import { useParams } from "next/navigation";
import Pocketbase from "pocketbase";
//import { Image } from "@nextui-org/react";
import Image from 'next/image';
import DOMPurify from "dompurify"; // Import the sanitizer
import SpotifyPlayer from "@/components/SpotifyPlayer";
import useEmblaCarousel from 'embla-carousel-react'
import Fade from 'embla-carousel-fade'
import { useHotkeys } from "react-hotkeys-hook";
import DynamicText from "@/components/DynamicText"; // Correct for default exports
import { Spinner } from '@nextui-org/react';
import { useRouter } from "next/navigation";
import { usePrimeDirectives } from "@/hooks/usePrimeDirectives";

interface Question {
  edition_id: string;
  question_text: string;
  answer: string;
  final_answer_gif: string;
  final_song: string;
  end_gif_1: string;  end_gif_2: string;
  is_active: boolean;
}

export default function Question() {
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const router = useRouter();
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const [song, setSong] = useState<string | null>(null);
  const [songArtist, setSongArtist] = useState<string | null>(null);
  const [songTitle, setSongTitle] = useState<string | null>(null);
  const [songAlbumArt, setSongAlbumArt] = useState<string | null>(null);
  const [endGif1, setEndGif1] = useState<string | null>(null);
  const [endGif2, setEndGif2] = useState<string | null>(null);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);


  // Use the hook and pass the callback for question_toggle
  // Assuming active might be a string, convert it to a boolean
  usePrimeDirectives(
    "directives",
    editionId,
    null,
    (message, team) => {
      console.log("Received message:", message, "for team:", team);
      // Handle notification messages
    }
  );

  useHotkeys("ctrl+ArrowLeft", () => {
    router.push(`/edition/${editionId}/present/final/`);
  });


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

    const fetchQuestion = async () => {
      try {
        pb.autoCancellation(false);
        const response = await pb
          .collection("final_rounds")
          .getFirstListItem<Question>(`edition_id = "${editionId}"`);

        console.log("Question fetched:", response);

        // Sanitize and set HTML content

        setSong(convertSpotifyUrlToUri(response.final_song));

        setEndGif1(`https://nerdtriviabucket.s3.us-east-1.amazonaws.com/hvunkxgg0yziid1/u215tr37ub999gz/${response.end_gif_1}`);
        setEndGif2(`https://nerdtriviabucket.s3.us-east-1.amazonaws.com/hvunkxgg0yziid1/u215tr37ub999gz/${response.end_gif_2}`);


      } catch (error) {
        console.log("Failed to fetch edition:", error);
      }
    };

    const convertSpotifyUrlToUri = (url: string): string | null => {
      const match = url.match(/track\/([a-zA-Z0-9]+)/); // Extract the track ID using a regex
      return match ? `spotify:track:${match[1]}` : null; // Return the Spotify URI or null if invalid
    };
    
    if (editionId) {
      fetchQuestion();
      refreshSpotifyAuth();
    }
  }, []);

  useEffect(() => {
    if (song) {
      getSongInfo(song);
    }
  }, [song]);

  return (
    <div className="h-dvh overflow-y-hidden">
      <div className="flex justify-between p-4">
        <h1 className="py-4 pl-4 text-2xl">THE END</h1>
        {spotifyToken && (
          <div>
            <SpotifyPlayer token={spotifyToken} song={song} songs={null} />
          </div>
        )}
      </div>
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          <div className="embla__slide p-4 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
            <div className="flex items-center justify-center w-full">
              {endGif1 ? (
                <Image src={endGif1} className="object-contain" alt="End GIF 1" fill={true} unoptimized={true} />
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
                <Image className="object-contain" src={endGif2} alt="End GIF 2" fill={true} unoptimized={true} />
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