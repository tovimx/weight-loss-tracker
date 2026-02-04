export type GoalDirection = 'loss' | 'gain'

export function getGoalDirection(startWeight: number, targetWeight: number): GoalDirection {
  return targetWeight < startWeight ? 'loss' : 'gain'
}

export function getWeightBounds(startWeight: number, targetWeight: number) {
  return {
    min: Math.min(startWeight, targetWeight),
    max: Math.max(startWeight, targetWeight),
  }
}

export function isWeightInRange(weight: number, startWeight: number, targetWeight: number): boolean {
  const { min, max } = getWeightBounds(startWeight, targetWeight)
  return weight >= min && weight <= max
}
