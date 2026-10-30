const canvas=document.getElementById('game')
const ctx=canvas.getContext('2d')
const hud=document.getElementById('hud')
let W=innerWidth,H=innerHeight,score=0,best=+(localStorage.getItem('chromabeatBest')||0)
let combo=0,multiplier=1,bpm=120,startTime=0,elapsed=0,speedrunStart=performance.now(),last=0
const colors=['#FF0033','#00A3FF','#39FF14','#FFD700']
const keys={D:0,F:1,J:2,K:3}
let notes=[]
function resize(){W=innerWidth;H=innerHeight;canvas.width=W;canvas.height=H}
addEventListener('resize',resize)
function tone(freq,type,dur){try{let a=new AudioContext();let o=a.createOscillator();let g=a.createGain();o.type=type;o.frequency.value=freq;g.gain.value=0.2;g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+dur);o.connect(g);g.connect(a.destination);o.start(a.currentTime);o.stop(a.currentTime+dur)}catch(e){}}
function loop(t){
requestAnimationFrame(loop)
if(!startTime){startTime=t;last=t}
elapsed=(t-startTime)/1000
if(t-last>1000/bpm){last=t;notes.push({x:100+Math.random()*(W-200),y:H+40,h:20})}
ctx.fillStyle='#050510';ctx.fillRect(0,0,W,H)
notes.forEach(n=>{ctx.fillStyle=colors[0];ctx.fillRect(n.x,n.y,n.h,10)})
ctx.fillStyle='#fff';ctx.fillText('Score '+score,W-100,H-10)
ctx.fillStyle='#fff';ctx.fillText('Best '+best,W-150,30)
ctx.fillStyle='#fff';ctx.fillText('Time '+Math.floor((performance.now()-speedrunStart)/1000),10,H-10)
}
addEventListener('keydown',e=>{if(keys[e.key]){let i=keys[e.key];let n=notes.filter(n=>!n.hit).sort((a,b)=>a.y-b.y)[0];if(n){n.hit=1;tone(440,'square',0.05);combo++;score+=100*multiplier}else{combo=0}}})
tone(440,'square',0.05)
requestAnimationFrame(loop)