import {
  streamText,
  UIMessage,
  convertToModelMessages,
  InferUITools,
  UIDataTypes,
  stepCountIs, 
} from "ai";
import { openai } from "@ai-sdk/openai";
import { tools } from "@/lib/tools";


export type ChatTools = InferUITools<typeof tools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: ChatMessage[] } = await req.json();

    const result = streamText({
      model: openai("gpt-3.5-turbo"),
      messages: convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(2),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error streaming chat completion:", error);
    return new Response("Failed to stream chat completion", { status: 500 });
  }
}
