import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { NoObjectGeneratedError, Output, generateText, stepCountIs } from "ai";
import { z } from "zod";

export const maxDuration = 30;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  const { prompt } = await req.json();
  try {
    const research = await generateText({
      model: google("gemini-2.5-flash"),
      tools: { google_search: google.tools.googleSearch({}) },
      system: `Briefly find factual evidence to resolve this market question.`,
      stopWhen: stepCountIs(2),
      prompt: `Market question:${prompt}`,
    });

    const { output } = await generateText({
      model: google("gemini-2.5-flash"),
      output: Output.object({
        schema: z.object({
          result: z.enum(["YES", "NO", "INCONCLUSIVE"]),
          confidence: z.number().int().min(0).max(10_000, "confidence must be between 0 and 10000 inclusive"),
        }),
      }),
      system: `Resolve the market based ONLY on the provided research.`,
      prompt: `Research: ${research.text}\n\nQuestion: ${prompt}`,
    });

    return Response.json({ output });
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      console.log("NoObjectGeneratedError");
      console.log("Cause:", error.cause);
      console.log("Text:", error.text);
      console.log("Response:", error.response);
      console.log("Usage:", error.usage);
      return Response.json({ error: error.message }, { status: 500 });
    }
    console.log(error);
    return Response.json({ error }, { status: 500 });
  }
}
