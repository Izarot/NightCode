const EMOTIONS = [
  {id:'Joy', color:'#FACC15', rgb:[250,204,21], weight:15.8},
  {id:'Sadness', color:'#3B82F6', rgb:[59,130,246], weight:15.8},
  {id:'Anger', color:'#EF4444', rgb:[239,68,68], weight:15.8},
  {id:'Fear', color:'#A855F7', rgb:[168,85,247], weight:15.8},
  {id:'Disgust', color:'#84CC16', rgb:[132,204,22], weight:15.8},
  {id:'Surprise', color:'#FB923C', rgb:[251,146,60], weight:15.8},
  {id:'Neutral', color:'#E5E7EB', rgb:[229,231,235], weight:5}
];
const totalWeight = EMOTIONS.reduce((s,e)=>s+e.weight,0);
EMOTIONS.forEach(e=>e.prob=e.weight/totalWeight);
function randomEmotion(){ const r=Math.random(); let acc=0; for(const e of EMOTIONS){ acc+=e.prob; if(r<acc) return e; } return EMOTIONS[0]; }
function getEmotion(id){ return EMOTIONS.find(e=>e.id===id) || EMOTIONS[0]; }
class EmotionTracker{
  constructor(){ this.counts={}; this.total=0; this.tilt=0; this.tiltActive=false; this.tiltTimer=0; this.invertTimer=0; }
  add(emo){ this.counts[emo.id]=(this.counts[emo.id]||0)+1; this.total++; }
  remove(emo){ if(this.counts[emo.id]){ this.counts[emo.id]--; this.total--; } }
  getDominant(){ if(this.total===0) return null; let max=0, dom=null; for(const [id,count] of Object.entries(this.counts)){ const pct=count/this.total; if(pct>max){ max=pct; dom=id; } } return {id:dom, pct:max}; }
  update(dt){ const dom=this.getDominant(); if(dom && dom.pct>0.6){ this.tilt=Math.min(1, this.tilt+dt/8000); if(this.tilt>=1 && !this.tiltActive){ this.tiltActive=true; this.tiltTimer=8000; this.invertTimer=3000; Audio.SFX.tilt(); } }else{ this.tilt=Math.max(0, this.tilt-dt/2000); if(this.tilt===0) this.tiltActive=false; }
    if(this.tiltActive){ this.tiltTimer-=dt; this.invertTimer-=dt; if(this.tiltTimer<=0) this.tiltActive=false; }
  }
  isTiltActive(){ return this.tiltActive; }
  isInverted(){ return this.invertTimer>0; }
  getTiltPct(){ return this.tilt; }
  getPressurePct(){ const dom=this.getDominant(); return dom?dom.pct:0; }
  getDominantId(){ const dom=this.getDominant(); return dom?dom.id:null; }
  purge(emoId){ let removed=0; for(let r=0;r<20;r++){ for(let c=0;c<10;c++){ const cell=window.Grid?.getCell(r,c); if(cell && cell.emotion===emoId){ window.Grid?.setCell(r,c,null); removed++; } } } this.total-=removed; this.counts[emoId]=0; return removed; }
  reset(){ this.counts={}; this.total=0; this.tilt=0; this.tiltActive=false; this.tiltTimer=0; this.invertTimer=0; }
}
window.Emotion = { EMOTIONS, randomEmotion, getEmotion, EmotionTracker };