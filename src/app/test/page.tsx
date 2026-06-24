"use client";

import React from "react";
import { useEffect, useState } from "react";
import { getPocketbaseClient } from "@/lib/pocketbase";

export default function App() {
  const pb = getPocketbaseClient();
  const refreshAuth = async () => {
    pb.autoCancellation(false);
    await pb.collection("users").authWithOAuth2({ provider: 'google' });
  }


  useEffect(() => {
    refreshAuth();
  }, []);

  // Renders the editor instance, and its contents as HTML below.
  return (
    <div className="wrapper">
      Testing Spotters
    </div>
  );
}
