"use client"

import React, { useEffect, useState, useRef } from "react";
import useEffectOnce from "react-use/lib/useEffectOnce";
import { useParams } from "next/navigation";
import Pocketbase from "pocketbase";
import { Spinner, Button, Form, Input, Textarea, Image } from "@heroui/react";
import DOMPurify from "dompurify"; // Import the sanitizer
import Typed from "typed.js";
import { useRouter } from "next/navigation";
import { usePrimeDirectives } from "@/hooks/usePrimeDirectives";
import { set } from "lodash";
import { toast } from "react-toastify";
import { Slide, Zoom, Flip, Bounce } from 'react-toastify';
import { send } from "process";
import CyberButton from "@/components/CyberButton";
import { motion } from "framer-motion";



export default function Question() {
  const params = useParams();
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const router = useRouter();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const impossibleId = typeof params?.impossibleId === "string" ? params.impossibleId : '';
  const teamId = typeof params?.teamId === "string" ? params.teamId : undefined;
  const [teamName, setTeamName] = useState<string | null>(null);
  const typedTeamName = useRef<HTMLSpanElement | null>(null);
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
  const submittingRef = useRef(false);


  // Use the hook and pass the callback for question_toggle
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
    console.log("Notification received:", message);
    if (teamName && message.includes(teamName)) return;
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
    if (submittingRef.current || answerSubmitted) return;
    submittingRef.current = true;
    try {
      pb.autoCancellation(false);

      // Duplicate guard: one impossible answer per team (reconnect / double-click).
      const existing = await pb.collection("answers").getList(1, 1, {
        filter: `edition_id = "${editionId}" && answer_type = "impossible" && impossible_number = "${impossibleId}" && team_id = "${teamId}"`,
      });
      if (existing.items.length > 0) {
        setAnswerSubmitted(true);
        setShowForm(false);
        return;
      }

      data.edition_id = editionId;
      data.team_id = teamId;
      data.answer_type = "impossible";
      data.team_identifier = teamIdentifier;
      data.team_name = teamName;
      data.impossible_number = impossibleId;
      data.team_name_lower = teamName?.toLowerCase();

      console.log("Submitting answer:", data);

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
    } finally {
      submittingRef.current = false;
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

  useEffect(() => {
    if (!typedTeamName.current) return;
  
    const typed = new Typed(typedTeamName.current, {
      strings: [teamName || ""], // Use a default string if teamName is null
      typeSpeed: 20,
      backSpeed: 30,
      showCursor: false,
      loop: false,
    });
  
    // Destroying
    return () => {
      typed.destroy();
    };
  }, [teamName]); // Add teamName as a dependency if it can change


  return (
    <div className="p-4 pb-10 md:p-10 w-screen">
      <div data-augmented-ui="tl-clip bl-clip b-clip-x r-clip-xy both " className="p-4 pb-10 md:p-10 w-full nerd-aug bluecard">
      <div className="flex flex-col md:flex-row gap-0 md:gap-2 justify-normal md:justify-between mb-5 ">
        <h1 className="text-lg mb-1 md:mb-5">
          Impossible Question {impossibleId}
        </h1>
        {teamName != null && (
          <h2 className="text-lg">
            <strong>Team:</strong><span ref={typedTeamName}></span>
          </h2>
          )}        
      </div>
        {questionActive ? (
          <span ref={el} className="text-md md:text-2xl"></span>
        ) : (
          <p className="text-2xl flex">{loadingQuote}</p>
        )}
      </div>
      {answerSubmitted === false ? (
        showForm ? (

            <motion.div
              initial={{ opacity: 0, y: -20 }} // Start hidden and slightly above
              animate={{ opacity: 1, y: 0 }} // Slide down and become visible
              exit={{ opacity: 0, y: -20 }} // Hide when the component is removed
              transition={{ duration: 0.5, ease: "easeInOut" }} // Smooth transition
              className="mt-6 w-full"
            >
              <div data-augmented-ui="tl-clip t-clip-xy bl-clip r-clip-xy both" className="p-4 pb-10 md:p-10 w-full nerd-aug bluecard bluecard__alt">
                <Form
                  validationBehavior="native"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const data = Object.fromEntries(new FormData(e.currentTarget));
                    console.log("data", data);
                    submitAnswer(data);
                  }}
                  onReset={() => setAction("reset")}
                >
                  <div className="w-full flex flex-col gap-6">
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
                    classNames={{
                      inputWrapper:
                        "border-2 border-cyan-500 focus-within:border-cyan-500 focus-within:animate-neon bg-black text-white focus-visible:border-cyan-500 !border-cyan-500 md:max-w-xl",
                      input: "placeholder-gray-400 text-white focus-visible:outline-none",
                    }}
                    radius="none" // Removes rounded edges
                    variant="bordered"
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
                      classNames={{
                        inputWrapper:
                          "border-2 border-cyan-500 focus-within:border-cyan-500 focus-within:animate-neon bg-black text-white focus-visible:border-cyan-500 !border-cyan-500 md:max-w-xl",
                        input: "placeholder-gray-400 text-white focus-visible:outline-none",
                      }}
                      radius="none" // Removes rounded edges
                      variant="bordered"
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
                      classNames={{
                        inputWrapper:
                          "border-2 border-cyan-500 focus-within:border-cyan-500 focus-within:animate-neon bg-black text-white focus-visible:border-cyan-500 !border-cyan-500 md:max-w-xl",
                        input: "placeholder-gray-400 text-white focus-visible:outline-none",
                      }}
                      radius="none" // Removes rounded edges
                      variant="bordered"
                    />

                    <CyberButton
                      text="SUBMIT"
                      glitchText="ANSWER"
                      className="mt-4 w-fit"
                      buttonType="submit"
                    />
                  </div>
                </Form>
              </div>
            </motion.div>

        ) : (
          null
        )
      ) : (
        <div className="mt-6">
          <p className="text-2xl">Answer submitted!</p>
        </div>
      )}
    </div>
  );


}
