"use client";

import React, { useEffect, useState } from 'react';
import useEffectOnce from "react-use/lib/useEffectOnce";
import { Button, Image, Tabs, Tab, Form, Select, Switch, cn } from "@heroui/react";
import { useParams, useRouter } from "next/navigation";
import { getPocketbaseClient } from '@/lib/pocketbase';
import { getPusherClient } from "@/lib/pusher/client";
import Scoring from '@/components/Scoring';
import SubmissionTracker from '@/components/SubmissionTracker';
import ShallNotPass from '@/components/ShallNotPass';
import { toast } from 'react-toastify';

interface Message {
  message: string;
  date: string;
}

/**
 * Exactly one game segment can be "active" at a time. Instead of tracking 20
 * independent booleans (and manually flipping the other 19 off on every
 * toggle), we model that as a single value. Helper predicates below derive the
 * on/off state of each individual Switch from it.
 */
type ActiveItem =
  | { kind: "question"; round: number; question: number }
  | { kind: "impossible"; n: number }
  | { kind: "wager" }
  | { kind: "final" }
  | { kind: "tiebreaker" }
  | null;

export default function Admin() {
  const pb = getPocketbaseClient();

  const params = useParams();
  const router = useRouter();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [editionTitle, setEditionTitle] = useState<string>("");
  // const questions is an array of objects
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeItem, setActiveItem] = useState<ActiveItem>(null);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  // Which Questions sub-tab is shown; auto-switched to follow the presenter so
  // the green "current" button is always visible.
  const [questionSection, setQuestionSection] = useState<string>('Round 1');

  // Derived on/off state for each Switch.
  const isQuestionActive = (round: number, question: number) =>
    activeItem?.kind === "question" &&
    activeItem.round === round &&
    activeItem.question === question;
  const isImpossibleActive = (n: number) =>
    activeItem?.kind === "impossible" && activeItem.n === n;
  const isWagerActive = activeItem?.kind === "wager";
  const isFinalActive = activeItem?.kind === "final";
  const isTiebreakerActive = activeItem?.kind === "tiebreaker";

  // Silently clear an item's is_active in the DB WITHOUT broadcasting a
  // question_toggle. Used when exclusively switching the active segment: the
  // players of the previously-active question have already navigated away, so a
  // broadcast would wrongly close the newly-activated question on everyone.
  const deactivateItem = (item: ActiveItem) => {
    if (!item) return;
    switch (item.kind) {
      case "question": toggleActive(false, "question", item.round, item.question, false); break;
      case "impossible": toggleActive(false, "impossible", item.n, null, false); break;
      case "wager": toggleActive(false, "wager", null, null, false); break;
      case "final": toggleActive(false, "final", null, null, false); break;
      case "tiebreaker": toggleActive(false, "tiebreaker", null, null, false); break;
    }
  };

  // Activate one segment exclusively: deactivate whatever was active first, then
  // activate (and broadcast) the new one. Only one segment is ever active.
  const activateExclusive = (
    item: ActiveItem,
    type: 'question' | 'impossible' | 'wager' | 'final' | 'tiebreaker',
    round: number | null,
    question: number | null
  ) => {
    const previous = activeItem;
    if (previous && JSON.stringify(previous) !== JSON.stringify(item)) {
      deactivateItem(previous);
    }
    setActiveItem(item);
    toggleActive(true, type, round, question);
  };

  // Handler for toggling a switch. Activating one deactivates the previously
  // active segment (exclusive), so only one question is ever live at a time.
  const handleToggle = (key: string, value: boolean) => {
    // Round question switches use keys like "switchR1Q3".
    if (key.startsWith("switchR")) {
      const round = Number(key[7]);
      const question = Number(key[9]);
      if (value) activateExclusive({ kind: "question", round, question }, "question", round, question);
      else { setActiveItem(null); toggleActive(false, "question", round, question); }
      return;
    }

    if (key === "I1" || key === "I2") {
      const n = key === "I1" ? 1 : 2;
      if (value) activateExclusive({ kind: "impossible", n }, "impossible", n, null);
      else { setActiveItem(null); toggleActive(false, "impossible", n, null); }
      return;
    }

    if (key === "wager") {
      if (value) activateExclusive({ kind: "wager" }, "wager", null, null);
      else { setActiveItem(null); toggleActive(false, "wager", null, null); }
      return;
    }

    if (key === "final") {
      if (value) activateExclusive({ kind: "final" }, "final", null, null);
      else { setActiveItem(null); toggleActive(false, "final", null, null); }
      return;
    }

    if (key === "tiebreaker") {
      if (value) activateExclusive({ kind: "tiebreaker" }, "tiebreaker", null, null);
      else { setActiveItem(null); toggleActive(false, "tiebreaker", null, null); }
    }
  };

  const fetchQuestions = async () => {
    try {
      pb.autoCancellation(false);

      const editionGrab = await pb.collection('editions').getOne(`${editionId}`);
      setEditionTitle(editionGrab.title);

      const questionList = await pb.collection('questions').getFullList({
        filter: `edition_id="${editionId}"`,
      });

      setQuestions(questionList);

      const activeQuestion = questionList.find((question) => question.is_active);

      if (activeQuestion) {
        setActiveItem({
          kind: "question",
          round: Number(activeQuestion.round_number),
          question: Number(activeQuestion.question_number),
        });
        return;
      }

      // If no active question is found, search for the active impossible round
      const impossibleList = await pb.collection('impossible_rounds').getFullList({
        filter: `edition_id="${editionId}"`,
      });

      const activeImpossible = impossibleList.find((impossible) => impossible.is_active);

      if (activeImpossible) {
        setActiveItem({ kind: "impossible", n: Number(activeImpossible.impossible_number) });
        return;
      }

      // If no impossible round is active, check if a wager round is active
      try {
        const wagerRecord = await pb.collection('wager_rounds').getFirstListItem(
          `edition_id="${editionId}"`
        );
        if (wagerRecord?.is_active) {
          setActiveItem({ kind: "wager" });
          // Exit early since a wager round is active
          return;
        }
      } catch (error) {
        console.log('No active wager round found:', error);
      }

      // If no wager round is active, check if a final round is active
      try {
        const finalRecord = await pb.collection('final_rounds').getFirstListItem(
          `edition_id="${editionId}"`
        );
        if (finalRecord?.is_active) {
          setActiveItem({ kind: "final" });
          return;
        }
      } catch (error) {
        console.log('No active final round found:', error);
      }

      // If no final round is active, check if a tiebreaker is active
      try {
        const tiebreakerList = await pb.collection('tiebreakers').getFullList();
        const activeTiebreaker = tiebreakerList.find(t => t.is_active);

        if (activeTiebreaker) {
          setActiveItem({ kind: "tiebreaker" });
        }
      } catch (error) {
        console.log('No active tiebreaker found:', error);
      }

    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };



  const sendDirective = async (type: string | null, round: string | null, question: string | null, active: boolean | null, tiedTeamIds: string[] | null = null) => {
    try {
      const response = await fetch('/api/direct/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pb.authStore.token}`,
        },
        body: JSON.stringify({ type, round, question, active, tiedTeamIds }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const json = await response.json();
      console.log("Data sent successfully:", json);

    } catch (error) {
      console.error("Error sending data:", error);
      toast.error("Failed to send navigation directive. Check your connection and try again.");
    }
  };

  const handleButtonClick = async (identifier: string, type: string, round: string | null, question: string | null, active: boolean | null) => {
    // Update active button
    setActiveButton(identifier);
    console.log('setting active button:', identifier);
    console.log('should be:', activeButton);

    let tiedTeamIds: string[] | null = null;

    if (type === 'tiebreaker_jump') {
      try {
        const teams = await pb.collection('teams').getFullList({
          filter: `current_edition = "${editionId}"`,
          sort: '-points_for_game',
        });

        if (teams.length > 0) {
          const topScore = teams[0].points_for_game;
          const tiedTeams = (teams as unknown as Array<{ points_for_game: number; id: string }>).filter((team) => team.points_for_game === topScore);
          tiedTeamIds = tiedTeams.map((team) => team.id);

        }
      } catch (error) {
        console.error("Error calculating tied teams:", error);
      }
    }

    sendDirective(type, round, question, active, tiedTeamIds);
  };


  const toggleActive = async (
    isActive: boolean,
    type: 'round' | 'question' | 'impossible' | 'wager' | 'final' | 'tiebreaker',
    round: number | null,
    question: number | null,
    broadcast: boolean = true
  ) => {
    try {
      // Validate inputs for "question" type
      if (type === 'question' && (!round || !question)) {
        throw new Error('For type "question", both round and question must be provided.');
      }

      // Prepare the data object
      const data: { type: string; round?: number; question?: number; is_active: boolean } = {
        type,
        is_active: isActive,
      };

      console.log('Data:', data);

      if (round) data.round = round;
      if (question) data.question = question;

      pb.autoCancellation(false);

      let recordId: string | null = null;

      if (type === 'question') {
        // Look up the specific question directly instead of pulling the whole
        // list and filtering on the client.
        const questionRecord = await pb.collection('questions').getFirstListItem(
          `edition_id="${editionId}" && round_number=${round} && question_number=${question}`
        );

        recordId = questionRecord.id;

        await pb.collection('questions').update(recordId, { is_active: isActive });

        if (broadcast) sendDirective('question_toggle', round !== null ? round.toString() : null, question !== null ? question.toString() : null, isActive);

      }

      if (type === 'impossible') {
        const impossibleRecord = await pb.collection('impossible_rounds').getFirstListItem(
          `edition_id="${editionId}" && impossible_number=${round}`
        );

        recordId = impossibleRecord.id;

        await pb.collection('impossible_rounds').update(recordId, { is_active: isActive });

        if (broadcast) sendDirective('question_toggle', "impossible", `${round?.toString()}`, isActive);

      }

      if (type === 'wager') {
        const wagerRecord = await pb.collection('wager_rounds').getFirstListItem(
          `edition_id="${editionId}"`,
        );

        if (!wagerRecord) {
          throw new Error('Wager record not found.');
        }
        recordId = wagerRecord.id;
        await pb.collection('wager_rounds').update(recordId, { is_active: isActive });
        if (broadcast) sendDirective('question_toggle', null, null, isActive);
      }

      if (type === 'final') {
        const finalRecord = await pb.collection('final_rounds').getFirstListItem(
          `edition_id="${editionId}"`,
        );

        if (!finalRecord) {
          throw new Error('Final record not found.');
        }
        recordId = finalRecord.id;
        await pb.collection('final_rounds').update(recordId, { is_active: isActive });
        if (broadcast) sendDirective('question_toggle', null, null, isActive);
      }

      if (type === 'tiebreaker') {
        const tiebreakerList = await pb.collection('tiebreakers').getFullList();

        if (tiebreakerList.length === 0) {
          console.warn('No tiebreaker records found.');
          return;
        }

        if (isActive) {
          // Deactivate all first (to be clean)
          await Promise.all(tiebreakerList.map(t => pb.collection('tiebreakers').update(t.id, { is_active: false })));

          // Pick a random one
          const randomIndex = Math.floor(Math.random() * tiebreakerList.length);
          const randomTiebreaker = tiebreakerList[randomIndex];

          console.log(`Activating random tiebreaker: ${randomTiebreaker.id} (Index: ${randomIndex})`);

          await pb.collection('tiebreakers').update(randomTiebreaker.id, { is_active: true });
        } else {
          // Deactivate all
          console.log("Deactivating all tiebreakers.");
          await Promise.all(tiebreakerList.map(t => pb.collection('tiebreakers').update(t.id, { is_active: false })));
        }

        if (broadcast) sendDirective('question_toggle', null, null, isActive);
      }

    } catch (error) {
      console.error(`Failed to update ${type}:`, error);
      toast.error(`Failed to toggle ${type}. It may not be in sync — try again.`);
    }
  };

  useEffect(() => {

    const initializeApp = async () => {
      if (!pb.authStore.isValid) {
        console.error("Not authenticated with Pocketbase.");
        return;
      }

      const authData = localStorage.getItem("pocketbase_auth");

      if (!authData) {
        console.error("No auth data found.");
        setIsAdmin(false);
        return;
      }

      const parsedAuth = JSON.parse(authData);
      if (!parsedAuth.record.is_admin) {
        setIsAdmin(false);
        return;
      }

      setIsAdmin(true);

      if (editionId) {
        //initializeApp();
      }
    };

    if (editionId) {
      initializeApp();
      fetchQuestions();
    }
  }, [editionId]);

  useEffect(() => {
    const pusher = getPusherClient(); // Call the function to get the Pusher instance
    const channel = pusher.subscribe("directives");

    channel.bind("evt::direct", (data: { type: string; round: string; question: string }) => {
      const { type, round, question } = data;

      // Navigation updates the highlighted "current" button (green) and switches
      // the Questions sub-tab so that button is visible. It does NOT touch the
      // Active switch (activeItem) — activation stays a deliberate manual toggle.
      if (type === 'round_jump' && round) {
        setActiveButton(`round_${round}`);
        setQuestionSection(`Round ${round}`);
      } else if (type === 'question_jump' && round && question) {
        setActiveButton(`question_jump_${round}${question}`);
        setQuestionSection(`Round ${round}`);
      } else if (type === 'impossible_jump' && round) {
        setActiveButton(`impossible_jump_${round}`);
        setQuestionSection(`Impossible ${round}`);
      } else if (type === 'wager_jump') {
        setActiveButton('wager');
        setQuestionSection('Wager');
      } else if (type === 'final_jump') {
        setActiveButton('final');
        setQuestionSection('Final');
      } else if (type === 'tiebreaker_jump') {
        setActiveButton('tiebreaker');
        setQuestionSection('Tiebreaker');
      }
    });

    // Once subscribed, ask the presenter to re-announce its current location so
    // the "current" question highlight is restored after an admin page reload.
    channel.bind("pusher:subscription_succeeded", () => {
      sendDirective('request_location', null, null, null);
    });

    return () => {
      console.log("Unsubscribing from Pusher channel");
      channel.unbind("evt::direct"); // Unbind the specific event
      pusher.unsubscribe("directives"); // Unsubscribe from the channel
    };
  }, []);

  return (
    <div className="admin p-4 pb-10 md:p-10">
      {!isAdmin ? (
        <>
          <ShallNotPass />
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3 mb-2 md:flex-row md:w-full md:justify-between md:items-center">
            <h1 className='text-2xl md:text-4xl'><span className="font-linebeam text-3xl md:text-5xl md:mr-3 text-glow-blue-400">NERD TRIVIA 3000</span> Admin - {editionTitle}</h1>
            <Button onPress={() => router.push("/dashboard")} className="w-fit shrink-0">Return to Dashboard</Button>
          </div>
          <Tabs
            aria-label='Admin Tabs'
            destroyInactiveTabPanel={false}
            size='lg'
            variant='bordered'
            classNames={{ tabList: "sticky top-14 mb-4" }}
          >
            <Tab key='navigation' title='Navigation'>
              <SubmissionTracker editionId={editionId} activeButton={activeButton} />
              <div className='md:px-4 pt-0 pb-4 mb-3'>
                <h3 className='text-3xl mb-2'>Rounds</h3>
                <div className="flex flex-wrap gap-4">
                  {/* Round Buttons */}
                  {['1', '2', '3'].map(round => {
                    const identifier = `round_${round}`;
                    return (
                      <Button
                        key={identifier}
                        onPress={() => handleButtonClick(identifier, 'round_jump', round, null, null)}
                        size="md"
                        color={activeButton === identifier ? "success" : undefined} // Add color dynamically
                      >
                        Round {round}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="p-4">
                {/* loop through rounds 1-3, 5 questions per round. Each question has a button as above, and a nextui Switch with the label "Active" */}
                <h3 className='text-3xl mb-2'>Questions</h3>
                <Tabs
                  aria-label="Question Sections"
                  className="mt-2 max-w-full"
                  classNames={{ tabList: "flex-wrap md:flex-nowrap md:overflow-x-auto max-w-full" }}
                  selectedKey={questionSection}
                  onSelectionChange={(k) => setQuestionSection(String(k))}
                >
                  {[
                    { title: 'Round 1', type: 'round', number: 1 },
                    { title: 'Impossible 1', type: 'impossible', number: 1 },
                    { title: 'Round 2', type: 'round', number: 2 },
                    { title: 'Impossible 2', type: 'impossible', number: 2 },
                    { title: 'Round 3', type: 'round', number: 3 },
                    { title: 'Wager', type: 'wager' },
                    { title: 'Final', type: 'final' },
                    { title: 'Tiebreaker', type: 'tiebreaker' },
                  ].map((item) => (
                    <Tab key={item.title} title={item.title}>
                      <div className="flex flex-col gap-4 pt-4">
                        {item.type === 'round' && item.number && (
                          <div className="flex flex-wrap gap-4 md:gap-6">
                            {[...Array(5)].map((_, questionIndex) => {
                              const questionNumber = questionIndex + 1;
                              const key = `switchR${item.number}Q${questionNumber}`;
                              const isCurrent = activeButton === `question_jump_${String(item.number)}${String(questionNumber)}`;
                              return (
                                <div
                                  key={key}
                                  className="flex flex-col gap-2"
                                >
                                  <Button
                                    onPress={() => handleButtonClick(`question_jump_${String(item.number)}${String(questionNumber)}`, 'question_jump', String(item.number), String(questionNumber), null)}
                                    size="md"
                                    color={isCurrent ? "success" : undefined}
                                  >
                                    Question {questionNumber}
                                  </Button>
                                  <Switch
                                    isSelected={isQuestionActive(Number(item.number), questionNumber)}
                                    onValueChange={(value) => handleToggle(key, value)}
                                  >
                                    Active
                                  </Switch>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {item.type === 'impossible' && item.number && (
                          <div className="flex flex-col gap-2">
                            <Button
                              className="w-fit"
                              onPress={() => handleButtonClick(`impossible_jump_${String(item.number)}`, 'impossible_jump', String(item.number), null, null)}
                              color={activeButton === `impossible_jump_${String(item.number)}` ? "success" : undefined}
                              size="md"
                            >
                              Impossible {item.number}
                            </Button>
                            <Switch
                              isSelected={isImpossibleActive(Number(item.number))}
                              onValueChange={(value) =>
                                item.number === 1 ? handleToggle('I1', value) : handleToggle('I2', value)
                              }
                            >
                              Active
                            </Switch>
                          </div>
                        )}
                        {item.type === 'wager' && (
                          <div className="flex flex-col gap-2">
                            <Button
                              className="w-fit"
                              onPress={() => handleButtonClick('wager', 'wager_jump', null, null, null)}
                              size="md"
                              color={activeButton === 'wager' ? "success" : undefined}
                            >
                              Wager
                            </Button>
                            <Switch
                              isSelected={isWagerActive}
                              onValueChange={(value) => handleToggle('wager', value)}
                            >
                              Active
                            </Switch>
                          </div>
                        )}
                        {item.type === 'final' && (
                          <div className="flex flex-col gap-2">
                            <Button
                              className="w-fit"
                              onPress={() => handleButtonClick('final', 'final_jump', null, null, null)}
                              size="md"
                              color={activeButton === 'final' ? "success" : undefined}
                            >
                              Final
                            </Button>
                            <Switch
                              isSelected={isFinalActive}
                              onValueChange={(value) => handleToggle('final', value)}
                            >
                              Active
                            </Switch>
                          </div>
                        )}
                        {item.type === 'tiebreaker' && (
                          <div className="flex flex-col gap-2">
                            <Button
                              className="w-fit"
                              onPress={() => handleButtonClick('tiebreaker', 'tiebreaker_jump', null, null, null)}
                              size="md"
                              color={activeButton === 'tiebreaker' ? "success" : undefined}
                            >
                              Tiebreaker
                            </Button>
                            <Switch
                              isSelected={isTiebreakerActive}
                              onValueChange={(value) => handleToggle('tiebreaker', value)}
                            >
                              Active
                            </Switch>
                          </div>
                        )}
                      </div>
                    </Tab>
                  ))}
                </Tabs>

              </div>
            </Tab>
            <Tab key='scoring' title='Scoring'>
              <div>
                <Scoring />
              </div>
              <div className="score-table">

              </div>
            </Tab>
            <Tab key='miscellany' title='Miscellany'>
              <div className='p-4 pb-10 md:p-10'>
                <h2 className='text-3xl mb-4'>Miscellany</h2>
                <p className="mb-6">Other admin tasks.</p>
                <Button
                  color="danger"
                  size="lg"
                  onPress={async () => {
                    if (confirm("Are you sure you want to FINISH IT? This will clear all team data for this edition.")) {
                      try {
                        // 1. Get winning team
                        const edition = await pb.collection('editions').getOne(editionId!);
                        if (edition.winning_team_id) {
                          // 2. Add 1 to wins
                          const winner = await pb.collection('teams').getOne(edition.winning_team_id);
                          await pb.collection('teams').update(winner.id, {
                            wins: (winner.wins || 0) + 1
                          });
                          console.log(`Incremented wins for ${winner.team_name}`);
                        }

                        // 3. Reset all teams
                        const allTeams = await pb.collection('teams').getFullList({
                          filter: `current_edition = "${editionId}"`
                        });

                        await Promise.all(allTeams.map(team => {
                          return pb.collection('teams').update(team.id, {
                            banthashit_card: false,
                            current_edition: "",
                            wager: "0"
                          });
                        }));

                        alert("IT IS FINISHED.");

                      } catch (error) {
                        console.error("Failed to FINISH IT:", error);
                        alert("Failed to finish it. Check console.");
                      }
                    }
                  }}
                >
                  FINISH IT!
                </Button>
              </div>
            </Tab>
          </Tabs>
        </>
      )}
    </div>
  );

}