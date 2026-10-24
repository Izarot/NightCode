class HUD{
  constructor(){
    this.timerEl = document.getElementById('timer');
    this.comboEl = document.getElementById('combo');
    this.speedoNeedle = document.getElementById('speedoNeedle');
  }
  update(speed, combo, waveform){
    const time = Math.floor(Math.random() * 60);
    this.timerEl.textContent = '00:' + time.toString().padStart(2, '0');
    this.comboEl.textContent = 'COMBO: ' + combo;
    const angle = (speed / 5) * 90 - 45;
    this.speedoNeedle.style.transform = 'rotate(' + angle + 'deg)';
  }
}