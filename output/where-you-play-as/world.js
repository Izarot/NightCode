export class GameWorld {
    constructor() {
        this.entities = [];
        this.player = null;
        this.init();
    }

    init() {
        this.entities = [];
        
        // Create static platforms
        for (let x = 0; x < 1920; x += 64) {
            this.entities.push({
                type: 'staticBlock',
                x: x,
                y: 1000,
                width: 64,
                height: 32,
                color: '#21262D',
                rigidbody: true
            });
        }
        
        // Create variable blocks
        for (let i = 0; i < 5; i++) {
            this.entities.push({
                type: 'varBlock',
                x: 200 + i * 150,
                y: 900 - (i * 20),
                width: 32,
                height: 32,
                color: '#3FB950',
                value: 42 + i,
                rigidbody: true,
                update: function(engine) {
                    // Breathing animation
                    this.scale = 1 + Math.sin(Date.now() * 0.005) * 0.02;
                },
                render: function(ctx) {
                    ctx.fillStyle = this.color;
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                    
                    // Draw value
                    ctx.fillStyle = '#FFF';
                    ctx.font = '12px JetBrains Mono';
                    ctx.fillText(this.value, this.x + 4, this.y + 20);
                    
                    // Border
                    ctx.strokeStyle = '#FFF';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(this.x, this.y, this.width, this.height);
                }
            });
        }
        
        // Create syntax errors
        for (let i = 0; i < 3; i++) {
            this.entities.push({
                type: 'syntaxError',
                x: 400 + i * 200,
                y: 800,
                width: 32,
                height: 32,
                color: '#F85149',
                rigidbody: true,
                vx: (Math.random() - 0.5) * 2,
                update: function(engine) {
                    // Jitter effect
                    this.x += Math.sin(Date.now() * 0.05) * 0.1;
                },
                render: function(ctx) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    
                    // Glitch effect
                    const offset = Math.sin(Date.now() * 0.02) * 2;
                    ctx.fillStyle = this.color;
                    ctx.fillRect(offset, 0, this.width, this.height);
                    
                    // Jagged edges
                    ctx.strokeStyle = '#FFF';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(this.width/2, this.height/2);
                    ctx.lineTo(this.width, 0);
                    ctx.stroke();
                    
                    ctx.restore();
                }
            });
        }
        
        // Create exit portal
        this.entities.push({
            type: 'exitPortal',
            x: 1800,
            y: 950,
            width: 32,
            height: 64,
            color: '#A371F7',
            render: function(ctx) {
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Animated portal
                const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
                ctx.fillStyle = `rgba(163, 113, 247, ${pulse})`;
                ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
            }
        });
    }

    createPlayer() {
        return {
            x: 100,
            y: 900,
            width: 32,
            height: 64,
            color: '#FFFFFF',
            vx: 0,
            vy: 0,
            onGround: false,
            rigidbody: true,
            
            update: function(engine) {
                // Movement physics
                const accel = 0.8;
                const maxSpeed = 7;
                
                if (engine.keys && engine.keys['KeyA']) {
                    this.vx = Math.max(this.vx - accel, -maxSpeed);
                }
                if (engine.keys && engine.keys['KeyD']) {
                    this.vx = Math.min(this.vx + accel, maxSpeed);
                }
                
                // Jump
                if (engine.keys && engine.keys['Space'] && this.onGround) {
                    this.vy = -14;
                    this.onGround = false;
                    engine.audio?.playSound('jump');
                }
                
                // Gravity
                this.vy += 0.5;
                if (this.vy > 15) this.vy = 15;
                
                // Apply velocity
                this.x += this.vx;
                this.y += this.vy;
                
                // Ground collision
                if (this.y + this.height > 1000) {
                    this.y = 1000 - this.height;
                    this.vy = 0;
                    this.onGround = true;
                }
                
                // Screen boundaries
                if (this.x < 0) this.x = 0;
                if (this.x > 1920 - this.width) this.x = 1920 - this.width;
                
                // Check exit portal collision
                const portal = engine.entities.find(e => e.type === 'exitPortal');
                if (portal && this.x < portal.x + portal.width &&
                    this.x + this.width > portal.x &&
                    this.y < portal.y + portal.height &&
                    this.y + this.height > portal.y) {
                    engine.score += 100;
                    engine.callStack.push('compile');
                    engine.audio?.playSound('compile');
                    
                    // Simple level progression
                    setTimeout(() => {
                        engine.score += 200;
                        engine.callStack.push('deploy');
                        engine.audio?.playSound('success');
                    }, 1000);
                }
            },
            
            render: function(ctx) {
                // Player body
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Debug outline
                ctx.strokeStyle = '#FF7B72';
                ctx.lineWidth = 2;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
                
                // Facing direction indicator
                ctx.fillStyle = '#FF7B72';
                if (this.vx > 0) {
                    ctx.fillRect(this.x + this.width, this.y + 10, 4, 10);
                } else if (this.vx < 0) {
                    ctx.fillRect(this.x - 4, this.y + 10, 4, 10);
                }
            }
        };
    }
}