"use client";

import { useState, useEffect, useCallback } from "react";

export interface EditionDraftData {
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