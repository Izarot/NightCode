export class Engine {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.player = {
            x: 100,
            y: 100,
            vx: 0,
            vy: 0,
            radius: 15,
            maxSpeed: 5,
            friction: 0.1,
            accel: 0.5
        };
        this.keys = {};
        this.walls = [
            {x: 0, y: 0, w: width, h: 10}, // Top
            {x: 0, y: height-10, w: width, h: 10}, // Bottom
            {x: 0, y: 0, w: 10, h: height}, // Left
            {x: width-10, y: 0, w: 10, h: height}, // Right
            {x: 350, y: 250, w: 100, h: 100} // Central Obstacle
        ];
    }

    handleInput(e, isDown) {
        this.keys[e.code] = isDown;
    }

    update() {
        // Acceleration
        if (this.keys['KeyW'] || this.keys['ArrowUp']) this.player.vy -= this.player.accel;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) this.player.vy += this.player.accel;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.player.vx -= this.player.accel;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) this.player.vx += this.player.accel;

        // Friction
        this.player.vx *= (1 - this.friction);
        this.player.vy *= (1 - this.friction);

        // Max Speed
        const speed = Math.sqrt(this.player.vx**2 + this.player.vy**2);
        if (speed > this.player.maxSpeed) {
            const ratio = this.player.maxSpeed / speed;
            this.player.vx *= ratio;
            this.player.vy *= ratio;
        }

        // Proposed Movement
        let nextX = this.player.x + this.player.vx;
        let nextY = this.player.y + this.player.vy;

        // Collision Detection (Simple AABB/Circle)
        let collision = false;
        for (const wall of this.walls) {
            if (nextX + this.player.radius > wall.x && 
                nextX - this.player.radius < wall.x + wall.w &&
                nextY + this.player.radius > wall.y && 
                nextY - this.player.radius < wall.y + wall.h) {
                collision = true;
                break;
            }
        }

        if (!collision) {
            this.player.x = nextX;
            this.player.y = nextY;
        } else {
            this.player.vx = 0;
            this.player.vy = 0;
        }
    }
}