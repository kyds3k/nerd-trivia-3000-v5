"use client";

import React, { useEffect, useState } from 'react';
import useEffectOnce from "react-use/lib/useEffectOnce";
import { Button, Image, Link, Tabs, Tab, Form, Select, Switch, cn } from '@nextui-org/react';
import { useParams } from "next/navigation";
import Pocketbase from 'pocketbase';
import { getPusherClient } from "@/lib/pusher/client";

interface Message {
  message: string;
  date: string;
}

export default function Admin() {
  type SwitchStatesType = {
    switchR1Q1: boolean;
    switchR1Q2: boolean;
    switchR1Q3: boolean;
    switchR1Q4: boolean;
    switchR1Q5: boolean;
    switchR2Q1: boolean;
    switchR2Q2: boolean;
    switchR2Q3: boolean;
    switchR2Q4: boolean;
    switchR2Q5: boolean;
    switchR3Q1: boolean;
    switchR3Q2: boolean;
    switchR3Q3: boolean;
    switchR3Q4: boolean;
    switchR3Q5: boolean;
  };

  const pb = new Pocketbase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
  const params = useParams();
  const editionId = typeof params?.id === "string" ? params.id : undefined;
  const [editionTitle, setEditionTitle] = useState<string>("");
  // const questions is an array of objects
  const [questions, setQuestions] = useState<any[]>([]);
  const [switchStates, setSwitchStates] = useState<SwitchStatesType>({
    switchR1Q1: false,
    switchR1Q2: false,
    switchR1Q3: false,
    switchR1Q4: false,
    switchR1Q5: false,
    switchR2Q1: false,
    switchR2Q2: false,
    switchR2Q3: false,
    switchR2Q4: false,
    switchR2Q5: false,
    switchR3Q1: false,
    switchR3Q2: false,
    switchR3Q3: false,
    switchR3Q4: false,
    switchR3Q5: false,
  });
  const [switchI1, setSwitchI1] = useState(false);
  const [switchI2, setSwitchI2] = useState(false);
  const [switchWager, setSwitchWager] = useState(false);
  const [switchFinal, setSwitchFinal] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);


  // Handler for toggling a switch
  const handleToggle = (key, value) => {
    console.log('Key:', key);
    console.log('Value:', value);

    // if the key starts with "R", set the switchStates for that key to the value
    if (key.startsWith('switchR')) {
      setSwitchStates((prev) => ({
        ...prev,
        [key]: value,
      }));

      setSwitchStates((prev) => ({
        ...prev,
        [key]: value,
      }));

      // switch all the others to false
      Object.keys(switchStates).forEach((k) => {
        if (k !== key) {
          setSwitchStates((prev) => ({
            ...prev,
            [k]: false,
          }));
        }
      });

      if (value == true) {
        setSwitchI1(false);
        setSwitchI2(false);
        setSwitchWager(false);
        setSwitchFinal(false);
      }

      toggleActive(value, 'question', Number(key[7]), Number(key[9]));
    }

    // if the key starts with "I", set the switchI1 or switchI2 to the value

    if (key.startsWith('I')) {
      console.log('impossible!');
      if (key === 'I1') {
        setSwitchI1(value);
        setSwitchI2(false);
        toggleActive(value, 'impossible', 1, null);
      } else {
        setSwitchI2(value);
        setSwitchI1(false);
        toggleActive(value, 'impossible', 2, null);
      }

      if (value == true) {
        setSwitchStates((prev) => ({
          ...prev,
          switchR1Q1: false,
          switchR1Q2: false,
          switchR1Q3: false,
          switchR1Q4: false,
          switchR1Q5: false,
          switchR2Q1: false,
          switchR2Q2: false,
          switchR2Q3: false,
          switchR2Q4: false,
          switchR2Q5: false,
          switchR3Q1: false,
          switchR3Q2: false,
          switchR3Q3: false,
          switchR3Q4: false,
          switchR3Q5: false,
        }));
      }

      toggleActive(value, 'impossible', Number(key[1]), null);

    }

    // if the key is "wager", set the switchWager to the value
    if (key === 'wager') {
      setSwitchWager(value);

      toggleActive(value, 'wager', null, null);

      if (value == true) {
        setSwitchStates((prev) => ({
          ...prev,
          switchR1Q1: false,
          switchR1Q2: false,
          switchR1Q3: false,
          switchR1Q4: false,
          switchR1Q5: false,
          switchR2Q1: false,
          switchR2Q2: false,
          switchR2Q3: false,
          switchR2Q4: false,
          switchR2Q5: false,
          switchR3Q1: false,
          switchR3Q2: false,
          switchR3Q3: false,
          switchR3Q4: false,
          switchR3Q5: false,
        }));

        setSwitchI1(false);
        setSwitchI2(false);
        setSwitchFinal(false);
      }

    }

    // if the key is "final", set the switchFinal to the value
    if (key === 'final') {
      setSwitchFinal(value);

      console.log('tog tog');

      toggleActive(value, 'final', null, null);

      if (value == true) {
        setSwitchStates((prev) => ({
          ...prev,
          switchR1Q1: false,
          switchR1Q2: false,
          switchR1Q3: false,
          switchR1Q4: false,
          switchR1Q5: false,
          switchR2Q1: false,
          switchR2Q2: false,
          switchR2Q3: false,
          switchR2Q4: false,
          switchR2Q5: false,
          switchR3Q1: false,
          switchR3Q2: false,
          switchR3Q3: false,
          switchR3Q4: false,
          switchR3Q5: false,
        }));

        setSwitchI1(false);
        setSwitchI2(false);
        setSwitchWager(false);

      }

    }


    console.log('Switch toggled:', key, value);

    // Extract round and question from the key
  };

  const fetchQuestions = async () => {
    try {
      pb.autoCancellation(false);
  
      const editionGrab = await pb.collection('editions').getOne(`${editionId}`);
      setEditionTitle(editionGrab.title);
  
      const questionList = await pb.collection('questions').getFullList({
        filter: `edition_id="${editionId}"`,
      });
  
      setQuestions(questionList); // Store the full question list
  
      // Find the question with is_active === true
      const activeQuestion = questionList.find((question) => question.is_active);
  
      if (activeQuestion) {
        const key = `switchR${activeQuestion.round_number}Q${activeQuestion.question_number}`;
        setSwitchStates((prev) => ({
          ...prev,
          [key]: true, // Set the active switch to true
        }));
        return; // Exit early since an active question was found
      }
  
      // If no active question is found, search for the active impossible round
      const impossibleList = await pb.collection('impossible_rounds').getFullList({
        filter: `edition_id="${editionId}"`,
      });
  
      const activeImpossible = impossibleList.find((impossible) => impossible.is_active);
  
      if (activeImpossible) {
        const key = activeImpossible.impossible_number;
        if (key === '1') {
          setSwitchI1(true);
        } else {
          setSwitchI2(true);
        }
        return; // Exit early since an active impossible round was found
      }
  
      // If no impossible round is active, check if a wager round is active
      try {
        const wagerRecord = await pb.collection('wager_rounds').getFirstListItem(
          `edition_id="${editionId}"`
        );
        if (wagerRecord?.is_active) {
          setSwitchWager(true);
          return; // Exit early since a wager round is active
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
          setSwitchFinal(true);
        }
      } catch (error) {
        console.log('No active final round found:', error);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };
  


  const sendDirective = async (type: string | null, round: string | null, question: string | null, active: boolean | null) => {
    console.log("sendDirective called with:", { type, round, question, active });

    try {
      const response = await fetch('/api/direct/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, round, question, active }),
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

  const handleButtonClick = (identifier: string, type: string, round: string | null, question: string | null, active: boolean | null) => {
    // Update active button
    setActiveButton(identifier);
    console.log('setting active button:', identifier);
    console.log('should be:', activeButton);
    // Call sendDirective with appropriate parameters
    sendDirective(type, round, question, active);
  };


  const toggleActive = async (
    isActive: boolean,
    type: 'round' | 'question' | 'impossible' | 'wager' | 'final',
    round: number | null,
    question: number | null
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
        // Find the specific question in the transcript
        const questionList = await pb.collection('questions').getFullList({
          filter: `edition_id="${editionId}"`,
        });

        console.log('Question List:', questionList);
        console.log('Round:', round);
        console.log('Question:', question);

        const questionRecord = questionList.find((item: any) => item.question_number === question && item.round_number === round);

        if (!questionRecord) {
          throw new Error(`Question ${question} in Round ${round} not found.`);
        }
        recordId = questionRecord.id;

        await pb.collection('questions').update(recordId, { is_active: isActive });

        sendDirective('question_toggle', round !== null ? round.toString() : null, question !== null ? question.toString() : null, isActive);

      }

      if (type === 'impossible') {
        console.log('toggling impossible');
        pb.autoCancellation(false);
        const impossibleList = await pb.collection('impossible_rounds').getFullList({
          filter: `edition_id="${editionId}"`,
        });

        const impossibleRecord = impossibleList.find((item: any) => item.impossible_number === round);

        if (!impossibleRecord) {
          throw new Error(`Impossible ${round} not found.`);
        }
        recordId = impossibleRecord.id;

        await pb.collection('impossible_rounds').update(recordId, { is_active: isActive });

        sendDirective('question_toggle', null, null, isActive);

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
        sendDirective('question_toggle', null, null, isActive);
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
        sendDirective('question_toggle', null, null, isActive);
      }

    } catch (error) {
      console.error(`Failed to update ${type}:`, error);
    }
  };

  useEffect(() => {
    if (editionId) {
      fetchQuestions();
    }
  }, [editionId]);


  useEffect(() => {
    const pusher = getPusherClient(); // Call the function to get the Pusher instance
    const channel = pusher.subscribe("directives");

    channel.bind("evt::direct", (data: Message) => {
      console.log("Received event:", data);
      // Handle the message here
    });

    return () => {
      console.log("Unsubscribing from Pusher channel");
      channel.unbind("evt::direct"); // Unbind the specific event
      pusher.unsubscribe("directives"); // Unsubscribe from the channel
    };
  }, []);

  return (
    <div className="admin p-4 md:p-10">
      <h1 className='text-4xl mb-4'>Admin - {editionTitle}</h1>
      <Tabs
        aria-label='Admin Tabs'
        destroyInactiveTabPanel={true}
        size='lg'
        variant='bordered'
        classNames={{ tabList: "sticky top-14" }}
      >
        <Tab key='navigation' title='Navigation'>
          <div className='p-4 md:p-4 mb-3'>
            <h3 className='text-2xl mb-2'>Rounds</h3>
            <div className="flex gap-4">
              {/* Round Buttons */}
              {['1', '2', '3'].map(round => {
                const identifier = `round_${round}`;
                return (
                  <Button
                    key={identifier}
                    onPress={() => handleButtonClick(identifier, 'round_jump', round, null, null)}
                    size="sm"
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
            <h3 className='text-2xl mb-2'>Questions</h3>
            <div className="flex flex-col gap-6">
              {[
                { type: 'round', number: 1, order: 1 },
                { type: 'impossible', number: 1, order: 2 },
                { type: 'round', number: 2, order: 3 },
                { type: 'impossible', number: 2, order: 3 },
                { type: 'round', number: 3, order: 5 },
              ].map(({ type, number, order }) => (
                <div key={`${type}-${number}`} className={`flex flex-col gap-4 order-${order}`}>
                  <h4>
                    {type === 'round' ? `Round ${number}` : `Impossible ${number}`}
                  </h4>
                  <div className="flex flex-col gap-6">
                    {type === 'round' ? (
                      <div className="flex gap-6">
                        {[...Array(5)].map((_, questionIndex) => {
                          const questionNumber = questionIndex + 1;
                          const key = `switchR${number}Q${questionNumber}`;
                          return (
                            <div key={key} className="flex flex-col gap-2">
                              <Button
                                // onPress={() =>
                                //   sendDirective('question_jump', String(number), String(questionNumber), null)
                                // }
                                onPress={() => handleButtonClick(`question_jump_${String(number)}${String(questionNumber)}`, 'question_jump', String(number), String(questionNumber), null)}
                                size="sm"
                                color={activeButton === `question_jump_${String(number)}${String(questionNumber)}` ? "success" : undefined}
                              >
                                Question {questionNumber}
                              </Button>
                              <Switch
                                className='overflow-hidden'
                                isSelected={switchStates[key]}
                                onValueChange={(value) => handleToggle(key, value)}
                              >
                                Active
                              </Switch>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button
                          className="w-fit"
                          // onPress={() => sendDirective('impossible_jump', String(number), null, null)}
                          onPress={() => handleButtonClick(`impossible_jump_${String(number)}`, 'impossible_jump', String(number), null, null)}
                          color={activeButton === `impossible_jump_${String(number)}` ? "success" : undefined}
                          size="sm"
                        >
                          Impossible {number}
                        </Button>
                        <Switch
                          isSelected={number === 1 ? switchI1 : switchI2}
                          onValueChange={(value) =>
                            number === 1 ? handleToggle('I1', value) : handleToggle('I2', value)
                          }
                        >
                          Active
                        </Switch>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex flex-col gap-4 order-5">
                <h4>Wager</h4>
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-fit"
                    onPress={() => handleButtonClick('wager', 'wager_jump', null, null, null)}
                    size="sm"
                    color={activeButton === 'wager' ? "success" : undefined}
                  >
                    Wager
                  </Button>
                  <Switch
                    isSelected={switchWager}
                    onValueChange={(value) => handleToggle('wager', value)}
                  >
                    Active
                  </Switch>
                </div>
              </div>
              <div className="flex flex-col gap-4 order-6">
                <h4>Final</h4>
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-fit"
                    onPress={() => handleButtonClick('final', 'final_jump', null, null, null)}
                    size="sm"
                    color={activeButton === 'final' ? "success" : undefined}
                  >
                    Final
                  </Button>
                  <Switch
                    isSelected={switchFinal}
                    onValueChange={(value) => handleToggle('final', value)}
                  >
                    Active
                  </Switch>
                </div>
              </div>
            </div>

          </div>
        </Tab>
        <Tab key='scoring' title='Scoring'>
          <div className='p-4 md:p-10'>
            <h2 className='text-2xl'>Scoring</h2>
            <p>Update scores and stats.</p>
          </div>
        </Tab>
        <Tab key='miscellany' title='Miscellany'>
          <div className='p-4 md:p-10'>
            <h2 className='text-2xl'>Miscellany</h2>
            <p>Other admin tasks.</p>
          </div>
        </Tab>
      </Tabs>
    </div>
  );

}