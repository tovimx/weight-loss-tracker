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
import { format, parseISO } from 'date-fns'
import { useAuth } from './hooks/useAuth'
import { useWeightEntries } from './hooks/useWeightEntries'
import { useGoals } from './hooks/useGoals'
import { useChartData } from './hooks/useChartData'
import { useToast } from './components/Toast'
import { DatePicker } from './components/DatePicker'
import { LoginScreen } from './components/LoginScreen'
import { GoalSetup } from './components/GoalSetup'
import { formatElapsedTime, formatDateShort, formatDateLong } from './utils/formatting'
import { getWeightBounds, isWeightInRange, getGoalDirection } from './utils/validation'
import './App.css'

function App() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth()
  const { entries, loading: dataLoading, addEntry, removeEntry } = useWeightEntries(user?.uid)
  const { goals, loading: goalsLoading, error: goalsError, saveGoals } = useGoals(user?.uid)
  const { showToast } = useToast()

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [weight, setWeight] = useState('')
  const [editingGoals, setEditingGoals] = useState(false)

  // Use dummy values for hooks that need goals data — they'll only render when goals exist
  const safeGoals = goals ?? { startDate: '', targetDate: '', startWeight: 0, targetWeight: 0 }
  const { chartData, totalDays, ticks, formatXAxis } = useChartData(
    entries,
    safeGoals.startDate,
    safeGoals.targetDate
  )

  if (authLoading) {
    return (
      <div className="app loading-screen">
        <div className="loading-spinner" />
        <p>Cargando...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onSignIn={signInWithGoogle} />
  }

  if (goalsLoading) {
    return (
      <div className="app loading-screen">
        <div className="loading-spinner" />
        <p>Cargando...</p>
      </div>
    )
  }

  if (goalsError) {
    return (
      <div className="app loading-screen">
        <p>No se pudieron cargar las metas.</p>
        <button className="submit-btn" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    )
  }

  if (!goals) {
    return <GoalSetup onSave={saveGoals} />
  }

  const { startDate, targetDate, startWeight, targetWeight } = goals
  const direction = getGoalDirection(startWeight, targetWeight)
  const { min: weightMin, max: weightMax } = getWeightBounds(startWeight, targetWeight)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!weight || !date) return

    const weightNum = parseFloat(weight)
    if (!isWeightInRange(weightNum, startWeight, targetWeight)) {
      showToast(`El peso debe estar entre ${weightMin} y ${weightMax} kg`)
      return
    }

    try {
      await addEntry({ date, weight: weightNum })
      setWeight('')
    } catch {
      showToast('No se pudo guardar el registro. Intenta de nuevo.')
    }
  }

  const handleDelete = async (dateToDelete: string) => {
    try {
      await removeEntry(dateToDelete)
    } catch {
      showToast('No se pudo eliminar el registro. Intenta de nuevo.')
    }
  }

  const weightChange =
    entries.length >= 2
      ? Math.abs(entries[0].weight - entries[entries.length - 1].weight).toFixed(1)
      : null

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>Control de Peso</h1>
          <p className="subtitle">
            Meta: {startWeight}kg → {targetWeight}kg para el {formatDateLong(targetDate)}
            <button
              className="edit-goals-btn"
              onClick={() => setEditingGoals(true)}
              title="Editar metas"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </p>
        </div>
        <button className="sign-out-btn" onClick={signOut} title="Cerrar sesión">
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

      {editingGoals && (
        <GoalSetup
          onSave={async (newGoals) => {
            await saveGoals(newGoals)
            setEditingGoals(false)
          }}
          initialGoals={goals}
          isEditing
          onCancel={() => setEditingGoals(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="form">
        <div className="input-group">
          <label htmlFor="date">Fecha</label>
          <DatePicker
            value={date}
            onChange={setDate}
            minDate={startDate}
            maxDate={targetDate}
          />
        </div>
        <div className="input-group">
          <label htmlFor="weight">Peso (kg)</label>
          <input
            type="number"
            id="weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="ej. 140.5"
            step="0.1"
            min={weightMin}
            max={weightMax}
          />
        </div>
        <button type="submit" className="submit-btn" disabled={dataLoading}>
          {dataLoading ? 'Guardando...' : 'Agregar Registro'}
        </button>
      </form>

      {weightChange && (
        <div className="stats">
          <div className="stat-card">
            <span className="stat-value">{weightChange} kg</span>
            <span className="stat-label">{direction === 'loss' ? 'Total Perdido' : 'Total Ganado'}</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{entries.length}</span>
            <span className="stat-label">Registros</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {entries[entries.length - 1]?.weight} kg
            </span>
            <span className="stat-label">Actual</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {formatElapsedTime(parseISO(startDate), new Date())}
            </span>
            <span className="stat-label">Tiempo</span>
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
              ticks={ticks}
              tickFormatter={formatXAxis}
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis
              domain={[weightMin, weightMax]}
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
              formatter={(value) => [`${value} kg`, 'Peso']}
              labelFormatter={(dayNumber) => formatXAxis(dayNumber as number)}
            />
            <ReferenceLine
              y={targetWeight}
              stroke="#4ecdc4"
              strokeDasharray="5 5"
              label={{
                value: 'Meta',
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
          <h2>Registro de Peso</h2>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Peso</th>
                <th>Cambio</th>
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
                const changeNum = change ? parseFloat(change) : 0
                const isPositiveChange =
                  direction === 'loss' ? changeNum < 0 : changeNum > 0
                const isNegativeChange =
                  direction === 'loss' ? changeNum > 0 : changeNum < 0
                return (
                  <tr key={entry.date}>
                    <td>{formatDateShort(entry.date)}</td>
                    <td>{entry.weight} kg</td>
                    <td
                      className={
                        change
                          ? isPositiveChange
                            ? 'positive'
                            : isNegativeChange
                              ? 'negative'
                              : ''
                          : ''
                      }
                    >
                      {change
                        ? `${changeNum > 0 ? '+' : ''}${change} kg`
                        : '—'}
                    </td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(entry.date)}
                        aria-label="Eliminar registro"
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
