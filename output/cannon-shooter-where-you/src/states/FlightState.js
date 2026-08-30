export default class FlightState {
    static update(game) {
        if (!game.projectile) return;
        game.projectile.update();
        if (game.projectile.outOfBounds || game.projectile.hitTarget) {
            game.setState('complete');
        }
    }

    static render(game) {
        game.projectile.draw(game.ctx);
    }
}