"use client";

import React, { useState, useEffect } from "react";

// Helper: Sleep function to add delays between requests
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


import {
  Button,
  Progress
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { getElevatableClient } from "@/lib/pocketbase";
import { elevateAuth } from "@/lib/elevate";
import { useParams } from "next/navigation";
import EditionForm from "@/components/EditionForm";
import ShallNotPass from "@/components/ShallNotPass";
import { useEditionDraft, EditionDraftData } from "../../../../src/hooks/useEditionDraft";
import { useDateField } from "../../../../src/hooks/useDateField";




const defaultEditionData: EditionDraftData = {
  title: "",
  date: null,
  blurb: "",
  editionGif: "",
  homeSongApple: "",
  endGif1: "",
  endGif2: "",
  r1Gif: "",
  r2Gif: "",
  r3Gif: "",
  round1Questions: [],
  round2Questions: [],
  round3Questions: [],
  round1Answers: [],
  round2Answers: [],
  round3Answers: [],
  round1SongsApple: [],
  round2SongsApple: [],
  round3SongsApple: [],
  round1AnswerGifs: [],
  round2AnswerGifs: [],
  round3AnswerGifs: [],
  banthaAnswer: "",
  banthaAnswerGif: "",
  imp1IntroGif: "",
  imp1Theme: "",
  imp1Gif: "",
  imp1Question: "",
  imp1Ppa: "",
  imp1SongsApple: [],
  imp1Answers: [],
  imp1AnswerGifs: [],
  imp2IntroGif: "",
  imp2Theme: "",
  imp2Gif: "",
  imp2Question: "",
  imp2Ppa: "",
  imp2SongsApple: [],
  imp2Answers: [],
  imp2AnswerGifs: [],
  wagerGif: "",
  wagerPlacingGif: "",
  wagerSongApple: "",
  finalCat: "",
  finalCatGif: "",
  finalIntroGif: "",
  finalQuestion: "",
  finalAnswer: "",
  finalAnswerGif: "",
  finalSongApple: "",
  numImpossibleAnswers: 0,
  numImpossibleAnswers2: 0,
  numImpossibleSongs: 0,
  numImpossibleSongs2: 0,
};

export default function NewEditionPage() {

  // Initialize Pocketbase instance (elevatable, non-persistent auth store)
  const pb = getElevatableClient();
  // --- All useState declarations for songs, GIFs, questions, answers, and other UI state ---
  // Songs
  // Removed redundant local state for songs. Using editionData directly.

  // Apple Music state (if needed, or just rely on editionData)
  // We don't need separate state for metadata if the Search component handles it, 
  // but we might want to display it if we are not using the Search component for display only.
  // All other UI state (questions, answers, gifs, etc)
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadMessage, setLoadMessage] = useState("Creating edition . . .");
  const [authData, setAuthData] = useState(null);
  const [date, setDate] = React.useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  // --- useEditionDraft must be before any useEffect that references editionData ---
  const { saveDraft, loadDraft, clearDraft, hasDraft } = useEditionDraft();

  const [editionData, setEditionData] = useState<EditionDraftData>(() => {
    if (typeof window !== "undefined") {
      const draft = loadDraft();
      if (draft) return draft;
    }
    return defaultEditionData;
  });

  const updateField = (key: keyof EditionDraftData) => (value: any) => {
    setEditionData(prev => ({ ...prev, [key]: value }));
  };


  // Auto-save effect
  useEffect(() => {
    const handler = setTimeout(() => {
      saveDraft(editionData);
    }, 2000);
    return () => clearTimeout(handler);
  }, [editionData, saveDraft]);

  // --- useDateField depends on editionData ---
  const { parsedDate, onDateChange } = useDateField(editionData.date, updateField("date"));









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
            song_apple: roundSongs[roundIndex][questionIndex],
            answer: roundAnswers[roundIndex][questionIndex],
            answer_gif: roundAnswerGifs[roundIndex][questionIndex],
            bantha_answer: round === 1 && questionIndex === 2 ? editionData.banthaAnswer : '',
            bantha_answer_gif: round === 1 && questionIndex === 2 ? editionData.banthaAnswerGif : '',
            is_banthashit_question: round === 1 && questionIndex === 2,
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
    imp1SongsApple: { [key: number]: string },
    imp1Answers: string[],
    imp1AnswerGifs: { [key: number]: string },
    imp2SongsApple: { [key: number]: string },
    imp2Answers: string[],
    imp2AnswerGifs: { [key: number]: string }
  ): Promise<any[][]> => {
    const updatedRounds = await Promise.all([
      updateImpossibleRound(editionId, 1, imp1SongsApple, imp1Answers, imp1AnswerGifs),
      updateImpossibleRound(editionId, 2, imp2SongsApple, imp2Answers, imp2AnswerGifs),
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
      theme_gif: editionData.imp1Gif,
      question_text: editionData.imp1Question,
      point_value: editionData.imp1Ppa,
      apple_music_ids: songs,
      answers: answers,
      answer_gifs: answerGifs,
      edition_id: editionId,
      impossible_number: 1
    } : {
      intro_gif: editionData.imp2IntroGif,
      theme: editionData.imp2Theme,
      theme_gif: editionData.imp2Gif,
      question_text: editionData.imp2Question,
      point_value: editionData.imp2Ppa,
      apple_music_ids: songs,
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
      // Save the live form state directly. (The autosave hook persists under a
      // different localStorage key, so reading "new_edition_draft" here always
      // missed; using editionData is also simply more correct.)
      const draftJson = editionData;

      // Ensure Auth is valid
      await refreshAuthState();

      // Upload to Pocketbase
      if (editionData.id) {
        // Update existing
        await pb.collection("wip_editions").update(editionData.id, {
          progress: draftJson,
        });
        console.log("Updated existing draft:", editionData.id);
      } else {
        // Create new — store the returned id so subsequent saves update this
        // record (the autosave effect persists editionData, id included).
        const record = await pb.collection("wip_editions").create({
          progress: draftJson,
        });
        updateField("id")(record.id);
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
        home_song_apple: editionData.homeSongApple,
        end_gif_1: editionData.endGif1,
        end_gif_2: editionData.endGif2,
      });

      const editionId = updatedEdition.id;

      // NOTE: The edition was just created, so it has no questions / impossible /
      // wager / final records yet. The old "reset all active states" loops here
      // queried those child collections by the new edition_id and always found
      // nothing, so they were removed (dead round-trips).

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
        padArray(editionData.round1Questions, 5),
        padArray(editionData.round2Questions, 5),
        padArray(editionData.round3Questions, 5)
      ];
      const roundSongs = [
        padArray(editionData.round1SongsApple, 5),
        padArray(editionData.round2SongsApple, 5),
        padArray(editionData.round3SongsApple, 5)
      ];
      const roundAnswers = [
        padArray(editionData.round1Answers, 5),
        padArray(editionData.round2Answers, 5),
        padArray(editionData.round3Answers, 5)
      ];
      const roundAnswerGifs = [
        padArray(editionData.round1AnswerGifs, 5),
        padArray(editionData.round2AnswerGifs, 5),
        padArray(editionData.round3AnswerGifs, 5)
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
        editionData.imp1SongsApple,
        editionData.imp1Answers,
        editionData.imp1AnswerGifs,
        editionData.imp2SongsApple,
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
        wager_intro_gif: editionData.wagerGif,
        final_cat: editionData.finalCat,
        final_cat_gif: editionData.finalCatGif,
        wager_placing_gif: editionData.wagerPlacingGif,
        wager_song_apple: editionData.wagerSongApple,
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
        final_song_apple: editionData.finalSongApple,
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



  const refreshAuthState = async () => {
    // Elevate to a superuser session via the server, which verifies the
    // logged-in user is an admin. The superuser password is no longer shipped
    // to the browser. Requires being logged in (Google OAuth) as an admin.
    await elevateAuth(pb);
  };




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
          fill="currentColor"
          viewBox="0 0 24 24"
          shapeRendering="crispEdges"
          className="w-6 h-6"
        >
          {/* Pixel-art up chevron */}
          <rect x="9" y="6" width="6" height="3" />
          <rect x="6" y="9" width="12" height="3" />
          <rect x="3" y="12" width="6" height="3" />
          <rect x="15" y="12" width="6" height="3" />
          <rect x="0" y="15" width="6" height="3" />
          <rect x="18" y="15" width="6" height="3" />
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
        <EditionForm
          editionData={editionData}
          setEditionData={setEditionData}
          parsedDate={parsedDate}
          onDateChange={onDateChange}
        />

      </div>
    </div>
  );


}
