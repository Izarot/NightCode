export class Config {
    constructor() {
        this.colors = {
            background: '#050505',
            player: '#00FFFF',
            enemy: '#FF00FF',
            projectile: '#FFBF00',
            particle: '#FFBF00'
        };
        
        this.difficulty = {
            baseSpeed: 50,
            baseHealth: 1,
            projectileSpeed: 200,
            enemyProjectileSpeed: 150
        };
    }
}