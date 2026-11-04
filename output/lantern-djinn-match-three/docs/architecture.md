# Architecture Documentation

## Overview
Reaction Master is a simple browser-based reaction game built with vanilla JavaScript.

## Key Features
### 1. Responsive Canvas
- Uses CSS aspect-ratio for mobile-friendly sizing
- Dynamically resizes on window resize events

### 2. Emoji Favicon
- Embedded SVG lightning bolt emoji
- No external requests needed

### 3. Vibrant Color Palette
- Blue (#4299e1) for waiting state
- Green (#48bb78) for ready state
- Red (#f56565) for danger state

### 4. LocalStorage High Score
- Persists across page refreshes
- Automatic update on high scores

### 5. Web Audio API Sound Effects
- Correct click: C5 sine wave
- Wrong click: F3 square wave
- Start: E5 triangle wave

### 6. Speedrun Timer
- Displays reaction time in top-left corner
- Updates every 100ms

## File Structure

.
|-- index.html
|-- config/settings.js
|-- src/game.js
|-- src/audio.js
|-- src/score.js
|-- src/ui.js
|-- tests/game.test.js
|-- scripts/build.js
`-- docs/architecture.md

