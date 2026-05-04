import { useEffect, useState } from "react";
import type { Generation } from "./useGenerationStore";
import type { PrintOptions } from "./usePrinter";

interface GalleryProps {
  generations: Generation[];
  isConnected: boolean;
  onClose: () => void;
  onPrint: (imageUrl: string, options?: PrintOptions) => void;
  onRequestPrinter: () => void;
}

export function Gallery({
  generations,
  isConnected,
  onClose,
  onPrint,
  onRequestPrinter,
}: GalleryProps) {
  // null = grid view; number = detail view index
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selected = selectedIndex !== null ? (generations[selectedIndex] ?? null) : null;
  const total = generations.length;

  function goTo(i: number) {
    setSelectedIndex(((i % total) + total) % total);
  }

  // Keyboard: Escape closes, arrows navigate in detail view
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedIndex !== null) setSelectedIndex(null);
        else onClose();
      }
      if (selectedIndex !== null) {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") goTo(selectedIndex + 1);
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") goTo(selectedIndex - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        backgroundColor: "rgba(16,4,12,0.97)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          position: "sticky",
          top: 0,
          zIndex: 2,
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(16,4,12,0.88)",
          borderBottom: "1px solid rgba(255,105,180,0.12)",
        }}
      >
        <h2
          style={{
            fontFamily: '"Fredoka One", system-ui, sans-serif',
            fontSize: 26,
            color: "#FF69B4",
            margin: 0,
            textShadow: "2px 3px 0 #C13B7E",
          }}
        >
          🌟 My Stickers ({generations.length})
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,105,180,0.12)",
            border: "2px solid rgba(255,105,180,0.35)",
            borderRadius: 9999,
            color: "#FF69B4",
            fontFamily: '"Fredoka One", system-ui, sans-serif',
            fontSize: 16,
            padding: "8px 20px",
            cursor: "pointer",
          }}
        >
          Done
        </button>
      </div>

      {/* Grid */}
      {generations.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.3)",
            fontFamily: '"Nunito", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          No stickers yet — make your first one!
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 12,
            padding: "16px 16px 48px",
          }}
        >
          {generations.map((gen, i) => (
            <button
              key={gen.id}
              onClick={() => setSelectedIndex(i)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  aspectRatio: "9 / 16",
                  overflow: "hidden",
                  borderRadius: 14,
                  border: "2px solid rgba(255,105,180,0.2)",
                  backgroundColor: "rgba(255,240,247,0.06)",
                  width: "100%",
                }}
              >
                <img
                  src={gen.imageUrl}
                  alt={gen.prompt}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <p
                style={{
                  fontFamily: '"Nunito", system-ui, sans-serif',
                  fontWeight: 700,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.5)",
                  margin: 0,
                  lineHeight: 1.3,
                  overflow: "hidden",
                  display: "-webkit-box",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  WebkitLineClamp: 2 as any,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  WebkitBoxOrient: "vertical" as any,
                }}
              >
                {gen.prompt}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Detail view */}
      {selected !== null && selectedIndex !== null && (
        <div
          onClick={() => setSelectedIndex(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            backgroundColor: "rgba(0,0,0,0.94)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 16px",
            gap: 16,
          }}
        >
          {/* Counter + close */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <span
              style={{
                fontFamily: '"Fredoka One", system-ui, sans-serif',
                fontSize: 16,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {selectedIndex + 1} / {total}
            </span>
          </div>

          {/* Image */}
          <img
            src={selected.imageUrl}
            alt={selected.prompt}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: "58dvh",
              maxWidth: "min(78vw, 340px)",
              borderRadius: 24,
              border: "5px solid #FFFFFF",
              boxShadow: "0 12px 0 #C13B7E, 0 16px 0 rgba(0,0,0,0.2)",
              display: "block",
            }}
          />

          {/* Prompt */}
          <p
            onClick={(e) => e.stopPropagation()}
            style={{
              fontFamily: '"Nunito", system-ui, sans-serif',
              fontWeight: 700,
              fontSize: 13,
              color: "rgba(255,255,255,0.55)",
              margin: 0,
              maxWidth: 300,
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            {selected.prompt}
          </p>

          {/* Prev / Next navigation */}
          {total > 1 && (
            <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => goTo(selectedIndex - 1)}
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  border: "2px solid rgba(255,255,255,0.2)",
                  borderRadius: 9999,
                  color: "#FFFFFF",
                  fontFamily: '"Fredoka One", system-ui, sans-serif',
                  fontSize: 20,
                  padding: "10px 20px",
                  cursor: "pointer",
                }}
              >
                ←
              </button>
              <button
                onClick={() => goTo(selectedIndex + 1)}
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  border: "2px solid rgba(255,255,255,0.2)",
                  borderRadius: 9999,
                  color: "#FFFFFF",
                  fontFamily: '"Fredoka One", system-ui, sans-serif',
                  fontSize: 20,
                  padding: "10px 20px",
                  cursor: "pointer",
                }}
              >
                →
              </button>
            </div>
          )}

          {/* Actions */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}
          >
            {isConnected ? (
              <button
                onClick={() => onPrint(selected.imageUrl, { fitToPage: true, media: "4x6" })}
                style={{
                  backgroundColor: "#FFE066",
                  color: "#C13B7E",
                  border: "4px solid #FFFFFF",
                  borderRadius: 9999,
                  padding: "12px 24px",
                  fontFamily: '"Fredoka One", system-ui, sans-serif',
                  fontSize: 17,
                  boxShadow: "0 6px 0 #FFCC00, 0 9px 0 #C13B7E",
                  cursor: "pointer",
                }}
              >
                🖸️ Print
              </button>
            ) : (
              <button
                onClick={onRequestPrinter}
                style={{
                  backgroundColor: "#FFFFFF",
                  color: "#C13B7E",
                  border: "4px solid #FFFFFF",
                  borderRadius: 9999,
                  padding: "12px 24px",
                  fontFamily: '"Fredoka One", system-ui, sans-serif',
                  fontSize: 17,
                  boxShadow: "0 5px 0 #FFCC00, 0 8px 0 #C13B7E",
                  cursor: "pointer",
                }}
              >
                🖸️ Connect to print
              </button>
            )}
            <button
              onClick={() => setSelectedIndex(null)}
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.7)",
                border: "2px solid rgba(255,255,255,0.15)",
                borderRadius: 9999,
                padding: "12px 24px",
                fontFamily: '"Fredoka One", system-ui, sans-serif',
                fontSize: 17,
                cursor: "pointer",
              }}
            >
              Grid
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
