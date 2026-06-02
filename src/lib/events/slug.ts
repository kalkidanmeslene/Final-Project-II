export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function withUniqueSlug(base: string, suffix: string) {
  const slug = slugify(base);
  return slug ? `${slug}-${suffix.slice(0, 8)}` : `event-${suffix.slice(0, 8)}`;
}
