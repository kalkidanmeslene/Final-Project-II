import { unstable_cache } from "next/cache";
import { getDiscoverHome, getFeaturedEvents, getTrendingEvents } from "./discovery.service";

const REVALIDATE_SECONDS = 60;

export const getCachedFeaturedEvents = unstable_cache(
  async () => getFeaturedEvents(6),
  ["discovery", "featured"],
  { revalidate: REVALIDATE_SECONDS, tags: ["events", "discovery-featured"] },
);

export const getCachedTrendingEvents = unstable_cache(
  async () => getTrendingEvents(8),
  ["discovery", "trending"],
  { revalidate: REVALIDATE_SECONDS, tags: ["events", "discovery-trending"] },
);

export const getCachedDiscoverHome = unstable_cache(
  async () => getDiscoverHome(),
  ["discovery", "home"],
  { revalidate: REVALIDATE_SECONDS, tags: ["events", "discovery-home"] },
);
