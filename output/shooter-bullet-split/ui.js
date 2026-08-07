export class UI {
    constructor() {
        this.scoreEl = document.getElementById('score');
        this.healthFill = document.getElementById('healthFill');
        this.comboEl = document.getElementById('combo');
        this.timerEl = document.getElementById('timer');
    }
    
    updateScore(score) {
        this.scoreEl.textContent = `Score: ${score}`; 
    }
    
    updateHealth(hp, maxHp) {
        const percent = (hp / maxHp) * 100;
        this.healthFill.style.width = `${percent}%`;
    }
    
    updateCombo(combo) {
        this.comboEl.textContent = `COMBO: x${combo}`;
    }
    
    updateTimer(mins, secs) {
        const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        this.timerEl.textContent = `Time: ${formatted}`;
    }
}