"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calendar, Ticket, Shield, Search } from "lucide-react";
import { EventSearchBar } from "@/components/discovery/event-search-bar";
import { EventSection } from "@/components/discovery/event-section";
import { useDiscoverHome } from "@/hooks/use-events";
import type { DiscoverHomePayload } from "@/lib/discovery/discovery.types";

export default function LandingPageClient({ initial }: { initial?: DiscoverHomePayload }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading } = useDiscoverHome();

  const payload = data ?? initial;
  const categories = payload?.categories ?? [];
  const featuredEvents = payload?.featured ?? [];
  const trendingEvents = payload?.trending ?? [];

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/events?q=${encodeURIComponent(q)}` : "/events");
  }

  return (
    <div>
      <section className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="absolute inset-0 opacity-10">
          <img
            src="https://images.unsplash.com/photo-1662894312546-667d7698a1f7?w=1200"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-32 lg:px-8">
          <div className="space-y-6 text-center">
            <h1 className="text-4xl font-bold md:text-6xl">
              Discover Amazing Events <br />
              <span className="text-accent">in Ethiopia</span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-primary-foreground/90 md:text-2xl">
              Book tickets securely with QR verification
              <br />
              <span className="text-base">በኢትዮጵያ ውስጥ አስደናቂ ዝግጅቶችን ያግኙ</span>
            </p>
            <EventSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={onSearch}
              size="hero"
              placeholder="Search events, organizers, venues..."
            />
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-2xl font-bold md:text-3xl">Browse by Category</h2>
          <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-4">
            {categories.map((category) => (
              <Link key={category.slug} href={`/events?category=${category.slug}`} className="shrink-0">
                <div className="cursor-pointer rounded-xl border border-border bg-card px-6 py-3 whitespace-nowrap transition-all hover:bg-primary hover:text-primary-foreground">
                  <span className="font-semibold">{category.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bg-secondary/30 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <EventSection
            title="Featured Events"
            subtitle="Hand-picked highlights from organizers"
            events={featuredEvents}
            isLoading={isLoading && !initial}
            viewAllHref="/events?sort=date"
            emptyMessage="Featured events will appear here soon."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <EventSection
          title="Trending Events"
          subtitle="Popular events based on ticket sales"
          events={trendingEvents}
          isLoading={isLoading && !initial}
          viewAllHref="/events?sort=popularity"
          emptyMessage="Trending events will appear as tickets are sold."
        />
      </section>

      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold">Why Choose Hibir Events?</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Ticket, title: "Easy Booking", text: "Book tickets in seconds with our streamlined process" },
              { icon: Shield, title: "Secure QR Codes", text: "Unique QR codes prevent fraud and ensure authenticity" },
              { icon: Calendar, title: "Local Events", text: "Discover the best events happening in Ethiopia" },
              { icon: Search, title: "Easy Discovery", text: "Find events by category, date, location, or organizer" },
            ].map((item) => (
              <div key={item.title} className="space-y-3 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                  <item.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-primary-foreground/80">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
