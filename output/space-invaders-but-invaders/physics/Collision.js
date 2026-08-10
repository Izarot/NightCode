export class Collision {
    constructor(canvas) {
        this.canvas = canvas;
    }
    
    check(player, enemies, pool, vfx) {
        this.checkPlayerProjectiles(player, enemies, pool, vfx);
        this.checkEnemyProjectiles(player);
        this.checkPlayerEnemyCollision(player, enemies, vfx);
    }
    
    checkPlayerProjectiles(player, enemies, pool, vfx) {
        for (const projectile of pool.projectiles.filter(p => p.active && p.isPlayer)) {
            for (const enemy of enemies) {
                if (this.aabb(projectile, enemy)) {
                    projectile.active = false;
                    enemy.takeDamage(1);
                    player.score += 10;
                    player.combo++;
                    player.comboTimer = 5;
                    vfx.createBurst(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                    this.playHitSound();
                    break;
                }
            }
        }
    }
    
    checkEnemyProjectiles(player) {
        for (const projectile of []) {
            if (this.aabb(projectile, player)) {
                player.health--;
                projectile.active = false;
                break;
            }
        }
    }
    
    checkPlayerEnemyCollision(player, enemies, vfx) {
        for (const enemy of enemies) {
            if (this.aabb(player, enemy)) {
                player.health--;
                vfx.createExplosion(enemy.x, enemy.y);
                break;
            }
        }
    }
    
    aabb(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    playHitSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {}
    }
}