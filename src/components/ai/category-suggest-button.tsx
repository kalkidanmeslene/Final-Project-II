"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAiJobPoll, useAiStatus, useCategorySuggestion } from "@/hooks/use-ai";
import type { CategorySuggestionResult } from "@/lib/ai/ai.types";

type Props = {
  description: string;
  title?: string;
  categoryIds?: string[];
  currentCategoryId?: string;
  onApply: (categoryId: string) => void;
  minLength?: number;
};

export function CategorySuggestButton({
  description,
  title,
  categoryIds,
  currentCategoryId,
  onApply,
  minLength = 30,
}: Props) {
  const { data: status } = useAiStatus();
  const suggest = useCategorySuggestion();
  const [suggestion, setSuggestion] = useState<CategorySuggestionResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [asyncJobId, setAsyncJobId] = useState<string | null>(null);

  const jobQuery = useAiJobPoll(asyncJobId, !!asyncJobId);

  const trimmed = description.trim();
  const canSuggest = trimmed.length >= minLength;
  const loading = suggest.isPending || jobQuery.isFetching;

  async function runSuggest(useAsync: boolean) {
    setNotice(null);
    setSuggestion(null);
    setAsyncJobId(null);

    try {
      const res = await suggest.mutateAsync({
        description: trimmed,
        title,
        categoryIds,
        async: useAsync,
      });

      if ("async" in res) {
        setAsyncJobId(res.job.id);
        setNotice("Suggestion is processing…");
        return;
      }

      if (res.available) {
        setSuggestion(res.suggestion);
        if (res.fallback) {
          setNotice("Used offline keyword matching (AI provider unavailable).");
        }
      } else {
        setNotice(res.message ?? "Could not suggest a category. Pick one manually.");
      }
    } catch {
      setNotice("AI assist is temporarily unavailable. You can still save your event.");
    }
  }

  const job = jobQuery.data?.job;

  useEffect(() => {
    if (!job) return;
    if (job.status === "completed" && job.result) {
      setSuggestion(job.result as CategorySuggestionResult);
      setNotice(job.provider === "heuristic" ? "Used offline keyword matching." : null);
      setAsyncJobId(null);
    }
    if (job.status === "failed") {
      setNotice(job.errorMessage ?? "Suggestion failed. Pick a category manually.");
      setAsyncJobId(null);
    }
  }, [job]);

  if (status && !status.enabled) return null;

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-dashed border-border bg-secondary/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canSuggest || loading}
          onClick={() => void runSuggest(false)}
        >
          {loading ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-1 h-3.5 w-3.5" />
          )}
          Suggest category
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!canSuggest || loading}
          onClick={() => void runSuggest(true)}
          title="Process in background (async)"
        >
          Async
        </Button>
        {suggest.isError && (
          <Button type="button" size="sm" variant="ghost" onClick={() => void runSuggest(false)}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Retry
          </Button>
        )}
      </div>

      {!canSuggest && (
        <p className="text-xs text-muted-foreground">Add at least {minLength} characters in the description to get a suggestion.</p>
      )}

      {notice && <p className="text-xs text-muted-foreground">{notice}</p>}

      {suggestion && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>Suggested:</span>
          <Badge variant="info">{suggestion.categoryName}</Badge>
          <span className="text-xs text-muted-foreground">
            {Math.round(suggestion.confidence * 100)}% confidence
            {suggestion.fallback ? " · fallback" : ""}
          </span>
          {suggestion.categoryId !== currentCategoryId && (
            <Button type="button" size="sm" onClick={() => onApply(suggestion.categoryId)}>
              Apply
            </Button>
          )}
          {suggestion.categoryId === currentCategoryId && (
            <span className="text-xs text-muted-foreground">Already selected</span>
          )}
        </div>
      )}
    </div>
  );
}
