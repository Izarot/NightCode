// Player physics and movement
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.maxSpeed = 6;
        this.acceleration = 0.5;
        this.friction = 0.85;
        this.size = 10;
    }
    
    update(keys, canvas, obstacles = []) {
        // Handle input
        let ax = 0, ay = 0;
        if (keys['w'] || keys['ArrowUp']) ay -= this.acceleration;
        if (keys['s'] || keys['ArrowDown']) ay += this.acceleration;
        if (keys['a'] || keys['ArrowLeft']) ax -= this.acceleration;
        if (keys['d'] || keys['ArrowRight']) ax += this.acceleration;
        
        // Apply acceleration
        this.vx += ax;
        this.vy += ay;
        
        // Limit speed
        const speed = Math.hypot(this.vx, this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
        
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Update position with collision
        let newX = this.x + this.vx;
        let newY = this.y + this.vy;
        
        // Check collisions
        let collision = false;
        for (const obstacle of obstacles) {
            if (newX + this.size > obstacle.x && 
                newX - this.size < obstacle.x + obstacle.width &&
                newY + this.size > obstacle.y && 
                newY - this.size < obstacle.y + obstacle.height) {
                collision = true;
                this.vx = 0;
                this.vy = 0;
                break;
            }
        }
        
        if (!collision) {
            this.x = newX;
            this.y = newY;
        }
        
        // Boundary constraints
        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y));
        
        // Update facing direction
        if (speed > 0.1) {
            this.angle = Math.atan2(this.vy, this.vx);
        }
    }
}