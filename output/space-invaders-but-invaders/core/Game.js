export class Game {
    constructor(canvas, ctx, player, waveManager, collision, vfx, hud, menu, pool, config) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.player = player;
        this.waveManager = waveManager;
        this.collision = collision;
        this.vfx = vfx;
        this.hud = hud;
        this.menu = menu;
        this.pool = pool;
        this.config = config;
        this.running = false;
        this.waveOverlay = null;
        this.shakeIntensity = 0;
        this.trailAlpha = 0.2;
    }
    
    init() {
        this.waveManager.start();
        this.running = true;
        this.menu.hide();
    }
    
    update(dt) {
        this.player.update(dt);
        this.waveManager.update(dt, this.player);
        this.collision.check(this.player, this.waveManager.enemies, this.pool, this.vfx);
        
        if (this.waveManager.waveComplete) {
            this.waveManager.nextWave();
        }
        
        this.updateShake();
        this.updateTrail();
    }
    
    render() {
        this.ctx.save();
        
        if (this.shakeIntensity > 0) {
            const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            this.ctx.translate(shakeX, shakeY);
        }
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, ' + this.trailAlpha + ')';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.player.render(this.ctx);
        this.waveManager.render(this.ctx);
        this.vfx.render(this.ctx);
        
        this.ctx.restore();
        
        this.hud.render(this.player.score, this.waveManager.currentWave, this.player.health, this.player.combo);
    }
    
    updateShake() {
        if (this.shakeIntensity > 0) {
            this.shakeIntensity -= 0.5;
        }
    }
    
    updateTrail() {
        this.trailAlpha = Math.max(0.1, this.trailAlpha - 0.001);
    }
    
    triggerShake(intensity) {
        this.shakeIntensity = intensity;
    }
    
    triggerTrail() {
        this.trailAlpha = 0.3;
    }
}