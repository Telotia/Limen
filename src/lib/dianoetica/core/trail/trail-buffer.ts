import type { Vec2 } from '../physics/vector'

/**
 * Ring buffer of recent positions used to render the meteor trail.
 * Color is read from the live particle at render time (per requirement
 * §六: "trail color follows particle current color in real time"),
 * so this buffer only needs positions.
 */
export class TrailBuffer {
  readonly capacity: number
  private positions: Float32Array
  private head = 0
  private filled = 0

  constructor(capacity: number) {
    this.capacity = capacity
    this.positions = new Float32Array(capacity * 2)
  }

  append(p: Vec2): void {
    const idx = this.head * 2
    this.positions[idx] = p.x
    this.positions[idx + 1] = p.y
    this.head = (this.head + 1) % this.capacity
    if (this.filled < this.capacity) this.filled++
  }

  clear(): void {
    this.head = 0
    this.filled = 0
  }

  get length(): number {
    return this.filled
  }

  /**
   * Iterate from oldest to newest. Callback receives (x, y, normalizedAge)
   * where normalizedAge=0 means oldest (tail tip) and 1 means newest (head).
   */
  forEach(cb: (x: number, y: number, t: number) => void): void {
    if (this.filled === 0) return
    const start = (this.head - this.filled + this.capacity) % this.capacity
    for (let i = 0; i < this.filled; i++) {
      const idx = ((start + i) % this.capacity) * 2
      const t = this.filled === 1 ? 1 : i / (this.filled - 1)
      cb(this.positions[idx], this.positions[idx + 1], t)
    }
  }

  /**
   * Iterate over a recent range while capping the number of emitted samples.
   * This lets long-history trails retain visual memory without forcing the
   * renderer to build a polygon from every stored point every frame.
   */
  forEachSampled(
    startT: number,
    maxSamples: number,
    cb: (x: number, y: number, t: number) => void,
  ): void {
    if (this.filled === 0 || maxSamples <= 0) return
    const rangeStartT = startT < 0 ? 0 : startT > 1 ? 1 : startT
    const first = Math.min(
      this.filled - 1,
      Math.max(0, Math.floor(rangeStartT * (this.filled - 1))),
    )
    const selectedCount = this.filled - first
    const step = Math.max(1, Math.ceil(selectedCount / maxSamples))
    const start = (this.head - this.filled + this.capacity) % this.capacity
    const denom = Math.max(1, selectedCount - 1)
    let emittedLast = false

    for (let i = first; i < this.filled; i += step) {
      const idx = ((start + i) % this.capacity) * 2
      const t = (i - first) / denom
      cb(this.positions[idx], this.positions[idx + 1], t)
      emittedLast = i === this.filled - 1
    }

    if (!emittedLast && this.filled > first) {
      const i = this.filled - 1
      const idx = ((start + i) % this.capacity) * 2
      cb(this.positions[idx], this.positions[idx + 1], 1)
    }
  }

  /**
   * Copy positions from another buffer (used when a child inherits its
   * mother's trail during splitting).
   */
  copyFrom(other: TrailBuffer): void {
    if (other.capacity !== this.capacity) {
      this.positions = new Float32Array(other.positions.length)
    } else {
      this.positions.set(other.positions)
    }
    this.head = other.head
    this.filled = other.filled
  }
}
