"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
} from "@nextui-org/react";
import { useRouter } from "next/navigation";
import pb from "@/lib/pocketbase";
import { parseDate, CalendarDate } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { useParams } from "next/navigation";
import { useCallback } from 'react';
import debounce from 'lodash/debounce';
import Tiptap from "@/components/TipTap";
import ShallNotPass from "@/components/ShallNotPass";
import { set } from "lodash";


export default function NewEditionPage() {

  const [loading, setLoading] = useState<boolean>(true);
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

  const { data: session } = useSession();

  //  console.log('logged in as admin:', session);


  const params = useParams();
  const editionEditId = typeof params?.id === "string" ? params.id : undefined;

  if (!editionEditId) {
    console.error("Edition ID is missing or invalid!");
    return; // Prevent further execution if the ID is missing
  }

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

      const randomRequestKey = Math.random().toString(36).substring(7);
      const getRounds = await pb.collection("rounds").getFullList({
        requestKey: randomRequestKey, filter: `edition_id = "${editionEditId}"`,
      });

      getRounds.forEach((round) => {
        if (round.round >= 1 && round.round <= 3) {
          setRoundGifs[round.round - 1](round.round_gif);
        }
      });


      const getQuestions = await pb.collection("questions").getFullList({ requestKey: randomRequestKey, filter: 'edition_id = "' + editionEditId + '"', sort: 'round_number, question_number' });

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
        if (index == 0) {
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
        const randomRequestKey = Math.random().toString(36).substring(7);
        const fetchedRoundQuestions = await pb
          .collection("questions")
          .getFullList({
            requestKey: randomRequestKey, filter: `edition_id = "${editionEditId}" && round_number = "${round}"`,
          });

        // Validate: Ensure the number of fetched questions matches the number of input questions
        if (fetchedRoundQuestions.length !== questions.length) {
          console.error(
            `Mismatch: Fetched ${fetchedRoundQuestions.length} questions but received ${questions.length} for round ${round}.`
          );
          throw new Error("Question count mismatch.");
        }

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

    const randomRequestKey = Math.random().toString(36).substring(7);
    const fetchedRound = await pb.collection("impossible_rounds").getFirstListItem(`edition_id = "${editionEditId}" && impossible_number = "${round}"`);
    const updatedRound = await pb.collection("impossible_rounds").update(fetchedRound.id, roundData);
    setLoadMessage(`Impossible Round ${round} updated . . .`);
    return [updatedRound];
  };



  const handleUpdateEdition = async () => {
    // scroll the page to the top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });   
    setLoading(true);
    setLoadMessage("Updating edition . . .");
    console.log('edition id: ', editionEditId);

    try {
      // // Wait for authentication to complete
      await refreshAuthState();

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

      // Step 2: Update the Questions
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

      // Step 3: Update the Impossible Rounds
      const updatedRounds = await updateImpossibleRounds(
        editionEditId,
        imp1Songs,
        imp1Answers,
        imp1AnswerGifs,
        imp2Songs,
        imp2Answers,
        imp2AnswerGifs
      );

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

      setError("Edition updated successfully!");
    } catch (err) {
      console.error("Failed to update edition:", err);
      setError("Failed to update the edition. Please try again later.");
    } finally {
      setLoading(false);
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


  useEffect(() => {
    //refreshAuthState();
    importEdition();
  }, []);

  return (
    <div>
      {!session ? (
        <ShallNotPass />
      ) : (
        <div className="p-10">
          <div className="absolute top-10 right-10">
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
                <div className="mb-4 w-1/4">
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
                </div>
                <div className="mb-4 w-1/2">
                  <label className="mb-2 block" htmlFor="edition_blurb">
                    Blurb
                  </label>
                  <Tiptap state={blurb} setState={setBlurb} identifier="edition_blurb" classes="tiptap p-4 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc" />
                </div>
                <div className="mb-4 w-1/4">
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
                </div>
              </div>
            </Tab>
            <Tab key="round1" title="Round 1">
              <h3 className="mb-8 text-2xl">Round 1</h3>
              <div className="ml-4">
                <div className="mb-8 w-1/4">
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
                  />
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
                      className="w-1/2 mb-6"
                      value={round1Songs[index]} // Bind the value dynamically
                      onChange={(e) => {
                        const updatedSongs = [...round1Songs];
                        updatedSongs[index] = e.target.value;
                        setRound1Songs(updatedSongs); // Update the specific song in the array
                      }}
                    />
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
                          identifier={`bantha_answer`}
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

                <div className="mb-8">
                  <h4 className="mb-2">Intro GIF</h4>
                  <Input
                    data-identifier="i1_intro_gif"
                    data-type="text"
                    type="text"
                    className="w-1/2"
                    value={imp1IntroGif}
                    onValueChange={setImp1IntroGif}
                  />
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

                <div className="mb-8">
                  <h4 className="mb-2">Theme GIF</h4>
                  <Input
                    data-identifier="i1_gif"
                    type="text"
                    data-type="gif"
                    className="w-1/2"
                    value={imp1Gif}
                    onValueChange={setImp1Gif}
                  />
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
                            onBlur={(e) => handleImp1Songs(index, e.target.getAttribute("value") ?? "")}
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

                <div className="mb-8 w-1/4">
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
                  />
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
                      className="w-1/2 mb-6"
                      value={round2Songs[index]} // Bind the value dynamically
                      onChange={(e) => {
                        const updatedSongs = [...round2Songs];
                        updatedSongs[index] = e.target.value;
                        setRound2Songs(updatedSongs); // Update the specific song in the array
                      }}
                    />
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
                <div className="mb-8">
                  <h4 className="mb-2">Intro GIF</h4>
                  <Input
                    data-identifier="i2_intro_gif"
                    data-type="text"
                    type="text"
                    className="w-1/2"
                    value={imp2IntroGif}
                    onValueChange={setImp2IntroGif}
                  />
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

                <div className="mb-8">
                  <h4 className="mb-2">Theme GIF</h4>
                  <Input
                    data-identifier="i2_gif"
                    type="text"
                    data-type="gif"
                    className="w-1/2"
                    value={imp2Gif}
                    onValueChange={setImp2Gif}
                  />
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
                            data-identifier={`i2_song${index + 1}`}
                            type="text"
                            data-type="song"
                            required
                            value={imp2Songs[index] ?? ""}
                            onBlur={(e) => handleImp2Songs(index, e.target.getAttribute("value") ?? "")}
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
                <div className="mb-8 w-1/4">
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
                  />
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
                      className="w-1/2 mb-6"
                      value={round3Songs[index]} // Bind the value dynamically
                      onChange={(e) => {
                        const updatedSongs = [...round3Songs];
                        updatedSongs[index] = e.target.value;
                        setRound3Songs(updatedSongs); // Update the specific song in the array
                      }}
                    />
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
                <div className="mb-8 w-1/2">
                  <label className="mb-2 block" htmlFor="wager_gif">
                    Wager Intro GIF:
                  </label>
                  <Input
                    id="wager_gif"
                    type="text"
                    data-type="gif"
                    value={wagerGif}
                    onValueChange={setWagerGif}
                  />
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

                <div className="mb-8 w-1/2">
                  <label className="mb-2 block" htmlFor="final_cat_gif">
                    Final Category GIF:
                  </label>
                  <Input
                    id="final_cat_gif"
                    type="text"
                    data-type="gif"
                    value={finalCatGif}
                    onBlur={(e) => setFinalCatGif(e.target.getAttribute("value") ?? "")}
                  />
                </div>

                <div className="mb-8 w-1/2">
                  <label className="mb-2 block" htmlFor="wager_placing_gif">
                    Wager Placing GIF:
                  </label>
                  <Input
                    id="wager_placing_gif"
                    type="text"
                    data-type="gif"
                    value={wagerPlacingGif}
                    onValueChange={setWagerPlacingGif}
                  />
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

                <div className="mb-8">
                  <h4 className="mb-2">Answer GIF:</h4>
                  <Input
                    data-identifier="final_answer_gif"
                    data-type="gif"
                    className="w-1/2"
                    value={finalAnswerGif}
                    onValueChange={setFinalAnswerGif}
                  />
                </div>

                <div className="mb-8">
                  <h4 className="mb-2">Song:</h4>
                  <Input
                    data-identifier="final_song"
                    data-type="song"
                    className="w-1/2"
                    value={finalSong}
                    onValueChange={setFinalSong}
                  />
                </div>

                <div className="mb-8 w-1/4">
                  <label className="mb-2 block" htmlFor="edition_end_gif_1">
                    End GIF 1:
                  </label>
                  <Input
                    id="edition_end_gif_1"
                    type="text"
                    value={endGif1}
                    onValueChange={setEndGif1}
                    data-type="gif"
                  />
                </div>

                <div className="mb-8 w-1/4">
                  <label className="mb-2 block" htmlFor="edition_end_gif_2">
                    End GIF 2:
                  </label>
                  <Input
                    id="edition_end_gif_2"
                    type="text"
                    value={endGif2}
                    onValueChange={setEndGif2}
                    data-type="gif"
                  />
                </div>
              </div>
            </Tab>
          </Tabs>
          <Button type="submit" onClick={handleUpdateEdition} className="mt-6">
            Update Edition
          </Button>
        </div>
      )}
    </div>
  );


}
