"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@nextui-org/button";
import { useHotkeys } from "react-hotkeys-hook";
import SpotTimer from "@/components/SpotTimer";

interface SpotifyPlayerProps {
  token: string | null;
  song: string | null;
  songs: string[] | null;
}

declare global {
  namespace Spotify {
    interface Player {
      togglePlay: () => Promise<void>;
      play: (items?: string | string[], offset?: number) => Promise<void>;
      nextTrack: () => Promise<void>;
      setUri: (uri: { uri: string }) => Promise<void>;
      removeFromQueue: (position: number, count: number) => Promise<void>;
      getCurrentState: () => Promise<{ duration: number } | null>;
      pause: () => Promise<void>;
    }
  }
}

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ token, song, songs }) => {
  const playerRef = useRef<Spotify.Player | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [timerExpiry, setTimerExpiry] = useState<Date>(new Date()); // Timer state for SpotTimer
  const [timerStarted, setTimerStarted] = useState<boolean>(false);

  useHotkeys("ctrl+p", () => playSong());
  useHotkeys("ctrl+t", () => togglePlayback());

  const ensureActivePlayer = async () => {
    if (!deviceId) {
      console.log("Device ID is not available.");
      return;
    }

    try {
      const response = await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_ids: [deviceId], // Activate the device
          play: false, // Set to false to activate without playback
        }),
      });

      if (response.ok) {
        console.log("Player activated successfully.");
      } else {
        console.error("Failed to activate player:", await response.json());
      }
    } catch (error) {
      console.error("Error activating player:", error);
    }
  };

  const getTrackDuration = async (spotifyUri: string | null) => {
    try {
      const trackId = spotifyUri?.split(":")[2];
      const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      return data.duration_ms; // Return duration in milliseconds
    } catch (error) {
      console.error("Error fetching track duration:", error);
      return null;
    }
  };

  const getCombinedTrackDuration = async (spotifyUris: string[] | null): Promise<number> => {
    try {
      if (!spotifyUris || spotifyUris.length === 0) {
        throw new Error("No Spotify URIs provided.");
      }
  
      const totalDuration = await Promise.all(
        spotifyUris.map(async (uri) => {
          // const trackId is everything after "track/" in the URI
          const trackId = uri.match(/track\/([^?]*)/)?.[1] || null;
          try {
            const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
  
            console.log('response: ', response);

            if (!response.ok) {
              throw new Error(`Spotify API error: ${response.status} - ${response.statusText}`);
            }
  
            const data = await response.json();
            return data.duration_ms; // Return duration in milliseconds
          } catch (error) {
            console.error(`Error fetching duration for URI ${uri}:`, error);
            return 0; // Return 0 for errors on specific tracks
          }
        })
      );
  
      // Combine all durations into a single total
      const combinedDuration = totalDuration.reduce((acc, duration) => acc + duration, 0);
      return combinedDuration;
    } catch (error) {
      console.error("Error fetching combined track duration:", error);
      return 0;
    }
  };
  
  

  const playSong = async () => {
    if (playerRef.current && isPlayerReady && (song || songs)) {
      try {
        await ensureActivePlayer();

        const response = await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ uris: song ? [song] : songs }),
          }
        );

        if (response.ok) {
          const songDuration = song ? await getTrackDuration(song) : await getCombinedTrackDuration(songs);
          if (songDuration) {
            const newExpiry = new Date();
            newExpiry.setMilliseconds(newExpiry.getMilliseconds() + songDuration);
            setTimerExpiry(newExpiry); // Update the timer expiry
            setTimerStarted(true); // Start the timer
          }
          console.log("Playing song...");
        } else {
          const errorData = await response.json();
          console.error("Failed to play song:", errorData);
        }
      } catch (error) {
        console.error("Error playing song:", error);
      }
    } else {
      console.error("Player is not ready, or no song URI is provided.");
    }
  };

  const togglePlayback = async () => {
    if (playerRef.current && isPlayerReady) {
      try {
        await playerRef.current.togglePlay();
        console.log("Toggled playback.");
      } catch (error) {
        console.error("Error toggling playback:", error);
      }
    } else {
      console.error("Player is not ready or initialized.");
    }
  };

  useEffect(() => {
    const initializeSpotifySDK = () => {
      if (!(window as any).Spotify) {
        console.error("Spotify SDK not loaded yet.");
        return;
      }

      const player = new Spotify.Player({
        name: "Nerd Trivia 3000 Player",
        getOAuthToken: (cb) => cb(token || ""),
        volume: 1,
      });

      player.addListener("ready", ({ device_id }) => {
        console.log("Player is ready with Device ID:", device_id);
        setDeviceId(device_id);
        setIsPlayerReady(true);
      });

      player.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID has gone offline:", device_id);
        setIsPlayerReady(false);
      });

      player.connect();
      playerRef.current = player;
    };

    const scriptCheckInterval = setInterval(() => {
      if ((window as any).Spotify) {
        clearInterval(scriptCheckInterval);
        initializeSpotifySDK();
      }
    }, 100);

    return () => clearInterval(scriptCheckInterval);
  }, [token]);

  useEffect(() => {
    console.log("Device ID updated:", deviceId);
    ensureActivePlayer();
  }, [deviceId]);

  return (
    <div className="text-xl">
      {/* Pass the updated expiry timestamp to SpotTimer */}
      <SpotTimer expiryTimestamp={timerExpiry} timerStarted={timerStarted} />
      <div className="hidden">
        <Button
          className="mx-4"
          onPress={playSong}
          disabled={!isPlayerReady || !song}
        >
          Play Song
        </Button>
        <Button
          className="mx-4"
          onPress={togglePlayback}
          disabled={!isPlayerReady}
        >
          Toggle Playback
        </Button>
      </div>
    </div>
  );
};

export default SpotifyPlayer;
