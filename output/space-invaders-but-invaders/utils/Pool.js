export class Pool {
    constructor() {
        this.projectiles = [];
        this.maxProjectiles = 100;
        this.initializePool();
    }
    
    initializePool() {
        for (let i = 0; i < this.maxProjectiles; i++) {
            const proj = new (await import('../physics/Projectile.js')).Projectile();
            this.projectiles.push(proj);
        }
    }
    
    getProjectile() {
        for (const proj of this.projectiles) {
            if (!proj.active) {
                return proj;
            }
        }
        return null;
    }
}