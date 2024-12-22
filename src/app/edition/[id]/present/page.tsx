"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PocketBase from "pocketbase";
import { Image } from "@nextui-org/react";
import DOMPurify from "dompurify"; // Import the sanitizer
import SpotifyPlayer from "@/components/SpotifyPlayer";
import { useHotkeys } from "react-hotkeys-hook";

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
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const [date, setDate] = useState<string | null>(null);
  const [editionTitle, setEditionTitle] = useState<string | null>(null);
  const [editionGif, setEditionGif] = useState<string | null>(null);
  const [blurb, setBlurb] = useState<string | null>(null);
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [pageSong, setPageSong] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);



  const refreshSpotifyAuth = async () => {
    // Check if a valid token exists in localStorage
    const savedToken = localStorage.getItem("spotifyAuthToken");
    const savedTokenExpiry = localStorage.getItem("spotifyAuthTokenExpiry");
    const savedRefreshToken = localStorage.getItem("spotifyAuthRefreshToken");

    // if token is expired, refresh it
    if (savedToken && savedTokenExpiry && savedRefreshToken) {
      console.log('Token:', savedToken);
      console.log('Expiry:', savedTokenExpiry);
      console.log('Refresh Token:', savedRefreshToken);
      const expiry = parseInt(savedTokenExpiry);
      const now = Date.now();
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
            localStorage.setItem("spotifyAuthTokenExpiry", (Date.now() + data.expires_in * 1000).toString());
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
          provider: 'spotify',
          requestKey: randomRequestKey,
          scopes: [
            "streaming user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-modify-private user-read-playback-position user-read-email"
          ],
        });

        console.log("authData", authData);

        // Save token and user info in localStorage
        if (authData.meta?.accessToken) {
          localStorage.setItem("spotifyAuthToken", authData.meta.accessToken);
          localStorage.setItem("spotifyAuthRefreshToken", authData.meta.refreshToken);
          localStorage.setItem("spotifyAuthTokenExpiry", authData.meta.expiry);
          console.log("Authenticated with Spotify successfully:", authData.meta.name);
        }

      } catch (error) {
        console.error("Failed to refresh Spotify auth state:", error);
      }
    }
  }


  useHotkeys("ctrl+ArrowRight", () => {
    // Navigate to the first round, aka adding /round/1 to the URL
    window.location.href = `/edition/${editionId}/present/round/1`;
  });

  useEffect(() => {

      refreshSpotifyAuth();

      const convertSpotifyUrlToUri = (url: string): string | null => {
        const match = url.match(/track\/([a-zA-Z0-9]+)/); // Extract the track ID using a regex
        return match ? `spotify:track:${match[1]}` : null; // Return the Spotify URI or null if invalid
      };


      const fetchEdition = async () => {
        try {
          const randomRequestKey = Math.random().toString(36).substring(7);
          const response = await pb
            .collection("editions")
            .getOne<Edition>(`${editionId}`, { requestKey: randomRequestKey });

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

          // Sanitize and set HTML content
          if (response.blurb) {
            const sanitizedHtml = DOMPurify.sanitize(response.blurb); // Clean the HTML
            setBlurb(sanitizedHtml);
          }
        } catch (error) {
          console.error("Failed to fetch edition:", error);
        }
      };

      if (editionId) {
        fetchEdition();
      }
  }, []);


  return (
    <div className="p-10 flex flex-col items-center justify-center">
      <h3 className="text-4xl mb-4">Nerd Trivia: {date}</h3>
      <h1 className="text-5xl">{editionTitle}</h1>
      {editionGif && (
        <Image
          src={editionGif}
          alt="Edition GIF"
          width="800"
          className="my-16"
        />
      )}
      {blurb && (
        <div
          className="text-3xl"
          dangerouslySetInnerHTML={{ __html: blurb }}
        />
      )}
      {spotifyToken && (
        <div>
          <SpotifyPlayer token={spotifyToken} song={pageSong} songs={null} />
        </div>
      )}
    </div>
  );
}
