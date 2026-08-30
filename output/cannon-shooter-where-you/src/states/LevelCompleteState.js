export default class LevelCompleteState {
    static update(game) {
        if (game.input && game.input.isClick) {
            game.level++;
            game.setState('aim');
            game.input.isClick = false;
        }
    }

    static render(game) {
        game.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        game.ctx.fillRect(0, 0, game.width, game.height);
        game.ctx.fillStyle = '#ffffff';
        game.ctx.font = '36px Arial';
        game.ctx.textAlign = 'center';
        game.ctx.fillText('Level Complete!', game.width/2, game.height/2);
        game.ctx.font = '24px Arial';
        game.ctx.fillText('Click for Next Level', game.width/2, game.height/2 + 50);
    }
}