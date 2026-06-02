"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

export function MockPaymentPanel({
  amount,
  currency,
  processing,
  error,
  onSuccess,
  onFail,
}: {
  amount: number;
  currency: string;
  processing: boolean;
  error: string | null;
  onSuccess: () => void;
  onFail: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulated payment</CardTitle>
        <CardDescription>
          This is a mock checkout for development. Choose an outcome to simulate payment processing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-semibold">
          Pay {currency} {amount.toFixed(2)}
        </p>
        {error && (
          <Alert variant="destructive" role="alert">
            {error}
          </Alert>
        )}
        {processing ? (
          <div className="flex items-center gap-2">
            <Spinner label="Processing payment" />
            <span className="text-sm">Processing...</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={onSuccess}>
              Simulate success
            </Button>
            <Button type="button" variant="outline" onClick={onFail}>
              Simulate failure
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
