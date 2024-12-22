"use client";

import React from "react";
import { useEffect, useState } from "react";
import PocketBase from "pocketbase";


export default function App() {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const refreshSpotifyAuth = async () => {
    pb.autoCancellation(false);
    const authData = await pb.collection("users").authWithOAuth2({provider: 'google'});
    console.log("authData", authData);
  }


  useEffect(() => {
    refreshSpotifyAuth();
  }, []);

  // Renders the editor instance, and its contents as HTML below.
  return (
    <div className="wrapper">
      Testing Spotters
    </div>
  );
}
