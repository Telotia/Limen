export interface Vec2 {
  x: number
  y: number
}

export const vec = (x: number, y: number): Vec2 => ({ x, y })

export const zero = (): Vec2 => ({ x: 0, y: 0 })

export const clone = (v: Vec2): Vec2 => ({ x: v.x, y: v.y })

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y })

export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y })

export const scale = (v: Vec2, s: number): Vec2 => ({ x: v.x * s, y: v.y * s })

export const addScaled = (a: Vec2, b: Vec2, s: number): Vec2 => ({
  x: a.x + b.x * s,
  y: a.y + b.y * s,
})

export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y

/** 90° counter-clockwise rotation: (x,y) -> (-y, x). */
export const perp = (v: Vec2): Vec2 => ({ x: -v.y, y: v.x })

export const length = (v: Vec2): number => Math.hypot(v.x, v.y)

export const lengthSq = (v: Vec2): number => v.x * v.x + v.y * v.y

export const distance = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y)

export const normalize = (v: Vec2): Vec2 => {
  const len = Math.hypot(v.x, v.y)
  if (len < 1e-9) return { x: 0, y: 0 }
  return { x: v.x / len, y: v.y / len }
}

export const lerp = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
})
