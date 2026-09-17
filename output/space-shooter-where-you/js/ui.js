export class UI{
  constructor(game){ this.game = game; this.title = document.getElementById('title'); this.pause = document.getElementById('pause'); this.results = document.getElementById('results'); this.startBtn = document.getElementById('startBtn'); this.bindButtons(); }
  
  bindButtons(){ const g = this.game; this.startBtn.onclick = ()=>{ this.hideTitle(); g.start(); }; }
  
  showTitle(){ this.title.classList.add('active'); }
  
  hideTitle(){ this.title.classList.remove('active'); }
  
  showPause(){ this.pause.classList.add('active'); }
  
  hidePause(){ this.pause.classList.remove('active'); }
  
  update(dt){ }
}