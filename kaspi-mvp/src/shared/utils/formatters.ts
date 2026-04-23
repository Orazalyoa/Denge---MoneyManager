export function formatKZT(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value) + " ₸";
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
