"use client"

import React, { useEffect, useState, useRef } from "react";
import useEffectOnce from "react-use/lib/useEffectOnce";
import { useParams } from "next/navigation";
import Pocketbase from "pocketbase";
import { Spinner, Button, Form, Input, Image, Switch } from "@nextui-org/react";
import DOMPurify from "dompurify"; // Import the sanitizer
import Typed from "typed.js";
import { useRouter } from "next/navigation";
import { usePrimeDirectives } from "@/hooks/usePrimeDirectives";
import { set } from "lodash";
import { toast } from "react-toastify";
import { Slide, Zoom, Flip, Bounce } from 'react-toastify';
import { send } from "process";


export default function Question() {
  const params = useParams();
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const router = useRouter();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const teamId = typeof params?.teamId === "string" ? params.teamId : undefined;
  const [teamName, setTeamName] = useState<string | null>(null);
  const [teamIdentifier, setTeamIdentifier] = useState<string | null>(null);
  const [banthashitCard, setBanthashitCard] = useState<boolean>(false);
  const [banthaUsed, setBanthaUsed] = useState<boolean>(false);
  const [questionText, setQuestionText] = useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(true);
  const [showForm, setShowForm] = React.useState<boolean>(false);
  const [loadingQuote, setLoadingQuote] = useState<string | null>(null);
  const [questionActive, setQuestionActive] = useState<boolean>(false);
  const [action, setAction] = useState<string | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState<boolean>(false);


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
      setQuestionActive(active); // Ensure the type matches
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


  const getLoadingQuote = async () => {
    try {
      pb.autoCancellation(false);
      const loadingQuotes = await pb.collection("loading_quotes").getFullList();
      const listCount = loadingQuotes.length;
      const randomIndex = Math.floor(Math.random() * listCount);
      setLoadingQuote(loadingQuotes[randomIndex].quote);
    } catch (error) {
      console.error("Failed to get loading quote:", error);
    }
  };

  const submitAnswer = async (data: any) => {
    try {
      data.edition_id = editionId;
      data.team_id = teamId;
      data.answer_type = "final";
      data.team_identifier = teamIdentifier;
      data.team_name = teamName;
      data.bantha_used = false;
      data.team_name_lower = teamName?.toLowerCase();
      pb.autoCancellation(false);

      const answer = await pb.collection("answers").create(data);
      console.log("Answer submitted:", answer);
      localStorage.setItem("answerSubmitted", "true");
      setAnswerSubmitted(true);
      setShowForm(false);
      sendMessage("answer", `${teamName} submitted their FINAL answer!`, `$teamId`);
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


  useEffectOnce(() => {
    if (localStorage.getItem("answerSubmitted") === "true")
      setAnswerSubmitted(true);

    console.log('answer submitted:', answerSubmitted);

    const fetchQuestion = async () => {
      pb.autoCancellation(false);
      try {
        // Check if the answer is already submitted
        const answerList = await pb.collection("answers").getList(1, 1, {
          filter: `edition_id = "${editionId}" && answer_type = "final" && team_id = "${teamId}"`,
        });

        if (answerList.items.length > 0) {
          setAnswerSubmitted(true);
          setShowForm(false);
          return;
        }

        // Fetch the question
        const question = await pb
          .collection("final_rounds")
          .getFirstListItem(
            `edition_id = "${editionId}"`,
            { fields: "id, is_active, question_text" }
          );
        console.log(question);

        const sanitizedQuestion = DOMPurify.sanitize(question.question_text);
        setQuestionText(sanitizedQuestion);
        setQuestionActive(question.is_active);
      } catch (error) {
        console.error("Failed to get question:", error);
      }
    };
    ``



    const fetchTeam = async () => {
      console.log("teamId", teamId);
      try {
        const team = await pb.collection("teams").getFirstListItem(`id = "${teamId}"`, { fields: "team_name, team_identifier, banthashit_card" });
        console.log("Team:", team);
        setTeamName(team.team_name);
        setTeamIdentifier(team.team_identifier);
        setBanthashitCard(team.banthashit_card);
      } catch (error) {
        console.error("Failed to get team:", error);
      }
    }

    getLoadingQuote();
    fetchTeam();
    fetchQuestion();
  });

  const el = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (el.current && questionActive && questionText) {
      const typed = new Typed(el.current, {
        strings: [questionText],
        typeSpeed: 20,
        backSpeed: 30,
        showCursor: false,
        loop: false,
        onComplete: (self) => {
          setShowForm(true);
          console.log("Question typed out");
        }
      });

      return () => typed.destroy(); // Cleanup Typed.js instance on unmount or rerun
    }
  }, [questionText, questionActive]);

  return (
    <div className="p-4 md:p-10 w-screen">
      <h1 className="text-3xl mb-5">
        FINAL QUESTION
      </h1>
      {questionActive ? (
        <span ref={el} className="text-2xl"></span>
      ) : (
        <p className="text-2xl flex">{loadingQuote}</p>
      )}
      {answerSubmitted === false ? (
        showForm ? (
          <div className="mt-6 w-full">
            <Form
              className="mt-6"
              validationBehavior="native"
              onSubmit={(e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.currentTarget));
                console.log("data", data);
                submitAnswer(data);
              }}
              onReset={() => setAction("reset")}
            >
              <div className="w-full max-w-lg md:max-w-lg flex flex-col gap-6">
                <Input
                  isRequired
                  errorMessage="Please enter a valid answer"
                  label="Answer"
                  labelPlacement="outside"
                  name="answer"
                  placeholder="Enter your answer"
                  type="text"
                  size="lg"
                  className="inline-block"
                />
                {banthashitCard && (
                  <div className="flex gap-4">
                    <p>Bantha is sad! You waited too long, you cannot use Banthashit in the final round!</p>
                    <Image src="https://i.imgur.com/pWDb7GL.gif" width="89" height="64" alt="Bantha Card" />
                  </div>
                )}
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
