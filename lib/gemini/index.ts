import { GoogleGenAI } from "@google/genai";
import { sanitizeTelegramHTML } from "../bot/utils";

// Initialize Gemini client using server-side environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTIONS = {
  table: `You are an expert data formatter for Telegram.
Your task is to receive unstructured data and format it into a clean table using the new Telegram Rich Message API.

CRITICAL RULES:
1. You MUST use <table>, <tr>, <th>, and <td> tags.
2. You can use attributes like <table bordered striped> if appropriate.
3. Do NOT output any markdown code block wrappers (like \`\`\`html). Output raw HTML tags.
4. Extract the most logical columns from the user's unstructured text.

Example format:
<table bordered striped>
  <tr>
    <th>Column 1</th>
    <th>Column 2</th>
  </tr>
  <tr>
    <td>Data</td>
    <td>Value</td>
  </tr>
</table>`,

  list: `You are an expert data formatter for Telegram.
Your task is to receive unstructured notes or text and convert it into a beautiful, organized list using the new Telegram Rich Message API.

CRITICAL RULES:
1. You MUST use structural list tags: <ul>, <ol>, and <li>.
2. Do NOT use markdown code block wrappers (like \`\`\`html).
3. Do not add manual emojis for bullets, rely on the native <li> rendering.
4. Emphasize important keywords using <b> and <i> tags.
5. Ensure a clean hierarchy if the data has nested concepts.
6. Only output the HTML, do not add introductory conversational text.`,

  smart: `You are a smart formatting assistant for Telegram.
Your task is to automatically determine the best way to format the user's unstructured text so it is highly readable and professional on a Telegram chat.

CRITICAL RULES:
1. Use all available Telegram Rich Message HTML tags: <h1> to <h6>, <p>, <hr/>, <blockquote>, <table>, <ul>, <ol>, <li>, <b>, <i>, <u>, <s>, <code>, <pre>, <a>.
2. If the data is highly tabular, use <table> tags.
3. If it's a list, use <ul> or <ol> with <li> tags.
4. Use <h1>, <h2> for main headings, <p> for paragraphs, and <hr/> for separators.
5. Do NOT use markdown wrappers (like \`\`\`html). Only raw HTML tags.
6. Only output the final formatted result, no conversational filler.`
};

export async function formatText(text: string, style: "table" | "list" | "smart"): Promise<string> {
  const systemInstruction = SYSTEM_INSTRUCTIONS[style];
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: text,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature for consistent formatting
      }
    });
    
    // Clean up potential markdown wrappers if the model accidentally includes them
    let output = response.text || "";
    if (output.startsWith("\`\`\`html")) {
      output = output.replace(/^\`\`\`html\n?/, "").replace(/\n?\`\`\`$/, "");
    } else if (output.startsWith("\`\`\`")) {
      output = output.replace(/^\`\`\`[a-z]*\n?/, "").replace(/\n?\`\`\`$/, "");
    }
    
    return sanitizeTelegramHTML(output.trim());
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to format text with Gemini.");
  }
}
