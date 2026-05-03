import { useEffect, useState, useMemo, useRef } from "react";
import { prepareWithSegments, measureNaturalWidth } from "@chenglou/pretext";

interface WordDisplayProps {
  text: string;
  onComplete: () => void;
}

const BASE_FONT_SIZE = 72;
const MAX_WIDTH_RATIO = 0.85;
// Timing (ms)
const WORD_STEP_MS = 300; // delay between each word appearing
const PHRASE_HOLD_MS = 650; // pause after all words visible
const PHRASE_FADE_MS = 280; // fade-out duration

/**
 * Break STT text into logical display phrases:
 * - Respect sentence boundaries (.!?)
 * - Respect clause boundaries (,;)
 * - Max ~5 words per phrase; longer clauses are split evenly in half
 */
function splitIntoPhrases(text: string): string[] {
  const normalized = text.trim().replace(/\s+/g, " ");

  // Split into sentences first
  const sentences = normalized
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const phrases: string[] = [];

  for (const sentence of sentences) {
    // Then split on commas / semicolons
    const clauses = sentence
      .split(/[,;]+/)
      .map((c) => c.trim())
      .filter(Boolean);

    for (const clause of clauses) {
      const words = clause.split(/\s+/).filter(Boolean);
      if (words.length <= 5) {
        phrases.push(clause);
      } else if (words.length <= 8) {
        // Split roughly in half at a natural-sounding midpoint
        const mid = Math.ceil(words.length / 2);
        phrases.push(words.slice(0, mid).join(" "));
        phrases.push(words.slice(mid).join(" "));
      } else {
        // Chunk every 4 words
        for (let i = 0; i < words.length; i += 4) {
          phrases.push(words.slice(i, i + 4).join(" "));
        }
      }
    }
  }

  return phrases.length > 0 ? phrases : [normalized];
}

function getScaledFontSize(phrase: string): number {
  const maxWidth = window.innerWidth * MAX_WIDTH_RATIO;
  try {
    const prepared = prepareWithSegments(
      phrase,
      `${BASE_FONT_SIZE}px "Fredoka One", system-ui, sans-serif`,
    );
    const naturalWidth = measureNaturalWidth(prepared);
    if (naturalWidth <= maxWidth) return BASE_FONT_SIZE;
    return Math.max(20, Math.floor(BASE_FONT_SIZE * (maxWidth / naturalWidth)));
  } catch {
    return BASE_FONT_SIZE;
  }
}

// ---- PhraseAnimation -------------------------------------------------------
// Mounted fresh for every phrase via key={phraseIndex}.
// Initial state is always visibleCount=0, opacity=1 — no synchronous setState
// inside effects needed, which satisfies react-hooks/set-state-in-effect.

interface PhraseAnimationProps {
  phrase: string;
  onDone: () => void;
}

function PhraseAnimation({ phrase, onDone }: PhraseAnimationProps) {
  const words = useMemo(() => phrase.split(/\s+/).filter(Boolean), [phrase]);
  const fontSize = useMemo(() => getScaledFontSize(phrase), [phrase]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [containerOpacity, setContainerOpacity] = useState(1);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  // Runs once on mount — no deps needed since this component is re-keyed per phrase
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 0; i < words.length; i++) {
      timers.push(setTimeout(() => setVisibleCount(i + 1), 80 + i * WORD_STEP_MS));
    }

    const fadeAt = 80 + words.length * WORD_STEP_MS + PHRASE_HOLD_MS;
    timers.push(setTimeout(() => setContainerOpacity(0), fadeAt));
    timers.push(setTimeout(() => onDoneRef.current(), fadeAt + PHRASE_FADE_MS));

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        opacity: containerOpacity,
        transition: `opacity ${PHRASE_FADE_MS}ms ease`,
        textAlign: "center",
        lineHeight: 1.2,
      }}
    >
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            fontFamily: '"Fredoka One", system-ui, sans-serif',
            fontSize,
            color: "#FFFFFF",
            textShadow: "4px 6px 0 #C13B7E",
            userSelect: "none",
            WebkitUserSelect: "none",
            display: "inline-block",
            marginRight: i < words.length - 1 ? "0.3em" : 0,
            opacity: i < visibleCount ? 1 : 0,
            transform: i < visibleCount ? "translateY(0) scale(1)" : "translateY(12px) scale(0.85)",
            transition: "opacity 200ms ease, transform 200ms ease",
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}

// ---- WordDisplay -----------------------------------------------------------

export function WordDisplay({ text, onComplete }: WordDisplayProps) {
  const phrases = useMemo(() => splitIntoPhrases(text), [text]);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  if (phrases.length === 0) return null;

  const handlePhrasesDone = () => {
    const next = phraseIndex + 1;
    if (next >= phrases.length) {
      onCompleteRef.current();
    } else {
      setPhraseIndex(next);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        pointerEvents: "none",
        padding: "0 32px",
      }}
    >
      {/* key re-mounts PhraseAnimation fresh for each phrase */}
      <PhraseAnimation
        key={phraseIndex}
        phrase={phrases[phraseIndex] ?? ""}
        onDone={handlePhrasesDone}
      />
    </div>
  );
}
