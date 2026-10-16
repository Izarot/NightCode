export class MazeGenerator {
    constructor(game) {
        this.game = game;
        this.walls = [];
        this.gapSize = 120;
        this.wallThickness = 20;
        this.scrollSpeed = 150;
        this.spawnTimer = 0;
        this.spawnInterval = 1.5;
        this.difficulty = 1;
        this.colorScheme = null;
        
        this.canvasWidth = game.width;
        this.canvasHeight = game.height;
    }

    onResize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }

    reset() {
        this.walls = [];
        this.scrollSpeed = 150;
        this.spawnTimer = 0;
        this.spawnInterval = 1.5;
        this.difficulty = 1;
        this.gapSize = 120;
        
        // Create initial safe zone
        this.createWallPair(this.canvasWidth + 100, true);
    }

    fixedUpdate(dt) {
        this.spawnTimer += dt;
        
        // Increase difficulty over time
        this.difficulty = 1 + this.game.hud.score / 10000;
        this.scrollSpeed = 150 * Math.min(this.difficulty, 3);
        this.gapSize = Math.max(80, 120 - this.difficulty * 10);
        this.spawnInterval = Math.max(0.8, 1.5 - this.difficulty * 0.15);
        
        // Move walls
        for (const wall of this.walls) {
            wall.x -= this.scrollSpeed * dt;
        }
        
        // Remove off-screen walls
        this.walls = this.walls.filter(w => w.x + this.wallThickness > -50);
        
        // Spawn new walls
        if (this.spawnTimer >= this.spawnInterval) {
            this.createWallPair(this.canvasWidth + 50);
            this.spawnTimer = 0;
        }
    }

    update(dt) {
        // Update color scheme based on score
        this.colorScheme = this.game.getColorScheme();
    }

    createWallPair(x, isStart = false) {
        const minGapY = 80;
        const maxGapY = this.canvasHeight - 80 - this.gapSize;
        const gapY = isStart ? (this.canvasHeight - this.gapSize) / 2 : minGapY + Math.random() * (maxGapY - minGapY);
        
        // Top wall
        this.walls.push({
            x: x,
            y: 0,
            width: this.wallThickness,
            height: gapY,
            type: 'wall'
        });
        
        // Bottom wall
        this.walls.push({
            x: x,
            y: gapY + this.gapSize,
            width: this.wallThickness,
            height: this.canvasHeight - gapY - this.gapSize,
            type: 'wall'
        });
        
        // Add decorative obstacles occasionally
        if (!isStart && Math.random() < 0.3 * this.difficulty) {
            this.createObstacle(x, gapY);
        }
    }

    createObstacle(x, gapY) {
        const obstacleTypes = ['block', 'spike', 'moving'];
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        let obsX = x + (Math.random() - 0.5) * 100;
        let obsY = gapY + Math.random() * this.gapSize;
        
        // Ensure obstacle is within gap
        obsY = Math.max(gapY + 20, Math.min(gapY + this.gapSize- 20, obsY));
        
        const size = 30 + Math.random() * 20 * this.difficulty;
        
        this.walls.push({
            x: obsX,
            y: obsY,
            width: size,
            height: size,
            type: type,
            angle: 0,
            spinSpeed: (Math.random() - 0.5) * 3,
            moveDir: type === 'moving' ? (Math.random() > 0.5 ? 1 : -1) : 0,
            moveRange: type === 'moving' ? 50 + Math.random() * 50 : 0,
            startY: obsY
        });
    }

    render(ctx) {
        if (!this.colorScheme) this.colorScheme = this.game.getColorScheme();
        
        ctx.fillStyle = this.settings?.highContrast ? '#fff' : this.colorScheme.wall;
        
        for (const wall of this.walls) {
            if (wall.type === 'wall') {
                ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
                
                // Wall edge highlight
                ctx.strokeStyle = this.settings?.highContrast ? '#ff0' : this.colorScheme.accent;
                ctx.lineWidth = 2;
                ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
            } else {
                this.renderObstacle(ctx, wall);
            }
        }
    }

    renderObstacle(ctx, obs) {
        ctx.save();
        ctx.translate(obs.x + obs.width/2, obs.y + obs.height/2);
        ctx.rotate(obs.angle);
        
        const color = this.settings?.highContrast ? '#fff' : this.colorScheme.accent;
        ctx.fillStyle = color;
        ctx.strokeStyle = this.settings?.highContrast ? '#ff0' : this.colorScheme.wall;
        ctx.lineWidth = 2;
        
        switch(obs.type) {
            case 'block':
                ctx.fillRect(-obs.width/2, -obs.height/2, obs.width, obs.height);
                ctx.strokeRect(-obs.width/2, -obs.height/2, obs.width, obs.height);
                break;
            case 'spike':
                ctx.beginPath();
                ctx.moveTo(0, -obs.height/2);
                ctx.lineTo(obs.width/2, obs.height/2);
                ctx.lineTo(-obs.width/2, obs.height/2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            case 'moving':
                ctx.beginPath();
                ctx.arc(0, 0, obs.width/2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                // Direction indicator
                ctx.fillStyle = this.settings?.highContrast ? '#000' : this.colorScheme.bg;
                ctx.beginPath();
                ctx.arc(obs.moveDir * 5, 0, 5, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        ctx.restore();
    }

    checkCollision(player) {
        const playerRect = player.getBounds();
        
        for (const wall of this.walls) {
            if (wall.type === 'wall') {
                if (Physics.checkAABB(playerRect, wall)) return true;
            } else {
                // Obstacle collision
                const obsRect = { x: wall.x, y: wall.y, width: wall.width, height: wall.height };
                if (Physics.checkAABB(playerRect, obsRect)) return true;
            }
        }
        return false;
    }

    get settings() {
        return this.game.settings;
    }
}