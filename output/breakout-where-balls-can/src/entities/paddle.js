import { constants } from '../utils/constants.js';

export class Paddle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = constants.PADDLE_WIDTH;
        this.height = constants.PADDLE_HEIGHT;
        this.color = '#00f3ff';
        this.velocity = 0;
        this.maxSpeed = constants.PADDLE_MAX_SPEED;
        this.acceleration = constants.PADDLE_ACCELERATION;
        this.deceleration = constants.PADDLE_DECELERATION;
    }
    
    reset() {
        this.x = this.canvasWidth / 2 - this.width / 2;
        this.velocity = 0;
    }
    
    update(inputHandler, canvasWidth) {
        this.canvasWidth = canvasWidth;
        let acc = 0;
        
        if (inputHandler.isPressed('ArrowLeft') || inputHandler.isPressed('KeyA')) {
            acc = -this.acceleration;
        } else if (inputHandler.isPressed('ArrowRight') || inputHandler.isPressed('KeyD')) {
            acc = this.acceleration;
        } else {
            // Deceleration
            acc = -Math.sign(this.velocity) * this.deceleration;
            if (Math.abs(this.velocity) < this.deceleration) this.velocity = 0;
        }
        
        this.velocity += acc;
        this.velocity = helpers.clamp(this.velocity, -this.maxSpeed, this.maxSpeed);
        
        this.x += this.velocity;
        this.x = helpers.clamp(this.x, 0, canvasWidth - this.width);
    }
    
    draw(ctx) {
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 5);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw glow
        ctx.save();
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x,
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}
