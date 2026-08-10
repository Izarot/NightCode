export class WaveManager {
    constructor(canvas, evolution) {
        this.canvas = canvas;
        this.evolution = evolution;
        this.currentWave = 1;
        this.enemies = [];
        this.waveComplete = false;
        this.spawnTimer = 0;
        this.spawnInterval = 1;
        this.enemyGrid = [];
        this.swarmDirection = 1;
        this.gridRows = 4;
        this.gridCols = 8;
        this.gridSpacingX = 60;
        this.gridSpacingY = 45;
        this.gridOffsetX = 100;
        this.gridOffsetY = 80;
        this.nextWaveDelay = 0;
        this.nextWaveOverlay = null;
    }
    
    start() {
        this.spawnEnemies();
    }
    
    spawnEnemies() {
        this.enemies = [];
        this.enemyGrid = [];
        
        for (let row = 0; row < this.gridRows; row++) {
            this.enemyGrid[row] = [];
            for (let col = 0; col < this.gridCols; col++) {
                const x = this.gridOffsetX + col * this.gridSpacingX;
                const y = this.gridOffsetY + row * this.gridSpacingY;
                const enemy = new Enemy(x, y, this.currentWave, this.evolution);
                this.enemies.push(enemy);
                this.enemyGrid[row][col] = enemy;
            }
        }
        
        this.spawnTimer = 0;
        this.waveComplete = false;
    }
    
    update(dt, player) {
        this.spawnTimer += dt;
        
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnTimer = 0;
        }
        
        this.updateSwarmMovement();
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt, player);
            
            if (enemy.markedForDeletion) {
                this.enemies.splice(i, 1);
            }
        }
        
        if (this.enemies.length === 0) {
            this.waveComplete = true;
        }
    }
    
    updateSwarmMovement() {
        if (this.enemies.length === 0) return;
        
        let leftmost = this.enemies[0].x;
        let rightmost = this.enemies[0].x;
        
        for (const enemy of this.enemies) {
            if (enemy.x < leftmost) leftmost = enemy.x;
            if (enemy.x > rightmost) rightmost = enemy.x;
        }
        
        if (rightmost > this.canvas.width - 50 || leftmost < 50) {
            this.swarmDirection *= -1;
            for (const enemy of this.enemies) {
                enemy.y += 20;
            }
        }
        
        for (const enemy of this.enemies) {
            enemy.x += 30 * this.swarmDirection;
        }
    }
    
    render(ctx) {
        for (const enemy of this.enemies) {
            enemy.render(ctx);
        }
    }
    
    nextWave() {
        this.currentWave++;
        this.evolution.mutate(this.currentWave);
        this.spawnEnemies();
        this.nextWaveOverlay = `WARNING: EVOLUTION DETECTED - WAVE ${this.currentWave}`;
    }
}