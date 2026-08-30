export default class MenuState {
    static update(game) {
        if (game.input && game.input.isClick) {
            game.setState('aim');
            game.input.isClick = false;
        }
    }

    static render(game) {
        game.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        game.ctx.fillRect(0, 0, game.width, game.height);
        game.ctx.fillStyle = '#ffffff';
        game.ctx.font = '48px Arial';
        game.ctx.textAlign = 'center';
        game.ctx.fillText('Artillery Ace', game.width/2, game.height/2 - 50);
        game.ctx.font = '24px Arial';
        game.ctx.fillText('Click to Start', game.width/2, game.height/2 + 50);
    }
}