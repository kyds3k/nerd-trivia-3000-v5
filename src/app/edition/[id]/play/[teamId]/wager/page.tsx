"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from "next/navigation";
import { usePrimeDirectives } from "@/hooks/usePrimeDirectives";
import { Button, Form, Input, Image, Slider } from "@nextui-org/react";
import { toast } from "react-toastify";
import { Slide, Zoom, Flip, Bounce } from 'react-toastify';
import Pocketbase from "pocketbase";

export default function Wager() {
  const params = useParams();
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const teamId = typeof params?.teamId === "string" ? params.teamId : undefined;
  const [teamName, setTeamName] = useState<string | null>(null);
  const [teamIdentifier, setTeamIdentifier] = useState<string | null>(null);  
  const [questionActive, setQuestionActive] = useState<boolean>(false);
  const [showForm, setShowForm] = React.useState<boolean>(false);
  const [wagerSubmitted, setWagerSubmitted] = useState<boolean>(false);
  const [action, setAction] = useState<string | null>(null);
  const [maxWager, setMaxWager] = useState<number>(0);
  const [wagerAmount, setWagerAmount] = useState<number>(0);

  // Use the hook and pass the callback for question_toggle
  // Assuming active might be a string, convert it to a boolean
  usePrimeDirectives(
    "directives",
    editionId,
    teamId,
    (message, team) => {
      console.log("Received message:", message, "for team:", team);
      // Handle notification messages
    },
    (active) => {
      console.log("Question active status:", active);
      setShowForm(active); // Ensure the type matches
      if (!active) {
        setShowForm(false); // Hide the form if the question is not active
      }
    }
  );


  usePrimeDirectives("notifications", editionId, teamId, (message, team) => {
    console.log(`Notification received from team ${team}: ${message}`);
    if (team == teamId) return;
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
      transition: Flip,
    });
  });

  const sendMessage = async (type: string | null, message: string | null, team: string | null) => {
    console.log("sendMessage called with:", { type, message, team });

    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, message })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const json = await response.json();
      console.log("Data sent successfully:", json);
    } catch (error) {
      console.error("Error sending data:", error);
    }
  };

  const submitWager = async (data: any) => {
    try {
      data.edition_id = editionId;
      data.team_id = teamId;
      data.team_name = teamName;
      data.team_name = teamName;
      pb.autoCancellation(false);

      const answer = await pb.collection("wagers").create(data);
      console.log("Wager submitted:", answer);
      localStorage.setItem("wagerSubmitted", "true");
      setWagerSubmitted(true);
      setShowForm(false);
      sendMessage("answer", `${teamName} submitted their wager!`, `$teamId`);
    } catch (error: any) {
      const responseData = error?.response?.data;
      if (
        error?.status === 400 &&
        responseData?.id?.code === "validation_not_unique"
      ) {
        console.error("Failed to submit answer: The ID already exists.");
      } else {
        console.error("Failed to submit answer:", error);
      }
    }
  };

  const fetchTeam = async () => {
    console.log("teamId", teamId);
    try {
      pb.autoCancellation(false);
      const team = await pb.collection("teams").getFirstListItem(`id = "${teamId}"`, { fields: "team_name, team_identifier, points_for_game" });
      console.log("Team:", team);
      setTeamName(team.team_name);
      setTeamIdentifier(team.team_identifier);
      setMaxWager(team.points_for_game);
    } catch (error) {
      console.error("Failed to get team:", error);
    }
  }

  const isWagerActive = async () => {
    try {
      pb.autoCancellation(false);
  
      // Check if the wager already exists
      const wagerList = await pb.collection("wagers").getList(1, 1, {
        filter: `edition_id = "${editionId}" && team_id = "${teamId}"`,
      });
  
      if (wagerList.items.length > 0) {
        setWagerSubmitted(true);
        setShowForm(false);
        return;
      }
  
      // Check if the wager round is active
      const wagerRoundList = await pb.collection("wager_rounds").getList(1, 1, {
        filter: `edition_id = "${editionId}"`,
        fields: "is_active",
      });
  
      if (wagerRoundList.items.length > 0) {
        setShowForm(wagerRoundList.items[0].is_active);
      } else {
        console.warn("No wager round found for the given edition.");
        setShowForm(false);
      }
    } catch (error) {
      console.error("Failed to get round:", error);
    }
  };
  

  const isAllIn = (wagerAmount: number | number[]) => {
    const amount = Array.isArray(wagerAmount) ? wagerAmount[0] : wagerAmount;
    if (amount === maxWager) {
      toast.info("🦄 ALL IN! ALL IN! ALL IN!!!! 🦄", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Flip,
      });
    }
  };


  useEffect(() => {
    if (teamId) {
      fetchTeam();
      isWagerActive();
    }
  }, [teamId]);


  return (
    <div className="p-4 md:p-10">
      <h1 className="text-3xl mb-5">
        Wager Round
      </h1>
      <p>{teamName}, you have {maxWager} Altairan dollars to wager!!!</p>
      {wagerSubmitted === false ? (
        showForm ? (
          <div className="mt-6 w-screen">
            <Form
              className="mt-6 w-screen"
              validationBehavior="native"
              onSubmit={(e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.currentTarget));
                console.log("data", data);
                submitWager(data);
              }}
              onReset={() => setAction("reset")}
            >
              <div className="w-screen max-w-lg md:max-w-lg flex flex-col gap-6">
                <Slider
                  label="Wager"
                  name="wager"
                  size="md"
                  className="inline-block"
                  minValue={0}
                  maxValue={maxWager}
                  step={1}
                  onChangeEnd={(value) => isAllIn(value)}
                />
                <Input
                  isRequired
                  errorMessage="Please enter artist name"
                  label="Music Artist"
                  labelPlacement="outside"
                  name="music_answer"
                  placeholder="Enter the artist's name"
                  type="text"
                  size="lg"
                  className="inline-block"
                />
                <Button className="w-fit" type="submit" color="primary">
                  Submit
                </Button>
              </div>
            </Form>
          </div>
        ) : (
          null
        )
      ) : (
        <div className="mt-6 w-screen">
          <p className="text-2xl">Answer submitted!</p>
        </div>
      )}
    </div>
  );
}
