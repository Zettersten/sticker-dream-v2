import { useRef, useState, useCallback, useEffect } from "react";

export type SpeakButtonMode = "speak" | "cancel";

interface SpeakButtonProps {
  mode: SpeakButtonMode;
  countdown?: number; // 3 → 0
  onAudioCaptured: (blob: Blob) => void;
  onCancel: () => void;
  onRecordingStart?: () => void;
}

const MIN_RECORD_MS = 4000;
const BUTTON_SIZE = 180;
const RING_RADIUS = 96;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function getMimeType(): string {
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"]) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

export function SpeakButton({
  mode,
  countdown = 3,
  onAudioCaptured,
  onCancel,
  onRecordingStart,
}: SpeakButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);

  // Release recording if pointer leaves window
  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    const elapsed = performance.now() - startTimeRef.current;

    recorder.onstop = () => {
      const mimeType = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      recorder.stream.getTracks().forEach((t) => t.stop());
      recorderRef.current = null;
      if (elapsed >= MIN_RECORD_MS) {
        onAudioCaptured(blob);
      }
      // silently discard if too short
    };

    recorder.stop();
    setIsRecording(false);
  }, [onAudioCaptured]);

  useEffect(() => {
    window.addEventListener("pointerup", stopRecording);
    window.addEventListener("pointercancel", stopRecording);
    return () => {
      window.removeEventListener("pointerup", stopRecording);
      window.removeEventListener("pointercancel", stopRecording);
    };
  }, [stopRecording]);

  const handlePointerDown = useCallback(
    async (e: React.PointerEvent) => {
      e.preventDefault();
      if (mode !== "speak" || isRecording) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = getMimeType();
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

        chunksRef.current = [];
        recorder.ondataavailable = (ev) => {
          if (ev.data.size > 0) chunksRef.current.push(ev.data);
        };

        recorderRef.current = recorder;
        startTimeRef.current = performance.now();
        recorder.start(100);
        setIsRecording(true);
        onRecordingStart?.();
      } catch {
        // Microphone permission denied — silently ignore
      }
    },
    [mode, isRecording, onRecordingStart],
  );

  // Countdown ring progress (1.0 = full, 0.0 = empty)
  const ringProgress = Math.max(0, Math.min(1, countdown / 3));
  const ringOffset = RING_CIRCUMFERENCE * (1 - ringProgress);

  if (mode === "cancel") {
    return (
      <div style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
        {/* Countdown SVG ring */}
        <svg
          width={BUTTON_SIZE + 24}
          height={BUTTON_SIZE + 24}
          style={{ position: "absolute", top: -12, left: -12, pointerEvents: "none" }}
          viewBox={`0 0 ${BUTTON_SIZE + 24} ${BUTTON_SIZE + 24}`}
        >
          <circle
            cx={(BUTTON_SIZE + 24) / 2}
            cy={(BUTTON_SIZE + 24) / 2}
            r={RING_RADIUS}
            fill="none"
            stroke="rgba(255,224,102,0.25)"
            strokeWidth="8"
          />
          <circle
            cx={(BUTTON_SIZE + 24) / 2}
            cy={(BUTTON_SIZE + 24) / 2}
            r={RING_RADIUS}
            fill="none"
            stroke="#FFE066"
            strokeWidth="8"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={ringOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${(BUTTON_SIZE + 24) / 2} ${(BUTTON_SIZE + 24) / 2})`}
            style={{ transition: "stroke-dashoffset 0.9s linear" }}
          />
        </svg>

        <button
          onClick={onCancel}
          style={{
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            borderRadius: "9999px",
            border: "4px solid #FFFFFF",
            backgroundColor: "#FFE066",
            color: "#C13B7E",
            fontFamily: '"Fredoka One", system-ui, sans-serif',
            fontSize: 26,
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            boxShadow: "0 8px 0 #FFCC00, 0 12px 0 #C13B7E",
            transition: "transform 80ms, box-shadow 80ms",
            userSelect: "none",
            WebkitUserSelect: "none",
            position: "relative",
            zIndex: 1,
            flexShrink: 0,
          }}
          onPointerDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(6px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 2px 0 #FFCC00, 0 4px 0 #C13B7E";
          }}
          onPointerUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 8px 0 #FFCC00, 0 12px 0 #C13B7E";
          }}
        >
          <span>Cancel?</span>
          <span style={{ fontSize: 36, fontFamily: '"Fredoka One", system-ui', lineHeight: 1 }}>
            {countdown}
          </span>
        </button>
      </div>
    );
  }

  return (
    <button
      onPointerDown={handlePointerDown}
      style={{
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: "9999px",
        border: "4px solid #FFFFFF",
        backgroundColor: isRecording ? "#FF1493" : "#FF69B4",
        color: "#FFFFFF",
        fontFamily: '"Fredoka One", system-ui, sans-serif',
        fontSize: 32,
        letterSpacing: "0.04em",
        cursor: isRecording ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: isRecording
          ? "0 4px 0 #FFCC00, 0 6px 0 #C13B7E"
          : "0 8px 0 #FFCC00, 0 12px 0 #C13B7E",
        animation: isRecording ? "pulse-ring 1.2s ease-out infinite" : "none",
        transition: "background-color 150ms, box-shadow 150ms",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
        flexShrink: 0,
      }}
    >
      {isRecording ? "🎤" : "SPEAK"}
    </button>
  );
}
