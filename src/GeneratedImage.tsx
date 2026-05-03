import { useEffect, useRef } from "react";
import { usePrinter } from "./usePrinter";

interface GeneratedImageProps {
  imageUrl: string;
  onReset: () => void;
}

export function GeneratedImage({ imageUrl, onReset }: GeneratedImageProps) {
  const { status, isConnected, error, requestPrinter, print } = usePrinter();
  const hasPrintedRef = useRef(false);

  // Auto-print once when image appears and a printer is connected
  useEffect(() => {
    if (isConnected && !hasPrintedRef.current) {
      hasPrintedRef.current = true;
      print(imageUrl, { fitToPage: true, media: "4x6" });
    }
  }, [isConnected, imageUrl, print]);

  return (
    <div
      onClick={onReset}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 24,
        zIndex: 20,
        backgroundColor: "#FFF0F7",
        cursor: "pointer",
      }}
    >
      <img
        src={imageUrl}
        alt="Generated coloring page"
        style={{
          maxHeight: "75dvh",
          maxWidth: "min(90vw, 400px)",
          borderRadius: 24,
          border: "5px solid #FFFFFF",
          boxShadow: "0 12px 0 #C13B7E, 0 16px 0 rgba(0,0,0,0.08)",
          display: "block",
        }}
      />

      {/* Printer controls — stop click from bubbling to reset */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
      >
        {!isConnected && status !== "error" && (
          <button
            onClick={requestPrinter}
            style={{
              backgroundColor: "#FFE066",
              color: "#C13B7E",
              border: "4px solid #FFFFFF",
              borderRadius: 9999,
              padding: "14px 36px",
              fontFamily: '"Fredoka One", system-ui, sans-serif',
              fontSize: 22,
              boxShadow: "0 6px 0 #FFCC00, 0 9px 0 #C13B7E",
              cursor: "pointer",
            }}
          >
            🖨️ Connect Printer
          </button>
        )}

        {status === "printing" && (
          <p
            style={{
              fontFamily: '"Fredoka One", system-ui, sans-serif',
              fontSize: 20,
              color: "#FF69B4",
              margin: 0,
            }}
          >
            Printing...
          </p>
        )}

        {status === "error" && error && (
          <p
            style={{
              fontFamily: '"Nunito", system-ui, sans-serif',
              fontWeight: 700,
              fontSize: 15,
              color: "#C13B7E",
              margin: 0,
              maxWidth: 280,
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}
      </div>

      <p
        style={{
          fontFamily: '"Nunito", system-ui, sans-serif',
          fontWeight: 700,
          fontSize: 16,
          color: "#C13B7E",
          opacity: 0.5,
          margin: 0,
        }}
      >
        Tap anywhere to start over
      </p>
    </div>
  );
}
