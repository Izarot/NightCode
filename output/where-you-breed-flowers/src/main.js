import { Game } from './engine/game.js';

const game = new Game();
function loop(timestamp) {
    game.update(timestamp);
    game.draw();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Save high score periodically
setInterval(() => {
    const highScore = localStorage.getItem('floragenesis_highscore') || 0;
    if (game.stats.score > highScore) {
        localStorage.setItem('floragenesis_highscore', game.stats.score);
    }
}, 30000);