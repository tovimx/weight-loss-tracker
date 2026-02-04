import { useMemo } from 'react'
import { parseISO, differenceInDays, format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { WeightEntry } from '../services/weightService'

export function useChartData(entries: WeightEntry[], startDate: string, targetDate: string) {
  const totalDays = differenceInDays(parseISO(targetDate), parseISO(startDate))

  const chartData = useMemo(
    () =>
      entries.map((entry) => ({
        ...entry,
        dateFormatted: format(parseISO(entry.date), 'd MMM', { locale: es }),
        dayNumber: differenceInDays(parseISO(entry.date), parseISO(startDate)),
      })),
    [entries, startDate]
  )

  const ticks = useMemo(() => {
    const result = []
    for (let i = 0; i <= totalDays; i += 14) {
      result.push(i)
    }
    if (result[result.length - 1] !== totalDays) {
      result.push(totalDays)
    }
    return result
  }, [totalDays])

  const formatXAxis = useMemo(() => {
    const start = parseISO(startDate)
    return (dayNumber: number) => {
      const d = new Date(start)
      d.setDate(d.getDate() + dayNumber)
      return format(d, 'd MMM', { locale: es })
    }
  }, [startDate])

  return { chartData, totalDays, ticks, formatXAxis }
}
