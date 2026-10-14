export const config = {
    canvas: {
        width: 1024,
        height: 768,
        responsive: true
    },
    physics: {
        maxSpeed: 180,
        acceleration: 400,
        gravity: 960,
        jumpVelocity: -320,
        airControlFactor: 0.7,
        footstepDistance: 24
    },
    colors: {
        background: '#0a0a2a',
        player: '#00ffff',
        enemy: '#ff0066',
        soundMarker: '#ff00ff',
        echo: '#00ff88',
        platform: '#1a1a4a',
        ui: '#ffffff',
        warning: '#ff3366'
    },
    audio: {
        enabled: true,
        footstepVolume: 0.3,
        echoVolume: 0.5
    },
    storage: {
        highScoreKey: 'echoThiefHighScore'
    }
};