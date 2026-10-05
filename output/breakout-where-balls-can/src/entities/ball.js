import { constants } from '../utils/constants.js';
import { helpers } from '../utils/helpers.js';

export class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = constants.BALL_RADIUS;
        this.velocity = {
            x: helpers.randomRange(constants.BALL_SPEED_MIN, constants.BALL_SPEED_MAX) * (Math.random() > 0.5 ? 1 : -1),
            y: -helpers.randomRange(constants.BALL_SPEED_MIN, constants.BALL_SPEED_MAX)
        };
        this.color = '#ffffff';
        this.trail = [];
        this.maxTrailLength = 10;
    }
    
    update(deltaTime, canvasWidth, canvasHeight) {
        this.x += this.velocity.x * deltaTime * 60; // 60 FPS base
        this.y += this.velocity.y * deltaTime * 60;
        
        // Update trail
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > this.maxTrailLength) this.trail.shift();
    }
    
    draw(ctx) {
        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = i / this.trail.length;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, this.radius * alpha, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
            ctx.fill();
        }
        
        // Draw ball
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw core glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
    }
    
    collidesWith(paddle) {
        const dx = this.x - paddle.x;
        const dy = this.y - paddle.y;
        return Math.sqrt(dx*dx + dy*dy) < this.radius + paddle.height/2;
    }
    
    bounceOffPaddle(paddle) {
        const relativeIntersect = (paddle.x + paddle.width/2) - this.x;
        const normalizedIntersect = relativeIntersect / (paddle.width/2);
        const bounceAngle = normalizedIntersect * constants.MAX_BOUNCE_ANGLE;
        
        this.velocity.x = -Math.sin(bounceAngle) * constants.BALL_SPEED;
        this.velocity.y = -Math.cos(bounceAngle) * constants.BALL_SPEED;
        
        // Add some spin based on paddle movement
        this.velocity.x += paddle.velocity * 0.5;
    }
}
