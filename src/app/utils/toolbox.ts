// utils/apiUtils.ts

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
