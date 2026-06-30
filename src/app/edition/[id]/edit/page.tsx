"use client";

import React, { useState, useEffect, useRef } from "react";

import {
  Button,
  Progress,
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { getElevatableClient } from "@/lib/pocketbase";
import { elevateAuth } from "@/lib/elevate";
import { useParams } from "next/navigation";
import EditionForm from "@/components/EditionForm";
import { useEditionDraft, EditionDraftData, defaultEditionData } from "@/hooks/useEditionDraft";
import { useDateField } from "@/hooks/useDateField";


export default function EditEditionPage() {
  const pb = getElevatableClient();
  const [loading, setLoading] = useState<boolean>(false);
  const [loadMessage, setLoadMessage] = useState("Loading edition . . .");
  const [authData, setAuthData] = useState(null);
  // Single source of truth for all form fields (shared with the new-edition
  // page via <EditionForm />).
  const [editionData, setEditionData] = useState<EditionDraftData>(defaultEditionData);

  const updateField = (key: keyof EditionDraftData) => (value: any) =>
    setEditionData(prev => ({ ...prev, [key]: value }));

  const { parsedDate, onDateChange } = useDateField(editionData.date, updateField("date"));
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  // Update Modal State
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateComplete, setUpdateComplete] = useState(false);

  // Helper: Sleep function
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));



  pb.autoCancellation(false);

  const params = useParams();
  const editionEditId = typeof params?.id === "string" ? params.id : undefined;

  if (!editionEditId) {
    console.error("Edition ID is missing or invalid!");
    return; // Prevent further execution if the ID is missing
  }



  const importEdition = async () => {
    try {
      const draft: EditionDraftData = { ...defaultEditionData };

      const getEdition = await pb.collection("editions").getFirstListItem(`id = "${editionEditId}"`);
      draft.title = getEdition.title;
      draft.editionGif = getEdition.edition_gif;
      draft.blurb = getEdition.blurb;
      draft.homeSongApple = getEdition.home_song_apple;
      draft.endGif1 = getEdition.end_gif_1;
      draft.endGif2 = getEdition.end_gif_2;
      // Store just the YYYY-MM-DD portion; useDateField parses it.
      draft.date = getEdition.date ? String(getEdition.date).split(" ")[0] : null;

      const getRounds = await pb.collection("rounds").getFullList({ filter: `edition_id = "${editionEditId}"` });
      const roundGifKeys: (keyof EditionDraftData)[] = ["r1Gif", "r2Gif", "r3Gif"];
      getRounds.forEach((round) => {
        if (round.round >= 1 && round.round <= 3) {
          (draft as any)[roundGifKeys[round.round - 1]] = round.round_gif;
        }
      });

      const getQuestions = await pb.collection("questions").getFullList({ filter: 'edition_id = "' + editionEditId + '"', sort: 'round_number, question_number' });
      const questionKeys: (keyof EditionDraftData)[] = ["round1Questions", "round2Questions", "round3Questions"];
      const answerKeys: (keyof EditionDraftData)[] = ["round1Answers", "round2Answers", "round3Answers"];
      const songKeys: (keyof EditionDraftData)[] = ["round1SongsApple", "round2SongsApple", "round3SongsApple"];
      const answerGifKeys: (keyof EditionDraftData)[] = ["round1AnswerGifs", "round2AnswerGifs", "round3AnswerGifs"];
      [0, 1, 2].forEach((index) => {
        const roundQuestions = getQuestions.filter((q) => q.round_number === index + 1);
        (draft as any)[questionKeys[index]] = roundQuestions.map((q) => q.question_text);
        (draft as any)[answerKeys[index]] = roundQuestions.map((q) => q.answer);
        (draft as any)[songKeys[index]] = roundQuestions.map((q) => q.song_apple);
        (draft as any)[answerGifKeys[index]] = roundQuestions.map((q) => q.answer_gif);
        if (index === 0 && roundQuestions.length > 2 && roundQuestions[2]?.bantha_answer != undefined) {
          draft.banthaAnswer = roundQuestions[2].bantha_answer;
          draft.banthaAnswerGif = roundQuestions[2].bantha_answer_gif;
        }
      });

      // Convert PB's keyed-object fields to a 0-based index map.
      const toIndexed = (obj: any): { [key: number]: string } => {
        const values = Object.values(obj || {}) as string[];
        const out: { [key: number]: string } = {};
        values.forEach((v, i) => { out[i] = v; });
        return out;
      };

      const getImpossibleRounds = await pb.collection("impossible_rounds").getFullList({
        filter: `edition_id = "${editionEditId}"`,
      });
      getImpossibleRounds.forEach((round) => {
        if (round.impossible_number === 1) {
          draft.imp1IntroGif = round.intro_gif;
          draft.imp1Theme = round.theme;
          draft.imp1Gif = round.theme_gif;
          draft.imp1Question = round.question_text;
          draft.imp1Ppa = round.point_value;
          draft.imp1SongsApple = toIndexed(round.apple_music_ids);
          draft.imp1Answers = Object.values(round.answers || {}) as string[];
          draft.imp1AnswerGifs = toIndexed(round.answer_gifs);
          draft.numImpossibleSongs = Object.values(round.apple_music_ids || {}).length;
          draft.numImpossibleAnswers = Object.values(round.answers || {}).length;
        } else if (round.impossible_number === 2) {
          draft.imp2IntroGif = round.intro_gif;
          draft.imp2Theme = round.theme;
          draft.imp2Gif = round.theme_gif;
          draft.imp2Question = round.question_text;
          draft.imp2Ppa = round.point_value;
          draft.imp2SongsApple = toIndexed(round.apple_music_ids);
          draft.imp2Answers = Object.values(round.answers || {}) as string[];
          draft.imp2AnswerGifs = toIndexed(round.answer_gifs);
          draft.numImpossibleSongs2 = Object.values(round.apple_music_ids || {}).length;
          draft.numImpossibleAnswers2 = Object.values(round.answers || {}).length;
        }
      });

      const wagerRound = await pb.collection("wager_rounds").getFirstListItem(`edition_id = "${editionEditId}"`);
      draft.wagerGif = wagerRound.wager_intro_gif;
      draft.finalCat = wagerRound.final_cat;
      draft.finalCatGif = wagerRound.final_cat_gif;
      draft.wagerPlacingGif = wagerRound.wager_placing_gif;
      draft.wagerSongApple = wagerRound.wager_song_apple;

      const finalRound = await pb.collection("final_rounds").getFirstListItem(`edition_id = "${editionEditId}"`);
      draft.finalIntroGif = finalRound.final_intro_gif;
      draft.finalQuestion = finalRound.question_text;
      draft.finalAnswer = finalRound.answer;
      draft.finalAnswerGif = finalRound.final_answer_gif;
      draft.finalSongApple = finalRound.final_song_apple;

      loadedSnapshotRef.current = JSON.stringify(draft);
      setEditionData(draft);
      setLoading(false);
      setIsLoaded(true);
      setError("Edition imported successfully!");
    } catch (err) {
      console.error("Failed to import edition:", err);
      setLoading(false);
      setError("Failed to import the edition. Please try again later.");
    }
  };

  // The loaded snapshot stores the impossible song/gif fields as keyed objects,
  // while the live form holds them as arrays (after EditionForm's count-sync).
  // Normalise both to arrays so change-detection compares like-with-like.
  const canonicalize = (d: EditionDraftData) => ({
    ...d,
    imp1SongsApple: Object.values(d.imp1SongsApple || {}),
    imp1AnswerGifs: Object.values(d.imp1AnswerGifs || {}),
    imp2SongsApple: Object.values(d.imp2SongsApple || {}),
    imp2AnswerGifs: Object.values(d.imp2AnswerGifs || {}),
  });

  // Update only the questions whose text/song/answer/gif (or bantha, for R1Q3)
  // actually changed vs the loaded snapshot. Rounds with no changes are skipped
  // entirely — no fetch, no writes.
  const updateQuestions = async (editionEditId: string, original: EditionDraftData | null) => {
    const rounds = [
      { qs: editionData.round1Questions, ss: editionData.round1SongsApple, as: editionData.round1Answers, gs: editionData.round1AnswerGifs,
        oqs: original?.round1Questions, oss: original?.round1SongsApple, oas: original?.round1Answers, ogs: original?.round1AnswerGifs },
      { qs: editionData.round2Questions, ss: editionData.round2SongsApple, as: editionData.round2Answers, gs: editionData.round2AnswerGifs,
        oqs: original?.round2Questions, oss: original?.round2SongsApple, oas: original?.round2Answers, ogs: original?.round2AnswerGifs },
      { qs: editionData.round3Questions, ss: editionData.round3SongsApple, as: editionData.round3Answers, gs: editionData.round3AnswerGifs,
        oqs: original?.round3Questions, oss: original?.round3SongsApple, oas: original?.round3Answers, ogs: original?.round3AnswerGifs },
    ];

    for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
      const round = roundIndex + 1;
      const r = rounds[roundIndex];

      const banthaChanged = round === 1 && (!original
        || editionData.banthaAnswer !== original.banthaAnswer
        || editionData.banthaAnswerGif !== original.banthaAnswerGif);

      const indices: number[] = [];
      for (let i = 0; i < r.qs.length; i++) {
        const changed = !original
          || r.qs[i] !== r.oqs?.[i]
          || r.ss[i] !== r.oss?.[i]
          || r.as[i] !== r.oas?.[i]
          || r.gs[i] !== r.ogs?.[i]
          || (round === 1 && i === 2 && banthaChanged);
        if (changed) indices.push(i);
      }

      if (indices.length === 0) continue; // nothing changed in this round

      setLoadMessage(`Updating questions for round ${round}...`);
      const fetched = await pb.collection("questions").getFullList({
        filter: `edition_id = "${editionEditId}" && round_number = "${round}"`,
        sort: 'question_number',
      });

      for (const i of indices) {
        const rec = fetched[i];
        if (!rec) {
          console.error(`Missing question record for Round ${round} Question ${i + 1}`);
          continue;
        }
        const data: Record<string, any> = {
          question_text: r.qs[i],
          song_apple: r.ss[i],
          answer: r.as[i],
          answer_gif: r.gs[i],
        };
        if (round === 1 && i === 2) {
          data.bantha_answer = editionData.banthaAnswer;
          data.bantha_answer_gif = editionData.banthaAnswerGif;
        }
        await pb.collection("questions").update(rec.id, data);
        setLoadMessage(`Round ${round} Question ${i + 1} updated . . .`);
        await sleep(150);
      }
    }
  };

  const updateImpossibleRound = async (
    editionEditId: string,
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
    } : {
      intro_gif: editionData.imp2IntroGif,
      theme: editionData.imp2Theme,
      theme_gif: editionData.imp2Gif,
      question_text: editionData.imp2Question,
      point_value: editionData.imp2Ppa,
      apple_music_ids: songs,
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
      await refreshAuthState();

      // Diff against the snapshot captured at load so we only write what changed.
      const original = loadedSnapshotRef.current ? canonicalize(JSON.parse(loadedSnapshotRef.current)) : null;
      const current = canonicalize(editionData);
      const changed = (k: keyof EditionDraftData) =>
        !original || JSON.stringify((current as any)[k]) !== JSON.stringify((original as any)[k]);

      // Step 1: Edition record
      const editionFields: (keyof EditionDraftData)[] = ["title", "date", "editionGif", "blurb", "homeSongApple", "endGif1", "endGif2"];
      if (editionFields.some(changed)) {
        setLoadMessage("Updating edition . . .");
        const formattedDate = `${parsedDate!.year}-${String(parsedDate!.month).padStart(2, '0')}-${String(parsedDate!.day).padStart(2, '0')} 12:00:00`;
        await pb.collection("editions").update(`${editionEditId}`, {
          title: editionData.title,
          date: formattedDate,
          edition_gif: editionData.editionGif,
          blurb: editionData.blurb,
          home_song_apple: editionData.homeSongApple,
          end_gif_1: editionData.endGif1,
          end_gif_2: editionData.endGif2,
        });
      }

      // Step 2: Questions (only the changed ones)
      setLoadMessage("Checking questions . . .");
      await updateQuestions(editionEditId, original);

      // Step 3: Impossible rounds (only if changed)
      const imp1Fields: (keyof EditionDraftData)[] = ["imp1IntroGif", "imp1Theme", "imp1Gif", "imp1Question", "imp1Ppa", "imp1SongsApple", "imp1Answers", "imp1AnswerGifs"];
      if (imp1Fields.some(changed)) {
        await updateImpossibleRound(editionEditId, 1, editionData.imp1SongsApple, editionData.imp1Answers, editionData.imp1AnswerGifs);
        await sleep(150);
      }
      const imp2Fields: (keyof EditionDraftData)[] = ["imp2IntroGif", "imp2Theme", "imp2Gif", "imp2Question", "imp2Ppa", "imp2SongsApple", "imp2Answers", "imp2AnswerGifs"];
      if (imp2Fields.some(changed)) {
        await updateImpossibleRound(editionEditId, 2, editionData.imp2SongsApple, editionData.imp2Answers, editionData.imp2AnswerGifs);
      }

      // Step 4: Wager round (only if changed)
      const wagerFields: (keyof EditionDraftData)[] = ["wagerGif", "finalCat", "finalCatGif", "wagerPlacingGif", "wagerSongApple"];
      if (wagerFields.some(changed)) {
        setLoadMessage("Updating wager round . . .");
        const wagerRoundId = await pb.collection("wager_rounds").getFirstListItem(`edition_id="${editionEditId}"`);
        await pb.collection("wager_rounds").update(`${wagerRoundId.id}`, {
          wager_intro_gif: editionData.wagerGif,
          final_cat: editionData.finalCat,
          final_cat_gif: editionData.finalCatGif,
          wager_placing_gif: editionData.wagerPlacingGif,
          wager_song_apple: editionData.wagerSongApple,
        });
      }

      // Step 5: Final round (only if changed)
      const finalFields: (keyof EditionDraftData)[] = ["finalIntroGif", "finalQuestion", "finalAnswer", "finalAnswerGif", "finalSongApple"];
      if (finalFields.some(changed)) {
        setLoadMessage("Updating final round . . .");
        const finalRound = await pb.collection("final_rounds").getFirstListItem(`edition_id="${editionEditId}"`);
        await pb.collection("final_rounds").update(`${finalRound.id}`, {
          final_intro_gif: editionData.finalIntroGif,
          question_text: editionData.finalQuestion,
          answer: editionData.finalAnswer,
          final_answer_gif: editionData.finalAnswerGif,
          final_song_apple: editionData.finalSongApple,
        });
      }

      // Refresh the baseline so an immediate re-save with no further edits is a no-op.
      loadedSnapshotRef.current = JSON.stringify(editionData);

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
    // Elevate to a superuser session via the server, which verifies the
    // logged-in user is an admin. The superuser password is no longer shipped
    // to the browser. Requires being logged in (Google OAuth) as an admin.
    await elevateAuth(pb);
  };


  useEffect(() => {
    //refreshAuthState();
    importEdition();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Local Storage Draft Integration
  const { saveDraft, loadDraft, hasDraft } = useEditionDraft();

  // Snapshot of the DB state captured at load, so we don't write a draft that's
  // identical to what's already saved (keeps the "Load Local Draft" button
  // hidden until the user actually edits something).
  const loadedSnapshotRef = useRef<string | null>(null);

  // Auto-save the draft to localStorage after edits settle.
  useEffect(() => {
    if (!isLoaded) return; // Don't save before the initial DB load
    if (
      loadedSnapshotRef.current !== null &&
      JSON.stringify(editionData) === loadedSnapshotRef.current
    ) {
      return; // Unchanged from what was loaded — nothing to save.
    }
    const handler = setTimeout(() => {
      saveDraft(editionData);
    }, 2000);
    return () => clearTimeout(handler);
  }, [editionData, isLoaded, saveDraft]);

  const handleLoadDraft = () => {
    if (confirm("Are you sure you want to load the draft? This will overwrite current unsaved changes.")) {
      const draft = loadDraft();
      if (draft) {
        setEditionData(draft);
        alert("Draft loaded successfully!");
      } else {
        alert("No draft found.");
      }
    }
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
      <div className="p-4 md:p-10">
        <div className="flex flex-wrap gap-3 mb-4 md:mb-0 md:absolute md:top-10 md:right-10">
          <Button
            color="primary"
            onPress={handleUpdateEdition}
            isLoading={loading}
          >
            Update Edition
          </Button>
          <Button
            onPress={() => router.push("/dashboard")}>
            Return to Dashboard
          </Button>
          {hasDraft && (
            <Button
              color="warning"
              variant="flat"
              onPress={handleLoadDraft}
            >
              Load Local Draft
            </Button>
          )}
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
        <EditionForm
          editionData={editionData}
          setEditionData={setEditionData}
          parsedDate={parsedDate}
          onDateChange={onDateChange}
        />
        <Button type="submit" onPress={handleUpdateEdition} className="mt-6">
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
