import { useState, useCallback, useEffect } from "react";
import { SpeakButton } from "./SpeakButton";
import { WordDisplay } from "./WordDisplay";
import { GeneratedImage } from "./GeneratedImage";
import "./index.css";

const CANCEL_WORDS = [
  "stop",
  "cancel",
  "abort",
  "quit",
  "exit",
  "nevermind",
  "never mind",
  "forget it",
  "forget",
  "scratch that",
  "scratch",
  "ignore",
  "discard",
  "reset",
  "no",
];

function hasCancelWord(text: string): boolean {
  const lower = text.toLowerCase();
  return CANCEL_WORDS.some((w) => lower.includes(w));
}

type AppPhase = "idle" | "processing" | "reviewing" | "generating" | "result";

interface AppState {
  phase: AppPhase;
  sttText: string;
  imageUrl: string;
  countdown: number;
}

const INITIAL: AppState = {
  phase: "idle",
  sttText: "",
  imageUrl: "",
  countdown: 3,
};

function LoadingDots({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ display: "flex", gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 20,
              height: 20,
              borderRadius: "9999px",
              backgroundColor: i === 1 ? "#FFE066" : "#FF69B4",
              animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <p
        style={{
          fontFamily: '"Fredoka One", system-ui, sans-serif',
          fontSize: 24,
          color: "#FF69B4",
          margin: 0,
          textShadow: "2px 3px 0 #C13B7E",
        }}
      >
        {label}
      </p>
    </div>
  );
}

export function App() {
  const [state, setState] = useState<AppState>(INITIAL);

  const reset = useCallback(() => setState(INITIAL), []);

  // 3-second countdown during reviewing phase → trigger generate
  useEffect(() => {
    if (state.phase !== "reviewing") return;

    const interval = setInterval(() => {
      setState((s) => {
        if (s.phase !== "reviewing") return s;
        const next = s.countdown - 1;
        if (next <= 0) return { ...s, phase: "generating", countdown: 0 };
        return { ...s, countdown: next };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.phase]);

  // Fire the generate request when phase transitions to "generating"
  useEffect(() => {
    if (state.phase !== "generating" || !state.sttText) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: state.sttText }),
        });
        const data = (await res.json()) as { imageUrl?: string; error?: string };
        if (cancelled) return;
        if (!data.imageUrl) {
          reset();
          return;
        }
        setState((s) => ({ ...s, phase: "result", imageUrl: data.imageUrl! }));
      } catch {
        if (!cancelled) reset();
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  const handleAudioCaptured = useCallback(
    async (blob: Blob) => {
      setState((s) => ({ ...s, phase: "processing" }));

      try {
        const formData = new FormData();
        formData.append("audio", blob, blob.type === "audio/wav" ? "audio.wav" : "audio.webm");
        const res = await fetch("/api/stt", { method: "POST", body: formData });
        const data = (await res.json()) as { text?: string; error?: string };

        if (!data.text || data.error) {
          reset();
          return;
        }
        if (hasCancelWord(data.text)) {
          reset();
          return;
        }

        setState((s) => ({ ...s, phase: "reviewing", sttText: data.text!, countdown: 3 }));
      } catch {
        reset();
      }
    },
    [reset],
  );

  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        width: "100%",
      }}
    >
      {/* ── RESULT ── */}
      {state.phase === "result" && <GeneratedImage imageUrl={state.imageUrl} onReset={reset} />}

      {/* ── WORD LYRICS (reviewing phase) ── */}
      {state.phase === "reviewing" && (
        <WordDisplay
          text={state.sttText}
          onComplete={() => {
            /* countdown drives the transition */
          }}
        />
      )}

      {/* ── LOADING ── */}
      {state.phase === "processing" && <LoadingDots label="Listening..." />}
      {state.phase === "generating" && <LoadingDots label="Creating..." />}

      {/* ── SPEAK / CANCEL BUTTON ── */}
      {(state.phase === "idle" || state.phase === "reviewing") && (
        <SpeakButton
          mode={state.phase === "reviewing" ? "cancel" : "speak"}
          countdown={state.countdown}
          onAudioCaptured={handleAudioCaptured}
          onCancel={reset}
        />
      )}
    </div>
  );
}

export default App;
