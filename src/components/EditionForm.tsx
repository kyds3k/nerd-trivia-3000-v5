"use client";

import React, { useState, useRef, useEffect } from "react";
import { Tabs, Tab, Button, Input, Select, SelectItem, Divider, DatePicker } from "@heroui/react";
import AppleMusicSearch from "@/components/AppleMusicSearch";
import Tiptap from "@/components/TipTap";
import GifPicker, { Theme } from "gif-picker-react";
import { EditionDraftData } from "@/hooks/useEditionDraft";

interface EditionFormProps {
  editionData: EditionDraftData;
  setEditionData: React.Dispatch<React.SetStateAction<EditionDraftData>>;
  parsedDate: any;
  onDateChange: (value: any) => void;
}

/**
 * The full edition form UI (Landing, Rounds 1-3, Impossible 1/2, Wager/Final).
 * Driven entirely by the `editionData` draft object so both the "new" and
 * "edit" pages can share one implementation. Page-specific concerns (create vs
 * update, save-progress, auth) stay in the parent.
 */
export default function EditionForm({ editionData, setEditionData, parsedDate, onDateChange }: EditionFormProps) {
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

  // Ref to collect all GifPicker search inputs
  const gifInputsRef = useRef<HTMLInputElement[]>([]);

  const updateField = (key: keyof EditionDraftData) => (value: any) => {
    setEditionData(prev => ({ ...prev, [key]: value }));
  };

  const updateArrayItem = (field: keyof EditionDraftData, index: number, value: any) => {
    setEditionData(prev => {
      const current = prev[field];
      let updated: any;

      if (Array.isArray(current)) {
        updated = [...current];
        updated[index] = value;
      } else {
        updated = value;
      }
      return { ...prev, [field]: updated };
    });
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

  useEffect(() => {
    // Impossible 1
    const imp1SongsValues = Object.values(editionData.imp1SongsApple || {});
    const imp1GifValues = Object.values(editionData.imp1AnswerGifs || {});
    updateField("imp1SongsApple")(syncArrayToCount(imp1SongsValues, editionData.numImpossibleSongs, ""));
    updateField("imp1Answers")(syncArrayToCount(editionData.imp1Answers, editionData.numImpossibleAnswers, ""));
    updateField("imp1AnswerGifs")(syncArrayToCount(imp1GifValues, editionData.numImpossibleAnswers, ""));

    // Impossible 2
    const imp2SongsValues = Object.values(editionData.imp2SongsApple || {});
    const imp2GifValues = Object.values(editionData.imp2AnswerGifs || {});
    updateField("imp2SongsApple")(syncArrayToCount(imp2SongsValues, editionData.numImpossibleSongs2, ""));
    updateField("imp2Answers")(syncArrayToCount(editionData.imp2Answers, editionData.numImpossibleAnswers2, ""));
    updateField("imp2AnswerGifs")(syncArrayToCount(imp2GifValues, editionData.numImpossibleAnswers2, ""));
  }, [
    editionData.numImpossibleSongs,
    editionData.numImpossibleAnswers,
    editionData.numImpossibleSongs2,
    editionData.numImpossibleAnswers2,
  ]);

  return (
        <Tabs
          aria-label="Rounds"
          destroyInactiveTabPanel={true}
          size="lg"
          variant="bordered"
          classNames={{ tabList: "mb-4 sticky top-14" }}
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
              <div className="mb-4 w-1/2">
                <label className="mb-2 block" htmlFor="edition_blurb">
                  Blurb:
                </label>
                <Input
                  id="edition_blurb"
                  type="text"
                  data-identifier="edition_blurb"
                  data-type="blurb"
                  value={editionData.blurb}
                  onValueChange={updateField("blurb")}
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
                    onPress={() => setShowEditionGifPicker((val) => !val)}
                  >
                    {showEditionGifPicker ? "Hide GIF Picker" : "Select GIF"}
                  </Button>
                  {showEditionGifPicker && (
                    <div className="gif-picker flex gap-4 mt-2">
                      <GifPicker
                        onGifClick={(gif) => updateField("editionGif")(gif.url)}
                        width={500}
                        height={500}
                        tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                        theme={Theme.DARK}


                      />
                      <img
                        src={editionData.editionGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                        alt="Edition GIF"
                        className="w-full max-w-[500px] h-auto self-start"
                      />
                    </div>
                  )}
                </div>
                {/* Landing Page Song input */}
                <div className="song-input w-1/2">
                  <label className="mb-2 block" htmlFor="home_song">
                    Landing Page Song
                  </label>
                  <AppleMusicSearch
                    initialValue={editionData.homeSongApple}
                    onSelect={(track) => updateField("homeSongApple")(track.id)}
                  />
                </div>
              </div>
            </div>
          </Tab>
          {/* ************ ROUND 1 ************ */}
          <Tab key="round1" title="Round 1">
            <h3 className="mb-8 text-2xl">Round 1</h3>
            <div className="ml-4">
              <div className="mb-8">
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
                  onPress={() => setShowR1GifPicker((val) => !val)}
                >
                  {showR1GifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showR1GifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("r1Gif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.r1Gif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>
              {Array.from({ length: 5 }, (_, index) => (
                <div key={`round1-question${index + 1}`}>
                  <h3 className="mb-2">Question {index + 1}</h3>
                  <Tiptap
                    state={editionData.round1Questions?.[index] || ""}
                    setState={(newVal) => updateArrayItem("round1Questions", index, newVal)}
                    identifier={`r1q${index + 1}`}
                    classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                  />
                  <h3 className="mb-2">Song</h3>
                  <div className="w-1/2 mb-2">
                    <AppleMusicSearch
                      initialValue={editionData.round1SongsApple?.[index]}
                      onSelect={(track) => updateArrayItem("round1SongsApple", index, track.id)}
                    />
                  </div>
                  <h3 className="mb-2">Answer {index + 1}</h3>
                  <Tiptap
                    state={editionData.round1Answers?.[index] || ""}
                    setState={(newVal) => updateArrayItem("round1Answers", index, newVal)}
                    identifier={`r1a${index + 1}`}
                    classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                  />
                  <h3 className="mb-2">GIF</h3>
                  <Input
                    data-identifier={`r1g${index + 1}`}
                    type="text"
                    data-type="gif"
                    className="w-1/2 mb-6"
                    value={editionData.round1AnswerGifs?.[index] || ""}
                    onValueChange={(newVal) => updateArrayItem("round1AnswerGifs", index, newVal)}
                  />
                  <GifAnswerPickerToggle
                    show={editionData.round1AnswerGifs?.[index]}
                    onToggle={(_show: boolean) => updateArrayItem("round1AnswerGifs", index, _show)}
                    gifUrl={editionData.round1AnswerGifs?.[index]}
                    onGifPick={(gif: any) => updateArrayItem("round1AnswerGifs", index, gif.url)}
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
                        onToggle={(_show: boolean) => updateField("banthaAnswerGif")(_show)}
                        gifUrl={editionData.banthaAnswerGif}
                        onGifPick={(gif: any) => updateField("banthaAnswerGif")(gif.url)}
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
                <Button className="mt-2" onPress={() => setShowImp1IntroGifPicker(val => !val)}>
                  {showImp1IntroGifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showImp1IntroGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("imp1IntroGif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.imp1IntroGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
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
                  value={editionData.imp1Gif}
                  onValueChange={updateField("imp1Gif")}
                />
                <Button
                  className="mt-2"
                  onPress={() => setShowImp1ThemeGifPicker((val) => !val)}
                >
                  {showImp1ThemeGifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showImp1ThemeGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("imp1Gif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.imp1Gif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
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
                  selectedKeys={[String(editionData.numImpossibleSongs)]}
                  onSelectionChange={(keys) => {
                    const selectedValue = Array.from(keys)[0];
                    const value = typeof selectedValue === "string" ? parseInt(selectedValue) : selectedValue;
                    updateField("numImpossibleSongs")(value);
                  }}
                >
                  {[1, 2, 3].map((num, index) => (
                    <SelectItem key={`${index + 1}`} textValue={`${index + 1}`}>
                      {index + 1}
                    </SelectItem>
                  ))}
                </Select>


                {/* Render the Song Inputs Based on State */}
                <div className="song_list ml-4" data-impossible="1">
                  {Array.from({ length: editionData.numImpossibleSongs }).map((_, index) => (
                    <div key={index}>
                      <div className="mb-4">
                        <h4 className="mb-2">Song {index + 1}</h4>
                        <div className="w-1/2">
                          <AppleMusicSearch
                            key={`imp1_song_${index}`}
                            initialValue={editionData.imp1SongsApple?.[index] || ""}
                            onSelect={(track) => updateArrayItem("imp1SongsApple", index, track.id)}
                          />
                        </div>

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
                  selectedKeys={[String(editionData.numImpossibleAnswers)]}
                  onSelectionChange={(keys) => {
                    const selectedValue = Array.from(keys)[0];
                    const value = typeof selectedValue === "string" ? parseInt(selectedValue) : selectedValue;
                    updateField("numImpossibleAnswers")(value);
                  }}

                >
                  {Array.from({ length: 20 }, (_, index) => (
                    <SelectItem key={index + 1} textValue={`${index + 1}`}>
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
                    value={editionData.imp1Ppa}
                    onValueChange={updateField("imp1Ppa")}
                  />
                </div>

                <hr className="block my-10 bg-gray-500"></hr>

                {/* Render the Answer Inputs Based on State */}
                <div className="answer_list ml-4" data-impossible="1">
                  {Array.from({ length: editionData.numImpossibleAnswers || 0 }).map((_, index) => (
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
                          onToggle={(_show: boolean) => updateArrayItem("imp1AnswerGifs", index, _show)}
                          gifUrl={editionData.imp1AnswerGifs[index]}
                          onGifPick={(gif: any) => updateArrayItem("imp1AnswerGifs", index, gif.url)}
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
              <div className="mb-8">
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
                <Button className="mt-2" onPress={() => setShowR2GifPicker(val => !val)}>
                  {showR2GifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showR2GifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("r2Gif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}
                    />
                    <img
                      src={editionData.r2Gif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>
              {Array.from({ length: 5 }, (_, index) => (
                <div key={`round2-question${index + 1}`}>
                  <h3 className="mb-2">Question {index + 1}</h3>
                  <Tiptap
                    state={editionData.round2Questions?.[index] || ""}
                    setState={(newVal) => updateArrayItem("round2Questions", index, newVal)}
                    identifier={`r2q${index + 1}`}
                    classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                  />
                  <h3 className="mb-2">Song</h3>
                  <div className="w-1/2 mb-2">
                    <AppleMusicSearch
                      initialValue={editionData.round2SongsApple?.[index]}
                      onSelect={(track) => updateArrayItem("round2SongsApple", index, track.id)}
                    />
                  </div>
                  <h3 className="mb-2">Answer {index + 1}</h3>
                  <Tiptap
                    state={editionData.round2Answers?.[index] || ""}
                    setState={(newVal) => updateArrayItem("round2Answers", index, newVal)}
                    identifier={`r2a${index + 1}`}
                    classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                  />
                  <h3 className="mb-2">GIF</h3>
                  <Input
                    data-identifier={`r2g${index + 1}`}
                    type="text"
                    data-type="gif"
                    className="w-1/2 mb-6"
                    value={editionData.round2AnswerGifs?.[index] || ""}
                    onValueChange={(newVal) => updateArrayItem("round2AnswerGifs", index, newVal)}
                  />
                  <div className="gif-picker flex gap-4">
                    <GifAnswerPickerToggle
                      show={editionData.round2AnswerGifs?.[index]}
                      onToggle={(_show: boolean) => updateArrayItem("round2AnswerGifs", index, _show)}
                      gifUrl={editionData.round2AnswerGifs?.[index]}
                      onGifPick={(gif: any) => updateArrayItem("round2AnswerGifs", index, gif.url)}
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
                <Button className="mt-2" onPress={() => setShowImp2IntroGifPicker(val => !val)}>
                  {showImp2IntroGifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showImp2IntroGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("imp2IntroGif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.imp2IntroGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
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
                  value={editionData.imp2Gif}
                  onValueChange={updateField("imp2Gif")}
                />
                <Button
                  className="mt-2"
                  onPress={() => setShowImp2ThemeGifPicker((val) => !val)}
                >
                  {showImp2ThemeGifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showImp2ThemeGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("imp2Gif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.imp2Gif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
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
                  selectedKeys={[String(editionData.numImpossibleSongs2)]}
                  onSelectionChange={(keys) => {
                    const selectedValue = Array.from(keys)[0];
                    const value = typeof selectedValue === "string" ? parseInt(selectedValue) : selectedValue;
                    updateField("numImpossibleSongs2")(value);
                  }}
                >
                  {[1, 2, 3].map((num, index) => (
                    <SelectItem key={`${index + 1}`} textValue={`${index + 1}`}>
                      {index + 1}
                    </SelectItem>
                  ))}
                </Select>

                <div className="song_list ml-4" data-impossible="2">
                  {Array.from({ length: editionData.numImpossibleSongs2 }).map((_, index) => (
                    <div key={index}>
                      <div className="mb-4">
                        <h4 className="mb-2">Song {index + 1}</h4>
                        <div className="w-1/2">
                          <AppleMusicSearch
                            key={`imp2_song_${index}`}
                            initialValue={editionData.imp2SongsApple?.[index] || ""}
                            onSelect={(track) => updateArrayItem("imp2SongsApple", index, track.id)}
                          />
                        </div>
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
                  selectedKeys={[String(editionData.numImpossibleAnswers2)]}
                  onSelectionChange={(keys) => {
                    const selectedValue = Array.from(keys)[0];
                    const value = typeof selectedValue === "string" ? parseInt(selectedValue) : selectedValue;
                    updateField("numImpossibleAnswers2")(value);
                  }}
                >
                  {Array.from({ length: 20 }, (_, index) => (
                    <SelectItem key={index + 1} textValue={`${index + 1}`}>
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
                    value={editionData.imp2Ppa}
                    onValueChange={updateField("imp2Ppa")}
                  />
                </div>

                <hr className="block my-10 bg-gray-500"></hr>

                <div className="answer_list ml-4" data-impossible="2">
                  {Array.from({ length: editionData.numImpossibleAnswers2 || 0 }).map((_, index) => (
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
                          onToggle={(_show: boolean) => updateArrayItem("imp2AnswerGifs", index, _show)}
                          gifUrl={editionData.imp2AnswerGifs[index]}
                          onGifPick={(gif: any) => updateArrayItem("imp2AnswerGifs", index, gif.url)}
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
              <div className="mb-8">
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
                  onPress={() => setShowR3GifPicker((val) => !val)}
                >
                  {showR3GifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showR3GifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("r3Gif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.r3Gif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>
              {Array.from({ length: 5 }, (_, index) => (
                <div key={`round3-question${index + 1}`}>
                  <h3 className="mb-2">Question {index + 1}</h3>
                  <Tiptap
                    state={editionData.round3Questions?.[index] || ""}
                    setState={(newVal) => updateArrayItem("round3Questions", index, newVal)}
                    identifier={`r3q${index + 1}`}
                    classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                  />
                  <h3 className="mb-2">Song</h3>
                  <div className="w-1/2 mb-2">
                    <AppleMusicSearch
                      initialValue={editionData.round3SongsApple?.[index]}
                      onSelect={(track) => updateArrayItem("round3SongsApple", index, track.id)}
                    />
                  </div>
                  <h3 className="mb-2">Answer {index + 1}</h3>
                  <Tiptap
                    state={editionData.round3Answers?.[index] || ""}
                    setState={(newVal) => updateArrayItem("round3Answers", index, newVal)}
                    identifier={`r3a${index + 1}`}
                    classes="tiptap p-4 mb-6 w-full bg-editor-bg text-white rounded-xl min-h-48 prose max-w-none [&_ol]:list-decimal [&_ul]:list-disc"
                  />
                  <h3 className="mb-2">GIF</h3>
                  <Input
                    data-identifier={`r3g${index + 1}`}
                    type="text"
                    data-type="gif"
                    className="w-1/2 mb-6"
                    value={editionData.round3AnswerGifs?.[index] || ""}
                    onValueChange={(newVal) => updateArrayItem("round3AnswerGifs", index, newVal)}
                  />
                  <GifAnswerPickerToggle
                    show={editionData.round3AnswerGifs?.[index]}
                    onToggle={(_show: boolean) => updateArrayItem("round3AnswerGifs", index, _show)}
                    gifUrl={editionData.round3AnswerGifs?.[index]}
                    onGifPick={(gif: any) => updateArrayItem("round3AnswerGifs", index, gif.url)}
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
                  value={editionData.wagerGif}
                  onValueChange={updateField("wagerGif")}
                />
                <Button
                  className="mt-2"
                  onPress={() => setShowWagerIntroGifPicker((val) => !val)}
                >
                  {showWagerIntroGifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showWagerIntroGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("wagerGif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.wagerGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
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
                  value={editionData.finalCat}
                  onValueChange={updateField("finalCat")}
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
                  value={editionData.finalCatGif}
                  onValueChange={updateField("finalCatGif")}
                />
                <Button
                  className="mt-2"
                  onPress={() => setShowFinalCategoryGifPicker((val) => !val)}
                >
                  {showFinalCategoryGifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showFinalCategoryGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("finalCatGif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.finalCatGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
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
                  onPress={() => setShowWagerPlacingGifPicker((val) => !val)}
                >
                  {showWagerPlacingGifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showWagerPlacingGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif: any) => updateField("wagerPlacingGif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.wagerPlacingGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              <div className="mb-8 w-1/2">
                <label className="mb-2 block" htmlFor="wager_song">
                  Wager Placing Song:
                </label>
                <AppleMusicSearch
                  initialValue={editionData.wagerSongApple}
                  onSelect={(track) => updateField("wagerSongApple")(track.id)}
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
                  onPress={() => setShowFinalIntroGifPicker((val) => !val)}
                >
                  {showFinalIntroGifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showFinalIntroGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("finalIntroGif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.finalIntroGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
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

              <div className="mb-8 w-1/2">
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
                  onPress={() => setShowFinalAnswerGifPicker((val) => !val)}
                >
                  {showFinalAnswerGifPicker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showFinalAnswerGifPicker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif: any) => updateField("finalAnswerGif")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.finalAnswerGif || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>

              <div className="mb-8">
                <h4 className="mb-2">Song:</h4>
                <div className="w-1/2">
                  <AppleMusicSearch
                    initialValue={editionData.finalSongApple}
                    onSelect={(track) => updateField("finalSongApple")(track.id)}
                  />
                </div>
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
                  onPress={() => setShowEndGif1Picker((val) => !val)}
                >
                  {showEndGif1Picker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showEndGif1Picker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("endGif1")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.endGif1 || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
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
                  onPress={() => setShowEndGif2Picker((val) => !val)}
                >
                  {showEndGif2Picker ? "Hide GIF Picker" : "Select GIF"}
                </Button>
                {showEndGif2Picker && (
                  <div className="gif-picker flex gap-4 mt-2">
                    <GifPicker
                      onGifClick={(gif) => updateField("endGif2")(gif.url)}
                      width={500}
                      height={500}
                      tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
                      theme={Theme.DARK}

                    />
                    <img
                      src={editionData.endGif2 || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
                      alt="Selected GIF"
                      className="w-full max-w-[500px] h-auto self-start"
                    />
                  </div>
                )}
              </div>
            </div>
          </Tab>
        </Tabs>
  );
}

// Helper component for GIF answer pickers with toggle
function GifAnswerPickerToggle({ show, onToggle, gifUrl, onGifPick, gifInputsRef, index }: any) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button
        className="mt-2"
        onPress={() => setOpen((v) => !v)}
      >
        {open ? "Hide GIF Picker" : "Select GIF"}
      </Button>
      {open && (
        <div className="gif-picker flex gap-4 mt-2">
          <GifPicker
            onGifClick={(gif: any) => {
              onGifPick(gif);
            }}
            width={500}
            height={500}
            tenorApiKey={process.env.NEXT_PUBLIC_TENOR_API_KEY || ""}
            theme={Theme.DARK}

          />
          <img
            src={gifUrl || "https://cdn.dribbble.com/userupload/41629504/file/original-de8cd818907e593c2bde764591ba9d43.png?resize=200x0"}
            alt="Selected GIF"
            className="w-full max-w-[500px] h-auto self-start"
          />
        </div>
      )}
    </>
  );
}
