"use client";

import { useLocale } from "next-intl";
import { Logo } from "@/components/site/logo";
import { LanguagePills } from "@/components/site/language-toggle";

export function AuthPageHeader({
  subtitleEn,
  subtitleAm,
}: {
  subtitleEn: string;
  subtitleAm: string;
}) {
  const locale = useLocale();

  return (
    <>
      <div className="mb-8 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <p className="mt-4 text-muted-foreground">{locale === "en" ? subtitleEn : subtitleAm}</p>
      </div>
      <LanguagePills className="mb-6" />
    </>
  );
}
