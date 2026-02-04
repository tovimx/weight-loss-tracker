import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'
import { ToastProvider } from '../components/Toast'

// Mock all hooks
const mockAuth = {
  user: null as { uid: string } | null,
  loading: false,
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
}

const mockEntries = {
  entries: [] as { date: string; weight: number }[],
  loading: false,
  error: null,
  addEntry: vi.fn(),
  removeEntry: vi.fn(),
}

const mockGoals = {
  goals: null as {
    startWeight: number
    targetWeight: number
    startDate: string
    targetDate: string
  } | null,
  loading: false,
  error: null as Error | null,
  saveGoals: vi.fn(),
}

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockAuth,
}))

vi.mock('../hooks/useWeightEntries', () => ({
  useWeightEntries: () => mockEntries,
}))

vi.mock('../hooks/useGoals', () => ({
  useGoals: () => mockGoals,
}))

// Mock DatePicker to avoid date-fns issues with react-day-picker in jsdom
vi.mock('../components/DatePicker', () => ({
  DatePicker: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input type="date" value={value} onChange={(e) => onChange(e.target.value)} data-testid="date-picker" />
  ),
}))

// Mock recharts to avoid canvas issues in jsdom
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ReferenceLine: () => null,
}))

function renderApp() {
  return render(
    <ToastProvider>
      <App />
    </ToastProvider>
  )
}

beforeEach(() => {
  mockAuth.user = null
  mockAuth.loading = false
  mockEntries.entries = []
  mockEntries.loading = false
  mockGoals.goals = null
  mockGoals.loading = false
  mockGoals.error = null
})

describe('App', () => {
  it('shows loading spinner when auth is loading', () => {
    mockAuth.loading = true
    renderApp()
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('shows login screen when not authenticated', () => {
    renderApp()
    // LoginScreen should be rendered — check for its presence
    expect(screen.getByText(/Iniciar sesión/i)).toBeInTheDocument()
  })

  it('shows goal setup when authenticated but no goals', () => {
    mockAuth.user = { uid: 'user1' }
    renderApp()
    expect(screen.getByLabelText('Peso Inicial (kg)')).toBeInTheDocument()
  })

  it('shows error state when goals fail to load', () => {
    mockAuth.user = { uid: 'user1' }
    mockGoals.error = new Error('failed')
    renderApp()
    expect(screen.getByText('No se pudieron cargar las metas.')).toBeInTheDocument()
  })

  it('renders dashboard with goals and entries', () => {
    mockAuth.user = { uid: 'user1' }
    mockGoals.goals = {
      startWeight: 100,
      targetWeight: 80,
      startDate: '2025-01-01',
      targetDate: '2025-06-01',
    }
    mockEntries.entries = [
      { date: '2025-01-01', weight: 100 },
      { date: '2025-01-15', weight: 97 },
    ]
    renderApp()
    expect(screen.getByText('Control de Peso')).toBeInTheDocument()
    expect(screen.getByText('Total Perdido')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('shows Total Ganado for weight gain goals', () => {
    mockAuth.user = { uid: 'user1' }
    mockGoals.goals = {
      startWeight: 60,
      targetWeight: 75,
      startDate: '2025-01-01',
      targetDate: '2025-06-01',
    }
    mockEntries.entries = [
      { date: '2025-01-01', weight: 60 },
      { date: '2025-01-15', weight: 63 },
    ]
    renderApp()
    expect(screen.getByText('Total Ganado')).toBeInTheDocument()
  })
})
