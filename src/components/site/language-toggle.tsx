import { LanguageSwitcher } from "@/components/locale/language-switcher";

export function LanguageToggle(props: { className?: string }) {
  return <LanguageSwitcher {...props} variant="toggle" />;
}

export function LanguagePills(props: { className?: string }) {
  return <LanguageSwitcher {...props} variant="pills" />;
}
