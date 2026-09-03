import {SONGS} from '../levels/songs.js';
export class UI{
  constructor(game){this.game=game;this.songEl=document.getElementById('songName');
    this.comboEl=document.getElementById('combo');this.scoreEl=document.getElementById('score');
    this.timerEl=document.getElementById('timer');
    this.title=document.getElementById('titleScreen');
    this.pause=document.getElementById('pauseScreen');
    this.complete=document.getElementById('completeScreen');
    document.getElementById('startBtn').onclick=()=>game.startLevel(game.levelIdx);
    document.getElementById('resumeBtn').onclick=()=>{game.state='PLAYING';this.hideAll();};
    document.getElementById('nextBtn').onclick=()=>game.startLevel(Math.min(game.levelIdx+1,2));
    document.getElementById('retryBtn').onclick=()=>game.startLevel(game.levelIdx);
  }
  buildSongList(){
    const list=document.getElementById('songList');list.innerHTML='';
    SONGS.forEach((s,i)=>{
      const r=document.createElement('div');r.className='song-row';r.textContent=(i+1)+'. '+s.name+' ('+s.bpm+' BPM)';
      r.onclick=()=>{this.game.levelIdx=i;this.game.startLevel(i);};
      list.appendChild(r);
    });
  }
  hideAll(){this.title.classList.add('hidden');this.pause.classList.add('hidden');this.complete.classList.add('hidden');}
  show(id){document.getElementById(id).classList.remove('hidden');}
  update(g){
    const s=g.levels;this.songEl.textContent='SONG: '+s.name;
    this.scoreEl.textContent='SCORE: '+g.score.points;
    this.comboEl.textContent='COMBO: '+g.score.combo+'x';
    const m=Math.floor(g.timer/60000);const sec=((g.timer%60000)/1000).toFixed(2);
    this.timerEl.textContent='⏱ '+m+':'+(sec<10?'0':'')+sec;
  }
  showComplete(g){
    const sc=g.score;
    let grade='C';if(sc.perfect>=sc.notes*0.8)grade='S';else if(sc.perfect>=sc.notes*.5)grade='A';else if(sc.good>=sc.notes*.5)grade='B';
    document.getElementById('completeTitle').textContent=g.levels.name+' COMPLETE!';
    document.getElementById('completeStats').textContent='Score: '+sc.points+'  ·  Grade: '+grade+'  ·  Max Combo: '+sc.maxCombo+'x';
    const m=Math.floor(g.timer/60000);const sec=((g.timer%60000)/1000).toFixed(2);
    const bm=Math.floor(g.bestMs/60000);const bsec=((g.bestMs%60000)/1000).toFixed(2);
    document.getElementById('completeHigh').textContent='Time: '+m+':'+(sec<10?'0':'')+sec+'   |   Best: '+bm+':'+(bsec<10?'0':'')+bsec;
    this.show('completeScreen');
  }
}
