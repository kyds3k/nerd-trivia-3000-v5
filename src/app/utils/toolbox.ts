// utils/toolbox.ts

import { getPocketbaseClient } from "@/lib/pocketbase";

export const sendMessage = async (type: string | null, message: string | null, team: string | null) => {
  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, message, team }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const sendDirective = async (type: string, round: string | null, question: string | null, active: boolean | null) => {
  try {
    const response = await fetch('/api/direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getPocketbaseClient().authStore.token}`,
      },
      body: JSON.stringify({ type, round, question, active }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending directive:", error);
    throw error;
  }
};
