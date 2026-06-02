import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { routing, isAppLocale } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !isAppLocale(locale)) {
    const cookieStore = await cookies();
    const fromCookie = cookieStore.get("NEXT_LOCALE")?.value;
    locale = fromCookie && isAppLocale(fromCookie) ? fromCookie : routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
