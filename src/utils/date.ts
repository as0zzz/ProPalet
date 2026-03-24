import { format } from "date-fns";
import { ru } from "date-fns/locale";

export function formatDateTime(timestamp: number): string {
  return format(new Date(timestamp), "dd.MM.yyyy HH:mm", { locale: ru });
}

export function formatDateOnly(timestamp: number): string {
  return format(new Date(timestamp), "dd.MM.yyyy", { locale: ru });
}

export function startOfTodayTimestamp(): number {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}
