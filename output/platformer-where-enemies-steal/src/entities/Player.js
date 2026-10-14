import { Vector2 } from '../utils/Vector2.js';

class Player {
    constructor(x, y, config) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.size = new Vector2(32, 48);
        this.config = config;
        this.onGround = false;
        this.footsteps = [];
        this.lastFootstepDistance = 0;
        this.footstepInterval = 0;
        this.activeSounds = 0;
        this.maxActiveSounds = 10;
        this.dead = false;
        this.facing = 1;
    }

    update(deltaTime, platforms, enemies) {
        this.handleInput(deltaTime);
        this.applyPhysics(deltaTime, platforms);
        this.generateFootsteps(deltaTime);
        this.updateFootsteps(deltaTime);
    }

    handleInput(deltaTime) {
        const input = window.playerInput || {};
        let moveX = 0;
        let moveY = 0;
        
        if (input.left) moveX -= 1;
        if (input.right) moveX += 1;
        if (input.up) moveY -= 1;
        if (input.down) moveY += 1;
        
        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.707;
            moveY *= 0.707;
        }
        
        // Apply acceleration
        const accel = this.config.physics.acceleration;
        const maxSpeed = this.config.physics.maxSpeed;
        
        if (moveX !== 0) {
            this.velocity.x += moveX * accel * deltaTime;
            this.velocity.x = Math.max(-maxSpeed, Math.min(maxSpeed, this.velocity.x));
            this.facing = moveX > 0 ? 1 : -1;
        } else {
            // Deceleration
            const decel = accel * 2;
            if (this.velocity.x > 0) {
                this.velocity.x = Math.max(0, this.velocity.x - decel * deltaTime);
            } else {
                this.velocity.x = Math.min(0, this.velocity.x + decel * deltaTime);
            }
        }
        
        // Jumping
        if (input.jump && this.onGround) {
            this.velocity.y = this.config.physics.jumpVelocity;
            this.onGround = false;
        }
    }

    applyPhysics(deltaTime, platforms) {
        const gravity = this.config.physics.gravity;
        const airControl = this.config.physics.airControlFactor;
        
        // Apply gravity
        this.velocity.y += gravity * deltaTime;
        
        // Air control adjustment
        if (!this.onGround) {
            this.velocity.x *= airControl;
        }
        
        // Update position
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        
        // Collision with platforms
        this.onGround = false;
        for (const platform of platforms) {
            if (this.checkCollision(platform)) {
                this.onGround = true;
                this.velocity.y = 0;
                
                // Adjust position based on collision side
                if (this.velocity.y > 0) {
                    this.position.y = platform.position.y - this.size.y;
                }
            }
        }
        
        // Boundary constraints
        this.position.x = Math.max(0, Math.min(1024 - this.size.x, this.position.x));
        this.position.y = Math.max(0, Math.min(768 - this.size.y, this.position.y));
    }

    checkCollision(platform) {
        return this.position.x < platform.position.x + platform.size.x &&
               this.position.x + this.size.x > platform.position.x &&
               this.position.y < platform.position.y + platform.size.y &&
               this.position.y + this.size.y > platform.position.y;
    }

    generateFootsteps(deltaTime) {
        const speed = Math.abs(this.velocity.x);
        const distance = speed * deltaTime;
        this.lastFootstepDistance += distance;
        
        if (this.lastFootstepDistance >= this.config.physics.footstepDistance && speed > 10) {
            this.createFootstep();
            this.lastFootstepDistance = 0;
        }
    }

    createFootstep() {
        if (this.activeSounds < this.maxActiveSounds) {
            const footstep = {
                position: new Vector2(this.position.x + this.size.x / 2, this.position.y + this.size.y),
                radius: 15,
                life: 2.0, // seconds
                maxLife: 2.0,
                absorbed: false,
                absorber: null
            };
            
            this.footsteps.push(footstep);
            this.activeSounds++;
            
            // Play footstep sound
            if (window.audioEngine) {
                window.audioEngine.playFootstep(footstep.position);
            }
        }
    }

    updateFootsteps(deltaTime) {
        for (let i = this.footsteps.length - 1; i >= 0; i--) {
            const footstep = this.footsteps[i];
            footstep.life -= deltaTime;
            
            if (footstep.life <= 0) {
                this.footsteps.splice(i, 1);
                this.activeSounds = Math.max(0, this.activeSounds - 1);
            }
        }
    }

    render(ctx) {
        // Draw player body
        ctx.fillStyle = this.config.colors.player;
        ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);
        
        // Draw facing direction
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.position.x + this.size.x / 2, this.position.y + this.size.y / 2);
        ctx.lineTo(
            this.position.x + this.size.x / 2 + this.facing * 15,
            this.position.y + this.size.y / 2
        );
        ctx.stroke();
        
        // Draw footsteps
        for (const footstep of this.footsteps) {
            const alpha = footstep.life / footstep.maxLife;
            ctx.fillStyle = footstep.absorbed ? 
                `rgba(255, 0, 255, ${alpha * 0.3})` : 
                `rgba(255, 0, 255, ${alpha * 0.7})`;
            
            ctx.beginPath();
            ctx.arc(footstep.position.x, footstep.position.y, footstep.radius * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    getClosestFootstep(position, radius) {
        let closest = null;
        let minDistance = Infinity;
        
        for (const footstep of this.footsteps) {
            if (footstep.absorbed) continue;
            
            const distance = Math.hypot(
                footstep.position.x - position.x,
                footstep.position.y - position.y
            );
            
            if (distance < radius && distance < minDistance) {
                minDistance = distance;
                closest = footstep;
            }
        }
        
        return closest;
    }
}

export { Player };