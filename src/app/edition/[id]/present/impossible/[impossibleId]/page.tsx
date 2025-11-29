"use client"

import React, { use } from 'react';

import { useEffect, useState, useRef } from 'react';
import { useParams } from "next/navigation";
import Pocketbase from "pocketbase";
import Image from 'next/image';
import DOMPurify from "dompurify"; // Import the sanitizer
import AppleScriptPlayer from "@/components/AppleScriptPlayer";
import useEmblaCarousel from 'embla-carousel-react'
import Fade from 'embla-carousel-fade'
import { useHotkeys } from "react-hotkeys-hook";
import DynamicText from "@/components/DynamicText"; // Correct for default exports
import { Spinner } from "@heroui/react";
import { useTransitionRouter } from "next-transition-router";
import { set } from 'lodash';
import { usePrimeDirectives } from "@/hooks/usePrimeDirectives";
import ShallNotPass from "@/components/ShallNotPass";
import { useSession } from "next-auth/react";
import { getAppleMusicTrack } from "@/lib/appleMusic";

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
  apple_music_ids: string[] | { [key: string]: string };
  is_active: boolean;
}

export default function Impossible() {
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const router = useTransitionRouter();
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

  const [loading, setLoading] = useState<boolean>(true);
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

  useEffect(() => {
    const initializeApp = async () => {
      if (!pb.authStore.isValid) {
        console.log("Not authenticated with Pocketbase.");
        setLoading(false);
        return;
      }

      console.log("Authenticated with Pocketbase successfully.");
      const authData = localStorage.getItem("pocketbase_auth");

      if (!authData) {
        console.log("No auth data found.");
        setLoading(false);
        setIsAdmin(false);
        return;
      }

      const parsedAuth = JSON.parse(authData);
      console.log("Parsed auth data:", parsedAuth);
      if (!parsedAuth.record.is_admin) {
        console.log("Not an admin.");
        setLoading(false);
        setIsAdmin(false);
        return;
      }

      console.log("Admin authenticated.");
      setIsAdmin(true);
      setLoading(false);


    };

    const fetchQuestion = async () => {
      try {
        pb.autoCancellation(false);
        const response = await pb
          .collection("impossible_rounds")
          .getFirstListItem<Impossible>(`edition_id = "${editionId}" && impossible_number = ${impossibleId}`);

        console.log("Question fetched:", response);

        setIntroGif(response.intro_gif);
        setTheme(response.theme);
        setThemeGif(response.theme_gif);

        const sanitizedQuestionText = DOMPurify.sanitize(response.question_text);
        setQuestionText(sanitizedQuestionText);

        const sanitizedAnswers = response.answers.map((answer) => DOMPurify.sanitize(answer));
        setAnswers(sanitizedAnswers);

        setAnswerGifs(response.answer_gifs);

        console.log("response.apple_music_ids:", response.apple_music_ids);

        let ids: string[] = [];
        if (Array.isArray(response.apple_music_ids)) {
          ids = response.apple_music_ids;
        } else {
          ids = Object.values(response.apple_music_ids).map((id) => id as string);
          console.log("ids:", ids);
        }

        setSongs(ids); // Update state
        return ids; // Return the updated ids for immediate use
      } catch (error) {
        console.log("Failed to fetch edition:", error);
        return [];
      }
    };

    const getSongsInfo = async (songs: string[]) => {
      console.log("Getting song info...");
      // Temporary arrays to collect the song data
      const artists: string[] = [];
      const titles: string[] = [];
      const albumArts: string[] = [];

      console.log("Songs:", songs);
      // Iterate over each song ID in the `songs` array
      for (const songId of songs) {
        try {
          const track = await getAppleMusicTrack(songId);
          if (track) {
            artists.push(track.artist);
            titles.push(track.title);
            albumArts.push(track.artworkUrl);
          }
        } catch (error) {
          console.log("Error fetching song info:", error);
        }
      }

      // Update state with the collected data
      setSongArtists(artists);
      setSongTitles(titles);
      setSongAlbumArts(albumArts);
    };



    const initializeAndFetch = async () => {
      if (editionId) {
        await initializeApp();
        const songs = await fetchQuestion(); // Wait for fetchQuestion and get the songs

        // Only fetch song info if we have songs
        if (songs && songs.length > 0) {
          await getSongsInfo(songs);
        }
      }
    };

    initializeAndFetch(); // Call the async function

  }, [editionId, impossibleId]); // Add relevant dependencies


  // if (!isAdmin) {
  //   return <ShallNotPass />;
  // }

  return (
    <div className="overflow-y-hidden h-dvh">
      <div className="flex justify-between p-4">
        <h1 className="py-4 pl-4 text-2xl">Impossible Question {impossibleId} </h1>
        {songs.length > 0 && (
          <div>
            <AppleScriptPlayer trackIds={songs} />
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
              <h3 className="text-6xl flex justify-items-center leading-[1.3]" dangerouslySetInnerHTML={{ __html: answer }}></h3>
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
                  {albumArt ? (
                    <Image src={albumArt} alt={`Album Art for ${songTitles[index]}`} width="600" height="600" />
                  ) : (
                    <div className="w-[600px] h-[600px] bg-gray-800 flex items-center justify-center">
                      <span className="text-gray-400">No Artwork</span>
                    </div>
                  )}
                  <h3 className="text-3xl max-w-[600px] text-center">"{songTitles[index]}" by {songArtists[index]}</h3>
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