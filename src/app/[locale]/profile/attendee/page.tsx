"use client";

import Link from "next/link";
import { useState } from "react";
import { User, Ticket, Heart, Settings } from "lucide-react";
import { AttendeeTicketsList } from "@/components/booking/attendee-tickets-list";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { useProfile } from "@/hooks/use-profile";
import { useMyTickets } from "@/hooks/use-booking";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type TabId = "tickets" | "favorites" | "settings";

export default function AttendeeProfilePage() {
  const [activeTab, setActiveTab] = useState<TabId>("tickets");
  const { profile, isLoading: profileLoading } = useProfile();
  const { data: ticketsData, isLoading: ticketsLoading } = useMyTickets();

  const tabs = [
    { id: "tickets" as const, label: "My Tickets", icon: Ticket, count: ticketsData?.tickets.length },
    { id: "favorites" as const, label: "Favorites", icon: Heart, count: 0 },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          {profileLoading ? (
            <Spinner label="Loading profile" />
          ) : profile ? (
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary">
                <User className="h-10 w-10 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{profile.fullName}</h1>
                <p className="text-muted-foreground">{profile.email ?? "No email"}</p>
                {profile.phoneNumber && (
                  <p className="mt-1 text-sm text-muted-foreground">{profile.phoneNumber}</p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-xl px-6 py-3 font-semibold transition-all",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "border border-border bg-card text-foreground hover:bg-secondary",
                )}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      "ml-1 rounded-full px-2 py-0.5 text-xs",
                      activeTab === tab.id
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab === "tickets" && (
          <>
            {ticketsLoading && <Spinner label="Loading tickets" />}
            {ticketsData && ticketsData.tickets.length === 0 && (
              <div className="py-12 text-center">
                <Ticket className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold">No tickets yet</h3>
                <p className="mb-6 text-muted-foreground">Browse events to book your first ticket.</p>
                <Link href="/events">
                  <Button>Browse Events</Button>
                </Link>
              </div>
            )}
            {ticketsData && ticketsData.tickets.length > 0 && (
              <AttendeeTicketsList tickets={ticketsData.tickets} />
            )}
          </>
        )}

        {activeTab === "favorites" && (
          <div className="py-12 text-center">
            <Heart className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">No favorites yet</h3>
            <p className="mb-6 text-muted-foreground">
              Start adding events to your favorites to see them here
            </p>
            <Link href="/events">
              <Button>Browse Events</Button>
            </Link>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold">Account Settings</h2>
            <EditProfileForm />
            <p className="mt-6 text-sm text-muted-foreground">
              <Link href="/profile/settings" className="text-primary hover:underline">
                Full account settings
              </Link>{" "}
              including password change.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
