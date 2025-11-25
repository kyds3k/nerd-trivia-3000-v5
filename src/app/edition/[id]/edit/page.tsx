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
  Progress,
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure
} from "@heroui/react";
import { useRouter } from "next/navigation";
import Pocketbase from "pocketbase";
import { parseDate, CalendarDate } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { useParams } from "next/navigation";
import debounce from 'lodash/debounce';
import Tiptap from "@/components/TipTap";
import ShallNotPass from "@/components/ShallNotPass";
import GifPicker, { Theme } from "gif-picker-react";


export default function EditEditionPage() {
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadMessage, setLoadMessage] = useState("Loading edition . . .");
  const [authData, setAuthData] = useState(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = React.useState<any>(null);
  let formatter = useDateFormatter({ dateStyle: "full" });
  const [blurb, setBlurb] = useState("");
  const [homeSong, setHomeSong] = useState("");
  const [editionGif, setEditionGif] = useState("");
  const [endGif1, setEndGif1] = useState("");
  const [endGif2, setEndGif2] = useState("");
  const [r1Gif, setR1Gif] = useState("");
  const [r2Gif, setR2Gif] = useState("");
  const [r3Gif, setR3Gif] = useState("");
  const [round1Questions, setRound1Questions] = useState(Array(5).fill(""));
  const [round2Questions, setRound2Questions] = useState(Array(5).fill(""));
  const [round3Questions, setRound3Questions] = useState(Array(5).fill(""));
  const [round1Answers, setRound1Answers] = useState(Array(5).fill(""));
  const [round2Answers, setRound2Answers] = useState(Array(5).fill(""));
  const [round3Answers, setRound3Answers] = useState(Array(5).fill(""));
  const [round1Songs, setRound1Songs] = useState(Array(5).fill(""));
  const [round2Songs, setRound2Songs] = useState(Array(5).fill(""));
  const [round3Songs, setRound3Songs] = useState(Array(5).fill(""));
  const [round1AnswerGifs, setRound1AnswerGifs] = useState(Array(5).fill(""));
  const [round2AnswerGifs, setRound2AnswerGifs] = useState(Array(5).fill(""));
  const [round3AnswerGifs, setRound3AnswerGifs] = useState(Array(5).fill(""));
  const [banthaAnswer, setBanthaAnswer] = useState("");
  const [banthaAnswerGif, setBanthaAnswerGif] = useState("");

  const [numImpossibleAnswers, setNumImpossibleAnswers] = useState<number>(1);
  const [numImpossibleAnswers2, setNumImpossibleAnswers2] = useState<number>(1);
  const [numImpossibleSongs, setNumImpossibleSongs] = useState<number>(1);
  const [numImpossibleSongs2, setNumImpossibleSongs2] = useState<number>(1);
  const [imp1IntroGif, setImp1IntroGif] = useState("");
  const [imp1Theme, setImp1Theme] = useState("");
  const [imp1Gif, setImp1Gif] = useState("");
  const [imp1Question, setImp1Question] = useState("");
  const [imp1Songs, setImp1Songs] = useState<{ [key: number]: string }>({});
  const [imp1Answers, setImp1Answers] = useState<string[]>([]);
  const [imp1AnswerGifs, setImp1AnswerGifs] = useState<{ [key: number]: string }>({});
  const [imp1Ppa, setImp1Ppa] = useState("");
  const [imp2IntroGif, setImp2IntroGif] = useState("");
  const [imp2Theme, setImp2Theme] = useState("");
  const [imp2Question, setImp2Question] = useState("");
  const [imp2Gif, setImp2Gif] = useState("");
  const [imp2Songs, setImp2Songs] = useState<{ [key: number]: string }>({});
  const [imp2Answers, setImp2Answers] = useState<string[]>([]);
  const [imp2AnswerGifs, setImp2AnswerGifs] = useState<{ [key: number]: string }>({});
  const [imp2Ppa, setImp2Ppa] = useState("");
  const [wagerGif, setWagerGif] = useState("");
  const [wagerPlacingGif, setWagerPlacingGif] = useState("");
  const [wagerSong, setWagerSong] = useState("");
  const [finalCat, setFinalCat] = useState("");
  const [finalCatGif, setFinalCatGif] = useState("");
  const [finalIntroGif, setFinalIntroGif] = useState("");
  const [finalQuestion, setFinalQuestion] = useState("");
  const [finalAnswer, setFinalAnswer] = useState("");
  const [finalAnswerGif, setFinalAnswerGif] = useState("");
  const [finalSong, setFinalSong] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  // Update Modal State
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateComplete, setUpdateComplete] = useState(false);

  // Helper: Sleep function
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Spotify states
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [homeSongInfo, setHomeSongInfo] = useState<any>(null);
  const [r1SongInfos, setR1SongInfos] = useState<any[]>(Array(5).fill(null));
  const [r2SongInfos, setR2SongInfos] = useState<any[]>(Array(5).fill(null));
  const [r3SongInfos, setR3SongInfos] = useState<any[]>(Array(5).fill(null));
  const [wagerSongInfo, setWagerSongInfo] = useState<any>(null);
  const [finalSongInfo, setFinalSongInfo] = useState<any>(null);

  // GIF Picker toggle states
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
  const [showImp1ThemeGifPicker, setShowImp1ThemeGifPicker] = useState(false);
  const [showImp2ThemeGifPicker, setShowImp2ThemeGifPicker] = useState(false);
  const [showImp1IntroGifPicker, setShowImp1IntroGifPicker] = useState(false);
  const [showImp2IntroGifPicker, setShowImp2IntroGifPicker] = useState(false);


  pb.autoCancellation(false);

  const params = useParams();
  const editionEditId = typeof params?.id === "string" ? params.id : undefined;

  if (!editionEditId) {
    console.error("Edition ID is missing or invalid!");
    return; // Prevent further execution if the ID is missing
  }

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
    const setters: Record<
      1 | 2 | 3,
      React.Dispatch<React.SetStateAction<string[]>>
    > = {
      1: setRound1Questions,
      2: setRound2Questions,
      3: setRound3Questions
    };

    setters[round]((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const updateAnswer: UpdateAnswerFunction = (round, index, value) => {
    const setters: Record<
      1 | 2 | 3 | "imp1" | "imp2",
      React.Dispatch<React.SetStateAction<string[]>>
    > = {
      1: setRound1Answers,
      2: setRound2Answers,
      3: setRound3Answers,
      imp1: setImp1Answers,
      imp2: setImp2Answers, // Add setter for imp2Answers
    };

    setters[round]((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleImp1Songs = (index: number, value: string) => {
    setImp1Songs((prevSongs) => ({
      ...prevSongs,
      [index]: value,
    }));
  };

  const handleImp2Songs = (index: number, value: string) => {
    setImp2Songs((prevSongs) => ({
      ...prevSongs,
      [index]: value,
    }));
  };


  const importEdition = async () => {
    console.log(pb.authStore.isValid);
    console.log(pb.authStore.token);
    console.log(pb.authStore.model?.id);

    try {

      const getEdition = await pb.collection("editions").getFirstListItem(`id = "${editionEditId}"`);
      setTitle(getEdition.title);
      setEditionGif(getEdition.edition_gif);
      setBlurb(getEdition.blurb);
      setHomeSong(getEdition.home_song);
      setIsLoaded(true);
      setEndGif1(getEdition.end_gif_1);
      setEndGif2(getEdition.end_gif_2);
      const dbDate = getEdition.date;
      const parsedDate = parseDate(dbDate.split(" ")[0]) as CalendarDate; // Parse the date
      setDate(parsedDate); // Set the parsed date      

      const setRoundGifs = [setR1Gif, setR2Gif, setR3Gif];

      const getRounds = await pb.collection("rounds").getFullList({ filter: `edition_id = "${editionEditId}"` });

      getRounds.forEach((round) => {
        if (round.round >= 1 && round.round <= 3) {
          setRoundGifs[round.round - 1](round.round_gif);
        }
      });


      const getQuestions = await pb.collection("questions").getFullList({ filter: 'edition_id = "' + editionEditId + '"', sort: 'round_number, question_number' });

      const setRoundQuestions = [setRound1Questions, setRound2Questions, setRound3Questions];
      setRoundQuestions.forEach((setter, index) => {
        const roundQuestions = getQuestions.filter((question) => question.round_number === index + 1);
        const questionTexts = roundQuestions.map((question) => question.question_text);
        setter(questionTexts);
      });

      const setRoundAnswers = [setRound1Answers, setRound2Answers, setRound3Answers];
      setRoundAnswers.forEach((setter, index) => {
        const roundAnswers = getQuestions.filter((question) => question.round_number === index + 1);
        const answerTexts = roundAnswers.map((question) => question.answer);
        setter(answerTexts);
        if (index == 0 && roundAnswers.length > 2 && roundAnswers[2]?.bantha_answer != undefined) {
          setBanthaAnswer(roundAnswers[2].bantha_answer);
          setBanthaAnswerGif(roundAnswers[2].bantha_answer_gif);
        }
      });

      const setRoundSongs = [setRound1Songs, setRound2Songs, setRound3Songs];
      setRoundSongs.forEach((setter, index) => {
        const roundSongs = getQuestions.filter((question) => question.round_number === index + 1);
        const songTexts = roundSongs.map((question) => question.song);
        setter(songTexts);
      });

      const setRoundAnswerGifs = [setRound1AnswerGifs, setRound2AnswerGifs, setRound3AnswerGifs];
      setRoundAnswerGifs.forEach((setter, index) => {
        const roundAnswerGifs = getQuestions.filter((question) => question.round_number === index + 1);
        const answerGifTexts = roundAnswerGifs.map((question) => question.answer_gif);
        setter(answerGifTexts);
      });

      // Get the impossible rounds
      const getImpossibleRounds = await pb.collection("impossible_rounds").getFullList({
        filter: `edition_id = "${editionEditId}"`,
      });

      getImpossibleRounds.forEach((round) => {

        if (round.impossible_number === 1) {
          setImp1IntroGif(round.intro_gif);
          setImp1Theme(round.theme);
          setImp1Gif(round.theme_gif);
          setImp1Question(round.question_text);
          setImp1Ppa(round.point_value);
          setNumImpossibleSongs(Object.values(round.spotify_ids).length);
          setNumImpossibleAnswers(Object.values(round.answers).length);
          // for each song in the round, set the state
          const songIds = Object.keys(round.spotify_ids);
          const songNames = Object.values(round.spotify_ids) as string[];
          const songs: Record<number, string> = {}; // Explicitly type the object

          songIds.forEach((id, index) => {
            songs[index] = songNames[index];
          });
          setImp1Songs(songs);

          const answerNames = Object.values(round.answers) as string[];
          setImp1Answers(answerNames); // Directly set the array

          const answerGifs = Object.values(round.answer_gifs) as string[];
          const answerGifObj: Record<number, string> = {};
          answerGifs.forEach((gif, index) => {
            answerGifObj[index] = gif;
          });
          setImp1AnswerGifs(answerGifObj);
        } else if (round.impossible_number === 2) {
          setImp2IntroGif(round.intro_gif);
          setImp2Theme(round.theme);
          setImp2Gif(round.theme_gif);
          setImp2Question(round.question_text);
          setImp2Ppa(round.point_value);
          setNumImpossibleSongs2(Object.values(round.spotify_ids).length);
          setNumImpossibleAnswers2(Object.values(round.answers).length);
          // for each song in the round, set the state
          const songIds = Object.keys(round.spotify_ids);
          const songNames = Object.values(round.spotify_ids) as string[];
          const songs: Record<number, string> = {}; // Explicitly type the object

          songIds.forEach((id, index) => {
            songs[index] = songNames[index];
          });
          setImp2Songs(songs);

          const answerNames = Object.values(round.answers) as string[];
          setImp2Answers(answerNames); // Directly set the array

          const answerGifs = Object.values(round.answer_gifs) as string[];
          const answerGifObj: Record<number, string> = {};
          answerGifs.forEach((gif, index) => {
            answerGifObj[index] = gif;
          });
          setImp2AnswerGifs(answerGifObj);
        }
      });

      const wagerRound = await pb.collection("wager_rounds").getFirstListItem(`edition_id = "${editionEditId}"`);
      setWagerGif(wagerRound.wager_intro_gif);
      setFinalCat(wagerRound.final_cat);
      setFinalCatGif(wagerRound.final_cat_gif);
      setWagerPlacingGif(wagerRound.wager_placing_gif);
      setWagerSong(wagerRound.wager_song);

      const finalRound = await pb.collection("final_rounds").getFirstListItem(`edition_id = "${editionEditId}"`);
      setFinalIntroGif(finalRound.final_intro_gif);
      setFinalQuestion(finalRound.question_text);
      setFinalAnswer(finalRound.answer);
      setFinalAnswerGif(finalRound.final_answer_gif);
      setFinalSong(finalRound.final_song);


      setLoading(false);
      setError("Edition imported successfully!");
    } catch (err) {
      console.error("Failed to import edition:", err);
      setLoading(false);
      setError("Failed to import the edition. Please try again later.");
    }
  };

  const updateQuestions = async (
    editionEditId: string,
    roundQuestions: string[][],
    roundSongs: string[][],
    roundAnswers: string[][],
    roundAnswerGifs: string[][]
  ): Promise<any[][]> => {
    // Loop through rounds (outer array of questions)
    const updatedQuestions = await Promise.all(
      roundQuestions.map(async (questions, roundIndex) => {
        const round = roundIndex + 1; // Rounds are 1-based

        setLoadMessage(`Updating questions for round ${round}...`);

        // Fetch the existing questions for the round
        const fetchedRoundQuestions = await pb
          .collection("questions")
          .getFullList({
            filter: `edition_id = "${editionEditId}" && round_number = "${round}"`,
          });

        // Validate: Ensure the number of fetched questions matches the number of input questions
        // if (fetchedRoundQuestions.length !== questions.length) {
        //   console.error(
        //     `Mismatch: Fetched ${fetchedRoundQuestions.length} questions but received ${questions.length} for round ${round}.`
        //   );
        //   throw new Error("Question count mismatch.");
        // }

        // Update each question in the round
        const updatedRoundQuestions = await Promise.all(
          questions.map(async (questionText, questionIndex) => {
            const questionId = fetchedRoundQuestions[questionIndex].id;

            // Update the question with its corresponding data
            const updatedQuestion = await pb.collection("questions").update(questionId, {
              question_text: questionText,
              song: roundSongs[roundIndex][questionIndex],
              answer: roundAnswers[roundIndex][questionIndex],
              answer_gif: roundAnswerGifs[roundIndex][questionIndex],
            });

            // if round is 3, update the bantha answer and gif. they are both fields in question 3 as "bantha_answer" and "bantha_answer_gif"
            if (round === 1 && questionIndex === 2) {
              const banthaQuestionId = fetchedRoundQuestions[questionIndex].id;
              const updatedBanthaQuestion = await pb.collection("questions").update(banthaQuestionId, {
                bantha_answer: banthaAnswer,
                bantha_answer_gif: banthaAnswerGif,
              });
              setLoadMessage(`Bantha question updated . . .`);
            }

            setLoadMessage(`Round ${round} Question ${questionIndex + 1} updated . . .`);
            return updatedQuestion;
          })
        );


        return updatedRoundQuestions;
      })
    );

    return updatedQuestions;
  };

  const updateImpossibleRounds = async (
    editionEditId: string,
    imp1Songs: { [key: number]: string },
    imp1Answers: string[],
    imp1AnswerGifs: { [key: number]: string },
    imp2Songs: { [key: number]: string },
    imp2Answers: string[],
    imp2AnswerGifs: { [key: number]: string }
  ): Promise<any[][]> => {
    const updatedRounds = await Promise.all([
      updateImpossibleRound(editionEditId, 1, imp1Songs, imp1Answers, imp1AnswerGifs),
      updateImpossibleRound(editionEditId, 2, imp2Songs, imp2Answers, imp2AnswerGifs),
    ]);
    return updatedRounds;
  }

  const updateImpossibleRound = async (
    editionEditId: string,
    roundNumber: 1 | 2,
    songs: { [key: number]: string },
    answers: string[],
    answerGifs: { [key: number]: string }
  ): Promise<any[]> => {
    const round = roundNumber;
    const roundData = roundNumber === 1 ? {
      intro_gif: imp1IntroGif,
      theme: imp1Theme,
      theme_gif: imp1Gif,
      question_text: imp1Question,
      point_value: imp1Ppa,
      spotify_ids: songs,
      answers: answers,
      answer_gifs: answerGifs,
    } : {
      intro_gif: imp2IntroGif,
      theme: imp2Theme,
      theme_gif: imp2Gif,
      question_text: imp2Question,
      point_value: imp2Ppa,
      spotify_ids: songs,
      answers: answers,
      answer_gifs: answerGifs,
    };

    const fetchedRound = await pb.collection("impossible_rounds").getFirstListItem(`edition_id = "${editionEditId}" && impossible_number = "${round}"`);
    const updatedRound = await pb.collection("impossible_rounds").update(fetchedRound.id, roundData);
    setLoadMessage(`Impossible Round ${round} updated . . .`);
    return [updatedRound];
  };



  const handleUpdateEdition = async () => {
    // scroll the page to the top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Start Update Process
    onOpen();
    setIsUpdating(true);
    setUpdateComplete(false);
    setLoadMessage("Updating edition . . .");
    console.log('edition id: ', editionEditId);

    try {
      // // Wait for authentication to complete
      await refreshAuthState();
      await sleep(800);

      // Step 1: Update the Edition
      const formattedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')} 12:00:00`;

      const updatedEdition = await pb.collection("editions").update(`${editionEditId}`, {
        title: title,
        date: formattedDate, // Ensure `date` is formatted correctly
        edition_gif: editionGif,
        blurb: blurb,
        home_song: homeSong,
        end_gif_1: endGif1,
        end_gif_2: endGif2,
      });

      console.log("Edition updated:", updatedEdition);
      await sleep(800);

      // Step 2: Update the Questions
      setLoadMessage("Updating questions . . .");
      const roundQuestions = [round1Questions, round2Questions, round3Questions];
      const roundSongs = [round1Songs, round2Songs, round3Songs];
      const roundAnswers = [round1Answers, round2Answers, round3Answers];
      const roundAnswerGifs = [round1AnswerGifs, round2AnswerGifs, round3AnswerGifs];
      const roundGifs = [r1Gif, r2Gif, r3Gif];

      const updatedQuestions = await updateQuestions(
        editionEditId, // Now guaranteed to be a string
        roundQuestions,
        roundSongs,
        roundAnswers,
        roundAnswerGifs
      );
      await sleep(800);

      // Step 3: Update the Impossible Rounds
      setLoadMessage("Updating impossible rounds . . .");
      const updatedRounds = await updateImpossibleRounds(
        editionEditId,
        imp1Songs,
        imp1Answers,
        imp1AnswerGifs,
        imp2Songs,
        imp2Answers,
        imp2AnswerGifs
      );
      await sleep(800);

      // Step 4: Update the Wager Round
      // Grab the wager_round item whose edition_id equals editionEditId, grab its id, and put it into a const WagerRoundId
      setLoadMessage("Updating wager round . . .");

      const wagerRoundId = await pb.collection("wager_rounds").getFirstListItem(`edition_id="${editionEditId}"`)


      const updatedWagerRound = await pb.collection("wager_rounds").update(`${wagerRoundId.id}`, {
        wager_intro_gif: wagerGif,
        final_cat: finalCat,
        final_cat_gif: finalCatGif,
        wager_placing_gif: wagerPlacingGif,
        wager_song: wagerSong,
      });
      await sleep(800);

      //Step 5: Update the Final Round
      setLoadMessage("Updating final round!");
      const finalRound = await pb.collection("final_rounds").getFirstListItem(`edition_id="${editionEditId}"`)
      console.log('finalRound: ', finalRound.id);

      const updatedFinalRound = await pb.collection("final_rounds").update(`${finalRound.id}`, {
        final_intro_gif: finalIntroGif,
        question_text: finalQuestion,
        answer: finalAnswer,
        final_answer_gif: finalAnswerGif,
        final_song: finalSong,
      });
      await sleep(800);

      setUpdateComplete(true);
      setError("Edition updated successfully!");
    } catch (err) {
      console.error("Failed to update edition:", err);
      setError("Failed to update the edition. Please try again later.");
      setIsUpdating(false); // Close modal on error if desired, or keep open with error state
    } finally {
      setIsUpdating(false);
    }
  };



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

  // Update the number of impossible answers when the input changes
  useEffect(() => {
    setImp1Answers((prev) => {
      const newAnswers = [...prev];
      while (newAnswers.length < numImpossibleAnswers) {
        newAnswers.push(""); // Add empty strings for new slots
      }
      return newAnswers.slice(0, numImpossibleAnswers); // Trim if the size decreases
    });
  }, [numImpossibleAnswers]);

  useEffect(() => {
    setImp2Answers((prev) => {
      const newAnswers = [...prev];
      while (newAnswers.length < numImpossibleAnswers2) {
        newAnswers.push(""); // Add empty strings for new slots
      }
      return newAnswers.slice(0, numImpossibleAnswers2); // Trim if the size decreases
    });
  }, [numImpossibleAnswers2]);

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

  // Home Song Info
  useEffect(() => {
    if (!spotifyToken || spotifyToken === "") return;
    if (!homeSong) { setHomeSongInfo(null); return; }
    let ignore = false;
    fetchSpotifyTrackInfo(homeSong, spotifyToken, refreshSpotifyToken).then(info => {
      if (!ignore) setHomeSongInfo(info);
    });
    return () => { ignore = true; };
  }, [homeSong, spotifyToken, refreshSpotifyToken]);

  // Round 1 Song Infos
  useEffect(() => {
    if (!spotifyToken || spotifyToken === "") return;
    let ignore = false;
    const songUris = round1Songs || [];
    Promise.all(songUris.map((uri: string) =>
      uri ? fetchSpotifyTrackInfo(uri, spotifyToken, refreshSpotifyToken) : Promise.resolve(null)
    )).then((infos) => { if (!ignore) setR1SongInfos(infos); });
    return () => { ignore = true; };
  }, [round1Songs, spotifyToken, refreshSpotifyToken]);

  // Round 2 Song Infos
  useEffect(() => {
    if (!spotifyToken || spotifyToken === "") return;
    let ignore = false;
    const songUris = round2Songs || [];
    Promise.all(songUris.map((uri: string) =>
      uri ? fetchSpotifyTrackInfo(uri, spotifyToken, refreshSpotifyToken) : Promise.resolve(null)
    )).then((infos) => { if (!ignore) setR2SongInfos(infos); });
    return () => { ignore = true; };
  }, [round2Songs, spotifyToken, refreshSpotifyToken]);

  // Round 3 Song Infos
  useEffect(() => {
    if (!spotifyToken || spotifyToken === "") return;
    let ignore = false;
    const songUris = round3Songs || [];
    Promise.all(songUris.map((uri: string) =>
      uri ? fetchSpotifyTrackInfo(uri, spotifyToken, refreshSpotifyToken) : Promise.resolve(null)
    )).then((infos) => { if (!ignore) setR3SongInfos(infos); });
    return () => { ignore = true; };
  }, [round3Songs, spotifyToken, refreshSpotifyToken]);

  // Wager Song Info
  useEffect(() => {
    if (!spotifyToken || spotifyToken === "") return;
    if (!wagerSong) { setWagerSongInfo(null); return; }
    let ignore = false;
    fetchSpotifyTrackInfo(wagerSong, spotifyToken, refreshSpotifyToken).then(info => {
      if (!ignore) setWagerSongInfo(info);
    });
    return () => { ignore = true; };
  }, [wagerSong, spotifyToken, refreshSpotifyToken]);

  // Final Song Info
  useEffect(() => {
    if (!spotifyToken || spotifyToken === "") return;
    if (!finalSong) { setFinalSongInfo(null); return; }
    let ignore = false;
    fetchSpotifyTrackInfo(finalSong, spotifyToken, refreshSpotifyToken).then(info => {
      if (!ignore) setFinalSongInfo(info);
    });
    return () => { ignore = true; };
  }, [finalSong, spotifyToken, refreshSpotifyToken]);

  useEffect(() => {
    //refreshAuthState();
    importEdition();
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
            color="primary"
            onClick={handleUpdateEdition}
            isLoading={loading}
          >
            Update Edition
          </Button>
          <Button
            onClick={() => router.push("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
        <h1 className="mb-6 text-2xl">Edit Edition</h1>
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
        <Tabs
          aria-label="Rounds"
          destroyInactiveTabPanel={true}
          size="lg"
          variant="bordered"
          classNames={{ tabList: "mb-4 sticky top-14" }}
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
                  value={title}
                  onValueChange={setTitle}
                  required
                />
              </div>
              <div className="mb-4 w-1/6">
                <label className="mb-2 block" htmlFor="edition_date">
                  Date:
                </label>
                <DatePicker
                  label="Edition date"
                  data-type="date"
                  data-identifier="edition_date"
                  value={date}
                  onChange={(newDate) => {
                    if (newDate) setDate(newDate);
                  }}
                  className="max-w-[284px]"
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
                    value={editionGif}
                    onValueChange={setEditionGif}
                  />
                  <Button
                    className="mt-2"
                    size="sm"
                    onPress={() => setShowEditionGifPicker(!showEditionGifPicker)}
                  >
                    {showEditionGifPicker ? "Hide" : "Show"} GIF Picker
                  </Button>
                  {showEditionGifPicker && (
                    <div className="gif-picker flex gap-4 mt-2">
                      <GifPicker
                        tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                        onGifClick={(gif) => {
                          setEditionGif(gif.url);
                          setShowEditionGifPicker(false);
                        }}
                        theme={Theme.DARK}
                      />
                      <img
                        src={editionGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                        alt="Edition GIF"
                        className="w-full max-w-[500px] h-auto self-start"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-4 w-1/2">
                <label className="mb-2 block" htmlFor="edition_blurb">
                  Blurb
                </label>
                <Tiptap state={blurb} setState={setBlurb} identifier="edition_blurb" classes="tiptap p-4 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc" />
              </div>
              <div className="mb-4 w-1/2">
                <label className="mb-2 block" htmlFor="edition_home_song">
                  Home Song:
                </label>
                <Input
                  id="edition_home_song"
                  type="text"
                  data-type="song"
                  data-identifier="edition_home_song"
                  value={homeSong}
                  onValueChange={setHomeSong}
                  required
                />
                {homeSongInfo && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-gray-800 rounded">
                    {homeSongInfo.albumImage && (
                      <img
                        src={homeSongInfo.albumImage}
                        alt="Album cover"
                        className="w-12 h-12"
                      />
                    )}
                    <div>
                      <div className="font-semibold">{homeSongInfo.title}</div>
                      <div className="text-sm text-gray-400">{homeSongInfo.artists}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Tab>
          <Tab key="round1" title="Round 1">
            <h3 className="mb-8 text-2xl">Round 1</h3>
            <div className="ml-4">
              <div className="mb-8 w-full">
                <label className="mb-2 block text-lg" htmlFor="r1_gif">
                  Round 1 GIF:
                </label>
                <Input
                  id="r1_gif"
                  type="text"
                  data-type="gif"
                  data-identifier="r1_gif"
                  value={r1Gif}
                  onValueChange={setR1Gif}
                  className="w-1/2"
                />
                <Button
                  className="mt-2"
                  size="sm"
                  onPress={() => setShowR1GifPicker(!showR1GifPicker)}
                >
                  {showR1GifPicker ? "Hide" : "Show"} GIF Picker
                </Button>
                {showR1GifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      onGifClick={(gif) => {
                        setR1Gif(gif.url);
                        setShowR1GifPicker(false);
                      }}
                      theme={Theme.DARK}
                    />
                    <img
                      src={r1Gif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Round 1 GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              {Array.from({ length: 5 }, (_, index) => (
                <div key={`round1-question${index + 1}`}>
                  <h3 className="mb-2">Question {index + 1}</h3>
                  <Tiptap
                    state={round1Questions[index]}
                    setState={(value) => updateQuestion(1, index, value)}
                    identifier={`r1q${index + 1}`}
                    classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                  />
                  <h3 className="mb-2">Song</h3>
                  <Input
                    data-identifier={`r1s${index + 1}`}
                    type="text"
                    data-type="song"
                    className="w-1/2"
                    value={round1Songs[index]} // Bind the value dynamically
                    onChange={(e) => {
                      const updatedSongs = [...round1Songs];
                      updatedSongs[index] = e.target.value;
                      setRound1Songs(updatedSongs); // Update the specific song in the array
                    }}
                  />
                  {r1SongInfos[index] && (
                    <div className="mb-6 mt-2 flex items-center gap-2 p-2 bg-gray-800 rounded w-1/2">
                      {r1SongInfos[index].albumImage && (
                        <img
                          src={r1SongInfos[index].albumImage}
                          alt="Album cover"
                          className="w-12 h-12"
                        />
                      )}
                      <div>
                        <div className="font-semibold">{r1SongInfos[index].title}</div>
                        <div className="text-sm text-gray-400">{r1SongInfos[index].artists}</div>
                      </div>
                    </div>
                  )}
                  <h3 className="mb-2">Answer {index + 1}</h3>
                  <Tiptap
                    state={round1Answers[index]}
                    setState={(value) => updateAnswer(1, index, value)}
                    identifier={`r1a${index + 1}`}
                    classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                  />
                  <h3 className="mb-2">GIF</h3>
                  <Input
                    data-identifier={`r1g${index + 1}`}
                    type="text"
                    data-type="gif"
                    className="w-1/2 mb-6"
                    value={round1AnswerGifs[index]} // Bind the value dynamically
                    onChange={(e) => {
                      const updatedGifs = [...round1AnswerGifs];
                      updatedGifs[index] = e.target.value;
                      setRound1AnswerGifs(updatedGifs); // Update the specific gif in the array
                    }}
                  />
                  {index == 2 && (
                    <div>
                      <h3 className="mb-2">Bantha Answer</h3>
                      <Tiptap
                        state={banthaAnswer}
                        setState={setBanthaAnswer}
                        identifier="bantha_answer"
                        classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                      />
                      <h3 className="mb-2">Bantha Answer GIF</h3>
                      <Input
                        data-identifier={`bantha_answer_gif`}
                        type="text"
                        data-type="gif"
                        className="w-1/2 mb-6"
                        value={banthaAnswerGif} // Bind the value dynamically
                        onValueChange={setBanthaAnswerGif}
                      />
                    </div>
                  )}
                  <Divider className="my-4" />
                  <hr className="block my-10 bg-gray-500"></hr>
                </div>
              ))}
            </div>
          </Tab>
          <Tab key="impossible1" title="Impossible 1">
            <h3 className="mb-8 text-2xl">Impossible 1</h3>
            <div className="ml-4">

              <div className="mb-8 w-full">
                <h4 className="mb-2">Intro GIF</h4>
                <Input
                  data-identifier="i1_intro_gif"
                  data-type="text"
                  type="text"
                  className="w-1/2"
                  value={imp1IntroGif}
                  onValueChange={setImp1IntroGif}
                />
                <Button
                  className="mt-2"
                  size="sm"
                  onPress={() => setShowImp1IntroGifPicker(!showImp1IntroGifPicker)}
                >
                  {showImp1IntroGifPicker ? "Hide" : "Show"} GIF Picker
                </Button>
                {showImp1IntroGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      onGifClick={(gif) => {
                        setImp1IntroGif(gif.url);
                        setShowImp1IntroGifPicker(false);
                      }}
                      theme={Theme.DARK}
                    />
                    <img
                      src={imp1IntroGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Impossible 1 Intro GIF"
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
                  value={imp1Theme}
                  onValueChange={setImp1Theme}
                />
              </div>

              <div className="mb-8 w-full">
                <h4 className="mb-2">Theme GIF</h4>
                <Input
                  data-identifier="i1_gif"
                  type="text"
                  data-type="gif"
                  className="w-1/2"
                  value={imp1Gif}
                  onValueChange={setImp1Gif}
                />
                <Button
                  className="mt-2"
                  size="sm"
                  onPress={() => setShowImp1ThemeGifPicker(!showImp1ThemeGifPicker)}
                >
                  {showImp1ThemeGifPicker ? "Hide" : "Show"} GIF Picker
                </Button>
                {showImp1ThemeGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      onGifClick={(gif) => {
                        setImp1Gif(gif.url);
                        setShowImp1ThemeGifPicker(false);
                      }}
                      theme={Theme.DARK}
                    />
                    <img
                      src={imp1Gif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Impossible 1 Theme GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              <div className="mb-8">
                <h4 className="mb-2">Question</h4>
                <Tiptap state={imp1Question} setState={setImp1Question} identifier="i1_question" classes="tiptap p-4 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc" />
              </div>

              {/* Songs */}
              <div className="mb-8">
                <h4 className="mb-2">Songs</h4>
                <Select
                  label="Number of Songs"
                  data-identifier="i1_num_songs"
                  className="w-80 mb-8"
                  value={numImpossibleSongs}
                  onSelectionChange={(keys) => {
                    const selectedValue = Array.from(keys)[0];
                    if (typeof selectedValue === "string") {
                      setNumImpossibleSongs(parseInt(selectedValue));
                    } else if (typeof selectedValue === "number") {
                      setNumImpossibleSongs(selectedValue);
                    }
                  }}
                >
                  {Array.from({ length: 3 }, (_, index) => (
                    <SelectItem key={`${index + 1}`} textValue="song_count" value={index + 1}>
                      {index + 1}
                    </SelectItem>
                  ))}
                </Select>

                {/* Render the Song Inputs Based on State */}
                <div className="song_list ml-4" data-impossible="1">
                  {Array.from({ length: numImpossibleSongs }).map((_, index) => (
                    <div key={index}>
                      <div className="mb-4">
                        <h4 className="mb-2">Song {index + 1}</h4>
                        <Input
                          data-identifier={`i1_song${index + 1}`}
                          type="text"
                          data-type="song"
                          required
                          value={imp1Songs[index] ?? ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleImp1Songs(index, e.target.value ?? "")
                          }
                        />
                        1
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
                  onSelectionChange={(keys) => {
                    const selectedValue = Array.from(keys)[0];
                    //("selectedValue from select", selectedValue);
                    if (typeof selectedValue === "string") {
                      setNumImpossibleAnswers(parseInt(selectedValue));
                    } else if (typeof selectedValue === "number") {
                      setNumImpossibleAnswers(selectedValue);
                    }
                  }}
                >
                  {Array.from({ length: 20 }, (_, index) => (
                    <SelectItem key={`${index + 1}`} textValue="answer_count" value={index + 1}>
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
                    value={imp1Ppa}
                    onValueChange={setImp1Ppa}
                  />
                </div>

                <hr className="block my-10 bg-gray-500"></hr>

                {/* Render the Answer Inputs Based on State */}
                <div className="answer_list ml-4" data-impossible="1">
                  {Array.from({ length: numImpossibleAnswers }).map((_, index) => (
                    <div key={index}>
                      <div className="mb-4">
                        <h4 className="mb-2">Answer {index + 1}</h4>
                        <Tiptap
                          key={`imp1-${index}`}
                          state={imp1Answers[index] || ""}
                          setState={(value) => updateAnswer("imp1", index, value)}
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
                          value={imp1AnswerGifs[index] ?? ""}
                          onValueChange={(newGif: string) => {
                            setImp1AnswerGifs((prevGifs) => ({
                              ...prevGifs,
                              [index]: newGif, // Use newGif directly since onValueChange provides the value
                            }));
                          }}
                        />
                      </div>
                      <hr className="block my-10 bg-gray-300"></hr>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Tab>
          <Tab key="round2" title="Round 2">
            <h3 className="mb-8 text-2xl">Round 2</h3>
            <div className="ml-4">

              <div className="mb-8 w-full">
                <label className="mb-2 block text-lg" htmlFor="r2_gif">
                  Round 2 GIF:
                </label>
                <Input
                  id="r2_gif"
                  type="text"
                  data-type="gif"
                  data-identifier="r2_gif"
                  value={r2Gif}
                  onValueChange={setR2Gif}
                  className="w-1/2"
                />
                <Button
                  className="mt-2"
                  size="sm"
                  onPress={() => setShowR2GifPicker(!showR2GifPicker)}
                >
                  {showR2GifPicker ? "Hide" : "Show"} GIF Picker
                </Button>
                {showR2GifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      onGifClick={(gif) => {
                        setR2Gif(gif.url);
                        setShowR2GifPicker(false);
                      }}
                      theme={Theme.DARK}
                    />
                    <img
                      src={r2Gif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Round 2 GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              {Array.from({ length: 5 }, (_, index) => (
                <div key={`round1-question${index + 1}`}>
                  <h3 className="mb-2">Question {index + 1}</h3>
                  <Tiptap
                    state={round2Questions[index]}
                    setState={(value) => updateQuestion(2, index, value)}
                    identifier={`r2q${index + 1}`}
                    classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                  />
                  <h3 className="mb-2">Song</h3>
                  <Input
                    data-identifier={`r2s${index + 1}`}
                    type="text"
                    data-type="song"
                    className="w-1/2"
                    value={round2Songs[index]} // Bind the value dynamically
                    onChange={(e) => {
                      const updatedSongs = [...round2Songs];
                      updatedSongs[index] = e.target.value;
                      setRound2Songs(updatedSongs); // Update the specific song in the array
                    }}
                  />
                  {r2SongInfos[index] && (
                    <div className="mb-6 mt-2 flex items-center gap-2 p-2 bg-gray-800 rounded w-1/2">
                      {r2SongInfos[index].albumImage && (
                        <img
                          src={r2SongInfos[index].albumImage}
                          alt="Album cover"
                          className="w-12 h-12"
                        />
                      )}
                      <div>
                        <div className="font-semibold">{r2SongInfos[index].title}</div>
                        <div className="text-sm text-gray-400">{r2SongInfos[index].artists}</div>
                      </div>
                    </div>
                  )}
                  <h3 className="mb-2">Answer {index + 1}</h3>
                  <Tiptap
                    state={round2Answers[index]}
                    setState={(value) => updateAnswer(2, index, value)}
                    identifier={`r2a${index + 1}`}
                    classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                  />
                  <h3 className="mb-2">GIF</h3>
                  <Input
                    data-identifier={`r2g${index + 1}`}
                    type="text"
                    data-type="gif"
                    className="w-1/2 mb-6"
                    value={round2AnswerGifs[index]} // Bind the value dynamically
                    onChange={(e) => {
                      const updatedGifs = [...round2AnswerGifs];
                      updatedGifs[index] = e.target.value;
                      setRound2AnswerGifs(updatedGifs); // Update the specific gif in the array
                    }}
                  />
                  <Divider className="my-4" />
                  <hr className="block my-10 bg-gray-500"></hr>
                </div>
              ))}

            </div>
          </Tab>

          <Tab key="impossible2" title="Impossible 2">
            <h3 className="mb-8 text-2xl">Impossible 2</h3>
            <div className="ml-4">
              <div className="mb-8 w-full">
                <h4 className="mb-2">Intro GIF</h4>
                <Input
                  data-identifier="i2_intro_gif"
                  data-type="text"
                  type="text"
                  className="w-1/2"
                  value={imp2IntroGif}
                  onValueChange={setImp2IntroGif}
                />
                <Button
                  className="mt-2"
                  size="sm"
                  onPress={() => setShowImp2IntroGifPicker(!showImp2IntroGifPicker)}
                >
                  {showImp2IntroGifPicker ? "Hide" : "Show"} GIF Picker
                </Button>
                {showImp2IntroGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      onGifClick={(gif) => {
                        setImp2IntroGif(gif.url);
                        setShowImp2IntroGifPicker(false);
                      }}
                      theme={Theme.DARK}
                    />
                    <img
                      src={imp2IntroGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Impossible 2 Intro GIF"
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
                  value={imp2Theme}
                  onValueChange={setImp2Theme}
                />
              </div>

              <div className="mb-8 w-full">
                <h4 className="mb-2">Theme GIF</h4>
                <Input
                  data-identifier="i2_gif"
                  type="text"
                  data-type="gif"
                  className="w-1/2"
                  value={imp2Gif}
                  onValueChange={setImp2Gif}
                />
                <Button
                  className="mt-2"
                  size="sm"
                  onPress={() => setShowImp2ThemeGifPicker(!showImp2ThemeGifPicker)}
                >
                  {showImp2ThemeGifPicker ? "Hide" : "Show"} GIF Picker
                </Button>
                {showImp2ThemeGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      onGifClick={(gif) => {
                        setImp2Gif(gif.url);
                        setShowImp2ThemeGifPicker(false);
                      }}
                      theme={Theme.DARK}
                    />
                    <img
                      src={imp2Gif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Impossible 2 Theme GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              <div className="mb-8">
                <h4 className="mb-2">Question</h4>
                <Tiptap
                  state={imp2Question}
                  setState={setImp2Question}
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
                  value={numImpossibleSongs2}
                  onSelectionChange={(keys) => {
                    const selectedValue = Array.from(keys)[0];
                    if (typeof selectedValue === "string") {
                      setNumImpossibleSongs2(parseInt(selectedValue));
                    } else if (typeof selectedValue === "number") {
                      setNumImpossibleSongs2(selectedValue);
                    }
                  }}
                >
                  {Array.from({ length: 3 }, (_, index) => (
                    <SelectItem key={`${index + 1}`} textValue="song_count" value={index + 1}>
                      {index + 1}
                    </SelectItem>
                  ))}
                </Select>

                {/* Render the Song Inputs Based on State */}
                <div className="song_list ml-4" data-impossible="2">
                  {Array.from({ length: numImpossibleSongs2 }).map((_, index) => (
                    <div key={index}>
                      <div className="mb-4">
                        <h4 className="mb-2">Song {index + 1}</h4>
                        <Input
                          data-identifier={`i1_song${index + 1}`}
                          type="text"
                          data-type="song"
                          required
                          value={imp2Songs[index] ?? ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleImp2Songs(index, e.target.value ?? "")
                          }
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
                  onSelectionChange={(keys) => {
                    const selectedValue = Array.from(keys)[0];
                    if (typeof selectedValue === "string") {
                      setNumImpossibleAnswers2(parseInt(selectedValue));
                    } else if (typeof selectedValue === "number") {
                      setNumImpossibleAnswers2(selectedValue);
                    }
                  }}
                >
                  {Array.from({ length: 20 }, (_, index) => (
                    <SelectItem key={`${index + 1}`} textValue="answer_count" value={index + 1}>
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
                    value={imp2Ppa}
                    onValueChange={setImp2Ppa}
                  />
                </div>

                <hr className="block my-10 bg-gray-500"></hr>

                {/* Render the Answer Inputs Based on State */}
                <div className="answer_list ml-4" data-impossible="2">
                  {Array.from({ length: numImpossibleAnswers2 }).map((_, index) => (
                    <div key={index}>
                      <div className="mb-4">
                        <h4 className="mb-2">Answer {index + 1}</h4>
                        <Tiptap
                          key={`imp2-${index}`}
                          state={imp2Answers[index] || ""}
                          setState={(value) => updateAnswer("imp2", index, value)}
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
                          value={imp2AnswerGifs[index] ?? ""}
                          onValueChange={(newGif: string) => {
                            setImp2AnswerGifs((prevGifs) => ({
                              ...prevGifs,
                              [index]: newGif,
                            }));
                          }}
                        />
                      </div>
                      <hr className="block my-10 bg-gray-300"></hr>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Tab>


          <Tab key="round3" title="Round 3">
            <h3 className="mb-8 text-2xl">Round 3</h3>
            <div className="ml-4">
              <div className="mb-8 w-full">
                <label className="mb-2 block text-lg" htmlFor="r3_gif">
                  Round 3 GIF:
                </label>
                <Input
                  id="r3_gif"
                  type="text"
                  data-type="gif"
                  data-identifier="r3_gif"
                  value={r3Gif}
                  onValueChange={setR3Gif}
                  className="w-1/2"
                />
                <Button
                  className="mt-2"
                  size="sm"
                  onPress={() => setShowR3GifPicker(!showR3GifPicker)}
                >
                  {showR3GifPicker ? "Hide" : "Show"} GIF Picker
                </Button>
                {showR3GifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      onGifClick={(gif) => {
                        setR3Gif(gif.url);
                        setShowR3GifPicker(false);
                      }}
                      theme={Theme.DARK}
                    />
                    <img
                      src={r3Gif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Round 3 GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              {Array.from({ length: 5 }, (_, index) => (
                <div key={`round3-question${index + 1}`}>
                  <h3 className="mb-2">Question {index + 1}</h3>
                  <Tiptap
                    state={round3Questions[index]}
                    setState={(value) => updateQuestion(3, index, value)}
                    identifier={`r3q${index + 1}`}
                    classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                  />
                  <h3 className="mb-2">Song</h3>
                  <Input
                    data-identifier={`r3s${index + 1}`}
                    type="text"
                    data-type="song"
                    className="w-1/2"
                    value={round3Songs[index]} // Bind the value dynamically
                    onChange={(e) => {
                      const updatedSongs = [...round3Songs];
                      updatedSongs[index] = e.target.value;
                      setRound3Songs(updatedSongs); // Update the specific song in the array
                    }}
                  />
                  {r3SongInfos[index] && (
                    <div className="mb-6 mt-2 flex items-center gap-2 p-2 bg-gray-800 rounded w-1/2">
                      {r3SongInfos[index].albumImage && (
                        <img
                          src={r3SongInfos[index].albumImage}
                          alt="Album cover"
                          className="w-12 h-12"
                        />
                      )}
                      <div>
                        <div className="font-semibold">{r3SongInfos[index].title}</div>
                        <div className="text-sm text-gray-400">{r3SongInfos[index].artists}</div>
                      </div>
                    </div>
                  )}
                  <h3 className="mb-2">Answer {index + 1}</h3>
                  <Tiptap
                    state={round3Answers[index]}
                    setState={(value) => updateAnswer(3, index, value)}
                    identifier={`r3a${index + 1}`}
                    classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                  />
                  <h3 className="mb-2">GIF</h3>
                  <Input
                    data-identifier={`r3g${index + 1}`}
                    type="text"
                    data-type="gif"
                    className="w-1/2 mb-6"
                    value={round3AnswerGifs[index]} // Bind the value dynamically
                    onChange={(e) => {
                      const updatedGifs = [...round3AnswerGifs];
                      updatedGifs[index] = e.target.value;
                      setRound3AnswerGifs(updatedGifs); // Update the specific gif in the array
                    }}
                  />
                  <Divider className="my-4" />
                  <hr className="block my-10 bg-gray-500"></hr>
                </div>
              ))}

            </div>
          </Tab>

          <Tab key="wager" title="Wager">
            <h3 className="mb-8 text-2xl">Wager</h3>
            <div className="ml-5">
              <div className="mb-8 w-full">
                <label className="mb-2 block" htmlFor="wager_gif">
                  Wager Intro GIF:
                </label>
                <Input
                  id="wager_gif"
                  type="text"
                  data-type="gif"
                  value={wagerGif}
                  onValueChange={setWagerGif}
                  className="w-1/2"
                />
                <Button
                  className="mt-2"
                  size="sm"
                  onPress={() => setShowWagerIntroGifPicker(!showWagerIntroGifPicker)}
                >
                  {showWagerIntroGifPicker ? "Hide" : "Show"} GIF Picker
                </Button>
                {showWagerIntroGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      onGifClick={(gif) => {
                        setWagerGif(gif.url);
                        setShowWagerIntroGifPicker(false);
                      }}
                      theme={Theme.DARK}
                    />
                    <img
                      src={wagerGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Wager Intro GIF"
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
                  value={finalCat}
                  onValueChange={setFinalCat}
                />
              </div>

              <div className="mb-8 w-full">
                <label className="mb-2 block" htmlFor="final_cat_gif">
                  Final Category GIF:
                </label>
                <Input
                  id="final_cat_gif"
                  type="text"
                  data-type="gif"
                  value={finalCatGif}
                  onValueChange={setFinalCatGif}
                  className="w-1/2"
                />
                <Button
                  className="mt-2"
                  size="sm"
                  onPress={() => setShowFinalCategoryGifPicker(!showFinalCategoryGifPicker)}
                >
                  {showFinalCategoryGifPicker ? "Hide" : "Show"} GIF Picker
                </Button>
                {showFinalCategoryGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      onGifClick={(gif) => {
                        setFinalCatGif(gif.url);
                        setShowFinalCategoryGifPicker(false);
                      }}
                      theme={Theme.DARK}
                    />
                    <img
                      src={finalCatGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Final Category GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              <div className="mb-8 w-full">
                <label className="mb-2 block" htmlFor="wager_placing_gif">
                  Wager Placing GIF:
                </label>
                <Input
                  id="wager_placing_gif"
                  type="text"
                  data-type="gif"
                  value={wagerPlacingGif}
                  onValueChange={setWagerPlacingGif}
                  className="w-1/2"
                />
                <Button
                  className="mt-2"
                  size="sm"
                  onPress={() => setShowWagerPlacingGifPicker(!showWagerPlacingGifPicker)}
                >
                  {showWagerPlacingGifPicker ? "Hide" : "Show"} GIF Picker
                </Button>
                {showWagerPlacingGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      onGifClick={(gif) => {
                        setWagerPlacingGif(gif.url);
                        setShowWagerPlacingGifPicker(false);
                      }}
                      theme={Theme.DARK}
                    />
                    <img
                      src={wagerPlacingGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Wager Placing GIF"
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
                  value={wagerSong}
                  onValueChange={setWagerSong}
                />
                {wagerSongInfo && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-gray-800 rounded">
                    {wagerSongInfo.albumImage && (
                      <img
                        src={wagerSongInfo.albumImage}
                        alt="Album cover"
                        className="w-12 h-12"
                      />
                    )}
                    <div>
                      <div className="font-semibold">{wagerSongInfo.title}</div>
                      <div className="text-sm text-gray-400">{wagerSongInfo.artists}</div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </Tab>

          <Tab key="final" title="Final">
            <h3 className="mb-8 text-2xl">Final Question</h3>

            <div className="ml-5">

              <div className="mb-8 w-1/4">
                <label className="mb-2 block" htmlFor="final_intro_gif">
                  Final Question Intro GIF:
                </label>
                <Input
                  id="final_intro_gif"
                  type="text"
                  data-type="gif"
                  value={finalIntroGif}
                  onValueChange={setFinalIntroGif}
                />
              </div>

              <div className="mb-8">
                <h4 className="mb-2">Question</h4>
                <Tiptap state={finalQuestion} setState={setFinalQuestion} identifier="final_question" classes="tiptap p-4 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc" />
              </div>

              <div className="mb-8">
                <h4 className="mb-2">Answer</h4>
                <Tiptap state={finalAnswer} setState={setFinalAnswer} identifier="final_answer" classes="tiptap p-4 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc" />
              </div>

              <div className="mb-8 w-full">
                <h4 className="mb-2">Final Intro GIF</h4>
                <Input
                  data-identifier="final_intro_gif"
                  data-type="gif"
                  className="w-1/2"
                  value={finalIntroGif}
                  onValueChange={setFinalIntroGif}
                />
                <Button
                  className="mt-2"
                  size="sm"
                  onPress={() => setShowFinalIntroGifPicker(!showFinalIntroGifPicker)}
                >
                  {showFinalIntroGifPicker ? "Hide" : "Show"} GIF Picker
                </Button>
                {showFinalIntroGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      onGifClick={(gif) => {
                        setFinalIntroGif(gif.url);
                        setShowFinalIntroGifPicker(false);
                      }}
                      theme={Theme.DARK}
                    />
                    <img
                      src={finalIntroGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Final Intro GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              <div className="mb-8 w-full">
                <h4 className="mb-2">Answer GIF:</h4>
                <Input
                  data-identifier="final_answer_gif"
                  data-type="gif"
                  className="w-1/2"
                  value={finalAnswerGif}
                  onValueChange={setFinalAnswerGif}
                />
                <Button
                  className="mt-2"
                  size="sm"
                  onPress={() => setShowFinalAnswerGifPicker(!showFinalAnswerGifPicker)}
                >
                  {showFinalAnswerGifPicker ? "Hide" : "Show"} GIF Picker
                </Button>
                {showFinalAnswerGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      onGifClick={(gif) => {
                        setFinalAnswerGif(gif.url);
                        setShowFinalAnswerGifPicker(false);
                      }}
                      theme={Theme.DARK}
                    />
                    <img
                      src={finalAnswerGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Final Answer GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              <div className="mb-8 w-1/2">
                <h4 className="mb-2">Song:</h4>
                <Input
                  data-identifier="final_song"
                  data-type="song"
                  value={finalSong}
                  onValueChange={setFinalSong}
                />
                {finalSongInfo && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-gray-800 rounded">
                    {finalSongInfo.albumImage && (
                      <img
                        src={finalSongInfo.albumImage}
                        alt="Album cover"
                        className="w-12 h-12"
                      />
                    )}
                    <div>
                      <div className="font-semibold">{finalSongInfo.title}</div>
                      <div className="text-sm text-gray-400">{finalSongInfo.artists}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-8 w-full">
                <label className="mb-2 block" htmlFor="edition_end_gif_1">
                  End GIF 1:
                </label>
                <Input
                  id="edition_end_gif_1"
                  type="text"
                  value={endGif1}
                  onValueChange={setEndGif1}
                  data-type="gif"
                  className="w-1/2"
                />
                <Button
                  className="mt-2"
                  size="sm"
                  onPress={() => setShowEndGif1Picker(!showEndGif1Picker)}
                >
                  {showEndGif1Picker ? "Hide" : "Show"} GIF Picker
                </Button>
                {showEndGif1Picker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      onGifClick={(gif) => {
                        setEndGif1(gif.url);
                        setShowEndGif1Picker(false);
                      }}
                      theme={Theme.DARK}
                    />
                    <img
                      src={endGif1 || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="End GIF 1"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              <div className="mb-8 w-full">
                <label className="mb-2 block" htmlFor="edition_end_gif_2">
                  End GIF 2:
                </label>
                <Input
                  id="edition_end_gif_2"
                  type="text"
                  value={endGif2}
                  onValueChange={setEndGif2}
                  data-type="gif"
                  className="w-1/2"
                />
                <Button
                  className="mt-2"
                  size="sm"
                  onPress={() => setShowEndGif2Picker(!showEndGif2Picker)}
                >
                  {showEndGif2Picker ? "Hide" : "Show"} GIF Picker
                </Button>
                {showEndGif2Picker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      onGifClick={(gif) => {
                        setEndGif2(gif.url);
                        setShowEndGif2Picker(false);
                      }}
                      theme={Theme.DARK}
                    />
                    <img
                      src={endGif2 || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="End GIF 2"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>
            </div>
          </Tab>
        </Tabs>
        <Button type="submit" onClick={handleUpdateEdition} className="mt-6">
          Update Edition
        </Button>
      </div>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        isDismissable={false}
        hideCloseButton={!updateComplete}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalBody className="flex flex-col items-center justify-center p-8">
                {!updateComplete ? (
                  <>
                    <h2 className="text-2xl font-bold mb-4">Updating Edition...</h2>
                    <img
                      src="https://media.tenor.com/ITc1hNBSH_wAAAAM/coding-typing.gif"
                      alt="Coding GIF"
                      className="w-64 h-auto rounded-lg mb-6"
                    />
                    <p className="text-lg text-default-500 animate-pulse">
                      {loadMessage}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold mb-4 text-success">Success!</h2>
                    <p className="text-lg text-default-500 mb-6">
                      Edition updated successfully!
                    </p>
                    <Button
                      color="success"
                      variant="flat"
                      onPress={onClose}
                      className="w-full"
                    >
                      Close
                    </Button>
                  </>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );


}
