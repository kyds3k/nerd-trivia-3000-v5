"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import { useParams, useRouter } from "next/navigation";
import Pocketbase from "pocketbase";
import { Button, Input } from "@heroui/react";
import { toast, Flip } from "react-toastify";
import { usePrimeDirectives } from "@/hooks/usePrimeDirectives";

export default function TiebreakerTeamPage({ params }: { params: Promise<{ id: string; teamId: string }> }) {
  const { id: editionId, teamId } = use(params);
  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const router = useRouter();
  const [questionText, setQuestionText] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const submittingRef = useRef(false);

  const [teamName, setTeamName] = useState<string | null>(null);

  usePrimeDirectives("directives", editionId, teamId);

  const onNotification = useCallback((message: string, team: string) => {
    console.log(`Notification received. Message: "${message}", Sender Team: "${team}", My TeamId: "${teamId}"`);
    console.log(`Comparison: team == teamId is ${team == teamId}`);

    if (team == teamId) {
      console.log("Ignoring own notification.");
      return;
    }

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
  }, [teamId]);

  usePrimeDirectives("notifications", editionId, teamId, onNotification);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        pb.autoCancellation(false);
        const tiebreakerList = await pb.collection('tiebreakers').getFullList({
          filter: 'is_active=true'
        });
        const tiebreakerRecord = tiebreakerList[0];

        if (tiebreakerRecord && tiebreakerRecord.question) {
          setQuestionText(tiebreakerRecord.question);
        }
      } catch (error) {
        console.error("Failed to fetch tiebreaker question:", error);
      }
    };

    fetchQuestion();
  }, [editionId]);

  const sendMessage = async (type: string | null, message: string | null, team: string | undefined | null) => {
    console.log("sendMessage called with:", { type, message, team });

    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, message, team })
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

  const handleInputChange = (value: string) => {
    // Remove non-numeric characters except for potential decimal points if needed (though tiebreakers are usually integers)
    const rawValue = value.replace(/[^0-9]/g, "");

    if (rawValue === "") {
      setAnswer("");
      return;
    }

    // Format with commas
    const formattedValue = Number(rawValue).toLocaleString();
    setAnswer(formattedValue);
  };

  const handleSubmit = async () => {
    if (!answer) return;
    if (submittingRef.current || submitted) return;
    submittingRef.current = true;

    // Strip commas for submission
    const numericAnswer = answer.replace(/,/g, "");

    setLoading(true);
    try {
      pb.autoCancellation(false);

      // Get the active tiebreaker question to link the answer to it.
      const tiebreakerList = await pb.collection('tiebreakers').getFullList({
        filter: 'is_active=true'
      });
      const tiebreakerRecord = tiebreakerList[0];

      if (!tiebreakerRecord) {
        toast.error("No active tiebreaker found.");
        setLoading(false);
        submittingRef.current = false;
        return;
      }

      // Duplicate guard: one tiebreaker answer per team (reconnect / double-click).
      const existing = await pb.collection("answers").getList(1, 1, {
        filter: `edition_id = "${editionId}" && answer_type = "tiebreaker" && tiebreaker_id = "${tiebreakerRecord.id}" && team_id = "${teamId}"`,
      });
      if (existing.items.length > 0) {
        setSubmitted(true);
        setLoading(false);
        return;
      }

      // Fetch team details to include in the answer
      const teamRecord = await pb.collection('teams').getOne(teamId as string);
      setTeamName(teamRecord.team_name);

      const data = {
        edition_id: editionId,
        team_id: teamId,
        team_name: teamRecord.team_name,
        team_identifier: teamRecord.team_identifier,
        answer: numericAnswer, // This is a string field in DB but we treat it as number
        answer_type: "tiebreaker",
        round_number: "tiebreaker", // or null
        question_number: "1", // assuming 1 for now
        tiebreaker_id: tiebreakerRecord.id
      };

      await pb.collection("answers").create(data);

      setSubmitted(true);
      sendMessage("answer", `${teamRecord.team_name} submitted an answer!`, teamId);
    } catch (error) {
      console.error("Failed to submit answer:", error);
      toast.error("Failed to submit answer. Please try again.");
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  if (submitted) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <h1 className="text-4xl mb-8 font-bold text-center">Answer Submitted!</h1>
        <p className="text-xl text-center">Please wait for the results...</p>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <h1 className="text-4xl mb-8 font-bold text-center text-glow-blue-400">TIEBREAKER</h1>

      {questionText && (
        <div
          className="mb-8 text-2xl text-center max-w-2xl"
          dangerouslySetInnerHTML={{ __html: questionText }}
        />
      )}

      <p className="text-xl mb-8 text-center">Enter your numerical answer below:</p>

      <div className="w-full max-w-md flex flex-col gap-4">
        <Input
          type="text"
          size="lg"
          placeholder="Enter number..."
          value={answer}
          onValueChange={handleInputChange}
          classNames={{
            input: "text-center text-2xl",
          }}
        />

        <Button
          size="lg"
          color="primary"
          className="w-full font-bold text-xl"
          onPress={handleSubmit}
          isLoading={loading}
        >
          SUBMIT
        </Button>
      </div>
    </div>
  );
}
