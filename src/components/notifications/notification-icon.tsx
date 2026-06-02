import type { NotificationType } from "@prisma/client";
import {
  Bell,
  Calendar,
  CheckCircle,
  Megaphone,
  Ticket,
  UserPlus,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export function notificationCategory(type: NotificationType) {
  if (type.startsWith("booking_")) return "booking";
  if (type.startsWith("ticket_")) return "transfer";
  if (type === "event_reminder") return "reminder";
  if (type === "organizer_announcement") return "announcement";
  if (type.startsWith("event_")) return "event";
  return "system";
}

export function notificationIcon(type: NotificationType): LucideIcon {
  switch (type) {
    case "booking_confirmed":
      return CheckCircle;
    case "booking_failed":
      return XCircle;
    case "ticket_transferred":
    case "ticket_received":
      return UserPlus;
    case "event_reminder":
      return Calendar;
    case "organizer_announcement":
      return Megaphone;
    case "event_cancelled":
      return XCircle;
    default:
      return type.startsWith("event_") ? Bell : Ticket;
  }
}

export function notificationIconStyles(type: NotificationType) {
  const category = notificationCategory(type);
  switch (category) {
    case "booking":
      return "bg-success/10 text-success";
    case "transfer":
      return "bg-accent/10 text-accent";
    case "reminder":
      return "bg-primary/10 text-primary";
    case "announcement":
      return "bg-amber-500/10 text-amber-700";
    case "event":
      return "bg-primary/10 text-primary";
    default:
      return "bg-secondary text-muted-foreground";
  }
}
