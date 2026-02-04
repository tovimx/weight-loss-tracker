import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GoalSetup } from '../GoalSetup'
import { ToastProvider } from '../Toast'

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>)
}

describe('GoalSetup', () => {
  it('renders form fields', () => {
    renderWithToast(<GoalSetup onSave={vi.fn()} />)
    expect(screen.getByLabelText('Peso Inicial (kg)')).toBeInTheDocument()
    expect(screen.getByLabelText('Peso Meta (kg)')).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha de Inicio')).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha Meta')).toBeInTheDocument()
  })

  it('shows toast when weights are equal', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    renderWithToast(<GoalSetup onSave={onSave} />)

    await user.type(screen.getByLabelText('Peso Inicial (kg)'), '100')
    await user.type(screen.getByLabelText('Peso Meta (kg)'), '100')
    // Set target date to future
    const targetDateInput = screen.getByLabelText('Fecha Meta')
    await user.type(targetDateInput, '2025-12-01')

    await user.click(screen.getByRole('button', { name: 'Comenzar' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('El peso meta debe ser diferente al peso inicial')).toBeInTheDocument()
  })

  it('accepts weight gain goals (target > start)', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    renderWithToast(<GoalSetup onSave={onSave} />)

    await user.clear(screen.getByLabelText('Peso Inicial (kg)'))
    await user.type(screen.getByLabelText('Peso Inicial (kg)'), '60')
    await user.type(screen.getByLabelText('Peso Meta (kg)'), '75')

    const startDate = screen.getByLabelText('Fecha de Inicio')
    await user.clear(startDate)
    await user.type(startDate, '2025-01-01')

    const targetDate = screen.getByLabelText('Fecha Meta')
    await user.type(targetDate, '2025-06-01')

    await user.click(screen.getByRole('button', { name: 'Comenzar' }))

    expect(onSave).toHaveBeenCalledWith({
      startWeight: 60,
      targetWeight: 75,
      startDate: '2025-01-01',
      targetDate: '2025-06-01',
    })
  })

  it('shows cancel button in editing mode', () => {
    renderWithToast(
      <GoalSetup
        onSave={vi.fn()}
        isEditing
        onCancel={vi.fn()}
        initialGoals={{
          startWeight: 100,
          targetWeight: 80,
          startDate: '2025-01-01',
          targetDate: '2025-06-01',
        }}
      />
    )
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })
})
