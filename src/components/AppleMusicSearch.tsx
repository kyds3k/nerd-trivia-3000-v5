"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input, Button, Listbox, ListboxItem, Avatar, Spinner } from "@heroui/react";
import { searchAppleMusic, AppleMusicTrack, extractAppleMusicId, getAppleMusicTrack } from "@/lib/appleMusic";
import debounce from "lodash/debounce";

interface AppleMusicSearchProps {
  onSelect: (track: AppleMusicTrack) => void;
  initialValue?: string; // Can be a URL or an ID
  placeholder?: string;
}

export default function AppleMusicSearch({ onSelect, initialValue, placeholder = "Search Apple Music..." }: AppleMusicSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AppleMusicTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<AppleMusicTrack | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load initial value if it exists
  useEffect(() => {
    const loadInitial = async () => {
      if (initialValue) {
        // Check if it's a URL
        const idFromUrl = extractAppleMusicId(initialValue);
        const idToFetch = idFromUrl || initialValue;

        // If it looks like an ID (numeric), fetch it
        if (/^\d+$/.test(idToFetch)) {
          const track = await getAppleMusicTrack(idToFetch);
          if (track) {
            setSelectedTrack(track);
            setQuery(`${track.title} - ${track.artist} (${formatDuration(track.durationMs)})`);
          }
        }
      }
    };
    loadInitial();
  }, [initialValue]);

  // Debounced search function
  const debouncedSearch = useRef(
    debounce(async (searchTerm: string) => {
      if (!searchTerm) {
        setResults([]);
        setLoading(false);
        return;
      }

      // If it looks like a URL, try to extract ID and fetch directly
      const idFromUrl = extractAppleMusicId(searchTerm);
      if (idFromUrl) {
        const track = await getAppleMusicTrack(idFromUrl);
        if (track) {
          setResults([track]);
          setLoading(false);
          return;
        }
      }

      // Otherwise, perform text search
      const tracks = await searchAppleMusic(searchTerm);
      setResults(tracks);
      setLoading(false);
    }, 500)
  ).current;

  const handleInputChange = (value: string) => {
    setQuery(value);
    setLoading(true);
    setIsOpen(true);
    debouncedSearch(value);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  const handleSelect = (track: AppleMusicTrack) => {
    setSelectedTrack(track);
    setQuery(`${track.title} - ${track.artist} (${formatDuration(track.durationMs)})`);
    setIsOpen(false);
    onSelect(track);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <Input
        value={query}
        onValueChange={handleInputChange}
        placeholder={placeholder}
        startContent={
          selectedTrack ? (
            <Avatar src={selectedTrack.artworkUrl} size="sm" className="mr-2" />
          ) : null
        }
        endContent={loading ? <Spinner size="sm" /> : null}
        isClearable
        onClear={() => {
          setQuery("");
          setSelectedTrack(null);
          setResults([]);
        }}
      />

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-content1 rounded-medium shadow-large max-h-60 overflow-y-auto border border-default-200">
          <Listbox aria-label="Search Results" onAction={(key) => {
            const track = results.find(r => r.id === key);
            if (track) handleSelect(track);
          }}>
            {results.map((track) => (
              <ListboxItem key={track.id} textValue={track.title}>
                <div className="flex gap-2 items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <Avatar src={track.artworkUrl} size="sm" radius="sm" />
                    <div className="flex flex-col">
                      <span className="text-small">{track.title}</span>
                      <span className="text-tiny text-default-400">{track.artist}</span>
                    </div>
                  </div>
                  <span className="text-tiny text-default-400">{formatDuration(track.durationMs)}</span>
                </div>
              </ListboxItem>
            ))}
          </Listbox>
        </div>
      )}
    </div>
  );
}
