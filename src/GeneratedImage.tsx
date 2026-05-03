import { useRef, useState } from "react";
import type { PrintOptions } from "./usePrinter";

interface GeneratedImageProps {
  imageUrl: string;
  /** Printer state lifted from App so pairing happens before generation */
  printerConnected: boolean;
  printerStatus: string;
  onPrint: (url: string, options?: PrintOptions) => void;
  onReset: () => void;
}

export function GeneratedImage({
  imageUrl,
  printerConnected,
  printerStatus,
  onPrint,
  onReset,
}: GeneratedImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const hasPrintedRef = useRef(false);

  // Print fires once, immediately after the browser finishes rendering the image
  function handleImageLoad() {
    setImageLoaded(true);
    if (printerConnected && !hasPrintedRef.current) {
      hasPrintedRef.current = true;
      onPrint(imageUrl, { fitToPage: true, media: "4x6" });
    }
  }

  const imgStyle = {
    maxHeight: "75dvh",
    maxWidth: "min(90vw, 400px)",
    width: "100%",
    aspectRatio: "9 / 16",
    borderRadius: 24,
    border: "5px solid #FFFFFF",
    boxShadow: "0 12px 0 #C13B7E, 0 16px 0 rgba(0,0,0,0.08)",
    display: "block",
  };

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
      {/* Skeleton shown while image is loading */}
      {!imageLoaded && (
        <div
          style={{
            ...imgStyle,
            background:
              "linear-gradient(90deg, rgba(255,105,180,0.08) 25%, rgba(255,105,180,0.18) 50%, rgba(255,105,180,0.08) 75%)",
            backgroundSize: "200% 100%",
            animation: "skeleton-shimmer 1.4s ease-in-out infinite",
          }}
        />
      )}

      {/* The real image — hidden until loaded to avoid layout jank */}
      <img
        src={imageUrl}
        alt="Generated coloring page"
        onLoad={handleImageLoad}
        style={{ ...imgStyle, display: imageLoaded ? "block" : "none" }}
      />

      {/* Status row — stop clicks bubbling to reset */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
      >
        {printerStatus === "printing" && (
          <p
            style={{
              fontFamily: '"Fredoka One", system-ui, sans-serif',
              fontSize: 20,
              color: "#FF69B4",
              margin: 0,
              textShadow: "2px 3px 0 #C13B7E",
            }}
          >
            Printing…
          </p>
        )}
        {printerStatus === "connected" && imageLoaded && (
          <p
            style={{
              fontFamily: '"Nunito", system-ui, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              color: "#FF69B4",
              margin: 0,
            }}
          >
            ✅ Sent to printer
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
