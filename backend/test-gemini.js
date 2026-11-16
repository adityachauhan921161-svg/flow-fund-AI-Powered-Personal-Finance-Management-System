
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    timeout: 30000,
  },
});

async function testGemini() {
  try {
    console.log("Testing Gemini 3.5 Flash Lite...");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: "Say hello in one short sentence.",
      config: {
        maxOutputTokens: 100,
      },
    });

    console.log("SUCCESS!");
    console.log("Gemini Response:", response.text);
  } catch (error) {
    console.error("Gemini Test Failed!");
    console.error("Status:", error.status);
    console.error("Message:", error.message);
  }
}

testGemini();
