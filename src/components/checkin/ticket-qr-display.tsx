"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useTicketQr } from "@/hooks/use-checkin";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";

export function TicketQrDisplay({ ticketId, ticketCode }: { ticketId: string; ticketCode: string }) {
  const { data, isLoading, isError, refetch } = useTicketQr(ticketId);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.qr.payload) return;
    let cancelled = false;
    void QRCode.toDataURL(data.qr.payload, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
    }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [data?.qr.payload]);

  if (isLoading) return <Spinner label="Loading QR code" />;
  if (isError || !data) {
    return (
      <Alert variant="destructive" role="alert">
        Could not load QR code.{" "}
        <button type="button" className="underline" onClick={() => void refetch()}>
          Retry
        </button>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt={`QR code for ticket ${ticketCode}`} width={240} height={240} className="rounded-lg" />
      ) : (
        <Spinner label="Generating QR" />
      )}
      <p className="font-mono text-xs text-muted-foreground">{ticketCode}</p>
      <p className="text-center text-xs text-muted-foreground">
        Valid for check-in until {new Date(data.qr.expiresAt).toLocaleString()}
      </p>
      <button type="button" className="text-xs text-primary hover:underline" onClick={() => void refetch()}>
        Refresh QR
      </button>
    </div>
  );
}
