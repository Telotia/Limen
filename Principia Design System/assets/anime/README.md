# Dianoetica Background Animation

A React/canvas background animation for Dianoetica. It renders a rose-gold guiding star, Telos, with orbiting claim-particles that split, resolve, and return to Telos. The name Telos is a simplified form of teleology: the sense of purpose or end-orientation that guides inquiry.

For the product/design meaning behind the motion, read [DESIGN_PHILOSOPHY.md](./DESIGN_PHILOSOPHY.md).

## Quick Start

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Import Contract

This package is intended to be imported by another frontend application. The public API is the React component:

```tsx
import { DianoeticaBackground } from 'dianoetica-background-animation'
import type {
  DianoeticaBackgroundProps,
  DianoeticaCenter,
  DianoeticaPatternBounds,
  DianoeticaRadius,
  DianoeticaTelosPattern,
} from 'dianoetica-background-animation'
```

The importer controls these variables:

- `className`: optional CSS class applied to the canvas.
- `style`: optional inline style applied to the canvas.
- `center`: optional orbit-center configuration.
- `radius`: optional orbit-radius configuration.
- `backgroundColor`: optional canvas background color.
- `telosPattern`: optional Telos path pattern.

Everything else, including particle count, colors, lifecycle states, Telos behavior, trails, and verdict animations, is controlled internally by the animation.

## React Usage

Import the component:

```tsx
import { DianoeticaBackground } from 'dianoetica-background-animation'
```

Use it as a full-screen fixed background:

```tsx
export function AppShell() {
  return (
    <DianoeticaBackground
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
      }}
    />
  )
}
```

The component renders a single `<canvas>` and fills its parent by default:

```tsx
style={{ display: 'block', width: '100%', height: '100%', ...style }}
```

## Configurable Orbit Geometry

By default, the orbit center is the center of the canvas and the orbit radius is:

```ts
Math.min(width, height) * 0.28
```

Both values use canvas CSS pixels.

### Center

The `center` prop controls the center of the circular orbit. It does not move the whole canvas; it moves the simulation's orbit center inside the canvas.

#### Fixed Center

Pass a fixed center in canvas CSS pixels:

```tsx
<DianoeticaBackground center={{ x: 420, y: 320 }} />
```

This means:

- `x: 0` is the left edge of the canvas.
- `y: 0` is the top edge of the canvas.
- `x: canvas width / 2` and `y: canvas height / 2` is the visual center.
- Values are CSS pixels, not device pixels. The animation handles `devicePixelRatio` internally.

#### Responsive Center

Pass a resolver function when the orbit center should depend on the canvas size:

```tsx
<DianoeticaBackground
  center={({ width, height }) => ({
    x: width * 0.58,
    y: height * 0.46,
  })}
/>
```

The resolver receives:

```ts
{
  width: number
  height: number
}
```

Both values are canvas dimensions in CSS pixels.

The resolver is re-applied when:

- the component mounts,
- the canvas/window resizes,
- the `center` prop identity changes.

If the parent component creates the resolver inline, React will create a new function each render. That is allowed, but if the parent renders very frequently, prefer `useCallback`:

```tsx
const center = useCallback(
  ({ width, height }: { width: number; height: number }) => ({
    x: width * 0.58,
    y: height * 0.46,
  }),
  [],
)

return <DianoeticaBackground center={center} />
```

### Radius

The `radius` prop controls the circular orbit radius. It does not resize the whole canvas; it changes the radius of the recursive orbit around `center`.

#### Fixed Radius

Pass a fixed radius in canvas CSS pixels:

```tsx
<DianoeticaBackground radius={220} />
```

#### Responsive Radius

Pass a resolver function when the orbit radius should depend on canvas size:

```tsx
<DianoeticaBackground
  radius={({ width, height }) => Math.min(width, height) * 0.24}
/>
```

The resolver receives the same metrics as `center`:

