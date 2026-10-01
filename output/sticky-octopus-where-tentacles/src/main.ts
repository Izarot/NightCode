import { Game } from './core/Game';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    const game = new Game(canvas);
    game.start();
});