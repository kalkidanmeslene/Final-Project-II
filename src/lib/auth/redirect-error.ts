/** Rethrow Next.js redirect() so server actions do not treat it as failure. */
export function isNextRedirectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const digest = "digest" in error ? String((error as { digest: string }).digest) : "";
  return digest.startsWith("NEXT_REDIRECT");
}
