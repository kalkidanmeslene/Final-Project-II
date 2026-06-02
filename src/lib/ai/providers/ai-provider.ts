import type {
  AiLanguage,
  AiProviderName,
  CategoryCandidate,
  CategorySuggestionResult,
  TranslationResult,
} from "../ai.types";

export type CategorySuggestInput = {
  title?: string;
  description: string;
  categories: CategoryCandidate[];
};

export type TranslateInput = {
  text: string;
  fromLang: AiLanguage;
  toLang: AiLanguage;
};

export interface AiProvider {
  readonly name: AiProviderName;
  suggestCategory(input: CategorySuggestInput): Promise<CategorySuggestionResult | null>;
  translate(input: TranslateInput): Promise<TranslationResult | null>;
}
