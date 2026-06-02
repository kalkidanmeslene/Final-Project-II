import { getCachedDiscoverHome } from "@/lib/discovery/discovery.cache";

export default async function HomePage() {
  const initial = await getCachedDiscoverHome();
  const { default: LandingPageClient } = await import("./landing-page-client");
  return <LandingPageClient initial={initial} />;
}
