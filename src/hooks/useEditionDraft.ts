"use client";

import { useState, useEffect, useCallback } from "react";

export interface EditionDraftData {
  id?: string;
  title: string;
  date: string | null;
  blurb: string;
  editionGif: string;
  homeSongApple: string;
  endGif1: string;
  endGif2: string;
  r1Gif: string;
  r2Gif: string;
  r3Gif: string;
  round1Questions: string[];
  round2Questions: string[];
  round3Questions: string[];
  round1Answers: string[];
  round2Answers: string[];
  round3Answers: string[];
  round1SongsApple: string[];
  round2SongsApple: string[];
  round3SongsApple: string[];
  round1AnswerGifs: string[];
  round2AnswerGifs: string[];
  round3AnswerGifs: string[];
  banthaAnswer: string;
  banthaAnswerGif: string;
  // Impossible 1
  imp1IntroGif: string;
  imp1Theme: string;
  imp1Gif: string;
  imp1Question: string;
  imp1Ppa: string;
  imp1SongsApple: { [key: number]: string };
  imp1Answers: string[];
  imp1AnswerGifs: { [key: number]: string };
  // Impossible 2
  imp2IntroGif: string;
  imp2Theme: string;
  imp2Gif: string;
  imp2Question: string;
  imp2Ppa: string;
  imp2SongsApple: { [key: number]: string };
  imp2Answers: string[];
  imp2AnswerGifs: { [key: number]: string };
  // Wager
  wagerGif: string;
  wagerPlacingGif: string;
  wagerSongApple: string;
  finalCat: string;
  finalCatGif: string;
  // Final
  finalIntroGif: string;
  finalQuestion: string;
  finalAnswer: string;
  finalAnswerGif: string;
  finalSongApple: string;
  // Counts
  numImpossibleAnswers: number;
  numImpossibleAnswers2: number;
  numImpossibleSongs: number;
  numImpossibleSongs2: number;
}

export const defaultEditionData: EditionDraftData = {
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
  imp1SongsApple: {},
  imp1Answers: [],
  imp1AnswerGifs: {},
  imp2IntroGif: "",
  imp2Theme: "",
  imp2Gif: "",
  imp2Question: "",
  imp2Ppa: "",
  imp2SongsApple: {},
  imp2Answers: [],
  imp2AnswerGifs: {},
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

const STORAGE_KEY = "edition_draft_v2"; // Changed key to avoid conflicts with old structure

export function useEditionDraft() {
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    // Check if draft exists on mount
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      setHasDraft(!!saved);
    }
  }, []);

  const saveDraft = useCallback((data: EditionDraftData) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setHasDraft(true);
    }
  }, []);

  const loadDraft = useCallback((): EditionDraftData | null => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse draft", e);
          return null;
        }
      }
    }
    return null;
  }, []);

  const clearDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      setHasDraft(false);
    }
  }, []);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft
  };
}