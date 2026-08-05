# Design Document – DUALITY

## Core Concept – The Mirror Bond
Two characters, **PRIME** and **ECHO**, share a single input vector. Their movement is perfectly synchronized, but the level geometry diverges between layers. The player must discover a **Golden Path** where both survive and exit simultaneously.

## Asymmetry Engine
Levels consist of two CSV‑defined tilemaps. Geometry on one layer may be solid on the other, creating puzzles that require precise timing and layer‑specific traversal.

## Desync Mechanics
Advanced abilities are unlocked per world:
- **Phase Shift** – inverts Echo’s horizontal input.
- **Gravity Inversion** – Echo falls upward.
- **Time Echo** – Echo replays recorded inputs.
- **Mass Swap** – swaps physical properties between characters.

## Visual Style
- Dark background `#0A0E17` with vibrant accents `#00F3FF` (Prime) and `#FF2D7A` (Echo).
- Procedural silhouettes rendered via off‑screen sprite sheets.
- Dash trails use additive blending and blur for a neon effect.
- SDF outlines provide a neon‑noir aesthetic.

## UI / UX
- Minimal diegetic HUD: Sync Meter, dash cooldowns, death counter, millisecond timer.
- Menus continue gameplay in the background with blur overlay.
- Win screen displays stats, best‑time comparison, and “VIEW GHOST” replay option.

## Accessibility
- Remappable controls (keyboard, gamepad, touch).
- Assist mode toggles (invincibility, infinite dash, slow‑motion, auto‑jump).
- High‑contrast and color‑blind palettes.
- Reduced‑motion option disables shake, particles, and UI transitions.

## Technical Constraints
- Bundle size < 150 KB gzipped, vanilla TypeScript/JS, no external game engines.
- Fixed‑timestep 1/60 s, zero allocations in critical loops.
- LocalStorage with LZString compression for persistent high‑score and unlocks.

---
*All design goals aim to deliver a tight, precision‑focused puzzle‑platformer that leverages dual‑character synchronization as the central gameplay loop.*
