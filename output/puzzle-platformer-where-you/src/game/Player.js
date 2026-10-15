export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 30;
        this.vx = 0;
        this.vy = 0;
        this.speed = 3;
        this.jumpForce = -12;
        this.gravity = 0.6;
        this.grounded = false;
        this.color = '#ffaa44';
    }

    update(dt, input, world, gravityReversed) {
        const effectiveGravity = gravityReversed ? -this.gravity : this.gravity;

        if (input.isPressed('ArrowLeft') || input.isPressed('KeyA')) {
            this.vx = -this.speed;
        } else if (input.isPressed('ArrowRight') || input.isPressed('KeyD')) {
            this.vx = this.speed;
        } else {
            this.vx *= 0.8;
        }

        if ((input.isPressed('ArrowUp') || input.isPressed('KeyW') || input.isPressed('Space')) && this.grounded) {
            this.vy = this.jumpForce;
            this.grounded = false;
        }

        this.vy += effectiveGravity * dt * 60;
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;

        this.grounded = false;
        world.platforms.forEach(platform => {
            if (this.collidesWith(platform)) {
                if (this.vy > 0 && this.y + this.height/2 < platform.y) {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.grounded = true;
                } else if (this.vy < 0 && this.y - this.height/2 > platform.y + platform.height) {
                    this.y = platform.y + platform.height;
                    this.vy = 0;
                }
            }
        });

        if (this.y > world.canvasHeight) {
            this.y = 100;
            this.vy = 0;
            this.score = Math.max(0, this.score - 5);
        }
    }

    collidesWith(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }

    resolveCollision(platform) {
        if (this.vy > 0 && this.y + this.height > platform.y && this.y < platform.y) {
            this.y = platform.y - this.height;
            this.vy = 0;
            this.grounded = true;
        }
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 5, this.y + 5, 5, 5);
        ctx.fillRect(this.x + 10, this.y + 5, 5, 5);
    }
}
