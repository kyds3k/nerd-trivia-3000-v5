"use client"

import React, { useEffect, useState, useRef } from 'react';
import { useEffectOnce } from 'react-use';
import { useParams } from "next/navigation";
import Pocketbase from "pocketbase";
// import { Image } from "@heroui/react";
import Image from 'next/image';
import DOMPurify from "dompurify"; // Import the sanitizer
import AppleScriptPlayer from "@/components/AppleScriptPlayer";
import useEmblaCarousel from 'embla-carousel-react'
import Fade from 'embla-carousel-fade'
import { useHotkeys } from "react-hotkeys-hook";
import DynamicText from "@/components/DynamicText"; // Correct for default exports
import { Spinner } from "@heroui/react";
import { useTransitionRouter } from "next-transition-router";
import Typed from "typed.js";
import { usePrimeDirectives } from "@/hooks/usePrimeDirectives";
import ShallNotPass from '@/components/ShallNotPass';
import { useSession } from "next-auth/react";
import { getAppleMusicTrack } from "@/lib/appleMusic";


interface Question {
  edition_id: string;
  round_number: number;
  question_number: number;
  question_text: string;
  answer: string;
  answer_gif: string;
  is_banthashit_question: boolean;
  bantha_answer: string;
  bantha_answer_gif: string;
  apple_ids: string;
  bonus_answers: string[];
  is_active: boolean;
}

interface session {
  accessToken: string;
  user: {
    name: string;
    email: string;
    image: string;
  }
}

