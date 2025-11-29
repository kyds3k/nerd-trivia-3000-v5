"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button, Card, CardBody, Image, Progress, Tooltip } from "@heroui/react";
import { getAppleMusicTrack, AppleMusicTrack } from "@/lib/appleMusic";
import { useHotkeys } from "react-hotkeys-hook";

// Icons (using simple text or HeroUI icons if available, for now using text/emoji for simplicity or we can import icons)
// Assuming we can use standard unicode for controls or HeroUI icons if we knew the package.
// Using text for now to be safe.

interface AppleScriptPlayerProps {
  trackId?: string | null; // The Apple Music ID to play
  trackIds?: string[] | null; // List of IDs (for playlist/queue)
  autoplay?: boolean;
}

const BRIDGE_URL = "http://localhost:17171";

export default function AppleScriptPlayer({ trackId, trackIds, autoplay = false }: AppleScriptPlayerProps) {
  // console.log("AppleScriptPlayer function body executed. trackId:", trackId);
  const [isPlaying, setIsPlaying] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<any>(null);
  const [bridgeOnline, setBridgeOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [metadata, setMetadata] = useState<AppleMusicTrack | null>(null);

  // Multi-track state
  const [allTracksMetadata, setAllTracksMetadata] = useState<AppleMusicTrack[]>([]);
  const [totalDuration, setTotalDuration] = useState(0);

  // Local timer state for smooth updates
  const [localPosition, setLocalPosition] = useState(0);

  // Determine the effective track ID
  const effectiveTrackId = trackIds ? trackIds[currentTrackIndex] : trackId;

  // Fetch metadata for ALL tracks if trackIds is present
  useEffect(() => {
    const fetchAllMetadata = async () => {
      if (trackIds && trackIds.length > 0) {
        const tracks: AppleMusicTrack[] = [];
        let totalDur = 0;
        for (const id of trackIds) {
          const data = await getAppleMusicTrack(id);
          if (data) {
            tracks.push(data);
            totalDur += (data.durationMs / 1000); // Convert to seconds
          } else {
            // Push placeholder to keep indices aligned
            tracks.push({
              id: id,
              title: "Unknown Title",
              artist: "Unknown Artist",
              album: "Unknown Album",
              artworkUrl: "",
              previewUrl: "",
              durationMs: 0,
              url: ""
            });
          }
        }
        setAllTracksMetadata(tracks);
        setTotalDuration(totalDur);
        console.log("Fetched all tracks metadata. Total Duration:", totalDur);
      }
    };
    fetchAllMetadata();
  }, [trackIds]);

  // Fetch metadata for the CURRENT requested track (for display before playback starts)
  useEffect(() => {
    const fetchMetadata = async () => {
      if (effectiveTrackId) {
        const data = await getAppleMusicTrack(effectiveTrackId);
        setMetadata(data);
      }
    };
    fetchMetadata();
  }, [effectiveTrackId]);

  // Ref to prevent multiple auto-advance triggers for the same track
  const hasAdvancedRef = React.useRef(false);
  // Ref to track previous state for "Just Finished" detection
  const previousStateRef = React.useRef<{ isPlaying: boolean; position: number; duration: number } | null>(null);

  // Reset ref when index changes
  useEffect(() => {
    hasAdvancedRef.current = false;
  }, [currentTrackIndex]);

  // Ref to trigger playback after index change
  const autoPlayNextRef = React.useRef(false);

  // Ref to track if pause was manual
  const isManuallyPaused = React.useRef(false);
  const [hasFinished, setHasFinished] = useState(false);

  // Reset local position when track changes
  useEffect(() => {
    setLocalPosition(0);
  }, [currentTrackIndex]);

  // Check bridge status and poll now playing
  // Defined FIRST so handlers can call it
  const checkBridge = useCallback(async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/now-playing`);
      if (res.ok) {
        const data = await res.json();
        setBridgeOnline(true);
        setError(null);

        if (data.name) {
          setNowPlaying(data);
          // Only sync if playing or if we just loaded
          if (data.isPlaying) {
            setLocalPosition(data.position);
          }
        }

        setIsPlaying(data.isPlaying);
      } else {
        setBridgeOnline(false);
        setError("Bridge offline");
      }
    } catch (e) {
      setBridgeOnline(false);
      setError("Bridge offline");
    }
  }, []);

  // Poll every 1 second
  useEffect(() => {
    checkBridge();
    const interval = setInterval(checkBridge, 1000);
    return () => clearInterval(interval);
  }, [checkBridge]);

  // Detect auto-finish
  useEffect(() => {
    if (!isPlaying && !isManuallyPaused.current && trackIds && currentTrackIndex >= trackIds.length - 1) {
      // If we stopped playing, weren't manually paused, and are on the last track... we finished.
      // We also check if we have actually started playing at some point (to avoid triggering on load)
      if (nowPlaying?.position > 0) {
        setHasFinished(true);
      }
    }
  }, [isPlaying, trackIds, currentTrackIndex, nowPlaying]);


  // Playback controls
  const handlePlay = useCallback(async () => {
    isManuallyPaused.current = false;
    setHasFinished(false);

    if (!bridgeOnline) {
      console.warn("handlePlay ignored: Bridge Offline");
      return;
    }

    console.log("handlePlay called. isPlaying:", isPlaying, "nowPlaying:", nowPlaying);

    // Check if we are already playing the correct track
    const isTrackLoaded = nowPlaying?.name && nowPlaying.name === allTracksMetadata[currentTrackIndex]?.title;

    console.log("isTrackLoaded:", isTrackLoaded);

    if (effectiveTrackId && !isTrackLoaded) {
      // Track is not loaded, so we jump to it
      try {
        console.log("Jumping to track:", effectiveTrackId);
        const body = { appleMusicId: effectiveTrackId };

        await fetch(`${BRIDGE_URL}/jump-to-track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        setTimeout(checkBridge, 1000);
      } catch (e) {
        console.error("Error jumping to track:", e);
      }
    } else {
      // Track is loaded, so we just Resume
      console.log("Track loaded, sending Play command (Resume)");
      try {
        await fetch(`${BRIDGE_URL}/play`, { method: "POST" });
        setTimeout(checkBridge, 500);
      } catch (e) {
        console.error("Error playing:", e);
      }
    }
  }, [bridgeOnline, isPlaying, nowPlaying, allTracksMetadata, currentTrackIndex, effectiveTrackId]);

  const handlePause = useCallback(async () => {
    isManuallyPaused.current = true;
    if (!bridgeOnline) return;
    try {
      await fetch(`${BRIDGE_URL}/pause`, { method: "POST" });
      setTimeout(checkBridge, 500);
    } catch (e) {
      console.error("Error pausing:", e);
    }
  }, [bridgeOnline, checkBridge]);

  const handleNext = useCallback(async () => {
    isManuallyPaused.current = false;
    setHasFinished(false);
    if (!bridgeOnline) return;

    if (trackIds && trackIds.length > 0) {
      const nextIndex = (currentTrackIndex + 1) % trackIds.length;
      console.log("Switching to next track index:", nextIndex);
      setCurrentTrackIndex(nextIndex);
      autoPlayNextRef.current = true; // Trigger auto-play
      return;
    }

    try {
      await fetch(`${BRIDGE_URL}/next`, { method: "POST" });
      setTimeout(checkBridge, 500);
    } catch (e) {
      console.error("Error next:", e);
    }
  }, [bridgeOnline, trackIds, currentTrackIndex, checkBridge]);

  const handlePrevious = useCallback(async () => {
    isManuallyPaused.current = false;
    setHasFinished(false);
    if (!bridgeOnline) return;

    if (trackIds && trackIds.length > 0) {
      const prevIndex = (currentTrackIndex - 1 + trackIds.length) % trackIds.length;
      console.log("Switching to previous track index:", prevIndex);
      setCurrentTrackIndex(prevIndex);
      autoPlayNextRef.current = true; // Trigger auto-play
      return;
    }

    try {
      await fetch(`${BRIDGE_URL}/previous`, { method: "POST" });
      setTimeout(checkBridge, 500);
    } catch (e) {
      console.error("Error previous:", e);
    }
  }, [bridgeOnline, trackIds, currentTrackIndex, checkBridge]);

  // Effect to handle auto-play after index change
  useEffect(() => {
    if (autoPlayNextRef.current && effectiveTrackId) {
      console.log("Auto-play triggered for track:", effectiveTrackId);
      autoPlayNextRef.current = false;
      handlePlay();
    }
  }, [currentTrackIndex, effectiveTrackId, handlePlay]);

  // Auto-Advance Logic (Moved to useEffect)
  useEffect(() => {
    if (!nowPlaying || !trackIds) return;

    const data = nowPlaying;
    const timeLeft = data.duration - data.position;
    const isNearEnd = data.duration > 0 && timeLeft < 4; // 4 second window
    const isLastTrack = trackIds && currentTrackIndex >= trackIds.length - 1;

    // 1. Predictive Advance (While Playing)
    if (isPlaying && isNearEnd && !isLastTrack && !hasAdvancedRef.current) {
      console.log("Auto-advancing (Predictive). Position:", data.position);
      hasAdvancedRef.current = true;
      handleNext();
    }

    // 2. "Just Finished" Advance
    if (previousStateRef.current?.isPlaying && !isPlaying && !isLastTrack && !hasAdvancedRef.current) {
      const prevTimeLeft = previousStateRef.current.duration - previousStateRef.current.position;
      if (prevTimeLeft < 5) {
        console.log("Auto-advancing (Just Finished). Prev Position:", previousStateRef.current.position);
        hasAdvancedRef.current = true;
        handleNext();
      }
    }

    // Update previous state ref
    previousStateRef.current = {
      isPlaying: isPlaying,
      position: data.position,
      duration: data.duration
    };

  }, [nowPlaying, isPlaying, trackIds, currentTrackIndex, handleNext]);


  // Local Timer Interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setLocalPosition(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Mount check
  useEffect(() => {
    // console.log("AppleScriptPlayer mounted. TrackId:", effectiveTrackId);
    // return () => console.log("AppleScriptPlayer unmounted.");
  }, [effectiveTrackId]);

  // Hotkeys
  useHotkeys('ctrl+p', (e) => {
    e.preventDefault();
    console.log("Ctrl+P pressed in AppleScriptPlayer. isPlaying:", isPlaying);
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  }, { enableOnFormTags: true }, [isPlaying, handlePause, handlePlay]);

  useHotkeys('shift+right', (e) => {
    e.preventDefault();
    console.log("Shift+Right pressed in AppleScriptPlayer");
    handleNext();
  }, { enableOnFormTags: true }, [handleNext]);

  useHotkeys('shift+left', (e) => {
    e.preventDefault();
    console.log("Shift+Left pressed in AppleScriptPlayer");
    handlePrevious();
  }, { enableOnFormTags: true }, [handlePrevious]);

  // Autoplay logic
  useEffect(() => {
    if (autoplay && bridgeOnline && effectiveTrackId && !isPlaying) {
      // handlePlay(); // Careful with autoplay loops
    }
  }, [autoplay, bridgeOnline, effectiveTrackId]);

  // Timer Component
  const SongTimer = () => {
    // If we have multiple tracks, use Global Timer logic
    if (trackIds && trackIds.length > 0 && allTracksMetadata.length > 0) {
      // Calculate duration of previous tracks
      let previousDuration = 0;
      for (let i = 0; i < currentTrackIndex; i++) {
        previousDuration += (allTracksMetadata[i].durationMs / 1000);
      }

      // Current position in the global timeline
      // Note: localPosition is the position in the CURRENT track
      const globalElapsed = previousDuration + localPosition;
      const globalRemaining = Math.max(0, totalDuration - globalElapsed);

      const minutes = Math.floor(globalRemaining / 60);
      const seconds = Math.floor(globalRemaining % 60);
      const formatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

      const isLowTime = globalRemaining <= 31;
      const isCriticalTime = globalRemaining <= 10;
      const isFinished = globalRemaining === 0 || hasFinished;

      let timerClass = "fixed top-4 right-4 text-xl font-mono p-2 rounded z-50 ";

      if (isFinished) {
        timerClass += "text-red-600";
      } else if (isCriticalTime) {
        timerClass += "text-red-600 animate-pulse";
      } else if (isLowTime) {
        timerClass += "text-red-600";
      } else {
        timerClass += "text-white";
      }

      return (
        <div className={timerClass}>
          {isFinished ? "TIME'S UP!" : `Time remaining: ${formatted}`}
        </div>
      );
    }

    // Fallback to Single Track Timer
    if (!nowPlaying || !nowPlaying.duration) return null;

    // Use localPosition for smooth updates
    const remaining = Math.max(0, nowPlaying.duration - localPosition);
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    const formatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    // Styling logic
    const isLowTime = remaining <= 31;
    const isCriticalTime = remaining <= 10;
    const isFinished = remaining === 0 || hasFinished;

    // Smaller font (text-xl), no background
    let timerClass = "fixed top-4 right-4 text-xl font-mono p-2 rounded z-50 ";

    if (isFinished) {
      timerClass += "text-red-600"; // Static red, no animation
    } else if (isCriticalTime) {
      timerClass += "text-red-600 animate-pulse"; // Pulse (fade) instead of ping
    } else if (isLowTime) {
      timerClass += "text-red-600";
    } else {
      timerClass += "text-white";
    }

    return (
      <div className={timerClass}>
        {isFinished ? "TIME'S UP!" : `Time remaining: ${formatted}`}
      </div>
    );
  };

  return (
    <>
      {/* Logic is handled by hooks */}
      {/* We can optionally render the timer here if requested */}
      <SongTimer />
    </>
  );
}
