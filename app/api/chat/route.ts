import { convertToModelMessages, createUIMessageStreamResponse, streamText, type UIMessage } from "ai";
import { gateway } from "@ai-sdk/gateway";

export const maxDuration = 30;

const SYSTEM_PROMPT = "You are RoxAI, a concise assistant for software engineering teams. Give practical, accurate answers. Be explicit about uncertainty and ask for code, logs, or deployment context when it is needed.";
const STREAM_ERROR_MESSAGE = "The assistant is temporarily unavailable. Try again shortly.";

export async function POST(request: Request) {
  if (!process.env.AI_GATEWAY_API_KEY) return Response.json({ error: "AI Gateway is not configured. Add AI_GATEWAY_API_KEY to this project's environment variables." }, { status: 503 });
  let body: { messages?: UIMessage[] };
  try { body = await request.json(); } catch { return Response.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  if (!Array.isArray(body.messages) || body.messages.length === 0) return Response.json({ error: "At least one message is required." }, { status: 400 });
  if (body.messages.length > 50) return Response.json({ error: "Conversation exceeds the 50-message limit." }, { status: 400 });
  const textLength = body.messages.reduce((total, message) => total + message.parts.reduce((partTotal, part) => partTotal + (part.type === "text" ? part.text.length : 0), 0), 0);
  if (textLength > 40_000) return Response.json({ error: "Conversation exceeds the 40,000-character limit." }, { status: 400 });
  try {
    const result = streamText({ model: gateway(process.env.AI_MODEL || "openai/gpt-4o-mini"), system: SYSTEM_PROMPT, messages: await convertToModelMessages(body.messages) });
    const stream = result.toUIMessageStream({
      onError(error) {
        console.error("Chat stream failed", error);
        return STREAM_ERROR_MESSAGE;
      },
    });
    const [probeStream, responseStream] = stream.tee();
    const probeReader = probeStream.getReader();
    try {
      const firstChunk = await probeReader.read();
      if (!firstChunk.done && firstChunk.value.type === "error") {
        console.error("Chat request failed", firstChunk.value.errorText);
        return Response.json({ error: STREAM_ERROR_MESSAGE }, { status: 502 });
      }
    } finally {
      void probeReader.cancel().catch(() => {});
    }
    return createUIMessageStreamResponse({ stream: responseStream });
  } catch (error) {
    console.error("Chat request failed", error);
    return Response.json({ error: STREAM_ERROR_MESSAGE }, { status: 502 });
  }
}
