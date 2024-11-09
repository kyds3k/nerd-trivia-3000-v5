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
} from "@nextui-org/react";
import { useRouter } from "next/navigation";
import pb from "@/lib/pocketbase";
import { Editor } from "@/components/DynamicEditor";
import EditorQuestion from "@/components/EditorQuestion";

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
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

      // Step 2: Create Rounds and Questions
      const rounds = [
        { round_number: 1, type: "Normal", edition_id: newEdition.id, questions: roundQuestions.round1 },
        { round_number: 1, type: "Impossible", edition_id: newEdition.id, questions: roundQuestions.impossible1 },
        { round_number: 2, type: "Normal", edition_id: newEdition.id, questions: roundQuestions.round2 },
        { round_number: 2, type: "Impossible", edition_id: newEdition.id, questions: roundQuestions.impossible2 },
        { round_number: 3, type: "Normal", edition_id: newEdition.id, questions: roundQuestions.round3 },
        { round_number: 4, type: "Wager/Final", edition_id: newEdition.id, questions: roundQuestions.wagerFinal },
      ];

      await Promise.all(
        rounds.map((round) => pb.collection("rounds").create(round))
      );

      // Redirect to the dashboard after successful creation
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to create edition:", err);
      setError("Failed to create the edition. Please try again later.");
    }
  };

  return (
    <div className="p-10">
      <h1 className="mb-6">Create New Edition</h1>
      {error && <p>{error}</p>}
      <Tabs
        aria-label="Rounds"
        destroyInactiveTabPanel={false}
        size="lg"
        variant="bordered"
        classNames={{ tabList: "mb-10 sticky top-14" }}
      >
        <Tab key="landing" title="Landing">
          <div className="mb-4 w-1/4">
            <label className="mb-2 block" htmlFor="edition_title">
              Title:
            </label>
            <Input
              id="edition_title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="mb-4 w-1/4">
            <label className="mb-2 block" htmlFor="edition_date">
              Date:
            </label>
            <Input
              id="edition_date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="mb-4 w-1/4">
            <label className="mb-2 block" htmlFor="edition_blurb">
              Blurb:
            </label>
            <Textarea
              id="edition_blurb"
              value={blurb}
              onChange={(e) => setBlurb(e.target.value)}
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
              value={homeSong}
              onChange={(e) => setHomeSong(e.target.value)}
              required
            />
          </div>
          <div className="mb-4 w-1/4">
            <label className="mb-2 block" htmlFor="edition_gif">
              Edition GIF:
            </label>
            <Input
              id="edition_gif"
              type="text"
              value={editionGif}
              onChange={(e) => setEditionGif(e.target.value)}
            />
          </div>
          <div className="mb-4 w-1/4">
            <label className="mb-2 block" htmlFor="edition_end_gif_1">
              End GIF 1:
            </label>
            <Input
              id="edition_end_gif_1"
              type="text"
              value={endGif1}
              onChange={(e) => setEndGif1(e.target.value)}
            />
          </div>
          <div className="mb-4 w-1/4">
            <label className="mb-2 block" htmlFor="edition_end_gif_2">
              End GIF 2:
            </label>
            <Input
              id="edition_end_gif_2"
              type="text"
              value={endGif2}
              onChange={(e) => setEndGif2(e.target.value)}
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
              <Input data-identifier="i1_theme" type="text" className="w-1/2" />
            </div>

            <div className="mb-4">
              <h4 className="mb-2">Theme GIF</h4>
              <Input data-identifier="i1_gif" type="text" className="w-1/2" />
            </div>

            <div className="mb-4">
              <h4 className="mb-2">Question</h4>
              <Editor data-identifier="i1_question" classNames="py-10 w-3/4" />
            </div>

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
                  <SelectItem key={`${index + 1}`} value={index + 1}>
                    {index + 1}
                  </SelectItem>
                ))}
              </Select>

              {/* Render the Answer Inputs Based on State */}
              <div className="answer_list ml-4" data-impossible="1">
                {Array.from({ length: numImpossibleAnswers }).map((_, index) => (
                  <div key={index}>
                  <div className="mb-4">
                    <h4 className="mb-2">Answer {index + 1}</h4>
                    <Editor
                      data-identifier={`i1_answer${index + 1}`}
                      classNames="py-10 w-3/4"
                    />
                  </div>
                  <div className="mb-4">
                  <h4 className="mb-2">Answer {index + 1} GIF</h4>
                  <Input data-identifier={`i1_a${index + 1}_gif`} type="text" className="w-1/2" />
                </div>   
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
              <hr className="block my-10 bg-gray-500"></hr>
            </div>
          ))}
        </Tab>
        <Tab key="impossible2" title="Impossible 2">
          <h3 className="mb-4 text-lg">Impossible 2</h3>
          <div className="ml-5">
            <div className="mb-4">
              <h4 className="mb-2">Theme</h4>
              <Input data-identifier="i2_theme" type="text" className="w-1/2" />
            </div>

            <div className="mb-4">
              <h4 className="mb-2">Theme GIF</h4>
              <Input data-identifier="i2_gif" type="text" className="w-1/2" />
            </div>

            <div className="mb-4">
              <h4 className="mb-2">Question</h4>
              <Editor data-identifier="i2_question" classNames="py-10 w-3/4" />
            </div>

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
                  <SelectItem key={`${index + 1}`} value={index + 1}>
                    {index + 1}
                  </SelectItem>
                ))}
              </Select>

              {/* Render the Answer Inputs Based on State */}
              <div className="answer_list ml-4" data-impossible="2">
                {Array.from({ length: numImpossibleAnswers2 }).map((_, index) => (
                  <div key={index}>
                  <div className="mb-4">
                    <h4 className="mb-2">Answer {index + 1}</h4>
                    <Editor
                      data-identifier={`i2_answer${index + 1}`}
                      classNames="py-10 w-3/4"
                    />
                  </div>
                  <div className="mb-4">
                  <h4 className="mb-2">Answer {index + 1} GIF</h4>
                  <Input data-identifier={`i1_a${index + 1}_gif`} type="text" className="w-1/2" />
                </div>   
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
              <hr className="block my-10 bg-gray-500"></hr>
            </div>
          ))}
        </Tab>
        <Tab key="wager-final" title="Wager/Final">
          <h3 className="mb-4 text-lg">Wager/Final Question</h3>
          <div className="ml-5">
            <Editor data-id="wager-final-editor" classNames="py-10 w-3/4" />
          </div>
        </Tab>
      </Tabs>
      <Button type="submit" onClick={handleCreateEdition} className="mt-6">
        Create Edition
      </Button>
    </div>
  );
}
