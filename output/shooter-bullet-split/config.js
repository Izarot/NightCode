export const CONFIG = {
    COLORS: {
        BACKGROUND: '#1a0033',
        PLAYER: '#00ffff',
        ENEMY: '#ff0033',
        ELITE: '#ff6600',
        BOSS: '#ff0066',
        BULLET: '#00ffff'
    },
    PLAYER: {
        SPEED: 240,
        MAX_SPEED: 320,
        FRICTION: 0.85,
        ACCELERATION: 0.15,
        DASH_COOLDOWN: 3,
        DASH_DISTANCE: 480
    },
    BULLET: {
        SPEED: 480,
        DAMAGE: 100,
        LIFESPAN: 1.2,
        FIRE_RATE: 0.1,
        MAGAZINE: 30,
        TOTAL_AMMO: 120
    },
    ENEMY: {
        BASIC_HP: 100,
        BASIC_SPEED: 80,
        ELITE_HP: 800,
        ELITE_SPEED: 120,
        BOSS_HP: 5000,
        BOSS_SPEED: 60
    }
};