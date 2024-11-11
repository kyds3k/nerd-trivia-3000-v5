"use client";

import React, { useState } from "react";
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
import { useRouter } from "next/navigation";
import pb from "@/lib/pocketbase";
import { Editor } from "@/components/DynamicEditor";
import EditorQuestion from "@/components/EditorQuestion";
import blocksToFullHTML from "@blocknote/mantine";

export default function NewEditionPage() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [blurb, setBlurb] = useState("");
  const [homeSong, setHomeSong] = useState("");
  const [editionGif, setEditionGif] = useState("");
  const [endGif1, setEndGif1] = useState("");
  const [endGif2, setEndGif2] = useState("");
  const [roundQuestions, setRoundQuestions] = useState<any>({
    round1: "",
    impossible1: "",
    round2: "",
    impossible2: "",
    round3: "",
    wagerFinal: "",
  });
  const [numImpossibleAnswers, setNumImpossibleAnswers] = useState<number>(1);
  const [numImpossibleAnswers2, setNumImpossibleAnswers2] = useState<number>(1);
  const [numImpossibleSongs, setNumImpossibleSongs] = useState<number>(1);
  const [numImpossibleSongs2, setNumImpossibleSongs2] = useState<number>(1);
  const [value, setValue] = useState<Selection>();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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


  const handleCreateEdition = async () => {
    try {
      // Step 1: Create the Edition
      const newEdition = await pb.collection("editions").create({
        title,
        date,
        blurb,
        home_song: homeSong,
        edition_gif: editionGif,
        end_gif_1: endGif1,
        end_gif_2: endGif2,
      });

      // // Step 2: Create Rounds and Questions
      // const rounds = [
      //   { round_number: 1, type: "Normal", edition_id: newEdition.id, questions: roundQuestions.round1 },
      //   { round_number: 1, type: "Impossible", edition_id: newEdition.id, questions: roundQuestions.impossible1 },
      //   { round_number: 2, type: "Normal", edition_id: newEdition.id, questions: roundQuestions.round2 },
      //   { round_number: 2, type: "Impossible", edition_id: newEdition.id, questions: roundQuestions.impossible2 },
      //   { round_number: 3, type: "Normal", edition_id: newEdition.id, questions: roundQuestions.round3 },
      //   { round_number: 4, type: "Wager/Final", edition_id: newEdition.id, questions: roundQuestions.wagerFinal },
      // ];

      // await Promise.all(
      //   rounds.map((round) => pb.collection("rounds").create(round))
      // );

      // Redirect to the dashboard after successful creation
      //router.push("/dashboard");
      } catch (err) {
        console.error("Failed to create edition:", err);
        setError("Failed to create the edition. Please try again later.");
      }
  };

  return (
    <div className="p-10">
      <h1 className="mb-6 text-2xl">Create New Edition</h1>
      <p>home song is this man {homeSong}</p>
      {error && <p>{error}</p>}
      <Tabs
        aria-label="Rounds"
        destroyInactiveTabPanel={true}
        size="lg"
        variant="bordered"
        classNames={{ tabList: "mb-4 sticky top-14" }}
      >
        <Tab key="landing" title="Landing">
          <div className="mb-4 w-1/2">
            <label className="mb-2 block" htmlFor="edition_title">
              Title:
            </label>
            <Input
              id="edition_title"
              type="text"
              data-identifier="edition_title"
              data-type="title"
              required
            />
          </div>
          <div className="mb-4 w-1/6">
            <label className="mb-2 block" htmlFor="edition_date">
              Date:
            </label>
            <DatePicker label="Edition date" data-type="date" data-identifier="edition_date" className="max-w-[284px]" />
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
            />
          </div>
          <div className="mb-4 w-1/2">
            <label className="mb-2 block" htmlFor="edition_blurb">
              Blurb:
            </label>
            <Textarea
              id="edition_blurb"
              data-type="text"
              data-identifier="edition_blurb"
              required
            />
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
              onValueChange={(value) => setHomeSong(value)}
              required
            />
          </div>
        </Tab>
        <Tab key="round1" title="Round 1">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={`round1-question${index + 1}`}>
              <EditorQuestion round={1} question={index + 1} />
              <Divider className="my-4" />
              <hr className="block my-10 bg-gray-500"></hr>
            </div>
          ))}
        </Tab>
        <Tab key="impossible1" title="Impossible 1">
          <h3 className="mb-4 text-lg">Impossible 1</h3>
          <div className="ml-5">
            <div className="mb-4">
              <h4 className="mb-2">Theme</h4>
              <Input data-identifier="i1_theme" data-type="text" type="text" className="w-1/2" />
            </div>

            <div className="mb-4">
              <h4 className="mb-2">Theme GIF</h4>
              <Input data-identifier="i1_gif" type="text" data-type="gif" className="w-1/2" />
            </div>

            <div className="mb-4">
              <h4 className="mb-2">Question</h4>
              <Editor dataIdentifier="i1_question" dataType="question" classNames="py-10 w-3/4" />
            </div>


            {/* Songs */}
            <div className="mb-4">
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
                      <Input data-identifier={`i1_a${index + 1}_gif`} data-type="gif" type="text" className="w-1/2" />
                    </div>
                    <hr className="block my-10 bg-gray-300"></hr>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Tab>
        <Tab key="round2" title="Round 2">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={`round2-question${index + 1}`}>
              <EditorQuestion round={2} question={index + 1} />
              <Divider className="my-4" />
              <hr className="block my-10 bg-gray-300"></hr>
            </div>
          ))}
        </Tab>
        <Tab key="impossible2" title="Impossible 2">
          <h3 className="mb-4 text-lg">Impossible 2</h3>
          <div className="ml-5">
            <div className="mb-4">
              <h4 className="mb-2">Theme</h4>
              <Input data-identifier="i2_theme" data-type="text" type="text" className="w-1/2" />
            </div>

            <div className="mb-4">
              <h4 className="mb-2">Theme GIF</h4>
              <Input data-identifier="i2_gif" data-type="gif" type="text" className="w-1/2" />
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
              <div className="song_list ml-4" data-impossible="2">
                {Array.from({ length: numImpossibleSongs }).map((_, index) => (
                  <div key={index}>
                    <div className="mb-4">
                      <h4 className="mb-2">Song {index + 1}</h4>
                      <Input
                        data-identifier={`i1_song${index + 1}`}
                        type="text"
                        data-type="song"
                        required
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
                        dataIdentifier={`i2_answer${index + 1}`}
                        dataType="answer"
                        classNames="py-10 w-3/4"
                      />
                    </div>
                    <div className="mb-4">
                      <h4 className="mb-2">Answer {index + 1} GIF</h4>
                      <Input data-identifier={`i1_a${index + 1}_gif`} data-type="gif" type="text" className="w-1/2" />
                    </div>
                    <hr className="block my-10 bg-gray-300"></hr>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Tab>

        <Tab key="round3" title="Round 3">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={`round3-question${index + 1}`}>
              <EditorQuestion round={3} question={index + 1} />
              <Divider className="my-4" />
              <hr className="block my-10 bg-gray-300"></hr>
            </div>
          ))}
        </Tab>

        <Tab key="wager" title="Wager">
          <h3 className="mb-4 text-lg">Wager</h3>
          <div className="ml-5">
            <div className="mb-8 w-1/4">
              <label className="mb-2 block" htmlFor="edition_gif">
                Wager Intro GIF:
              </label>
              <Input
                id="edition_gif"
                type="text"
                data-type="gif"
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
              />
            </div>

          </div>
        </Tab>

        <Tab key="final" title="Final">
          <h3 className="mb-4 text-lg">Final Question</h3>
          <div className="ml-5">
            <div className="mb-4">
              <h4 className="mb-2">Question</h4>
              <Editor dataIdentifier="final_question" dataType="question" classNames="py-10 w-3/4" />
            </div>

            <div className="mb-4">
              <h4 className="mb-2">Answer</h4>
              <Editor dataIdentifier="final_answer" dataType="answer" classNames="py-10 w-3/4" />
            </div>

            <div className="mb-4">
              <h4 className="mb-2">Answer GIF:</h4>
              <Input data-identifier="final_answer_gif" data-type="gif" className="w-1/2" />
            </div>

            <div className="mb-4">
              <h4 className="mb-2">Song:</h4>
              <Input data-identifier="final_song" data-type="song" className="w-1/2" />
            </div>

            <div className="mb-4 w-1/4">
              <label className="mb-2 block" htmlFor="edition_end_gif_1">
                End GIF 1:
              </label>
              <Input
                id="edition_end_gif_1"
                type="text"
                data-type="gif"
              />
            </div>

            <div className="mb-4 w-1/4">
              <label className="mb-2 block" htmlFor="edition_end_gif_2">
                End GIF 2:
              </label>
              <Input
                id="edition_end_gif_2"
                type="text"
                data-type="gif"
              />
            </div>
          </div>
        </Tab>
      </Tabs>
      <Button type="submit" onClick={grabInfo} className="mt-6">
              Create Edition
            </Button>      
    </div>
  );
}
