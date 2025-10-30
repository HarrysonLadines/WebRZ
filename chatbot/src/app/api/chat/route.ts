import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

const messageSchema = z.object({
  message: z.string().min(1).max(500),
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message } = messageSchema.parse(body);

    const openai = createOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY!,
      baseURL: process.env.OPENROUTER_BASE_URL!,
    });

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        { role: "system", content: "Eres un asistente útil y seguro." },
        { role: "user", content: DOMPurify.sanitize(message) },
      ],
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("Error en /api/chat:", err);
    return new Response(
      JSON.stringify({ error: "Error procesando la solicitud." }),
      { status: 500 }
    );
  }
}


