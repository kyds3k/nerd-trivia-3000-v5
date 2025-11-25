"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Pocketbase from "pocketbase";
import { Image } from "@heroui/react";
import { useHotkeys } from "react-hotkeys-hook";
import { Spinner, Progress } from "@heroui/react";
import { useTransitionRouter } from "next-transition-router";
import ShallNotPass from "@/components/ShallNotPass";

export default function Doubled() {
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const router = useTransitionRouter();
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useHotkeys("ctrl+ArrowRight", () => {
    // Navigate to Round 3 Question 1
    router.push(`/edition/${editionId}/present/round/3/question/1`);
  });

  useHotkeys("ctrl+ArrowLeft", () => {
    // Navigate back to Scoreboard
    router.push(`/edition/${editionId}/present/round/3`);
  });

  useEffect(() => {
    const initializeApp = async () => {
      if (!pb.authStore.isValid) {
        console.log("Not authenticated with Pocketbase.");
        setLoading(false);
        return;
      }

      console.log("Authenticated with Pocketbase successfully.");
      const authData = localStorage.getItem("pocketbase_auth");

      if (!authData) {
        console.error("No auth data found.");
        setLoading(false);
        setIsAdmin(false);
        return;
      }

      const parsedAuth = JSON.parse(authData);
      console.log("Parsed auth data:", parsedAuth);
      if (!parsedAuth.record.is_admin) {
        console.log("Not an admin.");
        setLoading(false);
        setIsAdmin(false);
        return;
      }

      console.log("Admin authenticated.");
      setIsAdmin(true);
      setLoading(false);
    };

    if (editionId) {
      initializeApp();
    }
  }, [editionId]);

  return (
    <div className="flex h-screen justify-center items-center">
      {loading ? (
        <Progress isIndeterminate aria-label="Loading..." className="max-w-md" size="sm" />
      ) : !isAdmin ? (
        <ShallNotPass />
      ) : (
        <div className="roundContainer flex flex-col gap-4 items-center">
          <h1 className="text-8xl">POINTS ARE DOUBLED!!!</h1>
          <Image
            src="https://media1.tenor.com/m/4hGCMf5MmnQAAAAC/chloe-grace-moretz-look.gif"
            alt="Doubled Points Gif"
            height={500}
          />
        </div>
      )}
    </div>
  );
}
