let start = true;

export const getAIMessage = async (userQuery) => {
  if (start) {
    resetHistory();
    start = false;
  }
  try {
    const response = await fetch("http://localhost:5000/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userQuery }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    // Parse response to retrieve answer.
    let jsonResponse = await response.text();
    if (jsonResponse.startsWith("```json")) {
      jsonResponse = jsonResponse.replace(/^```json/, "").replace(/```$/, "").trim();
    }
    jsonResponse= JSON.parse(jsonResponse);
    if (jsonResponse.error) {
      return { role: "assistant", content: "Please retry your last request."};
    }
    const assistantMessage = jsonResponse.Answer || "No response from AI.";

    return { role: "assistant", content: assistantMessage };
  } catch (error) {
    console.error("Error fetching AI response:", error);
    return { role: "assistant", content: "Sorry, I encountered an error processing your request." };
  }
};

export const resetHistory = () => {
  try {
    fetch("http://localhost:5000/reset", {
      method: "POST",
    });
  } catch (error) {
    console.error("Error resetting conversation history:", error);
  }
};