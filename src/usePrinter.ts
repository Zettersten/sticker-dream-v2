import { useState, useCallback, useEffect, useRef } from "react";

export type PrinterStatus = "idle" | "connected" | "printing" | "error";

// Phomemo PM-241 / generic 4×6 thermal label printer constants
// Resolution: 203 DPI  |  Label: 4.00" × 6.00"
const LABEL_DPI = 203;
const LABEL_WIDTH_IN = 4.0;
const LABEL_HEIGHT_IN = 6.0;
const LABEL_WIDTH_PX = Math.round(LABEL_WIDTH_IN * LABEL_DPI); // 812
const LABEL_HEIGHT_PX = Math.round(LABEL_HEIGHT_IN * LABEL_DPI); // 1218
const LABEL_WIDTH_BYTES = Math.ceil(LABEL_WIDTH_PX / 8); // 102

export interface PrintOptions {
  copies?: number;
  media?: string;
  grayscale?: boolean;
  fitToPage?: boolean;
  /** TSPL darkness / print density (1–15, default 8) */
  darkness?: number;
  /** TSPL print speed (1–6, default 4) */
  speed?: number;
}

const usbApi = () =>
  typeof navigator !== "undefined" && "usb" in navigator ? navigator.usb : null;

export function usePrinter() {
  const [status, setStatus] = useState<PrinterStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const deviceRef = useRef<USBDevice | null>(null);

  // Check for already-paired devices on mount
  useEffect(() => {
    const usb = usbApi();
    if (!usb) return;

    usb.getDevices().then((devices) => {
      const first = devices[0];
      if (first) {
        deviceRef.current = first;
        setStatus("connected");
      }
    });

    const onConnect = (e: USBConnectionEvent) => {
      deviceRef.current = e.device;
      setStatus("connected");
      setError(null);
    };

    const onDisconnect = (e: USBConnectionEvent) => {
      if (deviceRef.current?.serialNumber === e.device.serialNumber) {
        deviceRef.current = null;
        setStatus("idle");
        setError(null);
      }
    };

    usb.addEventListener("connect", onConnect);
    usb.addEventListener("disconnect", onDisconnect);
    return () => {
      usb.removeEventListener("connect", onConnect);
      usb.removeEventListener("disconnect", onDisconnect);
    };
  }, []);

  const requestPrinter = useCallback(async () => {
    const usb = usbApi();
    if (!usb) {
      setError("WebUSB is not supported in this browser");
      setStatus("error");
      return;
    }
    try {
      const device = await usb.requestDevice({ filters: [] });
      deviceRef.current = device;
      setStatus("connected");
      setError(null);
    } catch (err) {
      // User cancelled — NotFoundError is expected, not an error state
      if ((err as DOMException).name !== "NotFoundError") {
        setError(String(err));
        setStatus("error");
      }
    }
  }, []);

  const print = useCallback(async (imageUrl: string, options: PrintOptions = {}) => {
    const device = deviceRef.current;
    if (!device) {
      setError("No printer connected");
      setStatus("error");
      return;
    }

    setStatus("printing");
    setError(null);

    try {
      // Build TSPL print data (fetches image, converts to 1-bit bitmap)
      const printData = await buildTSPLPrintData(imageUrl, options);

      await device.open();

      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      const iface = device.configuration!.interfaces[0]!;
      await device.claimInterface(iface.interfaceNumber);

      // Find the bulk OUT endpoint
      const endpoint = iface.alternate.endpoints.find(
        (ep) => ep.direction === "out" && ep.type === "bulk",
      );

      if (!endpoint) {
        throw new Error("No bulk OUT endpoint found on this USB device");
      }

      await device.transferOut(endpoint.endpointNumber, printData);
      await device.releaseInterface(iface.interfaceNumber);
      await device.close();

      setStatus("connected");
    } catch (err) {
      setError(String(err));
      setStatus("error");
      // Try to close the device cleanly on error
      try {
        await deviceRef.current?.close();
      } catch {
        /* ignore */
      }
    }
  }, []);

  return {
    status,
    isConnected: status === "connected" || status === "printing",
    error,
    requestPrinter,
    print,
  };
}

/**
 * Build a TSPL print job for the Phomemo PM-241 (and compatible 4×6 thermal
 * label printers). Converts the image URL → canvas → 1-bit bitmap → TSPL.
 *
 * TSPL (TSC Standard Label Language) command reference:
 *   SIZE  – label dimensions in inches
 *   GAP   – gap between labels (0.12" for standard die-cut labels)
 *   DENSITY – darkness level (1–15)
 *   SPEED – print speed (1–6 ips)
 *   CLS   – clear image buffer
 *   BITMAP x,y,width_bytes,height,mode,data
 *   PRINT n – print n copies
 */
async function buildTSPLPrintData(imageUrl: string, options: PrintOptions): Promise<Uint8Array> {
  const darkness = options.darkness ?? 8;
  const speed = options.speed ?? 4;
  const copies = options.copies ?? 1;

  // 1. Load the image
  const img = await loadImage(imageUrl);

  // 2. Render onto a canvas sized to the physical label at 203 DPI
  const canvas = document.createElement("canvas");
  canvas.width = LABEL_WIDTH_PX;
  canvas.height = LABEL_HEIGHT_PX;
  const ctx = canvas.getContext("2d")!;

  // White background (thermal = no ink)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, LABEL_WIDTH_PX, LABEL_HEIGHT_PX);

  // Fit image to label preserving aspect ratio (letterbox — show the full image)
  const scale = Math.min(LABEL_WIDTH_PX / img.width, LABEL_HEIGHT_PX / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const drawX = (LABEL_WIDTH_PX - drawW) / 2;
  const drawY = (LABEL_HEIGHT_PX - drawH) / 2;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  // 3. Convert pixel data to packed 1-bit monochrome (MSB first, dark = ink)
  const { data } = ctx.getImageData(0, 0, LABEL_WIDTH_PX, LABEL_HEIGHT_PX);
  const bitmap = new Uint8Array(LABEL_WIDTH_BYTES * LABEL_HEIGHT_PX);

  for (let row = 0; row < LABEL_HEIGHT_PX; row++) {
    for (let col = 0; col < LABEL_WIDTH_PX; col++) {
      const pi = (row * LABEL_WIDTH_PX + col) * 4;
      const r = data[pi] ?? 255;
      const g = data[pi + 1] ?? 255;
      const b = data[pi + 2] ?? 255;
      // Luminance threshold — below 128 = dark pixel = print ink
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 128) {
        const byteIdx = row * LABEL_WIDTH_BYTES + Math.floor(col / 8);
        bitmap[byteIdx]! |= 0x80 >> (col % 8);
      }
    }
  }

  // 4. Assemble the TSPL job
  const enc = new TextEncoder();
  const header = enc.encode(
    `SIZE ${LABEL_WIDTH_IN} INCH,${LABEL_HEIGHT_IN} INCH\r\n` +
      `GAP 0.12 INCH,0.00 INCH\r\n` +
      `DENSITY ${darkness}\r\n` +
      `SPEED ${speed}\r\n` +
      `SET TEAR ON\r\n` +
      `CLS\r\n` +
      `BITMAP 0,0,${LABEL_WIDTH_BYTES},${LABEL_HEIGHT_PX},1,`,
  );
  const footer = enc.encode(`\r\nPRINT ${copies}\r\n`);

  const job = new Uint8Array(header.length + bitmap.length + footer.length);
  job.set(header);
  job.set(bitmap, header.length);
  job.set(footer, header.length + bitmap.length);
  return job;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // needed to read pixel data via canvas
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}
