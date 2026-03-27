
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextRequest } from "next/server";

const geminiAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const SYSTEM_PROMPT = `You are an expert coding assistant in a collaborative code editor.
Help with code explanation, debugging, refactoring, and suggestions.
Always use proper markdown code blocks. Be clear and concise.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Try Gemini First
    try {
      const model = geminiAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const history = messages.slice(0, -1).map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({
        history: history.length > 0 ? history : undefined,
      });

      const lastMessage = messages[messages.length - 1].content;

      const result = await chat.sendMessage(lastMessage);
      const responseText = result.response.text();

      return Response.json({
        content: responseText,
        provider: "gemini",
        warning: null
      });
    } 
    catch (error: any) {
      console.warn("Gemini failed, using Groq fallback:", error?.message?.substring(0, 100));

      const warning = error?.status === 429 || 
                      error?.message?.toLowerCase().includes("quota") 
        ? "Gemini limit reached. Switched to Groq." 
        : "Using Groq as fallback.";

      // Groq Fallback
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content || "No response from AI.";

      return Response.json({
        content,
        provider: "groq",
        warning
      });
    }
  } catch (err) {
    console.error("AI Error:", err);
    return Response.json({ 
      error: "AI service is unavailable right now." 
    }, { status: 503 });
  }
}