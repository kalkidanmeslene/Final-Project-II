import type { AiProvider } from "./ai-provider";
import type { CategoryCandidate, CategorySuggestionResult, TranslationResult } from "../ai.types";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  music: ["music", "concert", "jazz", "band", "dj", "live", "festival", "ጽሮት", "ኮንሰርት"],
  sports: ["sport", "football", "soccer", "match", "tournament", "marathon", "race", "እግር ኳስ", "ውድድር"],
  conference: ["conference", "summit", "workshop", "seminar", "talk", "keynote", "training", "ስልጠና", "ኮንፈረንስ"],
  "arts-culture": ["art", "culture", "exhibition", "gallery", "theatre", "theater", "museum", "ባህል", "ሙዚየም"],
  "food-drink": ["food", "drink", "tasting", "culinary", "restaurant", "dinner", "brunch", "ምግብ", "ሻይ"],
  community: ["community", "charity", "fundraiser", "meetup", "neighborhood", "local", "ማህበረሰብ", "በጎ"],
};

const EN_TO_AM: [RegExp, string][] = [
  [/\bevent\b/gi, "ዝግጅት"],
  [/\bticket\b/gi, "ትኬት"],
  [/\bconcert\b/gi, "ኮንሰርት"],
  [/\bworkshop\b/gi, "ስልጠና"],
  [/\bconference\b/gi, "ኮንፈረንስ"],
  [/\bwelcome\b/gi, "እንኳን ደህና መጡ"],
  [/\bjoin us\b/gi, "ይቀላቀሉን"],
];

const AM_TO_EN: [RegExp, string][] = [
  [/ዝግጅት/g, "event"],
  [/ትኬት/g, "ticket"],
  [/ኮንሰርት/g, "concert"],
  [/ስልጠና/g, "workshop"],
  [/ኮንፈረንስ/g, "conference"],
  [/እንኳን ደህና መጡ/g, "welcome"],
  [/ይቀላቀሉን/g, "join us"],
];

function scoreCategory(text: string, category: CategoryCandidate): number {
  const haystack = `${text} ${category.name} ${category.description ?? ""}`.toLowerCase();
  const slug = category.slug.toLowerCase();
  let score = 0;

  const keywords = CATEGORY_KEYWORDS[slug] ?? [];
  for (const kw of keywords) {
    if (haystack.includes(kw.toLowerCase())) score += 2;
  }
  if (haystack.includes(category.name.toLowerCase())) score += 3;
  if (category.description && haystack.includes(category.description.toLowerCase().slice(0, 20))) {
    score += 1;
  }

  return score;
}

function applyPhraseMap(text: string, pairs: [RegExp, string][]) {
  let out = text;
  for (const [pattern, replacement] of pairs) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export const heuristicProvider: AiProvider = {
  name: "heuristic",

  async suggestCategory(input) {
    if (input.categories.length === 0) return null;

    const text = `${input.title ?? ""} ${input.description}`.trim();
    const ranked = input.categories
      .map((c) => ({ category: c, score: scoreCategory(text, c) }))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    if (!best || best.score <= 0) {
      const fallback = input.categories[0];
      return {
        categoryId: fallback.id,
        categoryName: fallback.name,
        categorySlug: fallback.slug,
        confidence: 0.35,
        reasoning: "No strong keyword match; defaulting to first available category.",
        provider: "heuristic",
        fallback: true,
      };
    }

    const confidence = Math.min(0.92, 0.4 + best.score * 0.08);
    return {
      categoryId: best.category.id,
      categoryName: best.category.name,
      categorySlug: best.category.slug,
      confidence,
      reasoning: `Matched keywords related to “${best.category.name}”.`,
      provider: "heuristic",
      fallback: best.score < 3,
    };
  },

  async translate(input) {
    const trimmed = input.text.trim();
    if (!trimmed) return null;

    let translated = trimmed;
    if (input.fromLang === "en" && input.toLang === "am") {
      translated = applyPhraseMap(trimmed, EN_TO_AM);
      if (translated === trimmed) {
        translated = `[Amharic — heuristic] ${trimmed}`;
      }
    } else if (input.fromLang === "am" && input.toLang === "en") {
      translated = applyPhraseMap(trimmed, AM_TO_EN);
      if (translated === trimmed) {
        translated = `[English — heuristic] ${trimmed}`;
      }
    }

    return {
      translatedText: translated,
      fromLang: input.fromLang,
      toLang: input.toLang,
      provider: "heuristic",
      fallback: true,
    };
  },
};
