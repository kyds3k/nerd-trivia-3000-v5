"use client"

import React from 'react';

import { useEffect, useState } from 'react';
import { useParams } from "next/navigation";
import Pocketbase from "pocketbase";
//import { Image } from "@heroui/react";
import Image from 'next/image';
import AppleScriptPlayer from "@/components/AppleScriptPlayer";
import useEmblaCarousel from 'embla-carousel-react'
import Fade from 'embla-carousel-fade'
import { useHotkeys } from "react-hotkeys-hook";
import { Spinner } from "@heroui/react";
import { useTransitionRouter } from "next-transition-router";
import { set } from 'lodash';
import ShallNotPass from "@/components/ShallNotPass";
import { useSession } from "next-auth/react";
import { getAppleMusicTrack } from "@/lib/appleMusic";


interface Wager {
  edition_id: string;
  wager_intro_gif: string;
  final_cat: string;
  final_cat_gif: string;
  wager_placing_gif: string;
  wager_song_apple: string;
  is_active: boolean;
}

export default function Wager() {
  const router = useTransitionRouter();
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const [song, setSong] = useState<string | null>(null);
  const [songArtist, setSongArtist] = useState<string | null>(null);
  const [songTitle, setSongTitle] = useState<string | null>(null);
  const [songAlbumArt, setSongAlbumArt] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);

  const [wagerIntroGif, setWagerIntroGif] = useState<string | null>(null);
  const [finalCat, setFinalCat] = useState<string | null>(null);
  const [finalCatGif, setFinalCatGif] = useState<string | null>(null);
  const [wagerPlacingGif, setWagerPlacingGif] = useState<string | null>(null);
  const [timerStarted, setTimerStarted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);


  useHotkeys("ctrl+ArrowRight", () => {
    router.push(`/edition/${editionId}/present/final`);
  });

  useHotkeys("ctrl+ArrowLeft", () => {
    router.push(`/edition/${editionId}/present/wager`);
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
        setSongArtist(track.artist);
        setSongTitle(track.title);
        setSongAlbumArt(track.artworkUrl);
      }
    } catch (error) {
      console.error("Failed to fetch song info:", error);
    }
  }

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





    const fetchWager = async () => {
      try {
        pb.autoCancellation(false);
        const response = await pb
          .collection("wager_rounds")
          .getFirstListItem<Wager>(`edition_id = "${editionId}"`);

        console.log("Wager round fetched:", response);

        setWagerIntroGif(response.wager_intro_gif);
        setFinalCat(response.final_cat);
        setFinalCatGif(response.final_cat_gif);
        setWagerPlacingGif(response.wager_placing_gif);
        setSong(response.wager_song_apple);

        setIsActive(response.is_active);

      } catch (error) {
        console.error("Failed to fetch wager round:", error);
      }
    };

    if (editionId) {
      initializeApp();
      fetchWager();
    }
  }, []);

  useEffect(() => {
    if (song) {
      getSongInfo(song);
    }
  }, [song]);


  return (
    <div className="h-svh overflow-y-hidden">
      <div className="flex justify-between p-4">
        <h1 className="py-4 pl-4 text-2xl">Wager Round</h1>
        {song && (
          <div>
            <AppleScriptPlayer trackId={song} />
          </div>
        )}
      </div>
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">

          {/* First Slide */}
          <div className="embla__slide p-4 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
            <div className="p-8 flex items-center justify-center">
              <h3 className="text-6xl flex justify-items-center">WAGER ROUND</h3>
            </div>
            <div className="flex items-center justify-center w-full grow relative">
              {wagerIntroGif ? (
                <Image
                  src={wagerIntroGif}
                  alt="Wager intro GIF"
                  fill={true}
                  unoptimized={true}
                  className="object-contain"
                />
              ) : (
                <Spinner size="lg" />
              )}
            </div>
          </div>

          {/* Second Slide */}
          <div className="embla__slide p-4 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
            <div className="p-8 flex items-center justify-center">
              <h3 className="text-6xl flex justify-items-center">{finalCat}</h3>
            </div>
            <div className="flex items-center justify-center w-full grow relative">
              {finalCatGif ? (
                <Image
                  src={finalCatGif}
                  alt="Final Category GIF"
                  fill={true}
                  unoptimized={true}
                  className="object-contain"
                />
              ) : (
                <Spinner size="lg" />
              )}
            </div>
          </div>

          {/* Third Slide */}
          <div className="embla__slide p-4 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
            <div className="p-8 flex items-center justify-center">
              <h3 className="text-6xl flex justify-items-center">PLACE YOUR WAGERS</h3>
            </div>
            <div className="flex items-center justify-center w-full grow relative">
              {wagerPlacingGif ? (
                <Image
                  src={wagerPlacingGif}
                  alt="Place your wagers GIF"
                  fill={true}
                  unoptimized={true}
                  className="object-contain"
                />
              ) : (
                <Spinner size="lg" />
              )}
            </div>
          </div>

          {/* Last Slide */}
          <div className="embla__slide p-8 h-[calc(100vh-4rem)] flex flex-col items-center justify-start gap-4">
            {songAlbumArt ? (
              <>
                <Image src={songAlbumArt} alt="Song Album Art" height="600" width="600" />
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