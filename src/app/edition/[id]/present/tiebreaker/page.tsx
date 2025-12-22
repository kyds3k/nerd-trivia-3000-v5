"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from "next/navigation";
import Pocketbase from "pocketbase";
import Image from 'next/image';
import DOMPurify from "dompurify";
import AppleScriptPlayer from "@/components/AppleScriptPlayer";
import useEmblaCarousel from 'embla-carousel-react';
import Fade from 'embla-carousel-fade';
import { useHotkeys } from "react-hotkeys-hook";
import { Spinner } from "@heroui/react";
import Typed from "typed.js";
import { useTransitionRouter } from "next-transition-router";
import { usePrimeDirectives } from "@/hooks/usePrimeDirectives";
import { getAppleMusicTrack } from "@/lib/appleMusic";

interface TiebreakerQuestion {
  id: string;
  question: string;
  answer: number;
  song_apple: string;
  is_active: boolean;
}

export default function TiebreakerPresenterPage() {
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const router = useTransitionRouter();
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;

  const [questionText, setQuestionText] = useState<string>("");
  const [answer, setAnswer] = useState<number | null>(null);
  const [song, setSong] = useState<string | null>(null);
  const [songArtist, setSongArtist] = useState<string | null>(null);
  const [songTitle, setSongTitle] = useState<string | null>(null);
  const [songAlbumArt, setSongAlbumArt] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isResized, setIsResized] = useState<boolean>(false);

  const el = useRef<HTMLSpanElement | null>(null);
  const questionRef = useRef<HTMLDivElement | null>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false }, [Fade()]);

  usePrimeDirectives(
    "directives",
    editionId,
    null,
    undefined,
    (active) => {
      console.log("Tiebreaker active status:", active);
      setIsActive(active);
    }
  );

  useHotkeys("ctrl+ArrowRight", () => {
    router.push(`/edition/${editionId}/present/tiebreaker/scoreboard/`);
  });

  useHotkeys("ctrl+ArrowLeft", () => {
    router.push(`/edition/${editionId}/present/scoreboard`);
  });

  useHotkeys("left", () => {
    emblaApi?.scrollPrev();
  });

  useHotkeys("right", () => {
    emblaApi?.scrollNext();
  });

  const getSongInfo = async (songId: string) => {
    try {
      const track = await getAppleMusicTrack(songId);
      if (track) {
        setSongArtist(track.artist);
        setSongTitle(track.title);
        setSongAlbumArt(track.artworkUrl);
      }
    } catch (error) {
      console.error("Failed to fetch song info:", error);
    }
  };

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        pb.autoCancellation(false);

        // 1. Fetch ALL tiebreakers (global pool)
        const tiebreakerList = await pb.collection("tiebreakers").getFullList<TiebreakerQuestion>();

        if (tiebreakerList.length === 0) {
          console.log("No tiebreakers found in database.");
          return;
        }

        // 2. Pick a random one
        const randomIndex = Math.floor(Math.random() * tiebreakerList.length);
        const selectedTiebreaker = tiebreakerList[randomIndex];
        console.log(`Randomly selected tiebreaker: ${selectedTiebreaker.id} (Index: ${randomIndex})`);

        // 3. Set it as ACTIVE in the DB (and deactivate others)
        // We do this to ensure the Scoreboard and Teams see the same active question.
        await Promise.all(tiebreakerList.map(t => {
          if (t.id === selectedTiebreaker.id) {
            return pb.collection('tiebreakers').update(t.id, { is_active: true });
          } else if (t.is_active) {
            return pb.collection('tiebreakers').update(t.id, { is_active: false });
          }
          return Promise.resolve();
        }));

        // 4. Update State
        if (selectedTiebreaker.question) {
          const sanitizedQuestion = DOMPurify.sanitize(selectedTiebreaker.question);
          setQuestionText(sanitizedQuestion);
        }

        setAnswer(selectedTiebreaker.answer);
        setSong(selectedTiebreaker.song_apple);
        setIsActive(true); // We just made it active

      } catch (error) {
        console.log("Failed to fetch/update tiebreaker:", error);
      }
    };

    if (editionId) {
      fetchQuestion();
    }
  }, [editionId]);

  useEffect(() => {
    if (song) {
      getSongInfo(song);
    }
  }, [song]);

  // Text resizing logic
  useEffect(() => {
    setIsResized(false);
  }, [questionText]);

  useEffect(() => {
    if (questionRef.current && !isResized && questionText) {
      const container = questionRef.current;
      const parentWidth = container.offsetWidth;
      const parentHeight = container.offsetHeight;

      let fontSize = 80;
      container.style.fontSize = `${fontSize}px`;

      const checkFit = () => {
        if (
          (container.scrollWidth > parentWidth ||
            container.scrollHeight > parentHeight) && fontSize > 10
        ) {
          fontSize -= 1;
          container.style.fontSize = `${fontSize}px`;
          requestAnimationFrame(checkFit);
        } else {
          setIsResized(true);
        }
      };

      checkFit();
    }
  }, [questionText, isResized, isActive]);

  // Typed.js effect
  useEffect(() => {
    if (el.current && isActive && questionText && isResized) {
      const typed = new Typed(el.current, {
        strings: [questionText],
        typeSpeed: 20,
        showCursor: false,
        loop: false,
      });

      return () => typed.destroy();
    }
  }, [questionText, isActive, isResized]);

  return (
    <div className="max-h-svh overflow-hidden bg-black text-white">
      <div className="flex justify-between p-4">
        <h1 className="py-4 pl-4 text-2xl font-linebeam text-glow-blue-400">TIEBREAKER</h1>
        {song && (
          <div>
            <AppleScriptPlayer trackId={song} />
          </div>
        )}
      </div>
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          <div className="embla__slide p-4 h-[calc(100vh-4rem)]">
            {isActive ? (
              <div
                ref={questionRef}
                className="p-8 h-[calc(100vh-4rem)] flex flex-col items-start justify-start overflow-hidden w-full"
              >
                {!isResized ? (
                  <span className="opacity-0">{questionText}</span>
                ) : (
                  <span ref={el}></span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <h2 className="text-4xl text-gray-500">Waiting for Tiebreaker...</h2>
              </div>
            )}
          </div>

          <div className="embla__slide p-8 h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
            <h2 className="text-6xl font-bold text-green-400">{answer?.toLocaleString()}</h2>
            <p className="text-2xl text-gray-500 mt-4">Correct Answer</p>
          </div>

          <div className="embla__slide p-8 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
            {songAlbumArt ? (
              <>
                <Image src={songAlbumArt} alt="Song Album Art" width="600" height="600" />
                <h3 className="text-3xl">"{songTitle}" by {songArtist}</h3>
              </>
            ) : (
              <Spinner size="lg" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
