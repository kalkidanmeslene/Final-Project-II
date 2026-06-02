"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { QrCode } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

type QrScannerProps = {
  onScan: (payload: string) => void;
  /** Visual overlay only — does not stop the camera. */
  isProcessing?: boolean;
  className?: string;
};

export function QrScanner({ onScan, isProcessing = false, className }: QrScannerProps) {
  const regionId = useId().replace(/:/g, "");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);
  const startingRef = useRef(false);
  const onScanRef = useRef(onScan);
  const lastPayloadRef = useRef<string>("");
  const lastAtRef = useRef<number>(0);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  onScanRef.current = onScan;

  const stop = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    startingRef.current = false;
    if (scanner) {
      try {
        if (scanner.isScanning) await scanner.stop();
        scanner.clear();
      } catch {
        /* ignore cleanup errors */
      }
    }
    if (mountedRef.current) setActive(false);
  }, []);

  const start = useCallback(async () => {
    if (!mountedRef.current || startingRef.current || scannerRef.current?.isScanning) {
      return;
    }

    startingRef.current = true;
    if (mountedRef.current) setError(null);

    try {
      const scanner = new Html5Qrcode(regionId);
      scannerRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();
      const backCamera =
        cameras.find((c) => /back|rear|environment/i.test(c.label)) ?? cameras[cameras.length - 1];
      const cameraId = backCamera?.id ?? { facingMode: "environment" };

      await scanner.start(
        cameraId,
        {
          fps: 8,
          disableFlip: true,
          aspectRatio: 1.333,
          qrbox: (width, height) => {
            const size = Math.min(width, height, 280);
            return { width: size, height: size };
          },
        },
        (decoded) => {
          const now = Date.now();
          if (decoded === lastPayloadRef.current && now - lastAtRef.current < 3000) {
            return;
          }
          lastPayloadRef.current = decoded;
          lastAtRef.current = now;
          onScanRef.current(decoded);
        },
        () => {
          /* per-frame misses are expected */
        },
      );

      if (mountedRef.current) setActive(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not access camera.";
      if (mountedRef.current) {
        setError(msg);
        setActive(false);
      }
      scannerRef.current = null;
    } finally {
      startingRef.current = false;
    }
  }, [regionId]);

  useEffect(() => {
    mountedRef.current = true;
    void start();

    return () => {
      mountedRef.current = false;
      void stop();
    };
  }, [start, stop]);

  return (
    <div className={className}>
      <div className="relative mb-6 overflow-hidden rounded-xl bg-gray-900" style={{ minHeight: 400 }}>
        <div
          id={regionId}
          className="min-h-[400px] w-full [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover [&_canvas]:hidden"
        />
        {!active && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-center text-white/70">
            <QrCode className="mb-2 h-12 w-12" />
            <p className="text-sm">Starting camera…</p>
          </div>
        )}
        {isProcessing && active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-white">
            <Spinner label="Validating ticket" />
            <p className="text-sm font-medium">Validating…</p>
          </div>
        )}
      </div>
      {error && (
        <Alert variant="destructive" role="alert" className="mb-3">
          {error}. Allow camera permission or use manual entry below.
        </Alert>
      )}
      <div className="flex justify-center gap-2">
        {active ? (
          <Button type="button" variant="outline" onClick={() => void stop()}>
            Stop camera
          </Button>
        ) : (
          <Button type="button" onClick={() => void start()} disabled={startingRef.current}>
            Start camera
          </Button>
        )}
      </div>
    </div>
  );
}
