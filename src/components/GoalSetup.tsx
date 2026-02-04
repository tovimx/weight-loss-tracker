import { useState } from 'react'
import { format } from 'date-fns'
import type { UserGoals } from '../services/goalsService'

interface GoalSetupProps {
  onSave: (goals: UserGoals) => Promise<void>
  initialGoals?: UserGoals | null
  isEditing?: boolean
  onCancel?: () => void
}

export function GoalSetup({ onSave, initialGoals, isEditing, onCancel }: GoalSetupProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const start = parseFloat(startWeight)
    const target = parseFloat(targetWeight)

    if (!start || !target || !startDate || !targetDate) return

    if (target >= start) {
      alert('El peso meta debe ser menor al peso inicial')
      return
    }

    if (targetDate <= startDate) {
      alert('La fecha meta debe ser posterior a la fecha de inicio')
      return
    }

    setSaving(true)
    try {
      await onSave({ startWeight: start, targetWeight: target, startDate, targetDate })
    } catch {
      alert('No se pudieron guardar las metas. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

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
            <p className="login-subtitle">Configura tu plan de pérdida de peso</p>
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
                onChange={(e) => setTargetDate(e.target.value)}
                required
              />
            </div>
          </div>

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
