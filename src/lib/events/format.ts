export function formatEventDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "ETB" }).format(amount);
}

export function toDateInputValue(iso: string) {
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
}

export function toTimeInputValue(iso: string) {
  const d = new Date(iso);
  return d.toTimeString().slice(0, 5);
}
