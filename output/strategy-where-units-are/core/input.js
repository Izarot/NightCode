export class InputHandler {
    constructor(game) {
        this.game = game;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.getElementById('spawn-btn').addEventListener('click', () => {
            this.game.units.spawnUnit();
            this.game.sound.play('spawn');
        });
        
        document.getElementById('split-btn').addEventListener('click', () => {
            this.game.units.splitUnit();
            this.game.sound.play('split');
        });
        
        document.getElementById('mutate-btn').addEventListener('click', () => {
            this.game.units.mutateUnit();
            this.game.sound.play('mutate');
        });
        
        this.game.canvas.addEventListener('click', (e) => {
            const rect = this.game.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.game.units.handleClick(x, y);
        });
    }
}