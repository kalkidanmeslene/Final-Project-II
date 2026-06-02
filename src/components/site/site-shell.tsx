"use client";

import { Navbar } from "@/components/site/navbar";
import { MobileNav } from "@/components/site/mobile-nav";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-20 md:pb-0">{children}</main>
      <MobileNav />
    </div>
  );
}
