"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
// Helper: Spotify Track Info Fetcher
const fetchSpotifyTrackInfo = async (uri: string, token: string, refreshToken?: () => Promise<string | null>) => {
  // Accepts Spotify URI or URL, extracts track id, fetches metadata
  if (!uri) return null;
  let match = uri.match(/spotify:track:([a-zA-Z0-9]+)/);
  if (!match) {
    // Try URL
    match = uri.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  }
  const trackId = match ? match[1] : null;
  if (!trackId) return null;
  try {
    const resp = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // If 401 and we have a refresh callback, try to get a new token and retry
    if (resp.status === 401 && refreshToken) {
      const newToken = await refreshToken();
      if (newToken) {
        const retryResp = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: { Authorization: `Bearer ${newToken}` },
        });
        if (!retryResp.ok) return null;
        const retryData = await retryResp.json();
        return {
          title: retryData.name,
          artists: retryData.artists?.map((a: any) => a.name).join(", "),
          albumImage: retryData.album?.images?.[2]?.url || retryData.album?.images?.[0]?.url || "",
        };
      }
    }

    if (!resp.ok) return null;
    const data = await resp.json();
    return {
      title: data.name,
      artists: data.artists?.map((a: any) => a.name).join(", "),
      albumImage: data.album?.images?.[2]?.url || data.album?.images?.[0]?.url || "",
    };
  } catch (e) {
    return null;
  }
};

// Helper: Sleep function to add delays between requests
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: fetch Spotify client credentials token (public)
const getSpotifyToken = async () => {
  // Use env vars for client id/secret
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + (typeof window !== "undefined" && window.btoa
        ? window.btoa(`${clientId}:${clientSecret}`)
        : Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
      ),
    },
    body: "grant_type=client_credentials",
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.access_token;
};


import {
  Tabs,
  Tab,
  Button,
  Input,
  Select,
  SelectItem,
  Divider,
  DatePicker,
  Progress
} from "@heroui/react";
import { useRouter } from "next/navigation";
import Pocketbase from "pocketbase";
import { parseDate, CalendarDate, DateValue } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { useParams } from "next/navigation";
import Tiptap from "@/components/TipTap";
import ShallNotPass from "@/components/ShallNotPass";
import { useEditionDraft } from "../../../../src/hooks/useEditionDraft";
import { useDateField } from "../../../../src/hooks/useDateField";
import GifPicker, { Theme } from "gif-picker-react";



