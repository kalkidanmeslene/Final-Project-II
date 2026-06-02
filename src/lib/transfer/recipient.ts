export function parseTransferRecipient(
  value: string,
): { recipientEmail?: string; recipientPhone?: string } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes("@")) {
    return { recipientEmail: trimmed };
  }
  return { recipientPhone: trimmed };
}
