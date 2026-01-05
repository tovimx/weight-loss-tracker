import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { format, parseISO, differenceInDays } from 'date-fns'
import { useAuth } from './hooks/useAuth'
import { useWeightEntries } from './hooks/useWeightEntries'
import { DatePicker } from './components/DatePicker'
import { LoginScreen } from './components/LoginScreen'
import './App.css'

const START_DATE = '2026-01-04'
const END_DATE = '2026-05-04'
const MAX_WEIGHT = 142
const MIN_WEIGHT = 115

function App() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth()
  const { entries, loading: dataLoading, addEntry, removeEntry } = useWeightEntries(user?.uid)

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [weight, setWeight] = useState('')

  // Show login screen if not authenticated
  if (authLoading) {
    return (
      <div className="app loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onSignIn={signInWithGoogle} />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!weight || !date) return

    const weightNum = parseFloat(weight)
    if (weightNum < MIN_WEIGHT || weightNum > MAX_WEIGHT) {
      alert(`Weight must be between ${MIN_WEIGHT} and ${MAX_WEIGHT} kg`)
      return
    }

    try {
      await addEntry({ date, weight: weightNum })
      setWeight('')
    } catch (error) {
      console.error('Failed to save entry:', error)
      alert('Failed to save entry. Please try again.')
    }
  }

  const handleDelete = async (dateToDelete: string) => {
    try {
      await removeEntry(dateToDelete)
    } catch (error) {
      console.error('Failed to delete entry:', error)
      alert('Failed to delete entry. Please try again.')
    }
  }

  const chartData = entries.map((entry) => ({
    ...entry,
    dateFormatted: format(parseISO(entry.date), 'MMM d'),
    dayNumber: differenceInDays(parseISO(entry.date), parseISO(START_DATE)),
  }))

  const totalDays = differenceInDays(parseISO(END_DATE), parseISO(START_DATE))

  const generateTicks = () => {
    const ticks = []
    for (let i = 0; i <= totalDays; i += 14) {
      ticks.push(i)
    }
    if (ticks[ticks.length - 1] !== totalDays) {
      ticks.push(totalDays)
    }
    return ticks
  }

  const formatXAxis = (dayNumber: number) => {
    const date = new Date(parseISO(START_DATE))
    date.setDate(date.getDate() + dayNumber)
    return format(date, 'MMM d')
  }

  const weightLost =
    entries.length >= 2
      ? (entries[0].weight - entries[entries.length - 1].weight).toFixed(1)
      : null

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>Weight Loss Tracker</h1>
          <p className="subtitle">
            Goal: {MAX_WEIGHT}kg → {MIN_WEIGHT}kg by May 4th, 2026
          </p>
        </div>
        <button className="sign-out-btn" onClick={signOut} title="Sign out">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </header>

      <form onSubmit={handleSubmit} className="form">
        <div className="input-group">
          <label htmlFor="date">Date</label>
          <DatePicker
            value={date}
            onChange={setDate}
            minDate={START_DATE}
            maxDate={END_DATE}
          />
        </div>
        <div className="input-group">
          <label htmlFor="weight">Weight (kg)</label>
          <input
            type="number"
            id="weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g., 140.5"
            step="0.1"
            min={MIN_WEIGHT}
            max={MAX_WEIGHT}
          />
        </div>
        <button type="submit" className="submit-btn" disabled={dataLoading}>
          {dataLoading ? 'Saving...' : 'Add Entry'}
        </button>
      </form>

      {weightLost && (
        <div className="stats">
          <div className="stat-card">
            <span className="stat-value">{weightLost} kg</span>
            <span className="stat-label">Total Lost</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{entries.length}</span>
            <span className="stat-label">Entries</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {entries[entries.length - 1]?.weight} kg
            </span>
            <span className="stat-label">Current</span>
          </div>
        </div>
      )}

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#4ecdc4" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="dayNumber"
              type="number"
              domain={[0, totalDays]}
              ticks={generateTicks()}
              tickFormatter={formatXAxis}
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis
              domain={[MIN_WEIGHT, MAX_WEIGHT]}
              reversed={false}
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(value) => `${value}kg`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f3f4f6',
              }}
              formatter={(value) => [`${value} kg`, 'Weight']}
              labelFormatter={(dayNumber) => formatXAxis(dayNumber as number)}
            />
            <ReferenceLine
              y={MIN_WEIGHT}
              stroke="#4ecdc4"
              strokeDasharray="5 5"
              label={{
                value: 'Goal',
                position: 'right',
                fill: '#4ecdc4',
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="url(#weightGradient)"
              strokeWidth={3}
              dot={{
                fill: '#f3f4f6',
                stroke: '#4ecdc4',
                strokeWidth: 2,
                r: 6,
              }}
              activeDot={{
                fill: '#4ecdc4',
                stroke: '#f3f4f6',
                strokeWidth: 2,
                r: 8,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {entries.length > 0 && (
        <div className="entries-table">
          <h2>Weight Log</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Weight</th>
                <th>Change</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...entries].reverse().map((entry, index) => {
                const reversedIndex = entries.length - 1 - index
                const prevEntry = entries[reversedIndex - 1]
                const change = prevEntry
                  ? (entry.weight - prevEntry.weight).toFixed(1)
                  : null
                return (
                  <tr key={entry.date}>
                    <td>{format(parseISO(entry.date), 'MMM d')}</td>
                    <td>{entry.weight} kg</td>
                    <td
                      className={
                        change
                          ? parseFloat(change) < 0
                            ? 'positive'
                            : parseFloat(change) > 0
                              ? 'negative'
                              : ''
                          : ''
                      }
                    >
                      {change
                        ? `${parseFloat(change) > 0 ? '+' : ''}${change} kg`
                        : '—'}
                    </td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(entry.date)}
                        aria-label="Delete entry"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default App
