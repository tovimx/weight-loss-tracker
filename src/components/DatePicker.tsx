import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, parseISO } from 'date-fns'
import 'react-day-picker/style.css'
import './DatePicker.css'

interface DatePickerProps {
  value: string // yyyy-MM-dd format
  onChange: (date: string) => void
  minDate: string
  maxDate: string
}

export function DatePicker({ value, onChange, minDate, maxDate }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedDate = parseISO(value)
  const min = parseISO(minDate)
  const max = parseISO(maxDate)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'))
      setIsOpen(false)
    }
  }

  return (
    <div className="date-picker-container" ref={containerRef}>
      <button
        type="button"
        className="date-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        {format(selectedDate, 'MMM d, yyyy')}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {isOpen && (
        <div className="date-picker-popover">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={{ before: min, after: max }}
            defaultMonth={selectedDate}
            showOutsideDays
            fixedWeeks
          />
        </div>
      )}
    </div>
  )
}
