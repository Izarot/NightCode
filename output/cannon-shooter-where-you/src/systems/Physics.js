export class Physics {
    static update(projectile, gravity = 0.2, wind = 0) {
        projectile.vy += gravity;
        projectile.vx += wind;
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
    }
}