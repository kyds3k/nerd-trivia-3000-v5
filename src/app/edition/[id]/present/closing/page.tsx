"use client"

import React, { use } from 'react';
import { useEffect, useState, useRef } from 'react';
import { useEffectOnce } from 'react-use';
import { useParams } from "next/navigation"; // Keeping for now if needed elsewhere, but likely unused
// Actually, let's just remove it if it's the only usage.
// Wait, I can't see if it's used elsewhere easily without reading, but I replaced the only usage I knew of.
// Let's just leave it or remove it. I'll remove it.
import { useRouter } from "next/navigation";
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

export default function Question({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { id: editionId } = use(params);
  const sp = use(searchParams); // Unwrap searchParams to satisfy Next.js 15 strictness
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const router = useTransitionRouter();
  // Actually, useParams returns Params, not a Promise in Client Components usually, but Next.js 15 changed this for Page props.
  // Wait, useParams() from next/navigation is a hook.
  // The error says "params are being enumerated. params is a Promise".
  // This usually happens when using `props.params` in a Server Component or `useParams` in a way that expects sync access but it's now async-like or strict.
  // However, `useParams` hook *returns* the params.
  // Let's look at the error again: "params are being enumerated. params is a Promise".
  // This typically refers to the `params` prop passed to the page component, NOT `useParams()`.
  // But this file is "use client".
  // Ah, `useParams` in Next 15 might return a Promise? No, `useParams` returns `Params`.
  // BUT, if the user is passing `params` as a prop to a client component from a server component page, that might be it.
  // Wait, `export default function Question() {` is the page component.
  // In Next.js 15, Page components receive `params` as a Promise.
  // Even in "use client" files?
  // Yes, if it's a page.
  // So I should change the signature to accept props.

  // Let's check how `params` is defined currently.
  // `const params = useParams();`
  // If `useParams()` is used, it should be fine?
  // The error stack trace says: `at Question.useEffect (src/app/edition/[id]/present/closing/page.tsx:80:15)`
  // Line 80 is `console.log(emblaApi.slideNodes())`.
  // That seems unrelated to `params`.

  // Wait, the error message says: `params are being enumerated. params is a Promise`.
  // This often happens when `useParams` is used?
  // "In Next.js 15, `params` and `searchParams` props are Promises."
  // "If you are using `useParams` hook, it remains synchronous." -> WRONG?
  // Actually, `useParams` returns `Params` which is an object.

  // Let's look at the file again.
  // `const params = useParams();`
  // `const editionId = typeof params?.id === "string" ? params.id : undefined;`

  // If `useParams` returns a Promise (which it shouldn't, but maybe the user is on a canary version or I'm mistaken about 15 vs 16 behavior), then accessing `params.id` would fail.
  // BUT the error says "params are being enumerated".
  // `typeof params?.id` might trigger enumeration?

  // Actually, looking at Next.js 15 docs:
  // "The `params` and `searchParams` props passed to layouts and pages are now Promises."
  // "The `useParams` hook is NOT a Promise."

  // So why is the user seeing this?
  // Maybe they are passing `params` as a prop?
  // `export default function Question() {` -> It takes NO props.
  // So `useParams()` is the only source.

  // Wait, the error might be misleading or I'm misinterpreting "Question.useEffect".
  // Is it possible `useParams` is returning a Promise in this version?
  // "Next.js version: 16.0.7 (Turbopack)" -> This is very new.
  // Maybe in 16, `useParams` is also async?

  // Let's try to wrap it with `use()` just in case, or handle it as a Promise.
  // But `use()` expects a Promise.

  // Alternative: The user might be using `params` from the Page props but didn't declare it?
  // No, the code is `const params = useParams();`.

  // Let's assume `useParams` returns a Promise-like object or the user is actually receiving props and I missed it?
  // No, I see the file content.

  // Let's try to change how we access `params`.
  // Instead of `useParams`, let's accept `params` as a prop and `use()` it.
  // `export default function Question({ params }: { params: Promise<{ id: string }> }) {`
  // And remove `useParams`.

  // This is the recommended way for Pages in Next 15+.

  // Let's try that.

  const [song, setSong] = useState<string | null>(null);
  const [songArtist, setSongArtist] = useState<string | null>(null);
  const [songTitle, setSongTitle] = useState<string | null>(null);
  const [songAlbumArt, setSongAlbumArt] = useState<string | null>(null);
  const [endGif1, setEndGif1] = useState<string | null>(null);
  const [endGif2, setEndGif2] = useState<string | null>(null);



  const [hasTiebreaker, setHasTiebreaker] = useState<boolean>(false);

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
    if (hasTiebreaker) {
      router.push(`/edition/${editionId}/present/tiebreaker/scoreboard`);
    } else {
      router.push(`/edition/${editionId}/present/final/`);
    }
  });


  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false }, [Fade()])

  useHotkeys("left", () => {
    emblaApi?.scrollPrev()
  });

  useHotkeys("right", () => {
    emblaApi?.scrollNext()
  });

  // useEffect(() => {
  //   if (emblaApi) {
  //     console.log(emblaApi.slideNodes()) // Access API
  //   }
  // }, [emblaApi])



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

        setEndGif1(pb.files.getUrl(response, response.end_gif_1));
        setEndGif2(pb.files.getUrl(response, response.end_gif_2));

        // Check for tiebreaker answers
        const tiebreakerAnswers = await pb.collection("answers").getList(1, 1, {
          filter: `edition_id = "${editionId}" && answer_type = "tiebreaker"`,
        });
        setHasTiebreaker(tiebreakerAnswers.totalItems > 0);

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
            <AppleScriptPlayer trackId={song} />
          </div>
        )}
      </div>
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          <div className="embla__slide p-4 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
            <div className="flex items-center justify-center w-full relative h-[70vh]">
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
            <div className="flex items-center justify-center w-full relative h-[70vh]">
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
                <div className="animate-fade-in">
                  <Image src={songAlbumArt} alt="Song Album Art" width="600" height="600" />
                </div>
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