```ts
{
  width: number
  height: number
}
```

The resolved radius is clamped to at least `1` CSS pixel internally. Use a positive value that leaves enough room for trails and glow.

### Background Color

The `backgroundColor` prop controls the canvas clear color:

```tsx
<DianoeticaBackground backgroundColor="#050a1f" />
```

Default:

```ts
backgroundColor = '#050a1f'
```

Any valid CSS color string can be used, for example `#030817`, `rgb(5 10 31)`, or `hsl(228 72% 7%)`.

The color is drawn by the canvas every frame. The host page background only matters before the canvas mounts or if another layer covers the canvas.

### Telos Pattern

The `telosPattern` prop controls the path Telos follows after the entry and helix phases:

```tsx
<DianoeticaBackground telosPattern="circle" />
<DianoeticaBackground telosPattern="chaotic pattern" />
```

Accepted values:

- `"circle"`: the original circular orbit. This is the default.
- `"chaotic pattern"`: a smooth double-lobed, attractor-like path inspired by chaotic systems. Telos still remains the rose-gold guiding star, and sub-particles follow delayed positions on the same path so the whole system reads more like a strange attractor than a perfect orbit.

The pattern uses the same `center` and `radius` configuration. `center` anchors the middle of the pattern. `radius` scales the pattern's size.

For `"chaotic pattern"`, `radius` is a base size, not the final half-width. The Lorenz path currently occupies approximately:

```ts
width = radius * 1.62 * 2
height = radius * 1.05 * 2
```

For example, `radius={200}` means the chaotic path itself occupies about `648px` wide by `420px` tall before glow, star size, and layout breathing room.

Use `getDianoeticaPatternBounds` when the host layout needs to reserve space or avoid placing content over the pattern:

```tsx
import {
  DianoeticaBackground,
  getDianoeticaPatternBounds,
} from 'dianoetica-background-animation'

const center = { x: 600, y: 360 }
const radius = 200
const bounds = getDianoeticaPatternBounds({
  telosPattern: 'chaotic pattern',
  center,
  radius,
  padding: 48,
})

// bounds.width  ~= 744
// bounds.height ~= 516

<DianoeticaBackground
  telosPattern="chaotic pattern"
  center={center}
  radius={radius}
/>
```

Internal motion and trail tuning is separated by pattern in `src/core/patterns/telos-pattern-config.ts`. Adjust the `circle` block to tune the circular orbit, or the `"chaotic pattern"` block to tune the Lorenz-attractor motion. This keeps future chaotic changes from accidentally changing the circle behavior.

In `"chaotic pattern"` mode, Telos starts alone. For the first `10` seconds, it begins from a randomized point on the attractor and traces about `5000px` of Lorenz path so the opening reads smoothly before any sub-particles are created. After that intro, the first sub-particles are spawned and use the chaotic pattern's longer lifecycle timing.

The chaotic Telos trail separates memory from rendering. It can retain a much longer history than it draws each frame, then downsample that history for rendering. This keeps the opposite lobe visible when Telos spends time on one side of the Lorenz path, without forcing the canvas to render every stored trail point.

The chaotic Telos trail also scales with `radius`: larger pattern sizes retain and render more trail samples, so a large attractor does not feel like its path is shorter than a smaller one. This scaling is internal to `"chaotic pattern"` and does not change the circle trail.

## Props

```ts
export interface DianoeticaBackgroundProps {
  className?: string
  style?: React.CSSProperties
  center?: { x: number; y: number } | ((metrics: { width: number; height: number }) => { x: number; y: number })
  radius?: number | ((metrics: { width: number; height: number }) => number)
  backgroundColor?: string
  telosPattern?: 'circle' | 'chaotic pattern'
}

export function getDianoeticaPatternBounds(input: {
  telosPattern?: 'circle' | 'chaotic pattern'
  center: { x: number; y: number }
  radius: number
  padding?: number
}): {
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
  halfWidth: number
  halfHeight: number
}
```

