import { Ball } from '../entities/ball.js';
import { Paddle } from '../entities/paddle.js';
import { Brick } from '../entities/brick.js';
import { ParticleSystem } from '../rendering/particleSystem.js';
import { constants } from '../utils/constants.js';
import { helpers } from '../utils/helpers.js';

export class GameEngine {
    constructor({ canvas, ctx, inputHandler, audioManager, hud, menu }) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.inputHandler = inputHandler;
        this.audioManager = audioManager;
        this.hud = hud;
        this.menu = menu;
        
        this.state = 'MENU'; // MENU, PLAYING, PAUSED, GAMEOVER, LEVEL_COMPLETE
        this.level = 1;
        this.score = 0;
        this.lives = 3;
        this.highScore = parseInt(localStorage.getItem('breakoutHighScore')) || 0;
        
        this.balls = [];
        this.paddle = new Paddle(canvas.width / 2, canvas.height - 30);
        this.bricks = [];
        this.particleSystem = new ParticleSystem(ctx);
        this.orbitals = new Map(); // brickId -> {ball, startTime, radius, speed, direction}
        
        this.lastTime = 0;
        this.timer = 0;
        
        this.initLevel();
    }
    
    initLevel() {
        this.bricks = [];
        this.orbitals.clear();
        this.particleSystem.clear();
        
        const brickWidth = constants.BRICK_WIDTH;
        const brickHeight = constants.BRICK_HEIGHT;
        const padding = constants.BRICK_PADDING;
        const offsetTop = constants.BRICK_OFFSET_TOP;
        const offsetLeft = (this.canvas.width - (constants.BRICKS_PER_ROAD * (brickWidth + padding) - padding)) / 2;
        
        for (let row = 0; row < constants.BRICK_ROWS; row++) {
            for (let col = 0; col < constants.BRICKS_PER_ROAD; col++) {
                const health = Math.floor(Math.random() * 3) + 1;
                const x = offsetLeft + col * (brickWidth + padding);
                const y = offsetTop + row * (brickHeight + padding);
                this.bricks.push(new Brick(x, y, health));
            }
        }
        
        // Reset balls
        this.balls = [new Ball(this.canvas.width / 2, this.canvas.height - 50)];
        this.paddle.reset();
        
        // Reset timer
        this.timer = 0;
        this.hud.updateTimer(0);
    }
    
    start() {
        this.state = 'PLAYING';
        this.lastTime = performance.now();
    }
    
    restart() {
        this.level = 1;
        this.score = 0;
        this.lives = 3;
        this.initLevel();
        this.start();
    }
    
    nextLevel() {
        this.level++;
        this.initLevel();
        this.start();
    }
    
    gameOver() {
        this.state = 'GAMEOVER';
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('breakoutHighScore', this.highScore);
        }
        this.hud.updateHighScore(this.highScore);
        this.menu.showGameOver(this.score, this.highScore);
    }
    
    levelComplete() {
        this.state = 'LEVEL_COMPLETE';
        this.menu.showLevelComplete(this.score);
    }
    
    update(timestamp) {
        if (this.state !== 'PLAYING') return;
        
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        
        this.timer += deltaTime;
        this.hud.updateTimer(this.timer);
        
        // Update paddle
        this.paddle.update(this.inputHandler, this.canvas.width);
        
        // Update balls
        for (const ball of this.balls) {
            ball.update(deltaTime, this.canvas.width, this.canvas.height);
            
            // Check for paddle collision
            if (ball.collidesWith(this.paddle)) {
                ball.bounceOffPaddle(this.paddle);
                this.audioManager.play('paddle');
                
                // If ball is orbiting, paddle can absorb it
                for (const [brickId, orbital] of this.orbitals.entries()) {
                    if (orbital.ball === ball) {
                        this.orbitals.delete(brickId);
                        this.hud.updateOrbitCounter(this.orbitals.size);
                        this.audioManager.play('orbitEnd');
                        break;
                    }
                }
            }
            
            // Check wall collisions
            if (ball.x - ball.radius < 0 || ball.x + ball.radius > this.canvas.width) {
                ball.velocity.x = -ball.velocity.x;
                ball.x = helpers.clamp(ball.x, ball.radius, this.canvas.width - ball.radius);
                this.audioManager.play('wall');
            }
            if (ball.y - ball.radius < 0) {
                ball.velocity.y = -ball.velocity.y;
                ball.y = ball.radius;
                this.audioManager.play('wall');
            }
            
            // Check if ball fell below paddle
            if (ball.y > this.canvas.height) {
                this.balls = this.balls.filter(b => b !== ball);
                if (this.balls.length === 0) {
                    this.lives--;
                    this.hud.updateLives(this.lives);
                    if (this.lives <= 0) {
                        this.gameOver();
                    } else {
                        // Reset ball
                        this.balls.push(new Ball(this.canvas.width / 2, this.canvas.height - 50));
                    }
                }
                this.audioManager.play('loseLife');
            }
        }
        
        // Update orbital mechanics
        this.updateOrbitals(deltaTime);
        
        // Check brick collisions
        this.checkBrickCollisions();
        
        // Update particles
        this.particleSystem.update(deltaTime);
        
        // Check win condition
        if (this.bricks.length === 0) {
            this.levelComplete();
        }
    }
    
    updateOrbitals(deltaTime) {
        for (const [brickId, orbital] of this.orbitals.entries()) {
            orbital.elapsedTime += deltaTime;
            
            // End orbit after duration
            if (orbital.elapsedTime >= orbital.duration) {
                this.breakBrick(orbital.brick);
                this.orbitals.delete(brickId);
                this.hud.updateOrbitCounter(this.orbitals.size);
                this.audioManager.play('brickBreak');
                continue;
            }
            
            // Update ball position in orbit
            const angle = orbital.startAngle + (orbital.speed * orbital.elapsedTime * orbital.direction);
            orbital.ball.x = orbital.brick.x + orbital.brick.width / 2 + Math.cos(angle) * orbital.radius;
            orbital.ball.y = orbital.brick.y + orbital.brick.height / 2 + Math.sin(angle) * orbital.radius;
            
            // Add trail effect
            orbital.ball.trail.push({x: orbital.ball.x, y: orbital.ball.y});
            if (orbital.ball.trail.length > 10) orbital.ball.trail.shift();
        }
    }
    
    checkBrickCollisions() {
        for (const ball of this.balls) {
            for (const brick of this.bricks) {
                if (helpers.circleRectCollision(ball, brick)) {
                    // Determine collision side
                    const dx = ball.x - (brick.x + brick.width / 2);
                    const dy = ball.y - (brick.y + brick.height / 2);
                    const absDX = Math.abs(dx);
                    const absDX = Math.abs(dy);
                    
                    if (brick.health > 1 && absDX > brick.width / 2) {
                        // Side hit - trigger orbit
                        this.startOrbit(ball, brick, dx > 0 ? 1 : -1);
                        ball.velocity.x = -ball.velocity.x * 0.5; // Reduce speed
                        ball.velocity.y = -ball.velocity.y * 0.5;
                    } else if (absDY > brick.height / 2) {
                        // Top/bottom hit
                        ball.velocity.y = -ball.velocity.y;
                        if (brick.health > 1) {
                            this.startOrbit(ball, brick, dy > 0 ? 1 : -1);
                        }
                    } else {
                        // Corner hit - treat as side
                        if (brick.health > 1) {
                            this.startOrbit(ball, brick, dx > 0 ? 1 : -1);
                        }
                        ball.velocity.x = -ball.velocity.x;
                        ball.velocity.y = -ball.velocity.y;
                    }
                    
                    brick.health--;
                    this.score += constants.POINTS_PER_HIT * brick.health;
                    this.hud.updateScore(this.score);
                    
                    if (brick.health <= 0) {
                        this.breakBrick(brick);
                    } else {
                        this.audioManager.play('brickHit');
                        this.particleSystem.addBurst(brick.x + brick.width/2, brick.y + brick.height/2, brick.color);
                    }
                    
                    break; // One collision per ball per frame
                }
            }
        }
    }
    
    startOrbit(ball, brick, direction) {
        const brickId = brick.id;
        if (this.orbitals.has(brickId)) return; // Already orbiting
        
        const radius = brick.width * 1.5;
        const speed = helpers.randomRange(constants.ORBIT_SPEED_MIN, constants.ORBIT_SPEED_MAX);
        const duration = helpers.randomRange(constants.ORBIT_DURATION_MIN, constants.ORBIT_DURATION_MAX);
        const startAngle = Math.atan2(
            ball.y - (brick.y + brick.height/2),
            ball.x - (brick.x + brick.width/2)
        );
        
        this.orbitals.set(brickId, {
            ball,
            brick,
            radius,
            speed,
            direction,
            duration,
            startAngle,
            elapsedTime: 0
        });
        
        this.hud.updateOrbitCounter(this.orbitals.size);
        this.audioManager.play('orbitStart');
    }
    
    breakBrick(brick) {
        const index = this.bricks.indexOf(brick);
        if (index > -1) {
            this.bricks.splice(index, 1);
            this.score += constants.POINTS_PER_BRICK;
            this.hud.updateScore(this.score);
            this.particleSystem.addBurst(brick.x + brick.width/2, brick.y + brick.height/2, brick.color, 20);
            this.audioManager.play('brickBreak');
            
            // Chance for power-up
            if (Math.random() < constants.POWERUP_CHANCE) {
                // Implement power-up logic here
            }
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw bricks
        for (const brick of this.bricks) {
            brick.draw(this.ctx);
            
            // Draw orbit path if being orbited
            for (const [brickId, orbital] of this.orbitals.entries()) {
                if (orbital.brick === brick) {
                    this.ctx.beginPath();
                    this.ctx.arc(
                        brick.x + brick.width/2,
                        brick.y + brick.height/2,
                        orbital.radius,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.strokeStyle = `rgba(0, 243, 255, 0.3)`;
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                    break;
                }
            }
        }
        
        // Draw paddle
        this.paddle.draw(this.ctx);
        
        // Draw balls
        for (const ball of this.balls) {
            ball.draw(this.ctx);
        }
        
        // Draw particles
        this.particleSystem.render();
        
        // Draw orbital glow on bricks
        for (const [, orbital] of this.orbitals.entries()) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.5 - (orbital.elapsedTime / orbital.duration) * 0.3;
            this.ctx.beginPath();
            this.ctx.rect(
                orbital.brick.x - 2,
                orbital.brick.y - 2,
                orbital.brick.width + 4,
                orbital.brick.height + 4
            );
            this.ctx.strokeStyle = '#00f3ff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            this.ctx.restore();
        }
    }
}
