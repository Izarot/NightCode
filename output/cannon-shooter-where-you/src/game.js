import MenuState from './states/MenuState.js';
import AimState from './states/AimState.js';
import FlightState from './states/FlightState.js';
import LevelCompleteState from './states/LevelCompleteState.js';
import { Storage } from './utils/Storage.js';

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.state = 'menu';
        this.score = 0;
        this.level = 1;
        this.maxLevel = 15;
        this.highScore = Storage.get('highScore') || 0;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const scale = Math.min(window.innerWidth / this.width, window.innerHeight / this.height);
        this.canvas.style.width = (this.width * scale) + 'px';
        this.canvas.style.height = (this.height * scale) + 'px';
    }

    start() {
        this.state = 'menu';
        this.loop();
    }

    loop() {
        requestAnimationFrame(() => this.loop());
        this.update();
        this.render();
    }

    update() {
        switch(this.state) {
            case 'menu': MenuState.update(this); break;
            case 'aim': AimState.update(this); break;
            case 'flight': FlightState.update(this); break;
            case 'complete': LevelCompleteState.update(this); break;
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        switch(this.state) {
            case 'menu': MenuState.render(this); break;
            case 'aim': AimState.render(this); break;
            case 'flight': FlightState.render(this); break;
            case 'complete': LevelCompleteState.render(this); break;
        }
    }

    setState(state) { this.state = state; }
}