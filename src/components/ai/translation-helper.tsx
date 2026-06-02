"use client";

import { useEffect, useState } from "react";
import { Languages, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAiJobPoll, useAiStatus, useAiTranslation } from "@/hooks/use-ai";
import type { AiLanguage, TranslationResult } from "@/lib/ai/ai.types";

type Props = {
  text: string;
  onApply: (text: string) => void;
  label?: string;
};

export function TranslationHelper({ text, onApply, label = "Description" }: Props) {
  const { data: status } = useAiStatus();
  const translate = useAiTranslation();
  const [fromLang, setFromLang] = useState<AiLanguage>("en");
  const [toLang, setToLang] = useState<AiLanguage>("am");
  const [preview, setPreview] = useState<TranslationResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [asyncJobId, setAsyncJobId] = useState<string | null>(null);

  const jobQuery = useAiJobPoll(asyncJobId, !!asyncJobId);
  const trimmed = text.trim();
  const loading = translate.isPending || jobQuery.isFetching;

  function swapLanguages() {
    setFromLang(toLang);
    setToLang(fromLang);
    setPreview(null);
    setNotice(null);
  }

  async function runTranslate(useAsync: boolean) {
    setPreview(null);
    setNotice(null);
    setAsyncJobId(null);

    if (!trimmed) {
      setNotice(`Enter ${label.toLowerCase()} text first.`);
      return;
    }

    try {
      const res = await translate.mutateAsync({
        text: trimmed,
        fromLang,
        toLang,
        async: useAsync,
      });

      if ("async" in res) {
        setAsyncJobId(res.job.id);
        setNotice("Translation is processing…");
        return;
      }

      if (res.available) {
        setPreview(res.translation);
        if (res.fallback) {
          setNotice("Basic offline translation (AI provider unavailable). Review before applying.");
        }
      } else {
        setNotice(res.message ?? "Translation unavailable. Original text unchanged.");
      }
    } catch {
      setNotice("Translation service unavailable. Your original text is unchanged.");
    }
  }

  const job = jobQuery.data?.job;

  useEffect(() => {
    if (!job) return;
    if (job.status === "completed" && job.result) {
      setPreview(job.result as TranslationResult);
      setAsyncJobId(null);
    }
    if (job.status === "failed") {
      setNotice(job.errorMessage ?? "Translation failed.");
      setAsyncJobId(null);
    }
  }, [job]);

  if (status && !status.enabled) return null;

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-dashed border-border bg-secondary/20 p-3">
      <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Languages className="h-3.5 w-3.5" />
        Optional translation (English ↔ Amharic)
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={fromLang}
          onChange={(e) => setFromLang(e.target.value as AiLanguage)}
          className="rounded-md border border-input bg-background px-2 py-1 text-xs"
          aria-label="From language"
        >
          <option value="en">English</option>
          <option value="am">Amharic</option>
        </select>
        <button type="button" className="text-xs text-primary hover:underline" onClick={swapLanguages}>
          ↔
        </button>
        <select
          value={toLang}
          onChange={(e) => setToLang(e.target.value as AiLanguage)}
          className="rounded-md border border-input bg-background px-2 py-1 text-xs"
          aria-label="To language"
        >
          <option value="en">English</option>
          <option value="am">Amharic</option>
        </select>
        <Button type="button" size="sm" variant="outline" disabled={!trimmed || loading || fromLang === toLang} onClick={() => void runTranslate(false)}>
          {loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
          Translate
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={!trimmed || loading} onClick={() => void runTranslate(true)}>
          Async
        </Button>
        {translate.isError && (
          <Button type="button" size="sm" variant="ghost" onClick={() => void runTranslate(false)}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Retry
          </Button>
        )}
      </div>

      {fromLang === toLang && (
        <p className="text-xs text-amber-600 dark:text-amber-400">Choose different source and target languages.</p>
      )}

      {notice && <p className="text-xs text-muted-foreground">{notice}</p>}

      {preview && (
        <div className="space-y-2 rounded-md border border-border bg-card p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{preview.provider}</Badge>
            {preview.fallback && <Badge variant="warning">fallback</Badge>}
          </div>
          <p className="whitespace-pre-wrap text-foreground/90">{preview.translatedText}</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={() => onApply(preview.translatedText)}>
              Apply translation
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setPreview(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
