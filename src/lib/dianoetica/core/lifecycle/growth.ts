import type { Particle } from '../particle'

/**
 * Linearly grow each alive particle's radius from bornRadius to maxRadius
 * over its individual growthDuration. age is in seconds.
 */
export function updateGrowth(particles: Particle[], dt: number): void {
  for (const p of particles) {
    if (p.state !== 'alive') continue
    if (p.isTelos) continue // Telos doesn't grow — he's immortal at fixed size
    p.age += dt
    const t = Math.min(1, p.age / p.growthDuration)
    p.radius = p.bornRadius + (p.maxRadius - p.bornRadius) * t
  }
}
