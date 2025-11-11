"use client";

import React, { useState, useEffect, useRef } from "react";

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
import { useCallback } from 'react';
import Tiptap from "@/components/TipTap";
import ShallNotPass from "@/components/ShallNotPass";
import { useEditionDraft } from "../../../../src/hooks/useEditionDraft";
import { useDateField } from "../../../../src/hooks/useDateField";
import GifPicker from "gif-picker-react";


export default function NewEditionPage() {
  // Ref to collect all GifPicker search inputs
  const gifInputsRef = useRef<HTMLInputElement[]>([]);

  const {
    editionData,
    updateField,
    updateArrayItem,
    addArrayItem,
    removeArrayItem,
    clearDraft,
  } = useEditionDraft();

  const { parsedDate, onDateChange } = useDateField(editionData.date, updateField("date"));


  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadMessage, setLoadMessage] = useState("Creating edition . . .");
  const [authData, setAuthData] = useState(null);



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

        // Update each question in the round
        const updatedRoundQuestions = await Promise.all(
          questions.map(async (questionText, questionIndex) => {
            // const questionId = fetchedRoundQuestions[questionIndex].id;

            // Update the question with its corresponding data
            const updatedQuestion = await pb.collection("questions").create({
              question_text: questionText,
              song: roundSongs[roundIndex][questionIndex],
              answer: roundAnswers[roundIndex][questionIndex],
              answer_gif: roundAnswerGifs[roundIndex][questionIndex],
              bantha_answer: round === 1 && questionIndex === 2 ? banthaAnswer : '',
              bantha_answer_gif: round === 1 && questionIndex === 2 ? banthaAnswerGif : '',
              round_number: round,
              question_number: questionIndex + 1,
              edition_id: editionId,
            });

            setLoadMessage(`Round ${round} Question ${questionIndex + 1} created . . .`);
            return updatedQuestion;
          })
        );


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
      intro_gif: imp1IntroGif,
      theme: imp1Theme,
      theme_gif: imp1Gif,
      question_text: imp1Question,
      point_value: imp1Ppa,
      spotify_ids: songs,
      answers: answers,
      answer_gifs: answerGifs,
      edition_id: editionId,
      impossible_number: 1
    } : {
      intro_gif: imp2IntroGif,
      theme: imp2Theme,
      theme_gif: imp2Gif,
      question_text: imp2Question,
      point_value: imp2Ppa,
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



  const handleCreateEdition = async () => {
    // scroll the page to the top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    setLoadMessage("Creating edition . . .");

    try {
      // // Wait for authentication to complete
      await refreshAuthState();

      // Step 1: Update the Edition
      const formattedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')} 12:00:00`;

      const updatedEdition = await pb.collection("editions").create({
        title: editionData.title,
        date: formattedDate, // Ensure `date` is formatted correctly
        edition_gif: editionData.editionGif,
        blurb: blurb,
        home_song: homeSong,
        end_gif_1: endGif1,
        end_gif_2: endGif2,
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
        const roundGif = i === 1 ? r1Gif : i === 2 ? r2Gif : r3Gif;
        await pb.collection("rounds").create({
          //console.log({        
          edition_id: editionId,
          round: i,
          type: "regular",
          round_gif: roundGif
        });
      }

      console.log("Rounds created!");

      setLoadMessage("Rounds created!")

      // Step 2: Update the Questions
      const roundQuestions = [round1Questions, round2Questions, round3Questions];
      const roundSongs = [round1Songs, round2Songs, round3Songs];
      const roundAnswers = [round1Answers, round2Answers, round3Answers];
      const roundAnswerGifs = [round1AnswerGifs, round2AnswerGifs, round3AnswerGifs];
      const roundGifs = [r1Gif, r2Gif, r3Gif];

      const updatedQuestions = await updateQuestions(
        editionId, // Now guaranteed to be a string
        roundQuestions,
        roundSongs,
        roundAnswers,
        roundAnswerGifs
      );

      console.log("Questions created!");

      // Step 3: Update the Impossible Rounds
      const updatedRounds = await updateImpossibleRounds(
        editionId,
        imp1Songs,
        imp1Answers,
        imp1AnswerGifs,
        imp2Songs,
        imp2Answers,
        imp2AnswerGifs
      );

      console.log("Impossible Rounds created!");

      // Step 4: Update the Wager Round
      // Grab the wager_round item whose edition_id equals editionId, grab its id, and put it into a const WagerRoundId
      setLoadMessage("Creating wager round . . .");

      const updatedWagerRound = await pb.collection("wager_rounds").create({
        wager_intro_gif: wagerGif,
        final_cat: finalCat,
        final_cat_gif: finalCatGif,
        wager_placing_gif: wagerPlacingGif,
        wager_song: wagerSong,
        edition_id: editionId,
      });

      console.log("Wager round created!");

      //Step 5: Update the Final Round
      setLoadMessage("Creating final round!");

      const updatedFinalRound = await pb.collection("final_rounds").create({
        final_intro_gif: finalIntroGif,
        question_text: finalQuestion,
        answer: finalAnswer,
        final_answer_gif: finalAnswerGif,
        final_song: finalSong,
        edition_id: editionId,
      });

      console.log("Final round created!");

      setError("Edition created successfully!");
    } catch (err) {
      console.error("Failed to create edition:", err);
      setError("Failed to create the edition. Please try again later.");
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

  return (
    <div>
      <div className="p-10">
        <div className="absolute top-10 right-10">
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
          scrollIntoView={false} // prevent auto-scroll on tab change
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
                        width={300}
                        height={300}
                        tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                        theme="dark"
                        autoFocus={false}
                        ref={(el: any) => {
                          if (el?.searchInput) gifInputsRef.current.push(el.searchInput);
                        }}
                      />
                      <img
                        src={editionData.editionGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                        alt="Edition GIF"
                        className="w-full max-w-[200px]"
                      />
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
              <div className="mb-8 w-1/2">
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
                      width={300}
                      height={300}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme="dark"
                      autoFocus={false}
                      ref={(el: any) => {
                        if (el?.searchInput) gifInputsRef.current.push(el.searchInput);
                      }}
                    />
                    <img
                      src={editionData.r1Gif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[200px] self-start"
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
                    className="w-1/2 mb-6"
                    value={editionData.r1Songs?.[index] || ""}
                    onValueChange={(newVal) => updateArrayItem("r1Songs", index, newVal)}
                  />
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
                  width={300}
                  height={300}
                  tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                  theme="dark"
                  autoFocus={false}
                  ref={(el: any) => { if (el?.searchInput) gifInputsRef.current.push(el.searchInput); }}
                />
                <img
                  src={editionData.imp1IntroGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                  alt="Selected GIF"
                  className="w-full max-w-[200px] self-start"
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
                      width={300}
                      height={300}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme="dark"
                      autoFocus={false}
                      ref={(el: any) => {
                        if (el?.searchInput) gifInputsRef.current.push(el.searchInput);
                      }}
                    />
                    <img
                      src={editionData.imp1ThemeGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[200px] self-start"
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
            <div className="mb-8 w-1/2">
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
                    width={300}
                    height={300}
                    tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                    theme="dark"
                    autoFocus={false}
                    ref={(el: any) => { if (el?.searchInput) gifInputsRef.current.push(el.searchInput); }}
                  />
                  <img
                    src={editionData.r2Gif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                    alt="Selected GIF"
                    className="w-full max-w-[200px] self-start"
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
                    width={300}
                    height={300}
                    tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                    theme="dark"
                    autoFocus={false}
                    ref={(el: any) => { if (el?.searchInput) gifInputsRef.current.push(el.searchInput); }}
                  />
                  <img
                    src={editionData.imp2IntroGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                    alt="Selected GIF"
                    className="w-full max-w-[200px] self-start"
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
                      width={300}
                      height={300}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme="dark"
                      autoFocus={false}
                      ref={(el: any) => {
                        if (el?.searchInput) gifInputsRef.current.push(el.searchInput);
                      }}
                    />
                    <img
                      src={editionData.imp2ThemeGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[200px] self-start"
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
              <div className="mb-8 w-1/2">
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
                      width={300}
                      height={300}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme="dark"
                      autoFocus={false}
                      ref={(el: any) => {
                        if (el?.searchInput) gifInputsRef.current.push(el.searchInput);
                      }}
                    />
                    <img
                      src={editionData.r3Gif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[200px] self-start"
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
                      width={300}
                      height={300}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme="dark"
                      autoFocus={false}
                      ref={(el: any) => {
                        if (el?.searchInput) gifInputsRef.current.push(el.searchInput);
                      }}
                    />
                    <img
                      src={editionData.wagerIntroGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[200px] self-start"
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
                      width={300}
                      height={300}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme="dark"
                      autoFocus={false}
                      ref={(el: any) => {
                        if (el?.searchInput) gifInputsRef.current.push(el.searchInput);
                      }}
                    />
                    <img
                      src={editionData.finalCategoryGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[200px] self-start"
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
                      width={300}
                      height={300}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme="dark"
                      autoFocus={false}
                      ref={(el: any) => {
                        if (el?.searchInput) gifInputsRef.current.push(el.searchInput);
                      }}
                    />
                    <img
                      src={editionData.wagerPlacingGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[200px] self-start"
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
                      width={300}
                      height={300}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme="dark"
                      autoFocus={false}
                      ref={(el: any) => {
                        if (el?.searchInput) gifInputsRef.current.push(el.searchInput);
                      }}
                    />
                    <img
                      src={editionData.finalIntroGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[200px] self-start"
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

              <div className="mb-8">
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
                      width={300}
                      height={300}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme="dark"
                      autoFocus={false}
                      ref={(el: any) => {
                        if (el?.searchInput) gifInputsRef.current.push(el.searchInput);
                      }}
                    />
                    <img
                      src={editionData.finalAnswerGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[200px] self-start"
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
                      width={300}
                      height={300}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme="dark"
                      autoFocus={false}
                      ref={(el: any) => {
                        if (el?.searchInput) gifInputsRef.current.push(el.searchInput);
                      }}
                    />
                    <img
                      src={editionData.endGif1 || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[200px] self-start"
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
                      width={300}
                      height={300}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme="dark"
                      autoFocus={false}
                      ref={(el: any) => {
                        if (el?.searchInput) gifInputsRef.current.push(el.searchInput);
                      }}
                    />
                    <img
                      src={editionData.endGif2 || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[200px] self-start"
                    />
                  </div>
                )}
              </div>
            </div>
          </Tab>
        </Tabs>
        <Button type="submit" onClick={handleCreateEdition} className="mt-6">
          Create Edition
        </Button>
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
            width={300}
            height={300}
            tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
            theme="dark"
            autoFocus={false}
            ref={(el: any) => {
              if (el?.searchInput) gifInputsRef.current.push(el.searchInput);
            }}
          />
          <img
            src={gifUrl || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
            alt="Selected GIF"
            className="w-full max-w-[200px] self-start"
          />
        </div>
      )}
    </>
  );
}