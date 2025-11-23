"use client";

import { useState, useEffect } from "react";

const defaultEditionData = {
  id: null as string | null,
  title: "",
  date: null as string | null,
  blurb: "",
  editionGif: "",
  homeSong: "",
  endGif1: "",
  endGif2: "",
  r1Gif: "",
  r2Gif: "",
  r3Gif: "",
  r1Questions: [] as string[],
  r1Answers: [] as string[],
  r1Songs: [] as string[],
  r1AnswerGifs: [] as string[],
  banthaAnswer: "",
  banthaAnswerGif: "",
  r2Questions: [] as string[],
  r2Answers: [] as string[],
  r2Songs: [] as string[],
  r2AnswerGifs: [] as string[],
  r3Questions: [] as string[],
  r3Answers: [] as string[],
  r3Songs: [] as string[],
  r3AnswerGifs: [] as string[],
  imp1IntroGif: "",
  imp1Theme: "",
  imp1ThemeGif: "",
  imp1Question: "",
  imp1AnswerValue: 0,
  imp1Answers: [] as string[],
  imp1SongCount: 0,
  imp1Songs: [] as string[],
  imp1AnswerGifs: [] as string[],
  imp2IntroGif: "",
  imp2Theme: "",
  imp2ThemeGif: "",
  imp2Question: "",
  imp2AnswerValue: 0,
  imp2Answers: [] as string[],
  imp2SongCount: 0,
  imp2Songs: [] as string[],
  imp2AnswerGifs: [] as string[],
  // Wager Round
  wagerSong: "",
  wagerIntroGif: "",
  wagerPlacingGif: "",
  finalCategory: "",
  finalCategoryGif: "",
  // Final Round
  finalSong: "",
  finalIntroGif: "",
  finalQuestion: "",
  finalAnswer: "",
  finalAnswerGif: "",
  // Counts
  imp1AnswerCount: 0,
  imp2AnswerCount: 0,
};

const STORAGE_KEY = "new_edition_draft";

type EditionData = typeof defaultEditionData;

export function useEditionDraft() {
  const [editionData, setEditionData] = useState<EditionData>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved !== "undefined") {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse edition draft:", e);
          return defaultEditionData;
        }
      }
    }
    return defaultEditionData;
  });

  useEffect(() => {
    if (typeof window !== "undefined" && editionData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(editionData));
    }
  }, [editionData]);

  const updateField = (key: keyof typeof editionData) => (value: any) => {
    setEditionData(prev => ({ ...prev, [key]: value }));
  };

  const updateArrayItem = (field: keyof typeof editionData, index: number, value: any) => {
    setEditionData(prev => {
      const updated = Array.isArray(prev[field]) ? [...(prev[field] as any[])] : Object.assign([], prev[field]);
      updated[index] = value;
      return { ...prev, [field]: updated };
    });
  };

  const addArrayItem = (field: keyof typeof editionData, value: any = "") => {
    setEditionData(prev => {
      const updated = Array.isArray(prev[field]) ? [...(prev[field] as any[]), value] : [value];
      return { ...prev, [field]: updated };
    });
  };

  const removeArrayItem = (field: keyof typeof editionData, index: number) => {
    setEditionData(prev => {
      const updated = Array.isArray(prev[field]) ? [...(prev[field] as any[])] : [];
      updated.splice(index, 1);
      return { ...prev, [field]: updated };
    });
  };

  const clearDraft = () => {
    setEditionData(defaultEditionData);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return {
    editionData,
    updateField,
    updateArrayItem,
    addArrayItem,
    removeArrayItem,
    clearDraft,
  };
}