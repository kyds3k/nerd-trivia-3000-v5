"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@nextui-org/button";
import { useHotkeys } from "react-hotkeys-hook";
import { set } from "lodash";
import { p } from "framer-motion/client";

interface SpotifyPlayerProps {
  token: string | null; // The token can be null if it's not set yet
  song: string | null; // Spotify track URI (e.g., "spotify:track:TRACK_ID")
  songs: string[] | null;
}

declare global {
  namespace Spotify {
    interface Player {
      togglePlay: () => Promise<void>;
      play: (items?: string | string[], offset?: number) => Promise<void>;
      nextTrack: () => Promise<void>;
      setUri: (uri: { uri: string }) => Promise<void>;
      removeFromQueue: (position: number, count: number) => Promise<void>
    }
  }
}

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ token, song, songs }) => {
  const playerRef = useRef<Spotify.Player | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  
  useHotkeys("ctrl+p", () => playSong());
  useHotkeys("ctrl+t", () => togglePlayback());



  async function ensureActivePlayer() {
    const response = await fetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_ids: [deviceId], // Replace with your player's device ID
        play: false, // This will activate the device without playing
      }),
    });
  
    if (response.ok) {
      console.log("Player activated successfully");
    } else {
      console.error("Failed to activate player:", await response.json());
    }
  }

  const setDevice = async () => {
    if (!deviceId) {
      console.log("Device ID is null. Cannot set device.");
      return;
    }

    console.log("Setting device with Device ID:", deviceId);
    try {
      console.log("HERE I GO!!");
      const response = await fetch(`https://api.spotify.com/v1/me/player`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_ids: [deviceId], // Replace with your player's device ID
          play: false, // This will activate the device without playing
        }),
      });

      if (response.ok) {
        console.log("Device set successfully.");
      } else {
        console.error("Failed to set device:", await response.json());
      }
    } catch (error) {
      console.error("Error setting device:", error);
    }
  };



  const togglePlayback = async () => {
    if (playerRef.current && isPlayerReady) {
      try {
        await playerRef.current.togglePlay();
        console.log("Toggled playback for sure.");
      } catch (error) {
        console.error("Failed to toggle playback:", error);
      }
    } else {
      console.error("Player is not ready or initialized.");
    }
  };
 

  // Function to check playback position every second
  const checkPlaybackPosition = () => {
    if (!playerRef.current) return;
  
    const startTime = Date.now();
  
    const checkState = async () => {
      const state = await playerRef.current?.getCurrentState();
      if (state) {
        const { duration } = state;
        const elapsedTime = Date.now() - startTime;
        const adjustedDuration = duration - 1000;
  
        if (elapsedTime >= adjustedDuration) {
          playerRef.current?.pause();
          return; // Stop the loop after pausing
        }
  
        requestAnimationFrame(checkState); // Continue checking
      }
    };
  
    checkState();
  };
  

  const playSong = async () => {
    if (playerRef.current && isPlayerReady && song || songs) {
      console.log("Song is: ", song);
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
          console.log("playing song");
          // console.log("Song added to queue successfully.");
          // playerRef.current.nextTrack();
          // setIsPlayerReady(true);
          // console.log("Player:");
          // console.log(playerRef.current);
          // checkPlaybackPosition();
        } else {
          const errorData = await response.json();
          console.error("Failed to add song to queue:", errorData);
        }
      } catch (error) {
        console.error("Failed to add song to queue:", error);
      }
    } else {
      console.error("Player is not ready, or no song URI is provided.");
    }
  };


  useEffect(() => {
    console.log("Token passed to SpotifyPlayer:", token);

    const initializeSpotifySDK = () => {
      if (!(window as any).Spotify) {
        console.error("Spotify SDK not loaded yet.");
        return;
      }

      const theToken =
        "BQC1afCQ6M4tykmMMKHrQstvM5PQ4F4Jxq9hi2nyGZxZ4fpL3VHAuWPMWDdeXFEIG1KUFkd4piXFj_ncmnCTDOm-Ez06pJZWic-NvpYGfI2v9POJMJzmprGMwQEvymrWSSz0Em0p_QRVaHiNi3fvVHjCp49Z4e13BXOBemEbng6fTr4_KX3pDtbpsjsuG_2Q6QgAfAOMzqw";
      const effectiveToken = token || theToken;

      if (!effectiveToken) {
        console.error("Spotify token is not available. Player cannot initialize.");
        return;
      }

      console.log("Initializing Spotify Player with token:", effectiveToken);

      const player = new Spotify.Player({
        name: "Nerd Trivia 3000 Player",
        getOAuthToken: (cb) => cb(effectiveToken),
        volume: 1,
      });

      player.addListener("ready", ({ device_id }) => {
        console.log("Player is ready with Device ID:", device_id);
        setDeviceId(device_id); // Update state
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
    <div className="hidden">
      <Button
        className="mx-4"
        onClick={playSong} // Use the playSong function to play a specific track
        disabled={!isPlayerReady || !song}
      >
        Play Song
      </Button>
      <Button
        className="mx-4"
        onClick={togglePlayback} // Toggle playback
        disabled={!isPlayerReady}
      >
        Toggle Playback
      </Button>
    </div>
  );
};

export default SpotifyPlayer;
