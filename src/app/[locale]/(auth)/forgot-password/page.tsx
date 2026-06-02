"use client";

import Link from "next/link";
import { useState } from "react";
import type { ApiResponse } from "@/lib/http/api-response";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    setResetUrl(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: fd.get("identifier") }),
    });
    const json = (await res.json()) as ApiResponse<{ message: string; resetUrl?: string }>;
    setSubmitting(false);
    if (!json.ok) {
      setError(json.error.message);
      return;
    }
    setMessage(json.data.message);
    if (json.data.resetUrl) setResetUrl(json.data.resetUrl);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>Enter your email or phone to receive reset instructions.</CardDescription>
      </CardHeader>
      <CardContent>
        {message && <Alert className="mb-4">{message}</Alert>}
        {resetUrl && (
          <Alert className="mb-4">
            Dev reset link:{" "}
            <a href={resetUrl} className="underline">
              Reset password
            </a>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="mb-4">
            {error}
          </Alert>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Email or phone</Label>
            <Input id="identifier" name="identifier" required />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="underline">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
