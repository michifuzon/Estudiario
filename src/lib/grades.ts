import type { Grade } from '@/types/domain'

/** Promedio ponderado de una materia, normalizado a base 10. Null si no hay notas cargadas. */
export function computeAverage(grades: Grade[]): number | null {
  const scored = grades.filter((g) => g.score !== null)
  if (!scored.length) return null
  const totalWeight = scored.reduce((sum, g) => sum + (g.weight || 1), 0)
  const weightedSum = scored.reduce((sum, g) => sum + (g.score! / g.maxScore) * 10 * (g.weight || 1), 0)
  return weightedSum / totalWeight
}

/** Nota (base 10) que necesitarías en la próxima evaluación para alcanzar el promedio objetivo. */
export function requiredScoreForTarget(grades: Grade[], targetAverage: number, nextWeight = 1): number {
  const scored = grades.filter((g) => g.score !== null)
  if (!scored.length) return targetAverage
  const currentWeight = scored.reduce((sum, g) => sum + (g.weight || 1), 0)
  const currentWeightedSum = scored.reduce(
    (sum, g) => sum + (g.score! / g.maxScore) * 10 * (g.weight || 1),
    0,
  )
  const totalWeight = currentWeight + nextWeight
  const required = (targetAverage * totalWeight - currentWeightedSum) / nextWeight
  return Math.max(0, Math.round(required * 100) / 100)
}
