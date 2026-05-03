import { useCallback, useEffect, useRef, useState } from "react";

export interface Generation {
  id: string;
  prompt: string;
  ts: number;
  blob: Blob;
}

const DB_NAME = "sticker-dream-v2";
const STORE = "generations";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result as IDBDatabase);
    req.onupgradeneeded = () => {
      (req.result as IDBDatabase).createObjectStore(STORE, { keyPath: "id" });
    };
  });
}

export function useGenerationStore() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const dbRef = useRef<IDBDatabase | null>(null);

  // Load all saved generations on mount
  useEffect(() => {
    openDb()
      .then((db) => {
        dbRef.current = db;
        const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
        req.onsuccess = () => {
          const all = (req.result as Generation[]).sort((a, b) => b.ts - a.ts);
          setGenerations(all);
        };
      })
      .catch(() => {
        /* IndexedDB unavailable — silently degrade */
      });
  }, []);

  const saveGeneration = useCallback(async (imageUrl: string, prompt: string) => {
    try {
      const blob = await fetch(imageUrl).then((r) => r.blob());
      const entry: Generation = {
        id: crypto.randomUUID(),
        prompt,
        ts: Date.now(),
        blob,
      };

      const db = dbRef.current ?? (await openDb());
      dbRef.current = db;

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const req = tx.objectStore(STORE).put(entry);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      setGenerations((prev) => [entry, ...prev]);
    } catch {
      /* Don't crash the app if storage fails */
    }
  }, []);

  return { generations, saveGeneration };
}
