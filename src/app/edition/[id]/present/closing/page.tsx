"use client"

import React, { use } from 'react';
import { useEffect, useState, useRef } from 'react';
import { useEffectOnce } from 'react-use';
import { useParams } from "next/navigation";
import Pocketbase from "pocketbase";
//import { Image } from "@heroui/react";
import Image from 'next/image';
import DOMPurify from "dompurify"; // Import the sanitizer
import AppleScriptPlayer from "@/components/AppleScriptPlayer";
import useEmblaCarousel from 'embla-carousel-react'
import Fade from 'embla-carousel-fade'
import { useHotkeys } from "react-hotkeys-hook";
import DynamicText from "@/components/DynamicText"; // Correct for default exports
import { Spinner } from "@heroui/react";
import { useTransitionRouter } from "next-transition-router";
import { getAppleMusicTrack } from "@/lib/appleMusic";
import { usePrimeDirectives } from "@/hooks/usePrimeDirectives";

interface Question {
  edition_id: string;
  question_text: string;
  answer: string;
  final_answer_gif: string;
  final_song_apple: string;
  end_gif_1: string; end_gif_2: string;
  is_active: boolean;
}

export default function Question() {
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const router = useTransitionRouter();
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const [song, setSong] = useState<string | null>(null);
  const [songArtist, setSongArtist] = useState<string | null>(null);
  const [songTitle, setSongTitle] = useState<string | null>(null);
  const [songAlbumArt, setSongAlbumArt] = useState<string | null>(null);
  const [endGif1, setEndGif1] = useState<string | null>(null);
  const [endGif2, setEndGif2] = useState<string | null>(null);



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



  // function to grab the album art, song name, and artist name from the Apple Music API
  const getSongInfo = async (songId: string) => {
    try {
      const track = await getAppleMusicTrack(songId);
      if (track) {
        setSongArtist(track.artists);
        setSongTitle(track.title);
        setSongAlbumArt(track.albumImage);
      }
    } catch (error) {
      console.error("Failed to fetch song info:", error);
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

        setSong(response.final_song_apple);

        setEndGif1(`https://nerdtriviabucket.s3.us-east-1.amazonaws.com/hvunkxgg0yziid1/u215tr37ub999gz/${response.end_gif_1}`);
        setEndGif2(`https://nerdtriviabucket.s3.us-east-1.amazonaws.com/hvunkxgg0yziid1/u215tr37ub999gz/${response.end_gif_2}`);


      } catch (error) {
        console.log("Failed to fetch edition:", error);
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
    <div className="h-dvh overflow-y-hidden">
      <div className="flex justify-between p-4">
        <h1 className="py-4 pl-4 text-2xl">THE END</h1>
        {song && (
          <div>
            <AppleScriptPlayer song={song} />
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