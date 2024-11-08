"use client";

import {Tabs, Tab} from "@nextui-org/tabs";
import {Button} from "@nextui-org/react";
import {Input} from "@nextui-org/react";
import {Divider} from "@nextui-org/react";
import {Textarea} from "@nextui-org/input";
import { useState } from "react";
import pb from "@/lib/pocketbase";
import { useRouter } from "next/navigation";
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
    bonus1: "",
    round2: "",
    bonus2: "",
    round3: "",
    wagerFinal: "",
  });
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
        { round_number: 1, type: "Bonus", edition_id: newEdition.id, questions: roundQuestions.bonus1 },
        { round_number: 2, type: "Normal", edition_id: newEdition.id, questions: roundQuestions.round2 },
        { round_number: 2, type: "Bonus", edition_id: newEdition.id, questions: roundQuestions.bonus2 },
        { round_number: 3, type: "Normal", edition_id: newEdition.id, questions: roundQuestions.round3 },
        { round_number: 4, type: "Wager/Final", edition_id: newEdition.id, questions: roundQuestions.wagerFinal },
      ];

      await Promise.all(
        rounds.map((round) =>
          pb.collection("rounds").create(round)
        )
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
      <Tabs aria-label="Rounds" destroyInactiveTabPanel={false} size="lg" variant="bordered" classNames={{ tabList: "mb-10"}} >
        <Tab key="landing" title="Landing">
          <div className="mb-4 w-1/4">
            <label className="mb-2 block" htmlFor="edition_title">Title:</label>
            <Input id="edition_title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="mb-4 w-1/4">
            <label className="mb-2 block" htmlFor="edition_date">Date:</label>
            <Input id="edition_date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="mb-4 w-1/4">
            <label className="mb-2 block" htmlFor="edition_blurb">Blurb:</label>
            <Textarea id="edition_blurb" value={blurb} onChange={(e) => setBlurb(e.target.value)} required />
          </div>
          <div className="mb-4 w-1/4">
            <label className="mb-2 block" htmlFor="edition_home_song">Home Song:</label>
            <Input id="edition_home_song" type="text" value={homeSong} onChange={(e) => setHomeSong(e.target.value)} required />
          </div>
          <div className="mb-4 w-1/4">
            <label className="mb-2 block" htmlFor="edition_gif">Edition GIF:</label>
            <Input id="edition_gif" type="text" value={editionGif} onChange={(e) => setEditionGif(e.target.value)} />
          </div>
          <div className="mb-4 w-1/4">
            <label className="mb-2 block" htmlFor="edition_end_gif_1">End GIF 1:</label>
            <Input id="edition_end_gif_1" type="text" value={endGif1} onChange={(e) => setEndGif1(e.target.value)} />
          </div>
          <div className="mb-4 w-1/4">
            <label className="mb-2 block" htmlFor="edition_end_gif_1">End GIF 2:</label>
            <Input id="edition_end_gif_1" type="text" value={endGif2} onChange={(e) => setEndGif2(e.target.value)} />
          </div>
        </Tab>
        <Tab key="round1" title="Round 1">
          {Array.from({ length: 5 }, (_, index) => (
            <div>
              <EditorQuestion key={`round1-question${index + 1}`} round={1} question={index + 1} />
              <Divider className="my-4" />
              <hr className="block my-10 bg-gray-500"></hr>
            </div>
          ))}
        </Tab>
        <Tab key="bonus1" title="Bonus 1">
          <Editor
            data-id="bonus1-editor"
          />
        </Tab>
        <Tab key="round2" title="Round 2">
          <Editor
            data-id="round2-editor"
          />
        </Tab>
        <Tab key="bonus2" title="Bonus 2">
          <Editor
            data-id="bonus2-editor"
          />
        </Tab>
        <Tab key="round3" title="Round 3">
          <Editor
            data-id="round3-editor"
          />
        </Tab>
        <Tab key="wager-final" title="Wager/Final">
          <Editor
            data-id="wager-final-editor"
          />
        </Tab>
      </Tabs>
      <Button type="submit" onClick={handleCreateEdition}>Create Edition</Button>
    </div>
  );
}
