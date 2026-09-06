# SPECIFICATION: Firefly Orchestra - Lumina Conducts

## Project Overview
- **Project Name:** Lumina Conducts
- **Type:** 2D Interactive Music/Rhythm Game
- **Core Functionality:** Player controls a glowing firefly that conducts an orchestra through rhythmic light pulses and movement, bringing life to silent musicians on a moonlit stage.
- **Target Users:** Casual gamers, music enthusiasts, anyone who enjoys atmospheric, relaxing games

---

## Visual & Rendering Specification

### Scene Setup
- **Canvas Size:** Responsive, fills browser window (maintains 16:9 aspect ratio for gameplay area)
- **Background:** Deep midnight blue gradient (#0a0a1a to #1a1a2e) with subtle star particles
- **Stage:** Semi-circular orchestral layout viewed from conductor's perspective
- **Moon:** Soft glowing moon in upper background with volumetric glow effect

### Art Style
- **Aesthetic:** Minimalist silhouettes with luminous accents
- **Color Palette:**
  - Primary: Warm amber glow (#ffcc00, #ff9500)
  - Secondary: Cool moonlight blue (#4a90d9)
  - Strings: Orange glow when playing
  - Woodwinds: Teal glow when playing
  - Brass: Golden glow when playing
  - Percussion: White flash when playing
  - Background: Deep purples and midnight blues

### Visual Elements

**Firefly (Player)**
- Glowing orb with pulsing core (radius: 20px base)
- Particle trail when moving (12 trailing particles)
- Light radius indicator (expands on pulse up to 150px)
- Subtle bobbing idle animation

**Orchestra Sections (4 sections)**
1. **Strings** (center): 6 musicians - warm orange glow when playing
2. **Woodwinds** (left): 4 musicians - teal glow when playing
3. **Brass** (right): 4 musicians - golden glow when playing
4. **Percussion** (back): 3 musicians - white flash when playing

**Stage Elements**
- Conductor's podium implied at bottom
- Ambient firefly particles floating in background
- Beat line indicator

### Post-Processing Effects
- **Bloom:** Simulated via radial gradients on firefly and active instruments
- **Glow:** Dynamic glow intensity based on playing state

### UI Elements
- **Score Display:** Top-center, shows musicality score
- **Combo Meter:** Below score, shows consecutive correct beats
- **Light Meter:** Firefly's energy level (top-right)
- **Timer:** Speedrun timer in top-left corner
- **High Score:** Persisted via LocalStorage (top-left below timer)

---

## Gameplay Mechanics Specification

### Core Gameplay Loop
1. Musicians have readiness meters that fill over time
2. Musical phrases appear as beat timing events
3. Player times light pulses to "cue" musicians
4. Successfully cued sections play their phrase with visual flourish
5. Score increases based on timing accuracy and section coverage

### Firefly Controls
- **Movement:** Mouse/touch position controls firefly location (smooth interpolation, lerp: 0.08)
- **Pulse:** Click/tap triggers a conducting pulse (light expands rapidly then contracts)
- **Pulse Radius:** Base 50px, expands to 150px
- **Energy Cost:** -5% per pulse
- **Flight Bounds:** Firefly moves in bottom 40-85% of screen

### Pulse Mechanics
- **Pulse Duration:** Expands over ~300ms, contracts over ~200ms
- **Cooldown:** Energy-based (cannot pulse below 5%)
- **Detection:** Any musician within pulse radius gets cued if readiness > 60%

### Beat System
- **Tempo:** Starts at 90 BPM, increases with performance (max 140 BPM)
- **Beat Line:** Horizontal line across stage where pulses are timed
- **Timing:** Musicians are detected on beat, scored by readiness level

### Scoring System
- **Base Points:** 25 per musician cued on beat
- **Combo Multiplier:** Increases by 1 every 10 successful beats (max 8x)
- **Section Bonus:** Cueing 3+ sections simultaneously grants 2x multiplier
- **Energy Bonus:** +3% per successful cue

---

## Audio Specification

### Sound Design (Web Audio API)
- **Pulse:** Soft chime sound
- **Success:** Ascending chime arpeggio (C5-E5-G5)
- **Ambient:** Simulated via oscillators

### Procedural Music
- Simple beat-driven feedback system
- Each section adds to the soundscape when cued

---

## Technical Specification

### Canvas Setup
- Single canvas element, 2D context
- RequestAnimationFrame loop at 60fps target
- Delta time calculation for frame-independent movement
- Responsive scaling for mobile devices

### Particle System
- **Trail Particles:** Spawn on movement, fade over 400ms
- **Ambient Fireflies:** Random drift, twinkle animation
- **Section Particles:** Burst from cued musicians

### Emoji Favicon
- Uses ✨ emoji in SVG favicon

---

## State Management

### Game States
1. **Title:** Animated title, "Begin Performance" button
2. **Playing:** Main gameplay loop
3. **Results:** Final score, accuracy %, star rating (1-5), replay option

### LocalStorage
- High score persisted under key 'fireflyHighScore'

---

## Acceptance Criteria

### Visual Checkpoints
- [x] Firefly renders with visible glow and particle trail
- [x] All 4 orchestra sections visible with distinct silhouettes
- [x] Glow effect visible on firefly and active instruments
- [x] Pulse wave animation expands and fades correctly
- [x] UI elements readable and properly positioned
- [x] Responsive canvas scales to mobile screens

### Functional Checkpoints
- [x] Firefly follows mouse/touch with smooth interpolation
- [x] Click/tap triggers visible pulse
- [x] Musicians within pulse radius get "cued" state
- [x] Score increases on successful cues
- [x] Combo meter functions correctly
- [x] Energy meter depletes on pulse, regenerates over time
- [x] Audio plays when sections are cued
- [x] Speedrun timer displays elapsed time
- [x] High score saved to LocalStorage

### Gameplay Checkpoints
- [x] Visual feedback is satisfying and clear
- [x] No input lag between click and pulse
- [x] Game progresses through beats continuously
- [x] Title screen and results screen function
