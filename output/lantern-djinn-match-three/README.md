# Reaction Master

A fast-paced reaction game with responsive design, sound effects, and high score tracking.

## Features
- Responsive canvas that scales to mobile screens
- Emoji favicon for mobile friendliness
- Vibrant color palette
- LocalStorage high score persistence
- Web Audio API sound effects
- Speedrun timer in top corner

## Installation
Open `index.html` in any modern browser.

## Controls
- Wait for the circle to change color
- Click as fast as possible when it turns green
- Avoid clicking when it's red (penalty!)

## Architecture

.
|-- index.html
|-- README.md
|-- config/
|   `-- settings.js
|-- src/
|   |-- game.js
|   |-- audio.js
|   |-- score.js
|   `-- ui.js
`-- scripts/
    `-- build.js

