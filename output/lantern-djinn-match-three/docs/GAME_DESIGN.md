# Game Design Document

## Overview

Emoji Dodge is a simple yet engaging browser-based game where players control a circular avatar to dodge falling obstacles. The game features responsive design, sound effects, and persistent high scores.

## Core Mechanics

- Player movement via mouse (desktop) or touch (mobile)
- Obstacles spawn at regular intervals from the top of the screen
- Collision with an obstacle ends the game
- Score increases for each obstacle successfully avoided

## Visual Design

- Vibrant gradient backgrounds
- Neon-style player and obstacle rendering
- Grid-based background pattern
- Responsive layout for all screen sizes

## Audio Design

- Web Audio API for sound generation
- Distinct sounds for scoring, collisions, and actions
- Mute functionality for accessibility

## Controls

| Platform | Control Method |
|----------|----------------|
| Desktop  | Mouse movement |
| Mobile   | Touch drag     |

## Data Persistence

- High scores stored in browser LocalStorage
- Automatically loaded on game start
- Updated when a new high score is achieved
