"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiClientError } from "@/lib/api/fetch-json";
import { useProfile } from "@/hooks/use-profile";
import { FormField } from "@/components/forms/form-field";
import { FormSection } from "@/components/forms/form-section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ProfileAvatar } from "./profile-avatar";

const fieldClassName =
  "w-full rounded-lg border border-input bg-input-background text-foreground transition-all focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "am", label: "Amharic" },
  { value: "ar", label: "Arabic" },
  { value: "fr", label: "French" },
];

export function EditProfileForm() {
  const { profile, updateProfile, uploadAvatar, isLoading } = useProfile();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(t);
  }, [success]);

  if (isLoading || !profile) {
    return <p className="text-sm text-muted-foreground">Loading profile...</p>;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setSuccess(null);
    const fd = new FormData(e.currentTarget);

    try {
      await updateProfile.mutateAsync({
        fullName: String(fd.get("fullName")),
        email: String(fd.get("email") ?? ""),
        phoneNumber: String(fd.get("phoneNumber") ?? ""),
        preferredLanguage: String(fd.get("preferredLanguage")),
        bio: String(fd.get("bio") ?? ""),
      });
      const message = "Profile saved successfully.";
      setSuccess(message);
      toast.success(message);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
        toast.error(err.message);
        if (err.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(err.fieldErrors)) {
            mapped[k] = v[0] ?? "";
          }
          setFieldErrors(mapped);
        }
      } else {
        const message = "Failed to save profile.";
        setFormError(message);
        toast.error(message);
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {success && (
        <Alert variant="success" role="status" aria-live="polite">
          {success}
        </Alert>
      )}
      {formError && (
        <Alert variant="destructive" role="alert">
          {formError}
        </Alert>
      )}

      <FormSection title="Profile photo" description="Upload a clear photo for your account.">
        <ProfileAvatar
          name={profile.fullName}
          imageUrl={profile.profilePictureUrl}
          uploading={uploadAvatar.isPending}
          onUpload={(file) => {
            setFormError(null);
            uploadAvatar.mutate(file, {
              onSuccess: () => toast.success("Profile photo updated."),
              onError: (err) => {
                const message = err instanceof ApiClientError ? err.message : "Upload failed.";
                setFormError(message);
                toast.error(message);
              },
            });
          }}
        />
      </FormSection>

      <FormSection title="Personal information" description="Update how you appear on Hibir Events.">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="fullName" label="Full name" required error={fieldErrors.fullName}>
            <Input name="fullName" defaultValue={profile.fullName} required autoComplete="name" />
          </FormField>
          <FormField id="preferredLanguage" label="Preferred language" required error={fieldErrors.preferredLanguage}>
            <select
              id="preferredLanguage"
              name="preferredLanguage"
              defaultValue={profile.preferredLanguage}
              className={`${fieldClassName} flex h-11 px-4 py-2 text-sm`}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="email" label="Email" hint="At least email or phone is required." error={fieldErrors.email}>
            <Input name="email" type="email" defaultValue={profile.email ?? ""} autoComplete="email" />
          </FormField>
          <FormField id="phoneNumber" label="Phone number" error={fieldErrors.phoneNumber}>
            <Input name="phoneNumber" type="tel" defaultValue={profile.phoneNumber ?? ""} autoComplete="tel" />
          </FormField>
          <FormField id="bio" label="Bio" hint="Optional. Max 500 characters." error={fieldErrors.bio} className="sm:col-span-2">
            <textarea
              id="bio"
              name="bio"
              defaultValue={profile.bio ?? ""}
              maxLength={500}
              rows={3}
              placeholder="Tell others a little about yourself (optional)"
              className={`${fieldClassName} resize-none px-4 py-3 text-sm placeholder:text-muted-foreground`}
            />
          </FormField>
        </div>
      </FormSection>

      <Button type="submit" disabled={updateProfile.isPending} aria-busy={updateProfile.isPending}>
        {updateProfile.isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
