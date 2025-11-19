import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";
import { buildTools } from "../tools";
import { convertToModelMessages } from "ai";

// DOMPurify
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

// -----------------------------
// Validación BASE DEL BODY
// -----------------------------
const bodySchema = z.object({
  message: z.string()
    .min(1, "El mensaje no puede estar vacío.")
    .max(500, "El mensaje no puede superar 500 caracteres."),
  usuarioId: z.number()
    .int("usuarioId debe ser un entero.")
    .positive("usuarioId debe ser mayor a 0.")
});

// -----------------------------
// Validación interna de ToolCall
// -----------------------------
const toolCallSchema = z.object({
  toolName: z.string().min(1),
  input: z.any(),
  toolCallId: z.string().min(1)
});

// -----------------------------
// Validación extra para seguridad
// -----------------------------
const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(10, "OPENROUTER_API_KEY inválida."),
  OPENROUTER_BASE_URL: z.string().url("OPENROUTER_BASE_URL debe ser una URL válida.")
});

envSchema.parse(process.env);

// TIPOS
type Message = any;
type ToolCall = z.infer<typeof toolCallSchema>;

export const runtime = "nodejs";

// ---------------------------------------
//                 POST
// ---------------------------------------

export async function POST(req: Request) {
  try {
    // -----------------------------
    // 1) Validar encabezados mínimos
    // -----------------------------
    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "El request debe ser JSON." }),
        { status: 400 }
      );
    }

    // -----------------------------
    // 2) Validar body con Zod (FULL)
    // -----------------------------
    const json = await req.json().catch(() => {
      throw new Error("JSON inválido.");
    });

    const parsedBody = bodySchema.safeParse(json);
    if (!parsedBody.success) {
      return new Response(
        JSON.stringify({
          error: "Body inválido.",
          details: parsedBody.error.issues
        }),
        { status: 400 }
      );
    }

    const { message, usuarioId } = parsedBody.data;

    // -----------------------------
    // 3) Instanciar herramientas
    // -----------------------------
    const tools = buildTools(usuarioId);

    if (!tools || typeof tools !== "object") {
      throw new Error("Error interno: no se pudo construir el conjunto de herramientas.");
    }

    // -----------------------------
    // 4) Validar API Client
    // -----------------------------
    const openai = createOpenAI({
      apiKey: process.env.OPENROUTER_API_KEY!,
      baseURL: process.env.OPENROUTER_BASE_URL!
    });

    // -----------------------------
    // 5) Inicializar historial
    // -----------------------------
    const sanitizedMessage = DOMPurify.sanitize(message);

    let currentMessages: Message[] = [
      {
        role: "system",
        content:
          "Eres un asistente útil y seguro. Utiliza tus herramientas de libros para responder preguntas relacionadas con literatura."
      },
      {
        role: "user",
        content: sanitizedMessage
      }
    ];

    // -----------------------------
    // 6) Primera llamada al LLM
    // -----------------------------
    const firstResponse = await generateText({
      model: openai("gpt-4o-mini"),
      messages: currentMessages,
      tools,
      maxRetries: 5
    });

    // -----------------------------
    // 7) Si NO hay toolCalls → devolver respuesta normal
    // -----------------------------
    if (!firstResponse.toolCalls || firstResponse.toolCalls.length === 0) {
      return new Response(firstResponse.text, {
        headers: { "Content-Type": "text/plain" }
      });
    }

    console.log("\n--- Tool Call Detectada ---\n");

    // -----------------------------
    // 8) Validación fuerte de toolCalls
    // -----------------------------
    const toolCalls = firstResponse.toolCalls
      .map((c: any) => toolCallSchema.safeParse(c))
      .filter(r => r.success)
      .map(r => (r as any).data as ToolCall);

    if (toolCalls.length === 0) {
      throw new Error("El modelo devolvió toolCalls pero ninguna pasó validación.");
    }

    currentMessages.push({
      role: "assistant",
      toolCalls,
      content: ""
    });

    
    // -----------------------------
    // 9) Ejecutar herramientas con validación
    // -----------------------------
    for (const call of toolCalls) {
      const { toolName, input, toolCallId } = call;

      if (!(toolName in tools)) {
        console.warn("❌ Tool no registrada:", toolName);
        continue;
      }

      const toolInstance = (tools as any)[toolName];
      if (!toolInstance || typeof toolInstance.execute !== "function") {
        console.warn("❌ Tool inválida (no tiene execute):", toolName);
        continue;
      }

      let output: unknown;

      try {
        output = await toolInstance.execute(input);
      } catch (err) {
        output = { error: "Error interno ejecutando la herramienta." };
        console.error(`❌ Error en tool ${toolName}:`, err);
      }

      const toolMessage: Message = {
  role: "user",
  //toolCallId,
  content: "Interpreta la respuesta de la tool."
};


      currentMessages.push(toolMessage);
    }

    console.log("DEBUG currentMessages =", currentMessages);

    const modelMessages = convertToModelMessages(currentMessages);

    // -----------------------------
    // 10) Segunda llamada al LLM
    // -----------------------------
    const finalResponse = await generateText({
      model: openai("gpt-4o-mini"),
      messages: modelMessages,
      tools,
      maxRetries: 5
    });

    return new Response(finalResponse.text, {
      headers: { "Content-Type": "text/plain" }
    });

  } catch (err) {
    console.error("❌ Error en /api/chat:", err);

    return new Response(
      JSON.stringify({
        error: "Error procesando la solicitud.",
        details: err instanceof Error ? err.message : "Error desconocido"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