### Variable Behavior

`className`

Applied directly to the `<canvas>`. Use this for host-app styling, layering, or sizing rules.

`style`

Merged onto the canvas after the default canvas style. The defaults are:

```tsx
{
  display: 'block',
  width: '100%',
  height: '100%',
}
```

Importer-provided styles win over these defaults.

`center`

Controls `world.center`, the orbit center used by Telos, sub-particles, claim resolution, and recursive orbit motion.

If omitted:

```ts
center = { x: width / 2, y: height / 2 }
```

If a fixed object is passed:

```ts
center = { x, y }
```

If a function is passed:

```ts
center = resolver({ width, height })
```

Do not pass normalized values like `{ x: 0.5, y: 0.5 }` unless you intentionally want the orbit center to be half a CSS pixel from the top-left corner. For percentage-style positioning, use a resolver function.

`radius`

Controls `world.baseRadius`, the orbit radius used by Telos, sub-particles, helix amplitude, claim resolution, and trail shape.

If omitted:

```ts
radius = Math.min(width, height) * 0.28
```

If a fixed number is passed:

```ts
radius = 220
```

If a function is passed:

```ts
radius = resolver({ width, height })
```

Do not pass normalized values like `0.28` unless you intentionally want a radius of `0.28` CSS pixels. For percentage-style sizing, use a resolver function.

`backgroundColor`

Controls `world.backgroundColor`, the color used by the canvas clear step every frame.

If omitted:

```ts
backgroundColor = '#050a1f'
```

The value is not interpreted by the animation. It is passed directly to `CanvasRenderingContext2D.fillStyle`, so use any valid CSS color string.

`telosPattern`

Controls `world.telosPattern`, the post-helix path used by Telos.

If omitted:

```ts
telosPattern = 'circle'
```

If `"circle"` is passed, Telos follows the original circular orbit.

If `"chaotic pattern"` is passed, Telos follows a smooth double-lobed path. The pattern is deterministic, not random, so the motion stays readable and does not jitter.

## Visual Semantics

- Telos: rose-gold guiding star and intellectual anchor.
- Blue/teal/lavender particles: active claims and subclaims.
- Split: partial proof; a claim branches into more detailed subclaims.
- Red resolution: falsified claim.
- Green resolution: proven claim.
- Absorption into Telos: both proof and falsification become part of accumulated knowledge.
- Telos flash: the moment Telos observes and incorporates a resolved claim.
- Circle pattern: recursive evidence, subclaim, and theory formation.
- Chaotic pattern: inquiry moving through a strange-attractor-like field, where the search remains guided but not perfectly linear.

## Integration Notes

- This is a visual background component. Place it behind your app content and manage stacking with `z-index` in the host app.
- The animation uses the canvas size in CSS pixels and handles device-pixel-ratio scaling internally.
- The component starts the animation on mount and cleans up requestAnimationFrame, resize, and visibility listeners on unmount.
- Page visibility is respected: the simulation pauses while the document is hidden.
- The background color is drawn by the canvas itself, so the host page should avoid placing another opaque background above it.
- The importer should not directly manipulate the internal canvas context or simulation state.
- If the host layout changes the canvas size, the component observes the canvas and recalculates responsive `center` and `radius` values.

## Local Structure

```text
src/react/DianoeticaBackground.tsx  React adapter
src/core/                         Simulation, phases, lifecycle, physics
src/render/                       Canvas rendering layers
src/utils/                        Small math/visibility helpers
```

## Current Export

`package.json` exports the React adapter directly:

```json
{
  "exports": {
    ".": {
      "types": "./src/react/DianoeticaBackground.tsx",
      "import": "./src/react/DianoeticaBackground.tsx"
    }
  }
}
```

If this package is later published or bundled into a larger frontend app, keep this export aligned with the build system used by that app.
