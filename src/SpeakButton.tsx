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

/**
 * Decode whatever the browser recorded (webm/opus, ogg, etc.) via AudioContext
 * and re-encode as a 16-bit mono 16 kHz WAV blob.
 *
 * WAV/PCM is codec-free and universally accepted by all STT APIs including
 * Fish Audio, which rejects webm+Opus from Chrome's MediaRecorder.
 */
async function toWav(chunks: Blob[]): Promise<Blob> {
  const raw = new Blob(chunks);
  const arrayBuffer = await raw.arrayBuffer();
  const audioCtx = new AudioContext({ sampleRate: 16_000 });
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);
  await audioCtx.close();

  // Mix down to mono
  const monoData = new Float32Array(decoded.length);
  for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
    const channel = decoded.getChannelData(ch);
    for (let i = 0; i < decoded.length; i++) {
      monoData[i]! += channel[i]! / decoded.numberOfChannels;
    }
  }

  // Float32 → Int16
  const pcm16 = new Int16Array(monoData.length);
  for (let i = 0; i < monoData.length; i++) {
    pcm16[i] = Math.max(-32_768, Math.min(32_767, Math.round(monoData[i]! * 32_767)));
  }

  // Build WAV header
  const sampleRate = decoded.sampleRate;
  const numChannels = 1;
  const bitsPerSample = 16;
  const dataSize = pcm16.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buffer);

  const w32 = (off: number, val: number, le = true) => v.setUint32(off, val, le);
  const w16 = (off: number, val: number) => v.setUint16(off, val, true);

  v.setUint32(0, 0x52_49_46_46, false); // "RIFF"
  w32(4, 36 + dataSize);
  v.setUint32(8, 0x57_41_56_45, false); // "WAVE"
  v.setUint32(12, 0x66_6d_74_20, false); // "fmt "
  w32(16, 16); // chunk size
  w16(20, 1); // PCM
  w16(22, numChannels);
  w32(24, sampleRate);
  w32(28, (sampleRate * numChannels * bitsPerSample) / 8); // byte rate
  w16(32, (numChannels * bitsPerSample) / 8); // block align
  w16(34, bitsPerSample);
  v.setUint32(36, 0x64_61_74_61, false); // "data"
  w32(40, dataSize);
  new Int16Array(buffer, 44).set(pcm16);

  return new Blob([buffer], { type: "audio/wav" });
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
      const captured = [...chunksRef.current];
      recorder.stream.getTracks().forEach((t) => t.stop());
      recorderRef.current = null;
      if (elapsed < MIN_RECORD_MS) return; // silently discard if too short

      // Convert to WAV — Fish Audio rejects webm/opus from Chrome's MediaRecorder
      toWav(captured)
        .then((wav) => onAudioCaptured(wav))
        .catch(() => {
          // Fallback: send raw recording and hope for the best
          const raw = new Blob(captured, { type: recorder.mimeType || "audio/webm" });
          onAudioCaptured(raw);
        });
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
