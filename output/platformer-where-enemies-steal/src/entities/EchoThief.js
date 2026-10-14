import { Vector2 } from '../utils/Vector2.js';

class EchoThief {
    constructor(x, y, config) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.size = new Vector2(40, 40);
        this.config = config;
        this.stolenEchoes = 0;
        this.maxEchoes = 5;
        this.absorbRadius = 48;
        this.patrolPath = [];
        this.currentPatrolIndex = 0;
        this.patrolSpeed = 50;
        this.dead = false;
        this.glowIntensity = 0;
        this.targetFootstep = null;
    }

    update(deltaTime, player) {
        if (this.targetFootstep) {
            this.chaseFootstep(deltaTime, player);
        } else {
            this.patrol(deltaTime);
        }
        
        this.updateGlow(deltaTime);
        this.absorbFootsteps(player);
    }

    patrol(deltaTime) {
        if (this.patrolPath.length === 0) return;
        
        const target = this.patrolPath[this.currentPatrolIndex];
        const direction = new Vector2(
            target.x - this.position.x,
            target.y - this.position.y
        );
        
        if (direction.length() < 5) {
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPath.length;
            return;
        }
        
        direction.normalize();
        this.velocity = direction.multiply(this.patrolSpeed);
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
    }

    chaseFootstep(deltaTime, player) {
        if (!this.targetFootstep || this.targetFootstep.absorbed) {
            this.targetFootstep = null;
            return;
        }
        
        const direction = new Vector2(
            this.targetFootstep.position.x - this.position.x,
            this.targetFootstep.position.y - this.position.y
        );
        
        direction.normalize();
        this.velocity = direction.multiply(this.patrolSpeed * 1.5);
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
    }

    absorbFootsteps(player) {
        if (this.stolenEchoes >= this.maxEchoes) return;
        
        const footstep = player.getClosestFootstep(this.position, this.absorbRadius);
        
        if (footstep) {
            this.targetFootstep = footstep;
            footstep.absorbed = true;
            footstep.absorber = this;
            
            if (window.audioEngine) {
                window.audioEngine.playEchoAbsorb(this.position);
            }
        } else if (this.targetFootstep && this.targetFootstep.absorbed) {
            this.stolenEchoes++;
            this.targetFootstep = null;
            
            // Drop stolen echo if heavy enough
            if (this.stolenEchoes >= 3) {
                this.dropEcho();
            }
        }
    }

    dropEcho() {
        // Create echo entity at thief position
        if (window.game) {
            const echo = new Echo(
                this.position.x, 
                this.position.y,
                this.config
            );
            window.game.addEntity(echo);
        }
        
        this.stolenEchoes = 0;
    }

    updateGlow(deltaTime) {
        const targetGlow = this.stolenEchoes / this.maxEchoes;
        this.glowIntensity += (targetGlow - this.glowIntensity) * deltaTime * 2;
    }

    render(ctx) {
        // Draw thief body with glow
        const glowColor = `rgba(255, 0, 102, ${0.3 + this.glowIntensity * 0.7})`;
        
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = glowColor;
        
        // Draw shadow body
        ctx.beginPath();
        ctx.ellipse(
            this.position.x + this.size.x / 2,
            this.position.y + this.size.y / 2,
            this.size.x / 2,
            this.size.y / 2,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Draw glowing core
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#ff0066';
        ctx.beginPath();
        ctx.arc(
            this.position.x + this.size.x / 2,
            this.position.y + this.size.y / 2,
            8 * (0.5 + this.glowIntensity * 0.5),
            0, Math.PI * 2
        );
        ctx.fill();
        
        ctx.restore();
        
        // Draw absorb radius
        ctx.strokeStyle = `rgba(255, 0, 102, ${0.2 + this.glowIntensity * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
            this.position.x + this.size.x / 2,
            this.position.y + this.size.y / 2,
            this.absorbRadius,
            0, Math.PI * 2
        );
        ctx.stroke();
    }
}

export { EchoThief };