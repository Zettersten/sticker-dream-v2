import { useEffect, useMemo, useState } from "react";
import type { Generation } from "./useGenerationStore";
import type { PrintOptions } from "./usePrinter";

interface GalleryProps {
  generations: Generation[];
  isConnected: boolean;
  onClose: () => void;
  onPrint: (blobUrl: string, options?: PrintOptions) => void;
}

export function Gallery({ generations, isConnected, onClose, onPrint }: GalleryProps) {
  const [selected, setSelected] = useState<Generation | null>(null);

  // Compute object URLs from blobs during render via useMemo (not a ref)
  const blobUrls = useMemo(
    () => new Map(generations.map((g) => [g.id, URL.createObjectURL(g.blob)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [generations.length], // recompute only when the count changes
  );

  // Revoke all object URLs when they are replaced or the gallery unmounts
  useEffect(() => {
    return () => {
      blobUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [blobUrls]);

  // Close overlay on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selected) setSelected(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, onClose]);

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
          {generations.map((gen) => (
            <button
              key={gen.id}
              onClick={() => setSelected(gen)}
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
                  src={blobUrls.get(gen.id) ?? ""}
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
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            backgroundColor: "rgba(0,0,0,0.94)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            gap: 20,
          }}
        >
          <img
            src={blobUrls.get(selected.id) ?? ""}
            alt={selected.prompt}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: "68dvh",
              maxWidth: "min(88vw, 380px)",
              borderRadius: 24,
              border: "5px solid #FFFFFF",
              boxShadow: "0 12px 0 #C13B7E, 0 16px 0 rgba(0,0,0,0.2)",
              display: "block",
            }}
          />
          <p
            onClick={(e) => e.stopPropagation()}
            style={{
              fontFamily: '"Nunito", system-ui, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              color: "rgba(255,255,255,0.65)",
              margin: 0,
              maxWidth: 320,
              textAlign: "center",
            }}
          >
            {selected.prompt}
          </p>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}
          >
            {isConnected && (
              <button
                onClick={() =>
                  onPrint(blobUrls.get(selected.id) ?? "", { fitToPage: true, media: "4x6" })
                }
                style={{
                  backgroundColor: "#FFE066",
                  color: "#C13B7E",
                  border: "4px solid #FFFFFF",
                  borderRadius: 9999,
                  padding: "12px 28px",
                  fontFamily: '"Fredoka One", system-ui, sans-serif',
                  fontSize: 18,
                  boxShadow: "0 6px 0 #FFCC00, 0 9px 0 #C13B7E",
                  cursor: "pointer",
                }}
              >
                🖨️ Print Again
              </button>
            )}
            <button
              onClick={() => setSelected(null)}
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.7)",
                border: "2px solid rgba(255,255,255,0.15)",
                borderRadius: 9999,
                padding: "12px 28px",
                fontFamily: '"Fredoka One", system-ui, sans-serif',
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
