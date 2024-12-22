"use client"

import React, { useEffect, useState, useRef } from "react";
import useEffectOnce from "react-use/lib/useEffectOnce";
import { useParams } from "next/navigation";
import Pocketbase from "pocketbase";
import { Spinner, Button, Form, Input, Textarea, Image } from "@nextui-org/react";
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
  const impossibleId = typeof params?.impossibleId === "string" ? params.impossibleId : '';
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
  usePrimeDirectives("directives", editionId, teamId, (active) => {
    console.log("Question active status:", active);
    setQuestionActive(active); // Update the state based on the directive
    if (!active)
      setShowForm(false); // Hide the form if the question is not active
  });

  usePrimeDirectives("notifications", editionId, teamId, (message, team) => {
    console.log("Notification received:", message);
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
      data.answer_type = "impossible";
      data.id = teamId;
      data.team_identifier = teamIdentifier;
      data.team_name = teamName;
      data.impossible_number = impossibleId;
      data.team_name_lower = teamName?.toLowerCase();
      pb.autoCancellation(false);

      const answer = await pb.collection("answers").create(data);
      console.log("Answer submitted:", answer);
      localStorage.setItem("answerSubmitted", "true");
      setAnswerSubmitted(true);
      setShowForm(false);
      sendMessage("answer", `${teamName} submitted an answer!`, `$teamId`);
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

    const fetchImpossible = async () => {
      pb.autoCancellation(false);
      try {
        const idNum = parseInt(impossibleId);
        console.log("idNum", idNum);
        console.log("idNum type", typeof idNum);
        const question = await pb
          .collection("impossible_rounds")
          .getFirstListItem(
            `edition_id = "${editionId}" && impossible_number = ${idNum}`, { fields: "id, is_active, question_text" }
          );
        console.log(question);
        const sanitizedQuestion = DOMPurify.sanitize(question.question_text);
        setQuestionText(sanitizedQuestion);
        setQuestionActive(question.is_active);
      } catch (error) {
        console.error("Failed to get question:", error);
      }
    };

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
    fetchImpossible();
    fetchTeam();
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
    <div className="p-4 md:p-10">
      <h1 className="text-lg mb-5">
        Impossible Question {impossibleId}
      </h1>
      {questionActive ? (
        <span ref={el} className="text-2xl"></span>
      ) : (
        <p className="text-2xl flex">{loadingQuote}</p>
      )}
      {answerSubmitted === false ? (
        showForm ? (
          <div className="mt-6 w-screen">
            <Form
              className="mt-6 w-screen"
              validationBehavior="native"
              onSubmit={(e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.currentTarget));
                console.log("data", data);
                submitAnswer(data);
              }}
              onReset={() => setAction("reset")}
            >
              <div className="w-screen max-w-lg md:max-w-lg flex flex-col gap-6">
                <Textarea
                  isRequired
                  errorMessage="Please enter a valid answer"
                  label="Answer"
                  labelPlacement="outside"
                  name="answer"
                  isClearable
                  placeholder="Enter your answer"
                  type="text"
                  size="lg"
                  className="inline-block"
                />
                <Input
                  isRequired
                  errorMessage="Please enter artist #1 name"
                  label="Music Artist #1"
                  labelPlacement="outside"
                  name="music_answer"
                  placeholder="Enter the artist's name"
                  type="text"
                  size="lg"
                  className="inline-block"
                />
                <Input
                  isRequired
                  errorMessage="Please enter artist #2 name"
                  label="Music Artist #2"
                  labelPlacement="outside"
                  name="music_answer_2"
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
