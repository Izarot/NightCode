import Cannon from '../entities/Cannon.js';
import Projectile from '../entities/Projectile.js';

export default class AimState {
    static update(game) {
        if (!game.cannon) game.cannon = new Cannon(100, game.height - 100);
        if (game.input) {
            if (game.input.keys.Space) game.cannon.power = Math.min(100, game.cannon.power + 2);
            if (game.input.keys.ArrowUp) game.cannon.angle = Math.max(10, game.cannon.angle - 1);
            if (game.input.keys.ArrowDown) game.cannon.angle = Math.min(170, game.cannon.angle + 1);
            if (game.input.isClick) {
                game.projectile = new Projectile(game.cannon);
                game.setState('flight');
                game.input.isClick = false;
            }
        }
    }

    static render(game) {
        game.cannon.draw(game.ctx);
        if (game.projectile) game.projectile.drawTrajectory(game.ctx);
    }
}