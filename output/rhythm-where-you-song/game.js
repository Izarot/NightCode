const canvas=document.getElementById('game')
const ctx=canvas.getContext('2d')
let W=innerWidth,H=innerHeight,score=0,best=+(localStorage.getItem('chromabeatBest')||0)
let combo=0,multiplier=1,bpm=120,startTime=0,elapsed=0,speedrunStart=performance.now(),last=0,prevT=0
const colors=['#FF0033','#00A3FF','#39FF14','#FFD700']
const keys={D:0,F:1,J:2,K:3}
const HIT_WINDOW=50
const hitLine=()=>H-140
let notes=[]
let audioCtx=null
function resize(){W=innerWidth;H=innerHeight;canvas.width=W;canvas.height=H}
addEventListener('resize',resize)
function tone(freq,type,dur){
try{
if(!audioCtx){audioCtx=new (window.AudioContext||window.webkitAudioContext)()}
if(audioCtx.state==='suspended'){audioCtx.resume()}
const o=audioCtx.createOscillator(),g=audioCtx.createGain()
o.type=type;o.frequency.value=freq;g.gain.value=0.2
g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur)
o.connect(g);g.connect(audioCtx.destination)
o.start(audioCtx.currentTime);o.stop(audioCtx.currentTime+dur)
}catch(e){}
}
function laneX(lane){return (lane+0.5)*(W/4)}
function loop(t){
requestAnimationFrame(loop)
if(!startTime){startTime=t;prevT=t;last=t}
const dt=Math.min((t-prevT)/1000,0.05);prevT=t
elapsed=(t-startTime)/1000
if(t-last>1000/bpm){last=t;notes.push({lane:Math.floor(Math.random()*4),y:-30,h:20,hit:false,remove:false})}
const speed=250
const line=hitLine()
notes.forEach(n=>{if(!n.hit){n.y+=speed*dt}})
notes.forEach(n=>{if(!n.hit&&n.y>line+HIT_WINDOW){n.hit=true;combo=0;multiplier=1}})
notes=notes.filter(n=>!n.remove&&n.y<H+60)
ctx.fillStyle='#050510';ctx.fillRect(0,0,W,H)
for(let i=1;i<4;i++){ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.beginPath();ctx.moveTo(i*W/4,0);ctx.lineTo(i*W/4,H);ctx.stroke()}
ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(0,line);ctx.lineTo(W,line);ctx.stroke()
notes.forEach(n=>{ctx.fillStyle=colors[n.lane];ctx.fillRect(laneX(n.lane)-30,n.y,60,n.h)})
ctx.fillStyle='#fff';ctx.font='16px monospace';ctx.textAlign='left'
ctx.fillText('Score '+score,10,H-10)
ctx.fillText('Best '+best,10,30)
ctx.fillText('Combo '+combo+' x'+multiplier,10,50)
ctx.fillText('Time '+Math.floor((performance.now()-speedrunStart)/1000),W-100,H-10)
}
addEventListener('keydown',e=>{
const k=e.key.toUpperCase()
if(k in keys){
const lane=keys[k]
const line=hitLine()
let target=null,dist=Infinity
notes.forEach(n=>{
if(!n.hit&&n.lane===lane){
const d=Math.abs(n.y-line)
if(d<dist){dist=d;target=n}
}
})
if(target&&dist<=HIT_WINDOW){
target.hit=true;target.remove=true
tone(440+lane*110,'square',0.05)
combo++
multiplier=1+Math.floor(combo/10)
score+=100*multiplier
if(score>best){best=score;try{localStorage.setItem('chromabeatBest',best)}catch(err){}}
}else{
combo=0;multiplier=1
}
}
})
requestAnimationFrame(loop)