"use client";

import EditionManagementTabs from "@/components/EditionManagementTabs";
import { FormEvent, useState } from "react";
import pb from "@/lib/pocketbase";
import { useRouter } from "next/navigation";
import { Editor } from "@/components/DynamicEditor";

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
    <div>
      <h1>Create New Edition</h1>
      {error && <p>{error}</p>}
      <EditionManagementTabs
        landingContent={
          <form onSubmit={(e) => { e.preventDefault(); handleCreateEdition(); }}>
            <div>
              <label htmlFor="edition_title">Title:</label>
              <input id="edition_title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="edition_date">Date:</label>
              <input id="edition_date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="edition_blurb">Blurb:</label>
              <textarea id="edition_blurb" value={blurb} onChange={(e) => setBlurb(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="edition_home_song">Home Song:</label>
              <input id="edition_home_song" type="text" value={homeSong} onChange={(e) => setHomeSong(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="edition_gif">Edition GIF:</label>
              <input id="edition_gif" type="text" value={editionGif} onChange={(e) => setEditionGif(e.target.value)} />
            </div>
            <div>
              <label htmlFor="edition_end_gif_1">End GIF 1:</label>
              <input id="edition_end_gif_1" type="text" value={endGif1} onChange={(e) => setEndGif1(e.target.value)} />
            </div>
            <div>
              <label htmlFor="edition_end_gif_1">End GIF 2:</label>
              <input id="edition_end_gif_1" type="text" value={endGif2} onChange={(e) => setEndGif2(e.target.value)} />
            </div>
          </form>
        }
        round1Content={
          <Editor
            data-identifier="round1-editor"
            //onChange={(content) => setRoundQuestions({ ...roundQuestions, round1: content })}
          />
        }
        bonus1Content={
          <Editor
            data-id="bonus1-editor"
          />
        }
        round2Content={
          <Editor
            data-id="round2-editor"
          />
        }
        bonus2Content={
          <Editor
            data-id="bonus2-editor"
          />
        }
        round3Content={
          <Editor
            data-id="round3-editor"
          />
        }
        wagerFinalContent={
          <Editor
            data-id="wager-final-editor"
          />
        }
      />
      <button type="submit" onClick={handleCreateEdition}>Create Edition</button>
    </div>
  );
}
