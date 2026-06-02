"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerOrganizerAction, type AuthActionState } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

const initial: AuthActionState = { ok: true };

export default function OrganizerSignupPage() {
  const [state, action, pending] = useActionState(registerOrganizerAction, initial);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create organizer account</CardTitle>
        <CardDescription>
          Register as an event host. Your account stays pending until an admin approves it. Already have an attendee
          account?{" "}
          <Link href="/become-organizer" className="underline">
            Apply from your dashboard
          </Link>{" "}
          instead.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!state.ok && state.message && (
          <Alert variant="destructive" className="mb-4">
            {state.message}
          </Alert>
        )}
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Your full name</Label>
            <Input id="fullName" name="fullName" required />
            {state.fieldErrors?.fullName && <p className="text-sm text-red-600">{state.fieldErrors.fullName[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display / brand name</Label>
            <Input id="displayName" name="displayName" required placeholder="How you appear to attendees" />
            {state.fieldErrors?.displayName && (
              <p className="text-sm text-red-600">{state.fieldErrors.displayName[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" />
            {state.fieldErrors?.email && <p className="text-sm text-red-600">{state.fieldErrors.email[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone number</Label>
            <Input id="phoneNumber" name="phoneNumber" />
            {state.fieldErrors?.phoneNumber && (
              <p className="text-sm text-red-600">{state.fieldErrors.phoneNumber[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput id="password" name="password" required placeholder="Create a strong password" />
            <p className="text-xs text-zinc-500">10+ chars with upper, lower, number, and symbol.</p>
            {state.fieldErrors?.password && <p className="text-sm text-red-600">{state.fieldErrors.password[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolioUrl">Portfolio link (optional)</Label>
            <Input id="portfolioUrl" name="portfolioUrl" type="url" placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City (optional)</Label>
            <Input id="city" name="city" />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating..." : "Create organizer account"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          Attendee only?{" "}
          <Link href="/signup" className="underline">
            Sign up as attendee
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
