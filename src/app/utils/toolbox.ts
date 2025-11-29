// utils/apiUtils.ts
import { signIn } from "next-auth/react"

export const sendMessage = async (type: string | null, message: string | null, team: string | null) => {
  console.log("sendMessage called with:", { type, message, team });

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

    const json = await response.json();
    console.log("Data sent successfully:", json);
    return json; // Return the response JSON for further use if needed
  } catch (error) {
    console.error("Error sending data:", error);
    throw error; // Re-throw the error to handle it in the calling function
  }
};



export const sendDirective = async (type: string, round: string | null, question: string | null, active: boolean | null) => {
  console.log("sendDirective called with:", { type, round, question, active });

  try {
    const response = await fetch('/api/direct', {
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
    console.log("Directive sent successfully:", json);
    return json;
  } catch (error) {
    console.error("Error sending directive:", error);
    throw error;
  }
};
