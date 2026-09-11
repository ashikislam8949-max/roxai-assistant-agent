"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { FormEvent, useState } from "react";

const starters = [
  "Explain how to investigate a slow API route.",
  "Draft a plan to add authentication.",
  "What should I check before a production deployment?",
] as const;

export function AssistantChat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = input.trim();
    if (!text || isLoading) {
      return;
    }

    sendMessage({ text });
    setInput("");
  }

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-6 xl:px-8">
      <div className="grid w-full gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <aside className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
          <p className="label-mono text-primary">Assistant workspace</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
            Ask RoxAI about an engineering task.
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Keep the dashboard flow intact while switching into a focused chat view
            for investigations, rollout notes, and change proposals.
          </p>

          <div className="mt-8 rounded-[24px] bg-background p-5">
            <p className="text-sm font-medium text-secondary">Quick prompts</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {starters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => setInput(starter)}
                  className="rounded-2xl border border-border bg-surface px-3 py-2 text-left text-sm text-secondary transition hover:bg-muted hover:text-foreground"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex min-h-[640px] flex-col rounded-[28px] border border-border bg-surface p-6 shadow-sm">
          <div className="border-b border-border pb-5">
            <p className="text-sm font-medium text-secondary">Live session</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Responses stream through the configured Vercel AI Gateway model.
            </p>
          </div>

          <div className="flex flex-1 flex-col gap-5 py-6">
            {messages.length === 0 ? (
              <div className="my-auto rounded-[24px] bg-background p-6">
                <p className="text-lg font-semibold text-foreground">
                  What are you working on?
                </p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Start with a system question, a deployment issue, or a planned change.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={`max-w-3xl rounded-[24px] border px-5 py-4 ${
                    message.role === "user"
                    ? "ml-auto border-primary/25 bg-primary/[0.06]"
                      : "border-border bg-background"
                  }`}
                >
                  <p className="label-mono mb-3">
                    {message.role === "user" ? "You" : "RoxAI"}
                  </p>
                  <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                    {message.parts.map((part, index) =>
                      part.type === "text" ? (
                        <p key={index} className={index > 0 ? "mt-4" : undefined}>
                          {part.text}
                        </p>
                      ) : null,
                    )}
                  </div>
                </article>
              ))
            )}

            {isLoading ? (
              <p className="label-mono animate-pulse text-primary">RoxAI is thinking</p>
            ) : null}

            {error ? (
              <p
                role="alert"
                className="rounded-2xl border border-destructive/30 bg-destructive/[0.08] p-4 text-sm text-destructive"
              >
                {error.message ||
                  "The assistant request failed. Verify AI_GATEWAY_API_KEY and try again."}
              </p>
            ) : null}
          </div>

          <form
            onSubmit={submit}
            className="rounded-[24px] border border-border bg-background p-4 shadow-sm"
          >
            <label htmlFor="message" className="sr-only">
              Message RoxAI
            </label>
            <textarea
              id="message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Ask RoxAI about your software…"
              rows={4}
              className="w-full resize-none bg-transparent text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
            />
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-muted-foreground">
                Enter to send · Shift+Enter for newline
              </span>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(140,87,255,0.24)] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