export default function Question() {
  const router = useTransitionRouter();
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const questionId = typeof params?.questionId === "string" ? params.questionId : undefined;
  const roundId = typeof params?.roundId === "string" ? params.roundId : undefined;
  const [questionText, setQuestionText] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [answerGif, setAnswerGif] = useState<string | null>(null);
  const [isBanthaShitQuestion, setIsBanthaShitQuestion] = useState<boolean | null>(null);
  const [banthaAnswer, setBanthaAnswer] = useState<string>("");
  const [banthaAnswerGif, setBanthaAnswerGif] = useState<string | null>(null);
  const [song, setSong] = useState<string | null>(null);
  const [songArtist, setSongArtist] = useState<string | null>(null);
  const [songTitle, setSongTitle] = useState<string | null>(null);
  const [songAlbumArt, setSongAlbumArt] = useState<string | null>(null);
  const [bonusAnswers, setBonusAnswers] = useState<string[] | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);

  const [questionActive, setQuestionActive] = useState<boolean>(false);
  const [loadingQuote, setLoadingQuote] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [hasSession, setHasSession] = useState<boolean>(false);
  const { data: session } = useSession();

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


  useHotkeys("ctrl+ArrowRight", () => {
    const questionIdStr = questionId!; // Assert that questionId is not undefined
    if (questionIdStr === "5" && (roundId === "1" || roundId === "2")) {
      router.push(`/edition/${editionId}/present/impossible/${roundId}`);
    } else if (questionIdStr === "5" && roundId === "3") {
      localStorage.setItem("scoreBoardOrigin", "round3");
      router.push(`/edition/${editionId}/present/scoreboard`);
    } else {
      // Navigate to the next question in that round
      router.push(
        `/edition/${editionId}/present/round/${roundId}/question/${parseInt(questionIdStr) + 1}`
      );
    }
  });

  useHotkeys("ctrl+ArrowLeft", () => {
    const questionIdStr = questionId!; // Assert that questionId is not undefined
    // if questionId is 1, go to the previous round page. if questionId is 2-5, go to the previous question page.
    if (questionIdStr === "1") {
      router.push(`/edition/${editionId}/present/round/${parseInt(roundId!)}`);
    } else {
      router.push(
        `/edition/${editionId}/present/round/${roundId}/question/${parseInt(questionIdStr) - 1}`
      );
    }
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

  const [isResized, setIsResized] = useState<boolean>(false);

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
      let fontSize = 80; // Initial font size (matched maxFontSize from DynamicText)
      container.style.fontSize = `${fontSize}px`;

      // We need to ensure the content is rendered for measurement
      // The opacity-0 span should be present now

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

  const el = useRef<HTMLSpanElement | null>(null);

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
        setSongArtist(track.artist);
        setSongTitle(track.title);
        setSongAlbumArt(track.artworkUrl);
      }
    } catch (error) {
      console.error("Failed to fetch song info:", error);
    }
  }


  const fetchQuestion = async () => {
    try {
      pb.autoCancellation(false);
      const response = await pb
        .collection("questions")
        .getFirstListItem<Question>(`edition_id = "${editionId}" && question_number = "${questionId}" && round_number = "${roundId}"`);

      console.log("Question fetched:", response);

      setAnswerGif(response.answer_gif);
      setIsBanthaShitQuestion(response.is_banthashit_question);
      setBanthaAnswerGif(response.bantha_answer_gif);
      if (response.song_apple) {
        console.log("Question Page: Found song_apple:", response.song_apple);
        setSong(response.song_apple);
      } else {
        console.log("Question Page: No song_apple found for this question.");
      }

      setIsActive(response.is_active);

      const fixColor = (text: string) => {
        return text.replace(/style="color:\s+brown"/g, 'style="color: #7A5901"');
      };

      // Sanitize and set HTML content
      if (response.question_text) {
        const fixedText = fixColor(response.question_text);
        const sanitizedQuestion = DOMPurify.sanitize(fixedText); // Clean the HTML
        setQuestionText(sanitizedQuestion);
        setQuestionActive(response.is_active);
      }

      if (response.answer) {
        const fixedText = fixColor(response.answer);
        const sanitizedAnswer = DOMPurify.sanitize(fixedText); // Clean the HTML
        setAnswer(sanitizedAnswer);
      }

      if (response.bantha_answer) {
        const fixedText = fixColor(response.bantha_answer);
        const sanitizedBanthaAnswer = DOMPurify.sanitize(fixedText); // Clean the HTML
        setBanthaAnswer(sanitizedBanthaAnswer);
      }

      setBanthaAnswerGif(response.bantha_answer_gif);

      // setSong(response.apple_ids); // Removed to prevent overwriting song_apple

      if (response.bonus_answers) {
        const sanitizedBonusAnswers = response.bonus_answers.map((answer) => DOMPurify.sanitize(answer));
        setBonusAnswers(sanitizedBonusAnswers);
      }

      setIsActive(response.is_active);

    } catch (error) {
      console.error("Failed to fetch edition:", error);
    }
  };

  useEffect(() => {

    const initializeApp = async () => {
      if (!pb.authStore.isValid) {
        console.error("Not authenticated with Pocketbase.");
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
      setLoading(false);


      if (editionId) {
        //initializeApp();
      }
    };

    initializeApp();
    fetchQuestion();
    fetchQuestion();

  }, []);

  useEffect(() => {
    if (song && isAdmin) {
      getSongInfo(song);
    }
  }, [song, isAdmin]);

  useEffectOnce(() => {
    getLoadingQuote();
  });

  return loading ? (
    <div className="flex flex-col justify-center items-center h-screen bg-black">
      <Spinner size="lg" />
    </div>
  ) : !isAdmin ? (
    <ShallNotPass />
  ) : (
    <div className="h-screen overflow-hidden">
      <div className="flex justify-between p-4">
        <h1 className="py-4 pl-4 text-2xl">Question {questionId}</h1>

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
              <p className="text-4xl flex">{loadingQuote}</p>
            )}
          </div>
          <div className="embla__slide p-4 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
            <div className="p-8 flex items-center justify-center">
              <h3
                className="text-6xl flex justify-items-center"
                dangerouslySetInnerHTML={{ __html: answer }}
              ></h3>
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
                <p>Loading GIF...</p>
              )}
            </div>
          </div>

          {isBanthaShitQuestion && (
            <div className="embla__slide p-4 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
              <div className="p-8 flex items-center justify-center">
                <h3
                  className="text-6xl flex justify-center"
                  dangerouslySetInnerHTML={{ __html: banthaAnswer }}
                ></h3>
              </div>
              <div className="flex items-center justify-center w-full">
                {banthaAnswerGif ? (
                  <Image
                    className="h-full w-auto object-contain"
                    src={banthaAnswerGif}
                    alt="Bantha Answer GIF"
                    unoptimized={true}
                    fill={true}
                  />
                ) : (
                  <p>Loading GIF...</p>
                )}
              </div>
            </div>
          )}
          <div className="embla__slide p-8 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
            {songAlbumArt ? (
              <>
                <Image
                  src={songAlbumArt}
                  alt="Song Album Art"
                  width="600"
                  height="600"
                />
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