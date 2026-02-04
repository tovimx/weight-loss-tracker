import { useEffect, useMemo } from 'react'
import { useState } from 'react'
import { addWeeks, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { UserGoals } from '../services/goalsService'
import { useToast } from './Toast'

interface GoalSetupProps {
  onSave: (goals: UserGoals) => Promise<void>
  initialGoals?: UserGoals | null
  isEditing?: boolean
  onCancel?: () => void
}

export function GoalSetup({ onSave, initialGoals, isEditing, onCancel }: GoalSetupProps) {
  const { showToast } = useToast()

  const [startWeight, setStartWeight] = useState(
    initialGoals?.startWeight?.toString() ?? ''
  )
  const [targetWeight, setTargetWeight] = useState(
    initialGoals?.targetWeight?.toString() ?? ''
  )
  const [startDate, setStartDate] = useState(
    initialGoals?.startDate ?? format(new Date(), 'yyyy-MM-dd')
  )
  const [targetDate, setTargetDate] = useState(
    initialGoals?.targetDate ?? ''
  )
  const [saving, setSaving] = useState(false)

  const suggestedDate = useMemo(() => {
    const start = parseFloat(startWeight)
    const target = parseFloat(targetWeight)
    if (!start || !target || target === start || !startDate) return null

    const kgToChange = Math.abs(start - target)
    // Evidence-based: 0.5–1% of body weight per week is safe and sustainable
    // Using 0.75% as midpoint for the recommendation
    const weeklyRate = start * 0.0075
    const weeksNeeded = Math.ceil(kgToChange / weeklyRate)
    const suggested = addWeeks(parseISO(startDate), weeksNeeded)

    return {
      date: format(suggested, 'yyyy-MM-dd'),
      dateFormatted: format(suggested, "d 'de' MMMM, yyyy", { locale: es }),
      weeks: weeksNeeded,
      rateKg: weeklyRate.toFixed(2),
    }
  }, [startWeight, targetWeight, startDate])

  const [userEditedTargetDate, setUserEditedTargetDate] = useState(!!initialGoals?.targetDate)

  useEffect(() => {
    if (suggestedDate && !userEditedTargetDate) {
      setTargetDate(suggestedDate.date)
    }
  }, [suggestedDate, userEditedTargetDate])

  const applySuggestedDate = () => {
    if (suggestedDate) setTargetDate(suggestedDate.date)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const start = parseFloat(startWeight)
    const target = parseFloat(targetWeight)

    if (!start || !target || !startDate || !targetDate) return

    if (target === start) {
      showToast('El peso meta debe ser diferente al peso inicial')
      return
    }

    if (targetDate <= startDate) {
      showToast('La fecha meta debe ser posterior a la fecha de inicio')
      return
    }

    setSaving(true)
    try {
      await onSave({ startWeight: start, targetWeight: target, startDate, targetDate })
    } catch {
      showToast('No se pudieron guardar las metas. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const direction = (() => {
    const s = parseFloat(startWeight)
    const t = parseFloat(targetWeight)
    if (!s || !t || s === t) return null
    return t < s ? 'loss' : 'gain'
  })()

  return (
    <div className={isEditing ? 'goal-setup-overlay' : 'login-screen'}>
      <div className={isEditing ? 'goal-setup-modal' : 'login-content'}>
        {!isEditing && (
          <div className="login-hero">
            <div className="login-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h1 className="login-title">Define tus Metas</h1>
            <p className="login-subtitle">Configura tu plan de control de peso</p>
          </div>
        )}

        {isEditing && <h2 className="goal-setup-title">Editar Metas</h2>}

        <form onSubmit={handleSubmit} className={isEditing ? 'goal-setup-form' : 'login-card goal-setup-form'}>
          <div className="goal-fields">
            <div className="goal-field">
              <label htmlFor="startWeight">Peso Inicial (kg)</label>
              <input
                type="number"
                id="startWeight"
                value={startWeight}
                onChange={(e) => setStartWeight(e.target.value)}
                placeholder="ej. 142"
                step="0.1"
                required
              />
            </div>
            <div className="goal-field">
              <label htmlFor="targetWeight">Peso Meta (kg)</label>
              <input
                type="number"
                id="targetWeight"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder="ej. 115"
                step="0.1"
                required
              />
            </div>
            <div className="goal-field">
              <label htmlFor="startDate">Fecha de Inicio</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="goal-field">
              <label htmlFor="targetDate">Fecha Meta</label>
              <input
                type="date"
                id="targetDate"
                value={targetDate}
                onChange={(e) => {
                  setTargetDate(e.target.value)
                  setUserEditedTargetDate(true)
                }}
                required
              />
            </div>
          </div>

          {suggestedDate && (
            <p className="goal-suggestion">
              Fecha sugerida: <button type="button" className="suggestion-link" onClick={applySuggestedDate}>{suggestedDate.dateFormatted}</button>
              <br />
              <span className="suggestion-detail">
                ~{suggestedDate.rateKg} kg/semana durante {suggestedDate.weeks} semanas
                {direction === 'loss'
                  ? ' (ritmo saludable del 0.5–1% de tu peso corporal por semana)'
                  : ' (ritmo de ganancia gradual)'}
              </span>
            </p>
          )}

          <div className="goal-actions">
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? 'Guardando...' : isEditing ? 'Actualizar Metas' : 'Comenzar'}
            </button>
            {isEditing && onCancel && (
              <button type="button" className="cancel-btn" onClick={onCancel}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
