import {
  format,
  parseISO,
  differenceInMonths,
  addMonths,
  differenceInWeeks,
  addWeeks,
  differenceInDays,
} from 'date-fns'
import { es } from 'date-fns/locale'

export function formatElapsedTime(from: Date, to: Date): string {
  let cursor = from
  const months = differenceInMonths(to, cursor)
  if (months > 0) cursor = addMonths(cursor, months)

  const weeks = differenceInWeeks(to, cursor)
  if (weeks > 0) cursor = addWeeks(cursor, weeks)

  const days = differenceInDays(to, cursor)

  if (months > 0) {
    return weeks > 0 ? `${months}m ${weeks}s` : days > 0 ? `${months}m ${days}d` : `${months}m`
  }
  return weeks > 0 ? `${weeks}s ${days}d` : `${days}d`
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM', { locale: es })
}

export function formatDateLong(dateStr: string): string {
  return format(parseISO(dateStr), "d 'de' MMMM, yyyy", { locale: es })
}
