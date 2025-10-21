"use client";

import React from "react";
import { Button } from "@heroui/react";

interface SubmittedOverlayProps {
  show: boolean;
  onRescore: () => void;
  message?: string;
}

export default function SubmittedOverlay({ show, onRescore, message = "Submitted!" }: SubmittedOverlayProps) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div className="bg-gray-600 p-6 rounded-lg shadow-lg text-center">
        <div className="text-xl font-bold text-white mb-5">{message}</div>
        <Button onClick={onRescore} className="bg-blue-500 hover:bg-blue-600 text-white">
          Rescore
        </Button>
      </div>
    </div>
  );
}


