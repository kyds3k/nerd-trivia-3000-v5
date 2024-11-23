"use client";

import { NextResponse } from "next/server";
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
  Textarea,
  DatePicker
} from "@nextui-org/react";
import { Image } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import pb from "@/lib/pocketbase";
import { Editor } from "@/components/DynamicEditor";
import EditorQuestion from "@/components/EditorQuestion";
import { DateValue, getLocalTimeZone, today } from "@internationalized/date";
import { useParams } from "next/navigation";
import { useCallback } from 'react';
import debounce from 'lodash/debounce';
import Tiptap from "@/components/TipTap";
import Link from "next/link";
import ShallNotPass from "@/components/ShallNotPass";
import { set } from "lodash";


export default function NewEditionPage() {

  const [authData, setAuthData] = useState(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = React.useState<DateValue>(today(getLocalTimeZone()));
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
  
  const [numImpossibleAnswers, setNumImpossibleAnswers] = useState<number>(1);
  const [numImpossibleAnswers2, setNumImpossibleAnswers2] = useState<number>(1);
  const [numImpossibleSongs, setNumImpossibleSongs] = useState<number>(1);
  const [numImpossibleSongs2, setNumImpossibleSongs2] = useState<number>(1);
  const [imp1IntroGif, setImp1IntroGif] = useState("");
  const [imp1Theme, setImp1Theme] = useState("");
  const [imp1Gif, setImp1Gif] = useState("");
  const [imp1Songs, setImp1Songs] = useState<{ [key: number]: string }>({});
  const [imp1Answers, setImp1Answers] = useState<{ [key: number]: string }>({});
  const [imp1AnswerGifs, setImp1AnswerGifs] = useState<{ [key: number]: string }>({});
  const [imp1Ppa, setImp1Ppa] = useState<number>(100);
  const [imp2IntroGif, setImp2IntroGif] = useState("");
  const [imp2Theme, setImp2Theme] = useState("");
  const [imp2Gif, setImp2Gif] = useState("");
  const [imp2Songs, setImp2Songs] = useState<{ [key: number]: string }>({});
  const [imp2Answers, setImp2Answers] = useState<{ [key: number]: string }>({});
  const [imp2AnswerGifs, setImp2AnswerGifs] = useState<{ [key: number]: string }>({});
  const [imp2Ppa, setImp2Ppa] = useState<number>(100);
  const [wagerGif, setWagerGif] = useState("");
  const [wagerPlacingGif, setWagerPlacingGif] = useState("");
  const [wagerSong, setWagerSong] = useState("");
  const [finalCat, setFinalCat] = useState("");
  const [finalCatGif, setFinalCatGif] = useState("");
  const [finalIntroGif, setFinalIntroGif] = useState("");
  const [finalAnswerGif, setFinalAnswerGif] = useState("");
  const [finalSong, setFinalSong] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  const { data: session } = useSession();

  console.log('logged in as admin:', session);


  const params = useParams();
  const editionEditId = params.id;

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

  type UpdateQuestionFunction = (round: 1 | 2 | 3, index: number, value: string) => void;

  const updateQuestion: UpdateQuestionFunction = (round, index, value) => {
    const setters: Record<1 | 2 | 3, React.Dispatch<React.SetStateAction<string[]>>> = {
      1: setRound1Questions,
      2: setRound2Questions,
      3: setRound3Questions,
    };

    setters[round]((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const updateAnswer: UpdateQuestionFunction = (round, index, value) => {
    const setters: Record<1 | 2 | 3, React.Dispatch<React.SetStateAction<string[]>>> = {
      1: setRound1Answers,
      2: setRound2Answers,
      3: setRound3Answers,
    };

    setters[round]((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }

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

  const debouncedSetTitle = useCallback(
    debounce((value) => setTitle(value), 300),
    []
  );


  const importEdition = async () => {
    console.log(pb.authStore.isValid);
    console.log(pb.authStore.token);
    console.log(pb.authStore.model?.id);

    const formattedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')} 12:00:00`;

    try {
      //Step 1: Get the Edition

      // grab the edition ID from the url

      const getEdition = await pb.collection("editions").getFirstListItem(`id = "${editionEditId}"`);
      setTitle(getEdition.title);
      setEditionGif(getEdition.edition_gif);
      setBlurb(getEdition.blurb);
      setHomeSong(getEdition.home_song);
      setIsLoaded(true);


      // console.log(getEdition);
      const setRoundGifs = [setR1Gif, setR2Gif, setR3Gif];

      const getRounds = await pb.collection("rounds").getFullList({
        filter: `edition_id = "${editionEditId}"`,
      });

      // Loop through the rounds and set the corresponding state
      getRounds.forEach((round) => {
        if (round.round >= 1 && round.round <= 3) {
          setRoundGifs[round.round - 1](round.round_gif);
        }
      });


      const getQuestions = await pb.collection("questions").getFullList({ filter: 'edition_id = "' + editionEditId + '"', sort: 'round_number, question_number' });
      console.log('this is not working:');
      console.log(getQuestions);
      const setRoundQuestions = [setRound1Questions, setRound2Questions, setRound3Questions];
      setRoundQuestions.forEach((setter, index) => {
        const roundQuestions = getQuestions.filter((question) => question.round_number === index + 1);
        const questionTexts = roundQuestions.map((question) => question.question_text);
        setter(questionTexts);
      }
      );


      setError("GREAT SUCCESS!");
    } catch (err) {
      console.error("Failed to import edition:", err);
      setError("Failed to import the edition. Please try again later.");
    }
  };


  const handleUpdateEdition = async () => {
    console.log(pb.authStore.isValid);
    console.log(pb.authStore.token);
    console.log(pb.authStore.model?.id);

    const formattedDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')} 12:00:00`;
    // grab the data-html from the object whose data-identifier is "edition_blurb" and setBlurb to that
    const blurbEditor = document.querySelector("[data-identifier='edition_blurb']");
    if (blurbEditor) {
      console.log('we got a blurbeditor');
      setBlurb(blurbEditor.getAttribute("data-html") ?? "");
    }

    try {
      //Step 1: Create the Edition
      const newEdition = await pb.collection("editions").update(`${editionEditId}`, {
        //console.log({      
        title,
        date: formattedDate,
        blurb: blurb,
        home_song: homeSong,
        edition_gif: editionGif,
        end_gif_1: endGif1,
        end_gif_2: endGif2
      });

      //const editionId = newEdition.id;
      //const editionId = "12345";

      // Step 2: Create the Questions
      // const regularquestions = document.querySelectorAll("[data-type='regular_question']");

      // for (const [index, question] of Array.from(regularquestions).entries()) {
      //   const currentRound = question.getAttribute("data-identifier")?.split("r")[1]?.split("q")[0] ?? "";
      //   const currentQuestion = question.getAttribute("data-identifier")?.split("q")[1] ?? "";

      //   const questionText = question.getAttribute("data-html") ?? "";

      //   if (questionText === "")
      //     return;

      //   // Grab the data-html from the corresponding answer element
      //   const answer = document.querySelector(`[data-identifier='r${currentRound}a${currentQuestion}']`);
      //   const answerText = answer?.getAttribute("data-html") ?? "";

      //   // Grab the attribute "value" from the corresponding gif element
      //   const gif = document.querySelector(`[data-identifier='r${currentRound}g${currentQuestion}']`);
      //   const gifText = gif?.getAttribute("value") ?? "";

      //   // Grab the attribute "value" from the corresponding song element
      //   const song = document.querySelector(`[data-identifier='r${currentRound}s${currentQuestion}']`);
      //   const songText = song?.getAttribute("value") ?? "";

      //   let banthaAnswerText = "";
      //   let banthaAnswerGifUrl = "";

      //   if (currentRound == "1" && currentQuestion === "3") {
      //     const banthaAnswer = document.querySelector("[data-identifier='bantha_answer']");
      //     banthaAnswerText = banthaAnswer?.getAttribute("data-html") ?? "";

      //     const banthaAnswerGif = document.querySelector("[data-identifier='bantha_answer_gif']");
      //     banthaAnswerGifUrl = banthaAnswerGif?.getAttribute("value") ?? "";
      //   }


      //   // Create the new question
      //   await pb.collection("questions").create({
      //   //console.log({        
      //     edition_id: editionId,
      //     round_number: currentRound,
      //     question_number: currentQuestion,
      //     question_text: questionText,
      //     answer: answerText,
      //     answer_gif: gifText,
      //     bantha_answer: currentRound == "1" && currentQuestion === "3" ? banthaAnswerText : "",          
      //     bantha_answer_gif: currentRound == "1" && currentQuestion === "3" ? banthaAnswerGifUrl : "",
      //     song: songText,
      //     is_banthashit_question: currentRound == "1" && currentQuestion === "3" ? true : false,
      //     is_active: false
      //   });
      // }

      // //Step 3: Create the rounds. first we will loop from 1-3, creating a round which we will push to the rounds collection on pocketbase. "round_number" will be the index of the loop + 1. "type" will be "regular". "round_gif" will be {r1Gif, r2Gif, r3Gif} states respectively. "edition_id" will be the id of the edition we just created.
      // for (let i = 1; i < 4; i++) {
      //   const roundGif = i === 1 ? r1Gif : i === 2 ? r2Gif : r3Gif;
      //   await pb.collection("rounds").create({
      //   //console.log({        
      //     edition_id: editionId,
      //     round: i,
      //     type: "regular",
      //     round_gif: roundGif
      //   });
      // }

      // //Step 4: Create the Impossible and 2nd Impossible Questions

      // const collectAnswers = (setId: number) => {
      //   const collectedAnswers: { [key: string]: string } = {};
      //   const elements = document.querySelectorAll(`[data-type="answer"][data-identifier*="i${setId}"]`);
      //   elements.forEach((element, index) => {
      //     const identifier = element.getAttribute('data-identifier');
      //     const htmlData = element.getAttribute('data-html');

      //     if (identifier && htmlData) {
      //       collectedAnswers[index] = htmlData;
      //     }
      //   });
      //   return collectedAnswers;
      // };

      // const collectGifs = (setId: number) => {
      //   const collectedGifs: { [key: string]: string } = {};
      //   const elements = document.querySelectorAll(`[data-type="gif"][data-identifier*="i${setId}"]`);
      //   elements.forEach((element, index) => {
      //     const identifier = element.getAttribute('data-identifier');
      //     const htmlData = element.getAttribute('value');

      //     if (identifier && htmlData) {
      //       collectedGifs[index] = htmlData;
      //     }
      //   });
      //   return collectedGifs;
      // };      

      // // call collecedAnswers for 1 and 2 and put the results in the respective json objects
      // const imp1Answers = collectAnswers(1);
      // const imp2Answers = collectAnswers(2);

      // const imp1AnswerGifs = collectGifs(1);
      // const imp2AnswerGifs = collectGifs(2);

      // for (let i = 1; i <= 2; i++) {
      //   const gif = i === 1 ? imp1Gif : imp2Gif;
      //   const question_text = document.querySelector(`[data-identifier='i${i}_question']`)?.getAttribute("data-html") ?? "";
      //   // "answers" will be a JSON object formed by grabbing the data-html from each element with data-type="answer" and data-identifier="i1a1", "i1a2", etc

      //   const songs = i === 1 ? imp1Songs : imp2Songs;

      //   console.log('imp1Answers type:', typeof imp1Answers);
      //   console.log('songs type:', typeof songs);

      //   await pb.collection("impossible_rounds").create({
      //   //console.log ({
      //     edition_id: editionId,
      //     impossible_number: i,
      //     intro_gif: gif,
      //     theme: i === 1 ? imp1Theme : imp2Theme,
      //     theme_gif: i === 1 ? imp1Gif : imp2Gif,
      //     question_text: question_text,
      //     point_value: i === 1 ? imp1Ppa : imp2Ppa,
      //     answers: i === 1 ? imp1Answers : imp2Answers,
      //     answer_gifs: i === 1 ? imp1AnswerGifs : imp2AnswerGifs,
      //     spotify_ids: songs,
      //     is_active: false
      //   });
      // }

      // //create Wager round
      // await pb.collection("wager_rounds").create({
      //   //console.log({
      //   edition_id: editionId,
      //   wager_intro_gif: wagerGif,
      //   final_cat: finalCat,
      //   final_cat_gif: finalCatGif,
      //   wager_placing_gif: wagerPlacingGif,
      //   wager_song: wagerSong
      // });

      // // create final round
      // await pb.collection("final_rounds").create({
      // //console.log({
      //   edition_id: editionId,
      //   final_intro_gif: finalIntroGif,
      //   question_text: document.querySelector("[data-identifier='final_question']")?.getAttribute("data-html") ?? "",
      //   answer: document.querySelector("[data-identifier='final_answer']")?.getAttribute("data-html") ?? "",
      //   final_answer_gif: finalAnswerGif,
      //   final_song: finalSong,
      //   is_active: false
      // });


      // Redirect to the dashboard after successful creation
      setError("Edition updated successfully!");
    } catch (err) {
      console.error("Failed to create edition:", err);
      setError("Failed to create the edition. Please try again later.");
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


  useEffect(() => {
    //refreshAuthState();
    importEdition();
  }, []);

  return !session ? (
    ShallNotPass()
  ) : (
    <div className="p-10">
      <h1 className="mb-6 text-2xl">Edit Edition</h1>
      {error && <p>{error}</p>}
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
                onChange={(value) => setDate(value)}
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
                <Tiptap
                  state={round1Questions[index]}
                  setState={(value) => updateQuestion(1, index, value)}
                  identifier={`r1q${index + 1}`}
                  classes="tiptap p-4 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                />
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
              <Input data-identifier="i1_intro_gif" data-type="text" type="text" className="w-1/2" onBlur={(e) => setImp1IntroGif(e.target.getAttribute("value") ?? "")} />
            </div>

            <div className="mb-8">
              <h4 className="mb-2">Theme</h4>
              <Input data-identifier="i1_theme" data-type="text" type="text" className="w-1/2" onBlur={(e) => setImp1Theme(e.target.getAttribute("value") ?? "")} />
            </div>

            <div className="mb-8">
              <h4 className="mb-2">Theme GIF</h4>
              <Input data-identifier="i1_gif" type="text" data-type="gif" className="w-1/2" onBlur={(e) => setImp1Gif(e.target.getAttribute("value") ?? "")} />
            </div>

            <div className="mb-8">
              <h4 className="mb-2">Question</h4>
              <Editor dataIdentifier="i1_question" dataType="question" classNames="py-10 w-3/4" />
            </div>


            {/* Songs */}
            <div className="mb-8">
              <h4 className="mb-2">Songs</h4>
              <Select
                label="Number of Songs"
                data-identifier="i1_num_songs"
                className="w-80 mb-8"
                value="1"
                onSelectionChange={(keys) => {
                  const selectedValue = Array.from(keys)[0];
                  console.log("selectedValue from select", selectedValue);
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
                  console.log("selectedValue from select", selectedValue);
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
                <Input data-identifier="i1_ppa" type="number" data-type="number" step="50" min="50" className="w-1/12" onBlur={(e) => setImp1Ppa(parseInt(e.target.getAttribute("value") ?? ""))} />
              </div>

              <hr className="block my-10 bg-gray-500"></hr>

              {/* Render the Answer Inputs Based on State */}
              <div className="answer_list ml-4" data-impossible="1">
                {Array.from({ length: numImpossibleAnswers }).map((_, index) => (
                  <div key={index}>
                    <div className="mb-4">
                      <h4 className="mb-2">Answer {index + 1}</h4>
                      <Editor
                        dataIdentifier={`i1a${index + 1}`}
                        dataType="answer"
                        classNames="py-10 w-3/4"
                      />
                    </div>
                    <div className="mb-4">
                      <h4 className="mb-2">Answer {index + 1} GIF</h4>
                      <Input data-identifier={`i1a${index + 1}_gif`} data-type="gif" type="text" className="w-1/2" />
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
              />>
            </div>

            {Array.from({ length: 5 }, (_, index) => (
              <div key={`round2-question${index + 1}`}>
                <EditorQuestion round={2} question={index + 1} />
                <Divider className="my-4" />
                <hr className="block my-10 bg-gray-300"></hr>
              </div>
            ))}
          </div>
        </Tab>
        <Tab key="impossible2" title="Impossible 2">
          <h3 className="mb-8 text-2xl">Impossible 2</h3>
          <div className="ml-5">

            <div className="mb-8">
              <h4 className="mb-2">Intro GIF</h4>
              <Input data-identifier="i2_intro_gif" data-type="text" type="text" className="w-1/2" onBlur={(e) => setImp2IntroGif(e.target.getAttribute("value") ?? "")} />
            </div>

            <div className="mb-4">
              <h4 className="mb-2">Theme</h4>
              <Input data-identifier="i2_theme" data-type="text" type="text" className="w-1/2" onBlur={(e) => setImp2Theme(e.target.getAttribute("value") ?? "")} />
            </div>

            <div className="mb-4">
              <h4 className="mb-2">Theme GIF</h4>
              <Input data-identifier="i2_gif" data-type="gif" type="text" className="w-1/2" onBlur={(e) => setImp2Gif(e.target.getAttribute("value") ?? "")} />
            </div>

            <div className="mb-4">
              <h4 className="mb-2">Question</h4>
              <Editor dataIdentifier="i2_question" dataType="question" classNames="py-10 w-3/4" />
            </div>


            {/* Songs */}
            <div className="mb-4">
              <h4 className="mb-2">Songs</h4>
              <Select
                label="Number of Songs"
                data-identifier="i2_num_songs"
                className="w-80 mb-8"
                value="1"
                onSelectionChange={(keys) => {
                  const selectedValue = Array.from(keys)[0];
                  console.log("selectedValue from select", selectedValue);
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
                  console.log("selectedValue from select", selectedValue);
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

              <hr className="block my-10 bg-gray-500"></hr>

              {/* Render the Answer Inputs Based on State */}
              <div className="answer_list ml-4" data-impossible="2">
                {Array.from({ length: numImpossibleAnswers2 }).map((_, index) => (
                  <div key={index}>
                    <div className="mb-4">
                      <h4 className="mb-2">Answer {index + 1}</h4>
                      <Editor
                        dataIdentifier={`i2a${index + 1}`}
                        dataType="answer"
                        classNames="py-10 w-3/4"
                      />
                    </div>
                    <div className="mb-4">
                      <h4 className="mb-2">Answer {index + 1} GIF</h4>
                      <Input data-identifier={`i1a${index + 1}_gif`} data-type="gif" type="text" className="w-1/2" />
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
                <EditorQuestion round={3} question={index + 1} />
                <Divider className="my-4" />
                <hr className="block my-10 bg-gray-300"></hr>
              </div>
            ))}
          </div>
        </Tab>

        <Tab key="wager" title="Wager">
          <h3 className="mb-8 text-2xl">Wager</h3>
          <div className="ml-5">
            <div className="mb-8 w-1/4">
              <label className="mb-2 block" htmlFor="wager_gif">
                Wager Intro GIF:
              </label>
              <Input
                id="wager_gif"
                type="text"
                data-type="gif"
                onBlur={(e) => setWagerGif(e.target.getAttribute("value") ?? "")}
              />
            </div>

            <div className="mb-8 w-1/4">
              <label className="mb-2 block" htmlFor="final_category">
                Final Category:
              </label>
              <Input
                id="final_category"
                type="text"
                data-type="text"
                onBlur={(e) => setFinalCat(e.target.getAttribute("value") ?? "")}
              />
            </div>

            <div className="mb-8 w-1/4">
              <label className="mb-2 block" htmlFor="final_cat_gif">
                Final Category GIF:
              </label>
              <Input
                id="final_cat_gif"
                type="text"
                data-type="gif"
                onBlur={(e) => setFinalCatGif(e.target.getAttribute("value") ?? "")}
              />
            </div>

            <div className="mb-8 w-1/4">
              <label className="mb-2 block" htmlFor="wager_placing_gif">
                Wager Placing GIF:
              </label>
              <Input
                id="wager_placing_gif"
                type="text"
                data-type="gif"
                onBlur={(e) => setWagerPlacingGif(e.target.getAttribute("value") ?? "")}
              />
            </div>

            <div className="mb-8 w-1/4">
              <label className="mb-2 block" htmlFor="wager_song">
                Wager Placing Song:
              </label>
              <Input
                id="wager_song"
                type="text"
                data-type="song"
                onBlur={(e) => setWagerSong(e.target.getAttribute("value") ?? "")}
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
                onBlur={(e) => setFinalIntroGif(e.target.getAttribute("value") ?? "")}
              />
            </div>

            <div className="mb-8">
              <h4 className="mb-2">Question</h4>
              <Editor dataIdentifier="final_question" dataType="question" classNames="py-10 w-3/4" />
            </div>

            <div className="mb-8">
              <h4 className="mb-2">Answer</h4>
              <Editor dataIdentifier="final_answer" dataType="answer" classNames="py-10 w-3/4" />
            </div>

            <div className="mb-8">
              <h4 className="mb-2">Answer GIF:</h4>
              <Input data-identifier="final_answer_gif" data-type="gif" className="w-1/2" onBlur={(e) => setFinalAnswerGif(e.target.getAttribute("value") ?? "")} />
            </div>

            <div className="mb-8">
              <h4 className="mb-2">Song:</h4>
              <Input data-identifier="final_song" data-type="song" className="w-1/2" onBlur={(e) => setFinalSong(e.target.getAttribute("value") ?? "")} />
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
  );
}
