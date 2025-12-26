"use client"

import React, { useEffect, useState, useRef, use } from 'react';
import { useEffectOnce } from 'react-use';
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
import Typed from "typed.js";

import { useTransitionRouter } from "next-transition-router";
import { usePrimeDirectives } from "@/hooks/usePrimeDirectives";
import ShallNotPass from "@/components/ShallNotPass"
import { useSession } from "next-auth/react";
import { getAppleMusicTrack } from "@/lib/appleMusic";
import { motion, AnimatePresence } from "framer-motion";


interface Question {
  edition_id: string;
  question_text: string;
  answer: string;
  final_answer_gif: string;
  final_song_apple: string;
  is_active: boolean;
}

export default function Question({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const router = useTransitionRouter();
  const editionId = params.id;
  const [questionText, setQuestionText] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [answerGif, setAnswerGif] = useState<string | null>(null);
  const [song, setSong] = useState<string | null>(null);
  const [songArtist, setSongArtist] = useState<string | null>(null);
  const [songTitle, setSongTitle] = useState<string | null>(null);
  const [songAlbumArt, setSongAlbumArt] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [excelsiorAnswers, setExcelsiorAnswers] = useState<any[]>([]);

  const [questionActive, setQuestionActive] = useState<boolean | null>(null);
  const [loadingQuote, setLoadingQuote] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [isResized, setIsResized] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const el = useRef<HTMLSpanElement | null>(null);


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

  useHotkeys("ctrl+ArrowLeft", () => {
    router.push(`/edition/${editionId}/present/wager/`);
  });

  useHotkeys("ctrl+ArrowRight", () => {
    localStorage.setItem("scoreBoardOrigin", "final");
    router.push(`/edition/${editionId}/present/scoreboard/`);
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

  // Reset resized state when question text changes
  useEffect(() => {
    setIsResized(false);
  }, [questionText]);

  useEffect(() => {
    if (questionRef.current && !isResized && questionText) {
      const container = questionRef.current;
      const parentWidth = container.offsetWidth;
      const parentHeight = container.offsetHeight;

      // Start with a large font size and reduce it until the text fits
      let fontSize = 80; // Initial font size
      container.style.fontSize = `${fontSize}px`;

      const checkFit = () => {
        if (
          (container.scrollWidth > parentWidth ||
            container.scrollHeight > parentHeight) && fontSize > 10
        ) {
          fontSize -= 1; // Reduce font size
          container.style.fontSize = `${fontSize}px`;
          requestAnimationFrame(checkFit);
        } else {
          setIsResized(true);
        }
      };

      checkFit();
    }
  }, [questionText, isResized, questionActive]);

  useEffect(() => {
    if (el.current && questionActive && questionText && isResized) {
      const typed = new Typed(el.current, {
        strings: [questionText],
        typeSpeed: 20,
        showCursor: false,
        loop: false,
      });

      return () => typed.destroy(); // Cleanup Typed.js instance on unmount or rerun
    }
  }, [questionText, questionActive, isResized]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false }, [Fade()])

  useHotkeys("left", () => {
    emblaApi?.scrollPrev()
  });

  useHotkeys("right", () => {
    fetchExcelsior();
    emblaApi?.scrollNext()
  });

  useEffect(() => {
    if (emblaApi) {
      console.log("Embla API ready");

      const onSelect = () => {
        fetchExcelsior();

        const index = emblaApi.selectedScrollSnap();
        const excelsiorCount = excelsiorAnswers.length > 0 ? 1 : 0;
        const answerSlideIndex = 1 + excelsiorCount;

        if (index === answerSlideIndex) {
          setShowAnswer(false);
          setTimeout(() => {
            setShowAnswer(true);
          }, 1000);
        } else {
          setShowAnswer(false);
        }
      };

      emblaApi.on('select', onSelect);
      return () => {
        emblaApi.off('select', onSelect);
      };
    }
  }, [emblaApi, excelsiorAnswers.length])

  // Re-initialize Embla when slides are added dynamically
  useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit();
    }
  }, [emblaApi, excelsiorAnswers]);

  // function to grab the album art, song name, and artist name from the Apple Music API
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
  }

  const fetchExcelsior = async () => {
    try {
      const excelsiorList = await pb.collection("answers").getFullList({
        filter: `edition_id = "${editionId}" && answer_type = "final" && excelsior = true`,
        expand: "team_id",
      });
      console.log("Excelsior answers fetched for final round:", excelsiorList);
      setExcelsiorAnswers(excelsiorList);
    } catch (err) {
      console.log("No excelsior answers found for final round or error fetching:", err);
      setExcelsiorAnswers([]);
    }
  };

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
        console.error("No auth data found.");
        setLoading(false);
        setIsAdmin(false);
        return;
      }

      const parsedAuth = JSON.parse(authData);
      if (!parsedAuth.record.is_admin) {
        console.log("Not an admin.");
        setLoading(false);
        setIsAdmin(false);
        return;
      }

      console.log("Admin authenticated.");
      setIsAdmin(true);
    };

    const fetchQuestion = async () => {
      try {
        pb.autoCancellation(false);
        const response = await pb
          .collection("final_rounds")
          .getFirstListItem<Question>(`edition_id = "${editionId}"`);

        console.log("Question fetched:", response);

        // Fetch excelsior answers for final round
        await fetchExcelsior();

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

        setSong(response.final_song_apple);

        setIsActive(response.is_active);
        setLoading(false);

      } catch (error) {
        console.log("Failed to fetch edition:", error);
        setLoading(false);
      }
    };

    if (editionId) {
      initializeApp();
      fetchQuestion();
    }
  }, [editionId]);

  useEffectOnce(() => {
    getLoadingQuote();
  });

  // Initial fade-in handled by Embla select listener or initial state
  // Removing the automatic page-load timer to avoid conflicts with navigation logic
  /*
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setShowAnswer(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading]);
  */

  useEffect(() => {
    if (song) {
      getSongInfo(song);
    }
  }, [song, isAdmin]);

  return (
    <div className="max-h-svh overflow-hidden">
      <div className="flex justify-between p-4">
        <h1 className="py-4 pl-4 text-2xl">FINAL QUESTION</h1>
        {song && (
          <div>
            <AppleScriptPlayer trackId={song} />
          </div>
        )}
      </div>
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          <div className="embla__slide p-4 h-[calc(100vh-4rem)]">
            {questionActive ? (
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
              <p className="text-2xl flex">{loadingQuote}</p>
            )}
          </div>

          {/* Excelsior Slide - BEFORE answer for Final Round */}
          {excelsiorAnswers.length > 0 && (
            <div className="embla__slide p-8 h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-8">
              <h2 className="text-6xl font-linebeam text-glow-blue-400 mb-8">EXCELSIOR ANSWERS</h2>
              <div className="flex flex-col gap-4 items-center w-full max-w-4xl overflow-y-auto">
                {excelsiorAnswers.map((ans, idx) => (
                  <div key={idx} className="flex flex-col items-center p-4 border-b border-gray-700 w-full">
                    <span className="text-4xl font-bold text-yellow-400 mb-2">
                      {ans.team_name || ans.expand?.team_id?.team_name || "Unknown Team"}
                    </span>
                    <span className="text-2xl text-white italic">"{ans.answer}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="embla__slide p-4 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
            <AnimatePresence>
              {showAnswer && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1 }}
                  className="w-full h-full flex flex-col items-center justify-start gap-4"
                >
                  <div className="p-8 flex items-center justify-center">
                    <h3 className="text-6xl flex justify-items-center" dangerouslySetInnerHTML={{ __html: answer }}></h3>
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
                      <Spinner size="lg" />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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