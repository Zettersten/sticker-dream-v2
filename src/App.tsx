import { useState, useCallback, useEffect } from "react";
import { SpeakButton } from "./SpeakButton";
import { WordDisplay } from "./WordDisplay";
import { GeneratedImage } from "./GeneratedImage";
import { Gallery } from "./Gallery";
import { usePrinter } from "./usePrinter";
import { useGenerationStore } from "./useGenerationStore";
import "./index.css";

// Single-word cancel terms — matched as whole words only
// (substring matching would false-positive: "no" → "dino[no]saur", etc.)
const CANCEL_WORDS_EXACT = ["stop", "cancel", "abort", "quit", "exit", "reset", "no"];

// Multi-word cancel phrases — matched as substring of the full text
const CANCEL_PHRASES = ["never mind", "nevermind", "forget it", "scratch that", "start over"];

function hasCancelWord(text: string): boolean {
  const lower = text.toLowerCase();
  const tokens = lower.split(/\W+/).filter(Boolean);
  return (
    CANCEL_WORDS_EXACT.some((w) => tokens.includes(w)) ||
    CANCEL_PHRASES.some((p) => lower.includes(p))
  );
}

// animating: lyrics playing, no button shown
// reviewing: lyrics done, cancel countdown active
type AppPhase = "idle" | "processing" | "animating" | "reviewing" | "generating" | "result";

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
  const [showGallery, setShowGallery] = useState(false);
  const { status: printerStatus, isConnected, requestPrinter, print } = usePrinter();
  const { generations, saveGeneration } = useGenerationStore();

  const reset = useCallback(() => setState(INITIAL), []);

  // 3-second countdown — only starts once lyrics finish (reviewing phase)
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
        const url = data.imageUrl!;
        // Save to local IndexedDB before showing
        saveGeneration(url, state.sttText).catch(() => {});
        setState((s) => ({ ...s, phase: "result", imageUrl: url }));
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

        // Go to animating first — countdown starts only after lyrics complete
        setState((s) => ({ ...s, phase: "animating", sttText: data.text!, countdown: 3 }));
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
      {/* ── GALLERY OVERLAY ── */}
      {showGallery && (
        <Gallery
          generations={generations}
          isConnected={isConnected}
          onClose={() => setShowGallery(false)}
          onPrint={print}
        />
      )}

      {/* ── RESULT ── */}
      {state.phase === "result" && (
        <GeneratedImage
          imageUrl={state.imageUrl}
          printerConnected={isConnected}
          printerStatus={printerStatus}
          onPrint={print}
          onReset={reset}
        />
      )}

      {/* ── WORD LYRICS (animating phase only — no button, no chrome) ── */}
      {state.phase === "animating" && (
        <WordDisplay
          text={state.sttText}
          onComplete={() => setState((s) => ({ ...s, phase: "reviewing", countdown: 3 }))}
        />
      )}

      {/* ── LOADING ── */}
      {state.phase === "processing" && <LoadingDots label="Listening..." />}
      {state.phase === "generating" && <LoadingDots label="Creating..." />}

      {/* ── SPEAK / CANCEL BUTTON (idle + reviewing only) ── */}
      {state.phase === "idle" && (
        <SpeakButton
          mode="speak"
          countdown={3}
          onAudioCaptured={handleAudioCaptured}
          onCancel={reset}
        />
      )}
      {state.phase === "reviewing" && (
        <SpeakButton
          mode="cancel"
          countdown={state.countdown}
          onAudioCaptured={handleAudioCaptured}
          onCancel={reset}
        />
      )}

      {/* ── IDLE CHROME: printer badge + gallery button ── */}
      {state.phase === "idle" && (
        <>
          {/* Printer badge — top right — connect early before generation */}
          <button
            onClick={!isConnected ? requestPrinter : undefined}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              zIndex: 5,
              backgroundColor: isConnected ? "#FF69B4" : "#FFFFFF",
              border: "4px solid #FFFFFF",
              borderRadius: 9999,
              padding: "10px 18px",
              fontFamily: '"Fredoka One", system-ui, sans-serif',
              fontSize: 15,
              color: isConnected ? "#FFFFFF" : "#C13B7E",
              cursor: isConnected ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
              boxShadow: isConnected ? "0 5px 0 #C13B7E" : "0 5px 0 #FFCC00, 0 8px 0 #C13B7E",
            }}
          >
            🖸️ {isConnected ? "Ready" : "Connect printer"}
          </button>

          {/* Gallery button — bottom left — never overlaps the top-right printer badge */}
          {generations.length > 0 && (
            <button
              onClick={() => setShowGallery(true)}
              style={{
                position: "absolute",
                bottom: 28,
                left: 20,
                zIndex: 5,
                backgroundColor: "#FFE066",
                border: "4px solid #FFFFFF",
                borderRadius: 9999,
                padding: "10px 18px",
                fontFamily: '"Fredoka One", system-ui, sans-serif',
                fontSize: 15,
                color: "#C13B7E",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
                boxShadow: "0 5px 0 #FFCC00, 0 8px 0 #C13B7E",
              }}
            >
              🖼️ {generations.length} sticker{generations.length !== 1 ? "s" : ""}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default App;
