"use client";

import { useState } from "react";

export function SpeakButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  function toggleSpeech() {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setUnsupported(true);
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="mt-3 flex items-center gap-3">
      <button
        type="button"
        onClick={toggleSpeech}
        aria-label={speaking ? "Stop speaking response" : "Read response aloud"}
        className="text-xs text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
      >
        {speaking ? "Stop speaking" : "Read aloud"}
      </button>
      {unsupported ? (
        <span role="status" className="text-xs text-muted-foreground">
          Speech is not supported by this browser.
        </span>
      ) : null}
    </div>
  );
}
