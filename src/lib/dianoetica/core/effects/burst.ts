import type { Vec2 } from '../physics/vector'
import type { Hsl } from '../color/palette'

/**
 * A transient split-flash effect. Spawned at every split moment, lives
 * for `duration` seconds, then is removed.
 */
export interface Burst {
  kind: 'split' | 'knowledge'
  position: Vec2
  color: Hsl
  age: number
  duration: number
}

export const BURST_DURATION_S = 0.55
export const KNOWLEDGE_BURST_DURATION_S = 0.75

export function createBurst(position: Vec2, color: Hsl): Burst {
  return {
    kind: 'split',
    position: { x: position.x, y: position.y },
    color: { ...color },
    age: 0,
    duration: BURST_DURATION_S,
  }
}

export function createKnowledgeBurst(position: Vec2, color: Hsl): Burst {
  return {
    kind: 'knowledge',
    position: { x: position.x, y: position.y },
    color: { ...color },
    age: 0,
    duration: KNOWLEDGE_BURST_DURATION_S,
  }
}

/**
 * Advance every burst's age and drop ones that have completed.
 */
export function updateBursts(bursts: Burst[], dt: number): Burst[] {
  for (const b of bursts) b.age += dt
  return bursts.filter((b) => b.age < b.duration)
}
