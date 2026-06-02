import type { EventMediaType, EventStatus, EventVisibility } from "@prisma/client";

export type EventAvailability = {
  capacity: number;
  sold: number;
  available: number;
};

export type EventMediaDto = {
  id: string;
  url: string;
  mediaType: EventMediaType;
  sortOrder: number;
};

export type EventCategoryDto = {
  id: string;
  name: string;
  slug: string;
};

export type EventListItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: EventCategoryDto;
  location: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  ticketPrice: number;
  capacity: number;
  bannerUrl: string | null;
  status: EventStatus;
  visibility: EventVisibility;
  transferEnabled: boolean;
  isFeatured: boolean;
  ticketsSold: number;
  availability: EventAvailability;
  organizer: { id: string; fullName: string };
  averageRating: number | null;
  reviewCount: number;
};

export type EventDetail = EventListItem & {
  reviewNote: string | null;
  postponedAt: string | null;
  postponeReason: string | null;
  gallery: EventMediaDto[];
  createdAt: string;
  updatedAt: string;
};