export default function NewEditionPage() {

  console.log("PB URL IS:", process.env.NEXT_PUBLIC_POCKETBASE_URL);
  // Initialize Pocketbase instance
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL || "");
  // --- All useState declarations for songs, GIFs, questions, answers, and other UI state ---
  // Songs
  // Removed redundant local state for songs. Using editionData directly.

  // Spotify track info states
  const [homeSongInfo, setHomeSongInfo] = useState<any>(null);
  const [r1SongInfos, setR1SongInfos] = useState<any[]>(Array(5).fill(null));
  const [r2SongInfos, setR2SongInfos] = useState<any[]>(Array(5).fill(null));
  const [r3SongInfos, setR3SongInfos] = useState<any[]>(Array(5).fill(null));
  const [imp1SongInfos, setImp1SongInfos] = useState<any[]>([]);
  const [imp2SongInfos, setImp2SongInfos] = useState<any[]>([]);
  const [wagerSongInfo, setWagerSongInfo] = useState<any>(null);
  const [finalSongInfo, setFinalSongInfo] = useState<any>(null);
  // Spotify token state
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  // All other UI state (questions, answers, gifs, etc)
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadMessage, setLoadMessage] = useState("Creating edition . . .");
  const [authData, setAuthData] = useState(null);
  const [date, setDate] = React.useState<any>(null);
  let formatter = useDateFormatter({ dateStyle: "full" });
  const [error, setError] = useState<string | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  // Lazy GIF Pickers toggle state
  const [showEditionGifPicker, setShowEditionGifPicker] = useState(false);
  const [showR1GifPicker, setShowR1GifPicker] = useState(false);
  const [showR2GifPicker, setShowR2GifPicker] = useState(false);
  const [showR3GifPicker, setShowR3GifPicker] = useState(false);
  const [showWagerIntroGifPicker, setShowWagerIntroGifPicker] = useState(false);
  const [showFinalCategoryGifPicker, setShowFinalCategoryGifPicker] = useState(false);
  const [showWagerPlacingGifPicker, setShowWagerPlacingGifPicker] = useState(false);
  const [showFinalIntroGifPicker, setShowFinalIntroGifPicker] = useState(false);
  const [showFinalAnswerGifPicker, setShowFinalAnswerGifPicker] = useState(false);
  const [showEndGif1Picker, setShowEndGif1Picker] = useState(false);
  const [showEndGif2Picker, setShowEndGif2Picker] = useState(false);
  // Impossible 1/2 theme gif pickers
  const [showImp1ThemeGifPicker, setShowImp1ThemeGifPicker] = useState(false);
  const [showImp2ThemeGifPicker, setShowImp2ThemeGifPicker] = useState(false);
  // Impossible 1/2 intro gif pickers (lazy loaded)
  const [showImp1IntroGifPicker, setShowImp1IntroGifPicker] = useState(false);
  const [showImp2IntroGifPicker, setShowImp2IntroGifPicker] = useState(false);

  // Ref to collect all GifPicker search inputs
  const gifInputsRef = useRef<HTMLInputElement[]>([]);

  // --- useEditionDraft must be before any useEffect that references editionData ---
  const {
    editionData,
    updateField,
    updateArrayItem,
    addArrayItem,
    removeArrayItem,
    clearDraft,
  } = useEditionDraft();

  // --- useDateField depends on editionData ---
  const { parsedDate, onDateChange } = useDateField(editionData.date, updateField("date"));

  // Token refresh callback for Spotify API retry logic
  const refreshSpotifyToken = useCallback(async () => {
    const newToken = await getSpotifyToken();
    if (newToken) {
      setSpotifyToken(newToken);
      try {
        localStorage.setItem("spotify_token", newToken);
        localStorage.setItem("spotify_token_timestamp", Date.now().toString());
      } catch (e) { /* ignore */ }
    }
    return newToken;
  }, []);

  // --- All useEffect hooks that depend on editionData or song states come after variable declarations ---
  // Fetch and refresh Spotify token with caching in localStorage
  useEffect(() => {
    let ignore = false;
    const TOKEN_KEY = "spotify_token";
    const TIMESTAMP_KEY = "spotify_token_timestamp";
    const MAX_AGE_MS = 55 * 60 * 1000; // 55 minutes
    let intervalId: NodeJS.Timeout | number | null = null;

    async function fetchAndCacheToken() {
      const token = await getSpotifyToken();
      if (token && !ignore) {
        setSpotifyToken(token);
        try {
          localStorage.setItem(TOKEN_KEY, token);
          localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
        } catch (e) { /* ignore */ }
      }
    }

    function getCachedToken() {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const timestamp = localStorage.getItem(TIMESTAMP_KEY);
        if (token && timestamp) {
          const age = Date.now() - parseInt(timestamp, 10);
          if (!isNaN(age) && age < MAX_AGE_MS) {
            return token;
          }
        }
      } catch (e) { /* ignore */ }
      return null;
    }

    // Initial check
    const cachedToken = getCachedToken();
    if (cachedToken) {
      setSpotifyToken(cachedToken);
    } else {
      fetchAndCacheToken();
    }

    // Set up interval to refresh every 55 minutes
    intervalId = setInterval(() => {
      fetchAndCacheToken();
    }, MAX_AGE_MS);

    return () => {
      ignore = true;
      if (intervalId) clearInterval(intervalId as number);
    };
  }, []);

  // --- Home Song Info ---
  // --- Home Song Info ---
  useEffect(() => {
    if (!spotifyToken || spotifyToken === "") return;
    if (!editionData.homeSong) { setHomeSongInfo(null); return; }
    let ignore = false;
    fetchSpotifyTrackInfo(editionData.homeSong, spotifyToken, refreshSpotifyToken).then(info => {
      if (!ignore) setHomeSongInfo(info);
    });
    return () => { ignore = true; };
  }, [editionData.homeSong, spotifyToken, refreshSpotifyToken]);

  // --- Round 1 Song Infos ---
  useEffect(() => {
    if (!spotifyToken || spotifyToken === "") return;
    let ignore = false;
    const songUris = editionData.r1Songs || [];
    Promise.all(songUris.map((uri: string) =>
      uri ? fetchSpotifyTrackInfo(uri, spotifyToken, refreshSpotifyToken) : Promise.resolve(null)
    )).then((infos) => { if (!ignore) setR1SongInfos(infos); });
    return () => { ignore = true; };
  }, [editionData.r1Songs, spotifyToken, refreshSpotifyToken]);
  // --- Round 2 Song Infos ---
  useEffect(() => {
    if (!spotifyToken || spotifyToken === "") return;
    let ignore = false;
    const songUris = editionData.r2Songs || [];
    Promise.all(songUris.map((uri: string) =>
      uri ? fetchSpotifyTrackInfo(uri, spotifyToken, refreshSpotifyToken) : Promise.resolve(null)
    )).then((infos) => { if (!ignore) setR2SongInfos(infos); });
    return () => { ignore = true; };
  }, [editionData.r2Songs, spotifyToken, refreshSpotifyToken]);
  // --- Round 3 Song Infos ---
  useEffect(() => {
    if (!spotifyToken || spotifyToken === "") return;
    let ignore = false;
    const songUris = editionData.r3Songs || [];
    Promise.all(songUris.map((uri: string) =>
      uri ? fetchSpotifyTrackInfo(uri, spotifyToken, refreshSpotifyToken) : Promise.resolve(null)
    )).then((infos) => { if (!ignore) setR3SongInfos(infos); });
    return () => { ignore = true; };
  }, [editionData.r3Songs, spotifyToken, refreshSpotifyToken]);

  // --- Impossible 1 Song Infos ---
  useEffect(() => {
    if (!spotifyToken || spotifyToken === "") return;
    let ignore = false;
    const songUris = editionData.imp1Songs || [];
    Promise.all(
      Array.from({ length: editionData.imp1SongCount || 0 }).map((_, idx) =>
        editionData.imp1Songs?.[idx]
          ? fetchSpotifyTrackInfo(editionData.imp1Songs[idx], spotifyToken, refreshSpotifyToken)
          : Promise.resolve(null)
      )
    ).then((infos) => { if (!ignore) setImp1SongInfos(infos); });
    return () => { ignore = true; };
  }, [editionData.imp1Songs, editionData.imp1SongCount, spotifyToken, refreshSpotifyToken]);

  // --- Sync Song Counts on Mount (Migration Helper) ---
  useEffect(() => {
    if (editionData.imp1SongCount === 0 && editionData.imp1Songs) {
      const count = Array.isArray(editionData.imp1Songs) ? editionData.imp1Songs.length : Object.keys(editionData.imp1Songs).length;
      if (count > 0) updateField("imp1SongCount")(count);
    }
    if (editionData.imp2SongCount === 0 && editionData.imp2Songs) {
      const count = Array.isArray(editionData.imp2Songs) ? editionData.imp2Songs.length : Object.keys(editionData.imp2Songs).length;
      if (count > 0) updateField("imp2SongCount")(count);
    }
  }, []); // Run once on mount

  // --- Impossible 2 Song Infos ---
  useEffect(() => {
    if (!spotifyToken || spotifyToken === "") return;
    let ignore = false;
    const songUris = editionData.imp2Songs || [];
    Promise.all(
      Array.from({ length: editionData.imp2SongCount || 0 }).map((_, idx) =>
        editionData.imp2Songs?.[idx]
          ? fetchSpotifyTrackInfo(editionData.imp2Songs[idx], spotifyToken, refreshSpotifyToken)
          : Promise.resolve(null)
      )
    ).then((infos) => { if (!ignore) setImp2SongInfos(infos); });
    return () => { ignore = true; };
  }, [editionData.imp2Songs, editionData.imp2SongCount, spotifyToken, refreshSpotifyToken]);

  // --- Wager Song Info ---
  // --- Wager Song Info ---
  useEffect(() => {
    if (!spotifyToken || spotifyToken === "") return;
    if (!editionData.wagerSong) { setWagerSongInfo(null); return; }
    let ignore = false;
    fetchSpotifyTrackInfo(editionData.wagerSong, spotifyToken, refreshSpotifyToken).then(info => {
      if (!ignore) setWagerSongInfo(info);
    });
    return () => { ignore = true; };
  }, [editionData.wagerSong, spotifyToken, refreshSpotifyToken]);

  // --- Final Song Info ---
  // --- Final Song Info ---
  useEffect(() => {
    if (!spotifyToken || spotifyToken === "") return;
    if (!editionData.finalSong) { setFinalSongInfo(null); return; }
    let ignore = false;
    fetchSpotifyTrackInfo(editionData.finalSong, spotifyToken, refreshSpotifyToken).then(info => {
      if (!ignore) setFinalSongInfo(info);
    });
    return () => { ignore = true; };
  }, [editionData.finalSong, spotifyToken, refreshSpotifyToken]);





  pb.autoCancellation(false);



  /* function grabInfo to find the data-identifier of everything on the page and output to console */
  const grabInfo = () => {
    const elements = document.querySelectorAll("[data-identifier]");
    elements.forEach((element) => {

      console.log(element.getAttribute("data-identifier"));
      console.log(element.getAttribute("data-type"));

      if (element.getAttribute("data-type") === "question" || element.getAttribute("data-type") === "answer") {
        // console log its data-html attribute
        console.log(element.getAttribute("data-html"));
      }

      if (element.getAttribute("data-type") === "date") {
        // find the hidden input inside it and console log its value
        console.log(element.querySelector("input")?.value);
      }

    });
  };

  type UpdateQuestionFunction = (
    round: 1 | 2 | 3,
    index: number,
    value: string
  ) => void;

  type UpdateAnswerFunction = (
    round: 1 | 2 | 3 | "imp1" | "imp2",
    index: number,
    value: string
  ) => void;

  const updateQuestion: UpdateQuestionFunction = (round, index, value) => {
    const fieldMap: Record<1 | 2 | 3, keyof typeof editionData> = {
      1: "r1Questions",
      2: "r2Questions",
      3: "r3Questions"
    };
    updateArrayItem(fieldMap[round], index, value);
  };
  const updateAnswer: UpdateAnswerFunction = (round, index, value) => {
    const fieldMap: Record<1 | 2 | 3 | "imp1" | "imp2", keyof typeof editionData> = {
      1: "r1Answers",
      2: "r2Answers",
      3: "r3Answers",
      imp1: "imp1Answers",
      imp2: "imp2Answers",
    };
    updateArrayItem(fieldMap[round], index, value);
  };

  const handleImp1Songs = (index: number, value: string) => {
    updateArrayItem("imp1Songs", index, value);
  };

  const handleImp2Songs = (index: number, value: string) => {
    updateArrayItem("imp2Songs", index, value);
  };


  const updateQuestions = async (
    editionId: string,
    roundQuestions: string[][],
    roundSongs: string[][],
    roundAnswers: string[][],
    roundAnswerGifs: string[][]
  ): Promise<any[][]> => {
    // Loop through rounds (outer array of questions)
    const updatedQuestions = await Promise.all(
      roundQuestions.map(async (questions, roundIndex) => {
        const round = roundIndex + 1; // Rounds are 1-based

        setLoadMessage(`Creating questions for round ${round}...`);

        // Update each question in the round sequentially with delays
        const updatedRoundQuestions = [];
        for (let questionIndex = 0; questionIndex < questions.length; questionIndex++) {
          const questionText = questions[questionIndex];

          // Update the question with its corresponding data
          const updatedQuestion = await pb.collection("questions").create({
            question_text: questionText,
            song: roundSongs[roundIndex][questionIndex],
            answer: roundAnswers[roundIndex][questionIndex],
            answer_gif: roundAnswerGifs[roundIndex][questionIndex],
            bantha_answer: round === 1 && questionIndex === 2 ? editionData.banthaAnswer : '',
            bantha_answer_gif: round === 1 && questionIndex === 2 ? editionData.banthaAnswerGif : '',
            round_number: round,
            question_number: questionIndex + 1,
            edition_id: editionId,
          });

          setLoadMessage(`Round ${round} Question ${questionIndex + 1} created . . .`);
          updatedRoundQuestions.push(updatedQuestion);

          // Add delay between questions to avoid rate limiting
          if (questionIndex < questions.length - 1) {
            await sleep(200);
          }
        }

        // Add delay between rounds
        if (roundIndex < roundQuestions.length - 1) {
          await sleep(300);
        }

        return updatedRoundQuestions;
      })
    );

    return updatedQuestions;
  };

  const updateImpossibleRounds = async (
    editionId: string,
    imp1Songs: { [key: number]: string },
    imp1Answers: string[],
    imp1AnswerGifs: { [key: number]: string },
    imp2Songs: { [key: number]: string },
    imp2Answers: string[],
    imp2AnswerGifs: { [key: number]: string }
  ): Promise<any[][]> => {
    const updatedRounds = await Promise.all([
      updateImpossibleRound(editionId, 1, imp1Songs, imp1Answers, imp1AnswerGifs),
      updateImpossibleRound(editionId, 2, imp2Songs, imp2Answers, imp2AnswerGifs),
    ]);
    return updatedRounds;
  }

  const updateImpossibleRound = async (
    editionId: string,
    roundNumber: 1 | 2,
    songs: { [key: number]: string },
    answers: string[],
    answerGifs: { [key: number]: string }
  ): Promise<any[]> => {
    const round = roundNumber;
    const roundData = roundNumber === 1 ? {
      intro_gif: editionData.imp1IntroGif,
      theme: editionData.imp1Theme,
      theme_gif: editionData.imp1ThemeGif,
      question_text: editionData.imp1Question,
      point_value: editionData.imp1AnswerValue,
      spotify_ids: songs,
      answers: answers,
      answer_gifs: answerGifs,
      edition_id: editionId,
      impossible_number: 1
    } : {
      intro_gif: editionData.imp2IntroGif,
      theme: editionData.imp2Theme,
      theme_gif: editionData.imp2ThemeGif,
      question_text: editionData.imp2Question,
      point_value: editionData.imp2AnswerValue,
      spotify_ids: songs,
      answers: answers,
      answer_gifs: answerGifs,
      edition_id: editionId,
      impossible_number: 2
    };

    const updatedRound = await pb.collection("impossible_rounds").create(roundData);
    setLoadMessage(`Impossible Round ${round} updated . . .`);
    return [updatedRound];
  };

  const handleSaveProgress = async () => {
    setIsSaving(true);
    try {
      // 1. Get the data from local storage
      const draftString = localStorage.getItem("new_edition_draft");

      if (!draftString) {
        alert("No draft data found in local storage.");
        return;
      }

      // 2. Parse it to ensure it is valid JSON object before sending to PB
      const draftJson = JSON.parse(draftString);

      // 3. Ensure Auth is valid
      await refreshAuthState();

      // 4. Upload to Pocketbase
      if (editionData.id) {
        // Update existing
        await pb.collection("wip_editions").update(editionData.id, {
          progress: draftJson,
        });
        console.log("Updated existing draft:", editionData.id);
      } else {
        // Create new
        const record = await pb.collection("wip_editions").create({
          progress: draftJson,
        });
        // Update local state with the new ID so subsequent saves update this record
        updateField("id")(record.id);
        // Also update localStorage so a reload keeps the ID
        const updatedDraft = { ...draftJson, id: record.id };
        localStorage.setItem("new_edition_draft", JSON.stringify(updatedDraft));
        console.log("Created new draft:", record.id);
      }

      alert("Progress saved successfully!");
    } catch (err) {
      console.error("Error saving progress:", err);
      alert("Failed to save progress. Check console for details.");
    } finally {
      setIsSaving(false);
    }
  };


  const handleCreateEdition = async () => {
    // scroll the page to the top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    setLoadMessage("Creating edition . . .");

    try {
      // // Wait for authentication to complete
      await refreshAuthState();

      // Step 1: Validate that a date is selected
      if (!parsedDate) {
        setError("Please select a date for the edition.");
        setLoading(false);
        return;
      }

      // Step 2: Update the Edition
      const formattedDate = `${parsedDate.year}-${String(parsedDate.month).padStart(2, '0')}-${String(parsedDate.day).padStart(2, '0')} 12:00:00`;

      const updatedEdition = await pb.collection("editions").create({
        title: editionData.title,
        date: formattedDate, // Ensure `date` is formatted correctly
        edition_gif: editionData.editionGif,
        blurb: editionData.blurb,
        home_song: editionData.homeSong,
        end_gif_1: editionData.endGif1,
        end_gif_2: editionData.endGif2,
      });

      const editionId = updatedEdition.id;
      console.log("Edition created:", updatedEdition);

      // Step 1.5: Reset all active states for this edition
      setLoadMessage("Resetting active states...");

      // Reset all questions to inactive
      const allQuestions = await pb.collection("questions").getFullList({
        filter: `edition_id="${editionId}"`
      });
      for (const question of allQuestions) {
        await pb.collection("questions").update(question.id, { is_active: false });
      }

      // Reset impossible rounds to inactive
      const impossibleRounds = await pb.collection("impossible_rounds").getFullList({
        filter: `edition_id="${editionId}"`
      });
      for (const impossible of impossibleRounds) {
        await pb.collection("impossible_rounds").update(impossible.id, { is_active: false });
      }

      // Reset wager round to inactive
      const wagerRounds = await pb.collection("wager_rounds").getFullList({
        filter: `edition_id="${editionId}"`
      });
      for (const wager of wagerRounds) {
        await pb.collection("wager_rounds").update(wager.id, { is_active: false });
      }

      // Reset final round to inactive
      const finalRounds = await pb.collection("final_rounds").getFullList({
        filter: `edition_id="${editionId}"`
      });
      for (const final of finalRounds) {
        await pb.collection("final_rounds").update(final.id, { is_active: false });
      }

      console.log("All active states reset!");

      // Step 1.6: Create the rounds in a loop of 3

      for (let i = 1; i < 4; i++) {
        const roundGif = i === 1 ? editionData.r1Gif : i === 2 ? editionData.r2Gif : editionData.r3Gif;
        await pb.collection("rounds").create({
          //console.log({        
          edition_id: editionId,
          round: i,
          type: "regular",
          round_gif: roundGif
        });
        // Add delay between round creations
        if (i < 3) {
          await sleep(200);
        }
      }

      console.log("Rounds created!");

      setLoadMessage("Rounds created!")

      // Add delay before creating questions
      await sleep(500);

      // Helper to pad arrays
      const padArray = (arr: any[], length: number, fillValue: any = "") => {
        const newArr = [...(arr || [])];
        while (newArr.length < length) {
          newArr.push(fillValue);
        }
        return newArr.slice(0, length);
      };

      // Step 2: Update the Questions
      const roundQuestions = [
        padArray(editionData.r1Questions, 5),
        padArray(editionData.r2Questions, 5),
        padArray(editionData.r3Questions, 5)
      ];
      const roundSongs = [
        padArray(editionData.r1Songs, 5),
        padArray(editionData.r2Songs, 5),
        padArray(editionData.r3Songs, 5)
      ];
      const roundAnswers = [
        padArray(editionData.r1Answers, 5),
        padArray(editionData.r2Answers, 5),
        padArray(editionData.r3Answers, 5)
      ];
      const roundAnswerGifs = [
        padArray(editionData.r1AnswerGifs, 5),
        padArray(editionData.r2AnswerGifs, 5),
        padArray(editionData.r3AnswerGifs, 5)
      ];
      const roundGifs = [editionData.r1Gif, editionData.r2Gif, editionData.r3Gif];

      const updatedQuestions = await updateQuestions(
        editionId, // Now guaranteed to be a string
        roundQuestions,
        roundSongs,
        roundAnswers,
        roundAnswerGifs
      );

      console.log("Questions created!");

      // Add delay before creating impossible rounds
      await sleep(500);

      // Step 3: Update the Impossible Rounds
      const updatedRounds = await updateImpossibleRounds(
        editionId,
        editionData.imp1Songs,
        editionData.imp1Answers,
        editionData.imp1AnswerGifs,
        editionData.imp2Songs,
        editionData.imp2Answers,
        editionData.imp2AnswerGifs
      );

      console.log("Impossible Rounds created!");

      // Add delay before creating wager round
      await sleep(500);

      // Step 4: Update the Wager Round
      // Grab the wager_round item whose edition_id equals editionId, grab its id, and put it into a const WagerRoundId
      setLoadMessage("Creating wager round . . .");

      const updatedWagerRound = await pb.collection("wager_rounds").create({
        wager_intro_gif: editionData.wagerIntroGif,
        final_cat: editionData.finalCategory,
        final_cat_gif: editionData.finalCategoryGif,
        wager_placing_gif: editionData.wagerPlacingGif,
        wager_song: editionData.wagerSong,
        edition_id: editionId,
      });

      console.log("Wager round created!");

      // Add delay before creating final round
      await sleep(500);

      //Step 5: Update the Final Round
      setLoadMessage("Creating final round!");

      const finalRoundData = {
        final_intro_gif: editionData.finalIntroGif,
        question_text: editionData.finalQuestion,
        answer: editionData.finalAnswer,
        final_answer_gif: editionData.finalAnswerGif,
        final_song: editionData.finalSong,
        edition_id: editionId,
      };

      console.log("Creating final round with data:", finalRoundData);

      const updatedFinalRound = await pb.collection("final_rounds").create(finalRoundData);

      console.log("Final round created!");

      setError("Edition created successfully!");
    } catch (err: any) {
      console.error("Failed to create edition:", err);
      console.error("Error details:", err?.data);
      console.error("Error response:", err?.response);

      let errorMessage = "Failed to create the edition. ";
      if (err?.data?.message) {
        errorMessage += err.data.message;
      } else if (err?.message) {
        errorMessage += err.message;
      } else {
        errorMessage += "Please try again later.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  function syncArrayToCount<T>(
    current: T[] | undefined,
    count: number,
    fallback: T,
  ): T[] {
    const updated = [...(current || [])];
    while (updated.length < count) updated.push(fallback);
    return updated.slice(0, count);
  }


  const refreshAuthState = async () => {
    if (!pb.authStore.isValid) {
      try {
        const adminEmail = process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_EMAIL ?? '';
        const adminPass = process.env.NEXT_PUBLIC_POCKETBASE_ADMIN_PW ?? '';

        if (!adminEmail || !adminPass) {
          throw new Error("Admin email or password is not set in environment variables");
        }

        await pb.admins.authWithPassword(adminEmail, adminPass);
        console.log("Authenticated successfully:", pb.authStore.isValid);
      } catch (error) {
        console.error("Failed to refresh auth state:", error);
      }
    }
  };

  useEffect(() => {
    // Impossible 1
    updateField("imp1Songs")(syncArrayToCount(editionData.imp1Songs, editionData.imp1SongCount, ""));
    updateField("imp1Answers")(syncArrayToCount(editionData.imp1Answers, editionData.imp1AnswerCount, ""));
    updateField("imp1AnswerGifs")(syncArrayToCount(editionData.imp1AnswerGifs, editionData.imp1AnswerCount, ""));

    // Impossible 2
    updateField("imp2Songs")(syncArrayToCount(editionData.imp2Songs, editionData.imp2SongCount, ""));
    updateField("imp2Answers")(syncArrayToCount(editionData.imp2Answers, editionData.imp2AnswerCount, ""));
    updateField("imp2AnswerGifs")(syncArrayToCount(editionData.imp2AnswerGifs, editionData.imp2AnswerCount, ""));
  }, [
    editionData.imp1SongCount,
    editionData.imp1AnswerCount,
    editionData.imp2SongCount,
    editionData.imp2AnswerCount,
  ]);



  useEffect(() => {
    refreshAuthState();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 z-50 bg-secondary text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105"
        aria-label="Back to top"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      </button>
      <div className="p-10">
        <div className="absolute top-10 right-10 flex gap-4">
          <Button
            color="secondary" // or "primary" to make it stand out
            onPress={handleSaveProgress}
            isLoading={isSaving}
          >
            Save Progress
          </Button>
          <Button
            color="primary"
            onPress={handleCreateEdition}
            isLoading={loading}
          >
            Create Edition
          </Button>
          <Button
            onPress={() => router.push("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
        <h1 className="mb-6 text-2xl">New Edition</h1>
        {loading ? (
          <div>
            <p className="mb-3">{loadMessage}</p>
            <Progress
              size="md"
              isIndeterminate
              aria-label="Loading edition"
              className="max-w-md my-4"
            />
          </div>
        ) : (
          <p className="my-4">{error}</p>
        )}
        {/*
          Tabs onChange: blur all collected GifPicker search inputs to prevent scroll jumps
        */}
        {/*
          Clear gifInputsRef.current before each mount to avoid duplicates
        */}
        <Tabs
          aria-label="Rounds"
          destroyInactiveTabPanel={true}
          size="lg"
          variant="bordered"
          classNames={{ tabList: "mb-4 sticky top-14" }}
          onChange={() => {
            setTimeout(() => {
              gifInputsRef.current.forEach(input => input?.blur());
            }, 50);
          }}
        >
          <Tab key="landing" title="Landing">
            <h3 className="mb-8 text-2xl">Landing Page</h3>

            <div className="ml-4">
              <div className="mb-4 w-1/2">
                <label className="mb-2 block" htmlFor="edition_title">
                  Title:
                </label>
                <Input
                  id="edition_title"
                  type="text"
                  data-identifier="edition_title"
                  data-type="title"
                  value={editionData.title}
                  onValueChange={updateField("title")}
                  required
                />
              </div>
              <div className="mb-4 w-1/6">
                <label className="mb-2 block" htmlFor="edition_date">
                  Date:
                </label>
                <DatePicker
                  label="Edition date"
                  value={parsedDate}
                  onChange={onDateChange}
                  className="max-w-[284px]"
                  data-type="date"
                  data-identifier="edition_date"
                />
              </div>
              <div className="mb-4 w-1/2">
                <label className="mb-2 block" htmlFor="edition_blurb">
                  Blurb:
                </label>
                <Input
                  id="edition_blurb"
                  type="text"
                  data-identifier="edition_blurb"
                  data-type="blurb"
                  value={editionData.blurb}
                  onValueChange={updateField("blurb")}
                />
              </div>
              <div className="mb-4 w-full flex flex-col gap-8">
                <div className="gif-input w-1/2">
                  <label className="mb-2 block" htmlFor="edition_gif">
                    Edition GIF:
                  </label>
                  <Input
                    id="edition_gif"
                    type="text"
                    data-type="gif"
                    data-identifier="edition_gif"
                    value={editionData.editionGif}
                    onValueChange={updateField("editionGif")}
                  />
                  <Button
                    className="mt-2"
                    onClick={() => setShowEditionGifPicker((val) => !val)}
                  >
                    {showEditionGifPicker ? "Hide GIF Picker" : "Select GIF"}
                  </Button>
                  {showEditionGifPicker && (
                    <div className="gif-picker flex gap-4 mt-2">
                      <GifPicker
                        onGifClick={(gif) => updateField("editionGif")(gif.url)}
                        width={500}
                        height={500}
                        tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                        theme={Theme.DARK}


                      />
                      <img
                        src={editionData.editionGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                        alt="Edition GIF"
                        className="w-full max-w-[500px] h-auto self-start"
                      />
                    </div>
                  )}
                </div>
                {/* Landing Page Song input */}
                <div className="song-input w-1/2">
                  <label className="mb-2 block" htmlFor="home_song">
                    Landing Page Song
                  </label>
                  <Input
                    id="home_song"
                    data-identifier="home_song"
                    type="text"
                    data-type="song"
                    value={editionData.homeSong}
                    onValueChange={updateField("homeSong")}
                  />
                  {homeSongInfo && (
                    <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
                      {homeSongInfo.albumImage && (
                        <img src={homeSongInfo.albumImage} alt="album" style={{ width: 48, height: 48, borderRadius: 4, marginRight: 12 }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 500 }}>{homeSongInfo.title}</div>
                        <div style={{ color: "#888" }}>{homeSongInfo.artists}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Tab>
          {/* ************ ROUND 1 ************ */}
          <Tab key="round1" title="Round 1">
            <h3 className="mb-8 text-2xl">Round 1</h3>
            <div className="ml-4">
              <div className="mb-8">
                <label className="mb-2 block text-lg" htmlFor="r1_gif">
                  Round 1 GIF:
                </label>
                <Input
                  id="r1_gif"
                  type="text"
                  data-type="gif"
                  data-identifier="r1_gif"
                  value={editionData.r1Gif}
                  onValueChange={updateField("r1Gif")}
                />
                <Button
                  className="mt-2"
                  onClick={() => setShowR1GifPicker((val) => !val)}
                >
                  {showR1GifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showR1GifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("r1Gif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.r1Gif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>
              {Array.from({ length: 5 }, (_, index) => (
                <div key={`round1-question${index + 1}`}>
                  <h3 className="mb-2">Question {index + 1}</h3>
                  <Tiptap
                    state={editionData.r1Questions?.[index] || ""}
                    setState={(newVal) => updateArrayItem("r1Questions", index, newVal)}
                    identifier={`r1q${index + 1}`}
                    classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                  />
                  <h3 className="mb-2">Song</h3>
                  <Input
                    data-identifier={`r1s${index + 1}`}
                    type="text"
                    data-type="song"
                    className="w-1/2 mb-2"
                    value={editionData.r1Songs?.[index] || ""}
                    onValueChange={(newVal) => updateArrayItem("r1Songs", index, newVal)}
                  />
                  {r1SongInfos[index] && (
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                      {r1SongInfos[index].albumImage && (
                        <img src={r1SongInfos[index].albumImage} alt="album" style={{ width: 48, height: 48, borderRadius: 4, marginRight: 12 }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 500 }}>{r1SongInfos[index].title}</div>
                        <div style={{ color: "#888" }}>{r1SongInfos[index].artists}</div>
                      </div>
                    </div>
                  )}
                  <h3 className="mb-2">Answer {index + 1}</h3>
                  <Tiptap
                    state={editionData.r1Answers?.[index] || ""}
                    setState={(newVal) => updateArrayItem("r1Answers", index, newVal)}
                    identifier={`r1a${index + 1}`}
                    classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                  />
                  <h3 className="mb-2">GIF</h3>
                  <Input
                    data-identifier={`r1g${index + 1}`}
                    type="text"
                    data-type="gif"
                    className="w-1/2 mb-6"
                    value={editionData.r1AnswerGifs?.[index] || ""}
                    onValueChange={(newVal) => updateArrayItem("r1AnswerGifs", index, newVal)}
                  />
                  <GifAnswerPickerToggle
                    show={editionData.r1AnswerGifs?.[index]}
                    onToggle={(_show) => updateArrayItem("r1AnswerGifs", index, _show)}
                    gifUrl={editionData.r1AnswerGifs?.[index]}
                    onGifPick={(gif) => updateArrayItem("r1AnswerGifs", index, gif.url)}
                    gifInputsRef={gifInputsRef}
                    index={index}
                  />
                  {index == 2 && (
                    <div>
                      <h3 className="mb-2">Bantha Answer</h3>
                      <Tiptap
                        state={editionData.banthaAnswer || ""}
                        setState={updateField("banthaAnswer")}
                        identifier="bantha_answer"
                        classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                      />
                      <h3 className="mb-2">Bantha Answer GIF</h3>
                      <Input
                        data-identifier={`bantha_answer_gif`}
                        type="text"
                        data-type="gif"
                        className="w-1/2 mb-6"
                        value={editionData.banthaAnswerGif}
                        onValueChange={updateField("banthaAnswerGif")}
                      />
                      <GifAnswerPickerToggle
                        show={editionData.banthaAnswerGif}
                        onToggle={(_show) => updateField("banthaAnswerGif")(_show)}
                        gifUrl={editionData.banthaAnswerGif}
                        onGifPick={(gif) => updateField("banthaAnswerGif")(gif.url)}
                        gifInputsRef={gifInputsRef}
                        index="bantha"
                      />
                    </div>
                  )}
                  <Divider className="my-4" />
                  <hr className="block my-10 bg-gray-500"></hr>
                </div>
              ))}
            </div>
          </Tab>
          {/* ************ IMPOSSIBLE 1 ************ */}
          <Tab key="impossible1" title="Impossible 1">
            <h3 className="mb-8 text-2xl">Impossible 1</h3>
            <div className="ml-4">

              <div className="mb-8">
                <h4 className="mb-2">Intro GIF</h4>
                <Input
                  data-identifier="i1_intro_gif"
                  type="text"
                  data-type="gif"
                  className="w-1/2"
                  value={editionData.imp1IntroGif}
                  onValueChange={updateField("imp1IntroGif")}
                />
                <Button className="mt-2" onClick={() => setShowImp1IntroGifPicker(val => !val)}>
                  {showImp1IntroGifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showImp1IntroGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("imp1IntroGif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.imp1IntroGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              <div className="mb-8">
                <h4 className="mb-2">Theme</h4>
                <Input
                  data-identifier="i1_theme"
                  data-type="text"
                  type="text"
                  className="w-1/2"
                  value={editionData.imp1Theme}
                  onValueChange={updateField("imp1Theme")}
                />
              </div>

              <div className="mb-8">
                <h4 className="mb-2">Theme GIF</h4>
                <Input
                  data-identifier="i1_gif"
                  type="text"
                  data-type="gif"
                  className="w-1/2"
                  value={editionData.imp1ThemeGif}
                  onValueChange={updateField("imp1ThemeGif")}
                />
                <Button
                  className="mt-2"
                  onClick={() => setShowImp1ThemeGifPicker((val) => !val)}
                >
                  {showImp1ThemeGifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showImp1ThemeGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("imp1ThemeGif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.imp1ThemeGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              <div className="mb-8">
                <h4 className="mb-2">Question</h4>
                <Tiptap state={editionData.imp1Question || ""} setState={updateField("imp1Question")} identifier="i1_question" classes="tiptap p-4 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc" />
              </div>

              {/* Songs */}
              <div className="mb-8">
                <h4 className="mb-2">Songs</h4>
                <Select
                  label="Number of Songs"
                  data-identifier="i1_num_songs"
                  className="w-80 mb-8"
                  selectedKeys={[String(editionData.imp1SongCount)]}
                  onSelectionChange={(keys) => {
                    const selectedValue = Array.from(keys)[0];
                    const value = typeof selectedValue === "string" ? parseInt(selectedValue) : selectedValue;
                    updateField("imp1SongCount")(value);
                  }}
                >
                  {[1, 2, 3].map((num, index) => (
                    <SelectItem key={`${index + 1}`} value={index + 1} textValue={`${index + 1}`}>
                      {index + 1}
                    </SelectItem>
                  ))}
                </Select>


                {/* Render the Song Inputs Based on State */}
                <div className="song_list ml-4" data-impossible="1">
                  {Array.from({ length: editionData.imp1SongCount }).map((_, index) => (
                    <div key={index}>
                      <div className="mb-4">
                        <h4 className="mb-2">Song {index + 1}</h4>
                        <Input
                          key={`imp1_song_${index}`}
                          data-identifier={`i1_song${index + 1}`}
                          type="text"
                          data-type="song"
                          required
                          value={editionData.imp1Songs?.[index] || ""}
                          onValueChange={(newVal) => updateArrayItem("imp1Songs", index, newVal)}
                        />
                        {imp1SongInfos[index] && (
                          <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
                            {imp1SongInfos[index].albumImage && (
                              <img src={imp1SongInfos[index].albumImage} alt="album" style={{ width: 48, height: 48, borderRadius: 4, marginRight: 12 }} />
                            )}
                            <div>
                              <div style={{ fontWeight: 500 }}>{imp1SongInfos[index].title}</div>
                              <div style={{ color: "#888" }}>{imp1SongInfos[index].artists}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Answers */}
              <div className="mb-4">
                <h4 className="mb-2">Answers</h4>
                <Select
                  label="Number of Answers"
                  data-identifier="i1_num_answers"
                  className="w-80 mb-8"
                  selectedKeys={[String(editionData.imp1AnswerCount)]}
                  onSelectionChange={(keys) => {
                    const selectedValue = Array.from(keys)[0];
                    const value = typeof selectedValue === "string" ? parseInt(selectedValue) : selectedValue;
                    updateField("imp1AnswerCount")(value);
                  }}

                >
                  {Array.from({ length: 20 }, (_, index) => (
                    <SelectItem key={index + 1} value={index + 1} textValue={`${index + 1}`}>
                      {index + 1}
                    </SelectItem>
                  ))}

                </Select>

                <div className="mb-8">
                  <h4 className="mb-2">Points per answer</h4>
                  <Input
                    data-identifier="i1_ppa"
                    type="number"
                    data-type="number"
                    step="50"
                    min="50"
                    className="w-1/12"
                    value={editionData.imp1AnswerValue}
                    onValueChange={updateField("imp1AnswerValue")}
                  />
                </div>

                <hr className="block my-10 bg-gray-500"></hr>

                {/* Render the Answer Inputs Based on State */}
                <div className="answer_list ml-4" data-impossible="1">
                  {Array.from({ length: editionData.imp1AnswerCount || 0 }).map((_, index) => (
                    <div key={index}>
                      <div className="mb-4">
                        <h4 className="mb-2">Answer {index + 1}</h4>
                        <Tiptap
                          key={`imp1-${index}`}
                          state={editionData.imp1Answers[index] || ""}
                          setState={(value) => updateArrayItem("imp1Answers", index, value)}
                          identifier={`imp1a${index + 1}`}
                          classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                        />
                      </div>
                      <div className="mb-4">
                        <h4 className="mb-2">Answer {index + 1} GIF</h4>
                        <Input
                          data-identifier={`i1a${index + 1}_gif`}
                          data-type="gif"
                          type="text"
                          className="w-1/2"
                          value={editionData.imp1AnswerGifs[index] || ""}
                          onValueChange={(newGif: string) => updateArrayItem("imp1AnswerGifs", index, newGif)}
                        />
                        <GifAnswerPickerToggle
                          show={editionData.imp1AnswerGifs[index]}
                          onToggle={(_show) => updateArrayItem("imp1AnswerGifs", index, _show)}
                          gifUrl={editionData.imp1AnswerGifs[index]}
                          onGifPick={(gif) => updateArrayItem("imp1AnswerGifs", index, gif.url)}
                          gifInputsRef={gifInputsRef}
                          index={index}
                        />
                      </div>
                      <hr className="block my-10 bg-gray-300" />
                    </div>
                  ))}

                </div>
              </div>
            </div>
          </Tab>
          {/* ************ ROUND 2 ************ */}
          <Tab key="round2" title="Round 2">
            <h3 className="mb-8 text-2xl">Round 2</h3>
            <div className="ml-4">
              <div className="mb-8">
                <label className="mb-2 block text-lg" htmlFor="r2_gif">
                  Round 2 GIF:
                </label>
                <Input
                  id="r2_gif"
                  type="text"
                  data-type="gif"
                  data-identifier="r2_gif"
                  value={editionData.r2Gif}
                  onValueChange={updateField("r2Gif")}
                />
                <Button className="mt-2" onClick={() => setShowR2GifPicker(val => !val)}>
                  {showR2GifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showR2GifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("r2Gif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}
                    />
                    <img
                      src={editionData.r2Gif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>
              {Array.from({ length: 5 }, (_, index) => (
                <div key={`round2-question${index + 1}`}>
                  <h3 className="mb-2">Question {index + 1}</h3>
                  <Tiptap
                    state={editionData.r2Questions?.[index] || ""}
                    setState={(newVal) => updateArrayItem("r2Questions", index, newVal)}
                    identifier={`r2q${index + 1}`}
                    classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                  />
                  <h3 className="mb-2">Song</h3>
                  <Input
                    data-identifier={`r2s${index + 1}`}
                    type="text"
                    data-type="song"
                    className="w-1/2 mb-6"
                    value={editionData.r2Songs?.[index] || ""}
                    onValueChange={(newVal) => updateArrayItem("r2Songs", index, newVal)}
                  />
                  {r2SongInfos[index] && (
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                      {r2SongInfos[index].albumImage && (
                        <img src={r2SongInfos[index].albumImage} alt="album" style={{ width: 48, height: 48, borderRadius: 4, marginRight: 12 }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 500 }}>{r2SongInfos[index].title}</div>
                        <div style={{ color: "#888" }}>{r2SongInfos[index].artists}</div>
                      </div>
                    </div>
                  )}
                  <h3 className="mb-2">Answer {index + 1}</h3>
                  <Tiptap
                    state={editionData.r2Answers?.[index] || ""}
                    setState={(newVal) => updateArrayItem("r2Answers", index, newVal)}
                    identifier={`r2a${index + 1}`}
                    classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                  />
                  <h3 className="mb-2">GIF</h3>
                  <Input
                    data-identifier={`r2g${index + 1}`}
                    type="text"
                    data-type="gif"
                    className="w-1/2 mb-6"
                    value={editionData.r2AnswerGifs?.[index] || ""}
                    onValueChange={(newVal) => updateArrayItem("r2AnswerGifs", index, newVal)}
                  />
                  <div className="gif-picker flex gap-4">
                    <GifAnswerPickerToggle
                      show={editionData.r2AnswerGifs?.[index]}
                      onToggle={(_show) => updateArrayItem("r2AnswerGifs", index, _show)}
                      gifUrl={editionData.r2AnswerGifs?.[index]}
                      onGifPick={(gif) => updateArrayItem("r2AnswerGifs", index, gif.url)}
                      gifInputsRef={gifInputsRef}
                      index={index}
                    />
                  </div>
                  <Divider className="my-4" />
                  <hr className="block my-10 bg-gray-500"></hr>
                </div>
              ))}
            </div>
          </Tab>


          {/* ************ IMPOSSIBLE 2 ************ */}
          <Tab key="impossible2" title="Impossible 2">
            <h3 className="mb-8 text-2xl">Impossible 2</h3>
            <div className="ml-4">

              <div className="mb-8">
                <h4 className="mb-2">Intro GIF</h4>
                <Input
                  data-identifier="i2_intro_gif"
                  type="text"
                  data-type="gif"
                  className="w-1/2"
                  value={editionData.imp2IntroGif}
                  onValueChange={updateField("imp2IntroGif")}
                />
                <Button className="mt-2" onClick={() => setShowImp2IntroGifPicker(val => !val)}>
                  {showImp2IntroGifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showImp2IntroGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("imp2IntroGif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.imp2IntroGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              <div className="mb-8">
                <h4 className="mb-2">Theme</h4>
                <Input
                  data-identifier="i2_theme"
                  data-type="text"
                  type="text"
                  className="w-1/2"
                  value={editionData.imp2Theme}
                  onValueChange={updateField("imp2Theme")}
                />
              </div>

              <div className="mb-8">
                <h4 className="mb-2">Theme GIF</h4>
                <Input
                  data-identifier="i2_gif"
                  type="text"
                  data-type="gif"
                  className="w-1/2"
                  value={editionData.imp2ThemeGif}
                  onValueChange={updateField("imp2ThemeGif")}
                />
                <Button
                  className="mt-2"
                  onClick={() => setShowImp2ThemeGifPicker((val) => !val)}
                >
                  {showImp2ThemeGifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showImp2ThemeGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("imp2ThemeGif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.imp2ThemeGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              <div className="mb-8">
                <h4 className="mb-2">Question</h4>
                <Tiptap
                  state={editionData.imp2Question || ""}
                  setState={updateField("imp2Question")}
                  identifier="i2_question"
                  classes="tiptap p-4 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                />
              </div>

              {/* Songs */}
              <div className="mb-8">
                <h4 className="mb-2">Songs</h4>
                <Select
                  label="Number of Songs"
                  data-identifier="i2_num_songs"
                  className="w-80 mb-8"
                  selectedKeys={[String(editionData.imp2SongCount)]}
                  onSelectionChange={(keys) => {
                    const selectedValue = Array.from(keys)[0];
                    const value = typeof selectedValue === "string" ? parseInt(selectedValue) : selectedValue;
                    updateField("imp2SongCount")(value);
                  }}
                >
                  {[1, 2, 3].map((num, index) => (
                    <SelectItem key={`${index + 1}`} value={index + 1} textValue={`${index + 1}`}>
                      {index + 1}
                    </SelectItem>
                  ))}
                </Select>

                <div className="song_list ml-4" data-impossible="2">
                  {Array.from({ length: editionData.imp2SongCount }).map((_, index) => (
                    <div key={index}>
                      <div className="mb-4">
                        <h4 className="mb-2">Song {index + 1}</h4>
                        <Input
                          key={`imp2_song_${index}`}
                          data-identifier={`i2_song${index + 1}`}
                          type="text"
                          data-type="song"
                          required
                          value={editionData.imp2Songs?.[index] || ""}
                          onValueChange={(newVal) => updateArrayItem("imp2Songs", index, newVal)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Answers */}
              <div className="mb-4">
                <h4 className="mb-2">Answers</h4>
                <Select
                  label="Number of Answers"
                  data-identifier="i2_num_answers"
                  className="w-80 mb-8"
                  selectedKeys={[String(editionData.imp2AnswerCount)]}
                  onSelectionChange={(keys) => {
                    const selectedValue = Array.from(keys)[0];
                    const value = typeof selectedValue === "string" ? parseInt(selectedValue) : selectedValue;
                    updateField("imp2AnswerCount")(value);
                  }}
                >
                  {Array.from({ length: 20 }, (_, index) => (
                    <SelectItem key={index + 1} value={index + 1} textValue={`${index + 1}`}>
                      {index + 1}
                    </SelectItem>
                  ))}


                </Select>

                <div className="mb-8">
                  <h4 className="mb-2">Points per answer</h4>
                  <Input
                    data-identifier="i2_ppa"
                    type="number"
                    data-type="number"
                    step="50"
                    min="50"
                    className="w-1/12"
                    value={editionData.imp2AnswerValue}
                    onValueChange={updateField("imp2AnswerValue")}
                  />
                </div>

                <hr className="block my-10 bg-gray-500"></hr>

                <div className="answer_list ml-4" data-impossible="2">
                  {Array.from({ length: editionData.imp2AnswerCount || 0 }).map((_, index) => (
                    <div key={index}>
                      <div className="mb-4">
                        <h4 className="mb-2">Answer {index + 1}</h4>
                        <Tiptap
                          key={`imp2-${index}`}
                          state={editionData.imp2Answers[index] || ""}
                          setState={(value) => updateArrayItem("imp2Answers", index, value)}
                          identifier={`imp2a${index + 1}`}
                          classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                        />
                      </div>
                      <div className="mb-4">
                        <h4 className="mb-2">Answer {index + 1} GIF</h4>
                        <Input
                          data-identifier={`i2a${index + 1}_gif`}
                          data-type="gif"
                          type="text"
                          className="w-1/2"
                          value={editionData.imp2AnswerGifs[index] || ""}
                          onValueChange={(newGif: string) => updateArrayItem("imp2AnswerGifs", index, newGif)}
                        />
                        <GifAnswerPickerToggle
                          show={editionData.imp2AnswerGifs[index]}
                          onToggle={(_show) => updateArrayItem("imp2AnswerGifs", index, _show)}
                          gifUrl={editionData.imp2AnswerGifs[index]}
                          onGifPick={(gif) => updateArrayItem("imp2AnswerGifs", index, gif.url)}
                          gifInputsRef={gifInputsRef}
                          index={index}
                        />
                      </div>
                      <hr className="block my-10 bg-gray-300" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Tab>


          {/* ************ ROUND 3 ************ */}
          <Tab key="round3" title="Round 3">
            <h3 className="mb-8 text-2xl">Round 3</h3>
            <div className="ml-4">
              <div className="mb-8">
                <label className="mb-2 block text-lg" htmlFor="r3_gif">
                  Round 3 GIF:
                </label>
                <Input
                  id="r3_gif"
                  type="text"
                  data-type="gif"
                  data-identifier="r3_gif"
                  value={editionData.r3Gif}
                  onValueChange={updateField("r3Gif")}
                />
                <Button
                  className="mt-2"
                  onClick={() => setShowR3GifPicker((val) => !val)}
                >
                  {showR3GifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showR3GifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("r3Gif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.r3Gif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>
              {Array.from({ length: 5 }, (_, index) => (
                <div key={`round3-question${index + 1}`}>
                  <h3 className="mb-2">Question {index + 1}</h3>
                  <Tiptap
                    state={editionData.r3Questions?.[index] || ""}
                    setState={(newVal) => updateArrayItem("r3Questions", index, newVal)}
                    identifier={`r3q${index + 1}`}
                    classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                  />
                  <h3 className="mb-2">Song</h3>
                  <Input
                    data-identifier={`r3s${index + 1}`}
                    type="text"
                    data-type="song"
                    className="w-1/2 mb-6"
                    value={editionData.r3Songs?.[index] || ""}
                    onValueChange={(newVal) => updateArrayItem("r3Songs", index, newVal)}
                  />
                  {r3SongInfos[index] && (
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                      {r3SongInfos[index].albumImage && (
                        <img src={r3SongInfos[index].albumImage} alt="album" style={{ width: 48, height: 48, borderRadius: 4, marginRight: 12 }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 500 }}>{r3SongInfos[index].title}</div>
                        <div style={{ color: "#888" }}>{r3SongInfos[index].artists}</div>
                      </div>
                    </div>
                  )}
                  <h3 className="mb-2">Answer {index + 1}</h3>
                  <Tiptap
                    state={editionData.r3Answers?.[index] || ""}
                    setState={(newVal) => updateArrayItem("r3Answers", index, newVal)}
                    identifier={`r3a${index + 1}`}
                    classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                  />
                  <h3 className="mb-2">GIF</h3>
                  <Input
                    data-identifier={`r3g${index + 1}`}
                    type="text"
                    data-type="gif"
                    className="w-1/2 mb-6"
                    value={editionData.r3AnswerGifs?.[index] || ""}
                    onValueChange={(newVal) => updateArrayItem("r3AnswerGifs", index, newVal)}
                  />
                  <GifAnswerPickerToggle
                    show={editionData.r3AnswerGifs?.[index]}
                    onToggle={(_show) => updateArrayItem("r3AnswerGifs", index, _show)}
                    gifUrl={editionData.r3AnswerGifs?.[index]}
                    onGifPick={(gif) => updateArrayItem("r3AnswerGifs", index, gif.url)}
                    gifInputsRef={gifInputsRef}
                    index={index}
                  />
                  <Divider className="my-4" />
                  <hr className="block my-10 bg-gray-500"></hr>
                </div>
              ))}
            </div>
          </Tab>

          {/* ************ WAGER ROUND ************ */}


          <Tab key="wager" title="Wager">
            <h3 className="mb-8 text-2xl">Wager</h3>
            <div className="ml-5">
              <div className="mb-8 w-1/2">
                <label className="mb-2 block" htmlFor="wager_gif">
                  Wager Intro GIF:
                </label>
                <Input
                  id="wager_gif"
                  type="text"
                  data-type="gif"
                  value={editionData.wagerIntroGif}
                  onValueChange={updateField("wagerIntroGif")}
                />
                <Button
                  className="mt-2"
                  onClick={() => setShowWagerIntroGifPicker((val) => !val)}
                >
                  {showWagerIntroGifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showWagerIntroGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("wagerIntroGif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.wagerIntroGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              <div className="mb-8 w-1/2">
                <label className="mb-2 block" htmlFor="final_category">
                  Final Category:
                </label>
                <Input
                  id="final_category"
                  type="text"
                  data-type="text"
                  value={editionData.finalCategory}
                  onValueChange={updateField("finalCategory")}
                />
              </div>

              <div className="mb-8 w-1/2">
                <label className="mb-2 block" htmlFor="final_cat_gif">
                  Final Category GIF:
                </label>
                <Input
                  id="final_cat_gif"
                  type="text"
                  data-type="gif"
                  value={editionData.finalCategoryGif}
                  onValueChange={updateField("finalCategoryGif")}
                />
                <Button
                  className="mt-2"
                  onClick={() => setShowFinalCategoryGifPicker((val) => !val)}
                >
                  {showFinalCategoryGifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showFinalCategoryGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("finalCategoryGif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.finalCategoryGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              <div className="mb-8 w-1/2">
                <label className="mb-2 block" htmlFor="wager_placing_gif">
                  Wager Placing GIF:
                </label>
                <Input
                  id="wager_placing_gif"
                  type="text"
                  data-type="gif"
                  value={editionData.wagerPlacingGif}
                  onValueChange={updateField("wagerPlacingGif")}
                />
                <Button
                  className="mt-2"
                  onClick={() => setShowWagerPlacingGifPicker((val) => !val)}
                >
                  {showWagerPlacingGifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showWagerPlacingGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("wagerPlacingGif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.wagerPlacingGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              <div className="mb-8 w-1/2">
                <label className="mb-2 block" htmlFor="wager_song">
                  Wager Placing Song:
                </label>
                <Input
                  id="wager_song"
                  type="text"
                  data-type="song"
                  value={editionData.wagerSong}
                  onValueChange={updateField("wagerSong")}
                />
                {wagerSongInfo && (
                  <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
                    {wagerSongInfo.albumImage && (
                      <img src={wagerSongInfo.albumImage} alt="album" style={{ width: 48, height: 48, borderRadius: 4, marginRight: 12 }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 500 }}>{wagerSongInfo.title}</div>
                      <div style={{ color: "#888" }}>{wagerSongInfo.artists}</div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </Tab>

          <Tab key="final" title="Final">
            <h3 className="mb-8 text-2xl">Final Question</h3>

            <div className="ml-5">

              <div className="mb-8 w-1/2">
                <label className="mb-2 block" htmlFor="final_intro_gif">
                  Final Question Intro GIF:
                </label>
                <Input
                  id="final_intro_gif"
                  type="text"
                  data-type="gif"
                  value={editionData.finalIntroGif}
                  onValueChange={updateField("finalIntroGif")}
                />
                <Button
                  className="mt-2"
                  onClick={() => setShowFinalIntroGifPicker((val) => !val)}
                >
                  {showFinalIntroGifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showFinalIntroGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("finalIntroGif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.finalIntroGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              <div className="mb-8">
                <h4 className="mb-2">Question</h4>
                <Tiptap state={editionData.finalQuestion || ""} setState={updateField("finalQuestion")} identifier="final_question" classes="tiptap p-4 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc" />
              </div>

              <div className="mb-8">
                <h4 className="mb-2">Answer</h4>
                <Tiptap state={editionData.finalAnswer || ""} setState={updateField("finalAnswer")} identifier="final_answer" classes="tiptap p-4 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc" />
              </div>

              <div className="mb-8 w-1/2">
                <h4 className="mb-2">Answer GIF:</h4>
                <Input
                  data-identifier="final_answer_gif"
                  data-type="gif"
                  className="w-1/2"
                  value={editionData.finalAnswerGif}
                  onValueChange={updateField("finalAnswerGif")}
                />
                <Button
                  className="mt-2"
                  onClick={() => setShowFinalAnswerGifPicker((val) => !val)}
                >
                  {showFinalAnswerGifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showFinalAnswerGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("finalAnswerGif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.finalAnswerGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              <div className="mb-8">
                <h4 className="mb-2">Song:</h4>
                <Input
                  data-identifier="final_song"
                  data-type="song"
                  className="w-1/2"
                  value={editionData.finalSong}
                  onValueChange={updateField("finalSong")}
                />
                {finalSongInfo && (
                  <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
                    {finalSongInfo.albumImage && (
                      <img src={finalSongInfo.albumImage} alt="album" style={{ width: 48, height: 48, borderRadius: 4, marginRight: 12 }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 500 }}>{finalSongInfo.title}</div>
                      <div style={{ color: "#888" }}>{finalSongInfo.artists}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-8 w-1/2">
                <label className="mb-2 block" htmlFor="edition_end_gif_1">
                  End GIF 1:
                </label>
                <Input
                  id="edition_end_gif_1"
                  type="text"
                  value={editionData.endGif1}
                  onValueChange={updateField("endGif1")}
                  data-type="gif"
                />
                <Button
                  className="mt-2"
                  onClick={() => setShowEndGif1Picker((val) => !val)}
                >
                  {showEndGif1Picker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showEndGif1Picker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("endGif1")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.endGif1 || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              <div className="mb-8 w-1/2">
                <label className="mb-2 block" htmlFor="edition_end_gif_2">
                  End GIF 2:
                </label>
                <Input
                  id="edition_end_gif_2"
                  type="text"
                  value={editionData.endGif2}
                  onValueChange={updateField("endGif2")}
                  data-type="gif"
                />
                <Button
                  className="mt-2"
                  onClick={() => setShowEndGif2Picker((val) => !val)}
                >
                  {showEndGif2Picker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showEndGif2Picker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("endGif2")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.endGif2 || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>
            </div>
          </Tab>
        </Tabs>

      </div>
    </div>
  );


}

// Helper component for GIF answer pickers with toggle
function GifAnswerPickerToggle({ show, onToggle, gifUrl, onGifPick, gifInputsRef, index }: any) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button
        className="mt-2"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Hide GIF Picker" : "Select GIF"}
      </Button>
      {open && (
        <div className="gif-picker flex gap-4 mt-2">
          <GifPicker
            onGifClick={(gif: any) => {
              onGifPick(gif);
            }}
            width={500}
            height={500}
            tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
            theme={Theme.DARK}

          />
          <img
            src={gifUrl || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
            alt="Selected GIF"
            className="w-full max-w-[500px] h-auto self-start"
          />
        </div>
      )}
    </>
  );
}