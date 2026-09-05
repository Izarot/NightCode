# LOCKSMITH: The Art of the Silent Pick - SPEC

## 1. Overview
2D HTML5 Canvas lock-picking simulation. Cross-section view of pin tumbler mechanism. Player manipulates pick tool and tension wrench to set each pin at the shear line.

## 2. Rendering
- Pure 2D Canvas API, requestAnimationFrame loop
- Responsive canvas (min 320px, scales to viewport)
- Color palette: charcoal bg, brushed steel, brass gold, nickel pins, chrome pick
- Effects: pin set gleam, cylinder rotation, failure vignette, screen shake

## 3. Mechanics
- 8 difficulty tiers (3-7 pins, varying tolerance/reset chance)
- Pick movement: WASD/Arrows, Shift = precision
- Tension: Mouse wheel (0-100%)
- Light tension (0-30%): pins won't set
- Sweet spot (30-70%): optimal setting
- Heavy (70-100%): pins overset and reset
- Pin clicks when pick at correct height + correct tension

## 4. Audio (Web Audio API)
- Synthesized ambient hum, click sounds, success chimes, failure buzz
- Continuous scrape sound during picking
- All procedurally generated, no external files

## 5. UI
- Top HUD: lock name, lock number, speedrun timer
- Bottom HUD: feel indicator, pin status, tension gauge
- Pause/Complete/Settings menus

## 6. Progression
- 12-lock job mode with progressive difficulty
- Practice mode for single lock
- LocalStorage: settings + high score persistence

## 7. Controls
- WASD/Arrows: move pick
- W/S or Up/Down: pick depth
- Mouse wheel: tension
- Shift: precision mode
- ESC: pause
- R: restart

## 8. Technical
- 60fps target with delta-time
- LocalStorage for save data
- Single HTML file, no external dependencies
- Mobile responsive layout
