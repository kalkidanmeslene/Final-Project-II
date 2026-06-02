"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "@/i18n/navigation";
import { CheckoutAgreement } from "@/components/legal/checkout-agreement";
import { ArrowLeft, Check, CreditCard, Minus, Plus, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { ApiClientError } from "@/lib/api/fetch-json";
import type { BookingSummary } from "@/lib/booking/booking.types";
import { MAX_TICKETS_PER_ORDER } from "@/lib/booking/booking.schemas";
import { useTicketTypes, useBookingCheckout } from "@/hooks/use-booking";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type CheckoutStep = 1 | 2 | 3;
type PaymentCategory = "card" | "mobile";
type MobileProvider = "telebirr" | "mpesa" | "cbe";

export function BookingCheckoutFlow({
  slug,
  eventTitle,
  eventStartsAt,
  eventLocation,
}: {
  slug: string;
  eventTitle: string;
  eventStartsAt?: string;
  eventLocation?: string;
}) {
  const router = useRouter();
  const { data, isLoading, isError } = useTicketTypes(slug);
  const { preview, complete } = useBookingCheckout(slug);

  const [step, setStep] = useState<CheckoutStep>(1);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState<BookingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentCategory, setPaymentCategory] = useState<PaymentCategory>("mobile");
  const [mobileProvider, setMobileProvider] = useState<MobileProvider>("telebirr");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const ticketTypes = data?.ticketTypes ?? [];
  const checkoutLines = ticketTypes.map((t) => ({
    ticketTypeId: t.id,
    quantity: quantities[t.id] ?? 0,
  }));
  const totalSelected = checkoutLines.reduce((sum, line) => sum + line.quantity, 0);
  const previewTotal =
    summary?.lineTotal ??
    ticketTypes.reduce((sum, t) => sum + t.price * (quantities[t.id] ?? 0), 0);
  const lineTotal = summary?.lineTotal ?? previewTotal;
  const currency = summary?.currency ?? "ETB";
  const isFreeCheckout = lineTotal === 0 && totalSelected > 0;

  function adjustQuantity(ticketTypeId: string, delta: number, available: number) {
    setQuantities((prev) => {
      const current = prev[ticketTypeId] ?? 0;
      const otherTotal = Object.entries(prev).reduce(
        (sum, [id, qty]) => (id === ticketTypeId ? sum : sum + qty),
        0,
      );
      const next = current + delta;
      if (next < 0) return prev;
      if (next > Math.min(10, available)) return prev;
      if (delta > 0 && otherTotal + current + 1 > MAX_TICKETS_PER_ORDER) return prev;
      return { ...prev, [ticketTypeId]: next };
    });
  }

  function buildCheckoutPayload() {
    return { lines: checkoutLines };
  }

  async function goToPayment() {
    if (totalSelected < 1) {
      setError("Select at least one ticket.");
      return;
    }
    setError(null);
    try {
      const res = await preview.mutateAsync(buildCheckoutPayload());
      setSummary(res.summary);
      setStep(res.summary.lineTotal === 0 ? 3 : 2);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not load summary.");
    }
  }

  async function confirmBooking(paymentResult: "success" | "fail" = "success") {
    if (totalSelected < 1 || !termsAccepted) return;
    setError(null);
    try {
      const res = await complete.mutateAsync({ ...buildCheckoutPayload(), paymentResult });
      if (res.paymentStatus === "successful") {
        const firstTicket = res.booking.tickets[0];
        toast.success("Booking confirmed!", {
          description: firstTicket
            ? "Your QR ticket is ready — opening it now."
            : "Check My tickets for your QR code.",
        });
        if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = setTimeout(() => {
          if (firstTicket) {
            router.push(`/dashboard/attendee/tickets/${firstTicket.id}`);
          } else {
            router.push("/dashboard/attendee/tickets");
          }
        }, 1500);
        return;
      }
      if (res.paymentStatus === "failed") {
        toast.error("Payment declined. No tickets were issued.");
        setError("Simulated payment failed. You can adjust your order and try again.");
        setStep(isFreeCheckout ? 1 : 2);
      }
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 401) {
        setError("Please log in or sign up to complete your booking.");
        return;
      }
      setError(e instanceof ApiClientError ? e.message : isFreeCheckout ? "Could not reserve ticket." : "Payment failed.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner label="Loading ticket options" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive" role="alert">
        Could not load tickets.{" "}
        <Link href={`/events/${slug}`} className="underline">
          Back to event
        </Link>
      </Alert>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={`/events/${slug}`}
        className="mb-6 inline-flex items-center gap-2 text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Event
      </Link>

      <h1 className="mb-2 text-3xl font-bold text-foreground">Complete your booking</h1>
      <p className="mb-8 text-muted-foreground">Secure checkout with QR ticket delivery</p>

      <div className="mb-12 flex items-center justify-center">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all",
                step >= s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
              )}
            >
              {step > s ? <Check className="h-5 w-5" /> : s}
            </div>
            {s < 3 && (
              <div
                className={cn("mx-2 h-1 w-16 transition-all sm:w-24", step > s ? "bg-primary" : "bg-secondary")}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6" role="alert">
          {error}
        </Alert>
      )}

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1 space-y-6">
          {step === 1 && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-6 text-2xl font-bold">Select Tickets</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Set a quantity for each ticket type (starts at 0). You can buy General Admission and VIP in the
                same order.
              </p>
              <div className="space-y-4">
                {ticketTypes.map((t) => {
                  const qty = quantities[t.id] ?? 0;
                  const soldOut = t.available === 0;
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        "w-full rounded-lg border p-4 transition-all",
                        qty > 0 ? "border-primary bg-primary/5 ring-2 ring-primary/30" : "border-border bg-background",
                        soldOut ? "opacity-50" : "",
                      )}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold">{t.name}</h3>
                          {t.description && (
                            <p className="text-sm text-muted-foreground">{t.description}</p>
                          )}
                          <p className="mt-2 font-semibold text-primary">
                            {t.price === 0 ? "Free" : formatCurrency(t.price)}
                          </p>
                          <p className="text-xs text-muted-foreground">{soldOut ? "Sold out" : "Available"}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={soldOut || qty === 0}
                            onClick={() => adjustQuantity(t.id, -1, t.available)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-semibold">{qty}</span>
                          <button
                            type="button"
                            disabled={soldOut || qty >= Math.min(10, t.available) || totalSelected >= MAX_TICKETS_PER_ORDER}
                            onClick={() => adjustQuantity(t.id, 1, t.available)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button
                type="button"
                size="lg"
                className="mt-6 w-full"
                onClick={() => void goToPayment()}
                disabled={preview.isPending || totalSelected < 1}
              >
                {preview.isPending
                  ? "Loading..."
                  : isFreeCheckout && totalSelected > 0
                    ? "Continue to review"
                    : "Continue to payment"}
              </Button>
            </div>
          )}

          {step === 2 && summary && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-6 text-2xl font-bold">Payment Method</h2>
              <div className="mb-6 space-y-4">
                <button
                  type="button"
                  onClick={() => setPaymentCategory("card")}
                  className={cn(
                    "w-full rounded-lg border-2 p-4 transition-all",
                    paymentCategory === "card"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <div className="text-left">
                      <p className="font-semibold">Credit / Debit Card</p>
                      <p className="text-sm text-muted-foreground">
                        Pay with Visa, Mastercard, or local cards
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentCategory("mobile")}
                  className={cn(
                    "w-full rounded-lg border-2 p-4 transition-all",
                    paymentCategory === "mobile"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-6 w-6 text-primary" />
                    <div className="text-left">
                      <p className="font-semibold">Mobile Money</p>
                      <p className="text-sm text-muted-foreground">
                        Pay with Telebirr, M-PESA, or CBE Birr
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {paymentCategory === "card" && (
                <div className="space-y-4">
                  <Input label="Card Number" placeholder="1234 5678 9012 3456" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Expiry Date" placeholder="MM/YY" />
                    <Input label="CVV" placeholder="123" type="password" />
                  </div>
                  <Input label="Cardholder Name" placeholder="John Doe" />
                </div>
              )}

              {paymentCategory === "mobile" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ["telebirr", "Telebirr"],
                        ["mpesa", "M-PESA"],
                        ["cbe", "CBE Birr"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setMobileProvider(id)}
                        className={cn(
                          "rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-all",
                          mobileProvider === id
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-foreground hover:border-primary/50",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <Input label="Mobile Number" placeholder="+251 912 345 678" />
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-amber-800">
                      You will receive a prompt on your phone to complete the payment via{" "}
                      {mobileProvider === "telebirr"
                        ? "Telebirr"
                        : mobileProvider === "mpesa"
                          ? "M-PESA"
                          : "CBE Birr"}
                      .
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <Button variant="outline" size="lg" type="button" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button size="lg" className="flex-1" type="button" onClick={() => setStep(3)}>
                  Continue to Review
                </Button>
              </div>
            </div>
          )}

          {step === 3 && summary && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-6 text-2xl font-bold">Review Your Booking</h2>
              <div className="mb-6 space-y-4">
                <div className="rounded-lg bg-background p-4">
                  <p className="mb-1 text-sm text-muted-foreground">Event</p>
                  <p className="font-semibold">{summary.eventTitle}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-background p-4">
                    <p className="mb-1 text-sm text-muted-foreground">Date & Time</p>
                    <p className="text-sm font-semibold">
                      {eventStartsAt ? (
                        <>
                          {formatDate(eventStartsAt)}
                          <br />
                          {formatTime(eventStartsAt)}
                        </>
                      ) : (
                        "See event page"
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg bg-background p-4">
                    <p className="mb-1 text-sm text-muted-foreground">Location</p>
                    <p className="text-sm font-semibold">{eventLocation ?? "See event page"}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-background p-4">
                  <p className="mb-2 text-sm text-muted-foreground">Tickets</p>
                  <ul className="space-y-1">
                    {summary.lines.map((line) => (
                      <li key={line.ticketTypeId} className="font-semibold">
                        {line.quantity}× {line.ticketTypeName} —{" "}
                        {line.unitPrice === 0 ? "Free" : `${formatCurrency(line.unitPrice)} each`}
                      </li>
                    ))}
                  </ul>
                </div>
                {!isFreeCheckout && (
                  <div className="rounded-lg bg-background p-4">
                    <p className="mb-1 text-sm text-muted-foreground">Payment</p>
                    <p className="font-semibold capitalize">
                      {paymentCategory === "card"
                        ? "Credit / Debit Card"
                        : mobileProvider === "telebirr"
                          ? "Telebirr"
                          : mobileProvider === "mpesa"
                            ? "M-PESA"
                            : "CBE Birr"}
                    </p>
                  </div>
                )}
              </div>

              <CheckoutAgreement
                termsAccepted={termsAccepted}
                onTermsAcceptedChange={setTermsAccepted}
                isFreeCheckout={isFreeCheckout}
              />

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  size="lg"
                  type="button"
                  onClick={() => setStep(isFreeCheckout ? 1 : 2)}
                >
                  Back
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  type="button"
                  disabled={!termsAccepted || complete.isPending}
                  onClick={() => void confirmBooking("success")}
                >
                  {complete.isPending
                    ? "Processing..."
                    : isFreeCheckout
                      ? "Confirm booking"
                      : `Confirm & pay ${formatCurrency(lineTotal)}`}
                </Button>
              </div>
              {!isFreeCheckout && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="mt-2 w-full text-muted-foreground"
                  disabled={!termsAccepted || complete.isPending}
                  onClick={() => void confirmBooking("fail")}
                >
                  Simulate payment failure (mock checkout)
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 lg:w-96">
          <div className="sticky top-24 rounded-xl border border-border bg-card p-6 shadow-lg">
            <h3 className="mb-4 text-xl font-bold">Order Summary</h3>
            <div className="mb-6 space-y-4">
              {(summary
                ? summary.lines
                : ticketTypes
                    .filter((t) => (quantities[t.id] ?? 0) > 0)
                    .map((t) => ({
                      ticketTypeId: t.id,
                      ticketTypeName: t.name,
                      quantity: quantities[t.id] ?? 0,
                      lineTotal: t.price * (quantities[t.id] ?? 0),
                    }))
              ).map((line) => (
                <div key={line.ticketTypeId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {line.ticketTypeName} × {line.quantity}
                  </span>
                  <span className="font-semibold">{formatCurrency(line.lineTotal)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service Fee</span>
                <span className="font-semibold">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-4">
                <span className="font-bold">Total</span>
                <span className="text-xl font-bold text-primary">
                  {isFreeCheckout
                    ? "Free"
                    : currency === "ETB"
                      ? formatCurrency(lineTotal)
                      : `${currency} ${lineTotal.toFixed(2)}`}
                </span>
              </div>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
              <p className="mb-2 text-sm font-semibold text-primary">✓ Instant QR ticket delivery</p>
              <p className="text-xs text-muted-foreground">
                {isFreeCheckout
                  ? "Your unique QR code ticket will appear in My tickets right after you confirm"
                  : "Your unique QR code ticket will be sent to your email immediately after payment"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}