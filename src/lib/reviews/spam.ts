const URL_PATTERN = /https?:\/\/|www\./gi;
const REPEAT_CHAR = /(.)\1{6,}/;

export function detectSpam(comment: string): string | null {
  const trimmed = comment.trim();
  if (trimmed.length < 10) return "Comment is too short.";
  const urls = trimmed.match(URL_PATTERN);
  if (urls && urls.length > 3) return "Too many links in comment.";
  if (REPEAT_CHAR.test(trimmed)) return "Comment looks like spam.";
  const lowered = trimmed.toLowerCase();
  const blocked = ["viagra", "casino", "crypto giveaway", "click here now"];
  if (blocked.some((w) => lowered.includes(w))) return "Comment contains blocked content.";
  return null;
}

export const MAX_REVIEWS_PER_DAY = 5;
