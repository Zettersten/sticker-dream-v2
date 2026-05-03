import { useEffect, useState, useRef } from "react";
import { prepareWithSegments, measureNaturalWidth } from "@chenglou/pretext";

interface WordDisplayProps {
  text: string;
  onComplete: () => void;
}

const BASE_FONT_SIZE = 96;
const MAX_WIDTH_RATIO = 0.8;

function getScaledFontSize(word: string): number {
  const maxWidth = window.innerWidth * MAX_WIDTH_RATIO;
  try {
    const prepared = prepareWithSegments(
      word,
      `${BASE_FONT_SIZE}px "Fredoka One", system-ui, sans-serif`,
    );
    const naturalWidth = measureNaturalWidth(prepared);
    if (naturalWidth <= maxWidth) return BASE_FONT_SIZE;
    return Math.max(24, Math.floor(BASE_FONT_SIZE * (maxWidth / naturalWidth)));
  } catch {
    return BASE_FONT_SIZE;
  }
}

export function WordDisplay({ text, onComplete }: WordDisplayProps) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const [wordIndex, setWordIndex] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(0.75);
  const onCompleteRef = useRef(onComplete);
  // Sync ref after every render so timers always call the latest callback
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    if (words.length === 0) {
      onCompleteRef.current();
      return;
    }

    // Fade in
    const t1 = setTimeout(() => {
      setOpacity(1);
      setScale(1);
    }, 40);

    // Begin fade out
    const t2 = setTimeout(() => {
      setOpacity(0);
      setScale(1.15);
    }, 40 + 700);

    // Advance to next word
    const t3 = setTimeout(
      () => {
        const next = wordIndex + 1;
        if (next >= words.length) {
          onCompleteRef.current();
        } else {
          setOpacity(0);
          setScale(0.75);
          setWordIndex(next);
        }
      },
      40 + 700 + 260,
    );

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [wordIndex, words.length]);

  if (words.length === 0) return null;

  const currentWord = words[wordIndex] ?? "";
  const fontSize = getScaledFontSize(currentWord);

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
      }}
    >
      <span
        style={{
          fontFamily: '"Fredoka One", system-ui, sans-serif',
          fontSize,
          color: "#FFFFFF",
          textShadow: "4px 6px 0 #C13B7E",
          opacity,
          transform: `scale(${scale})`,
          transition: "opacity 260ms ease, transform 260ms ease",
          lineHeight: 1,
          userSelect: "none",
          WebkitUserSelect: "none",
          whiteSpace: "nowrap",
          display: "block",
          padding: "0 16px",
        }}
      >
        {currentWord}
      </span>
    </div>
  );
}
