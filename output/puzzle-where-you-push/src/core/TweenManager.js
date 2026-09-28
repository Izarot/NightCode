export class TweenManager{
  constructor(){this.tweens=[]}
  add(obj,prop,target,duration){const start=obj[prop];const startTime=performance.now();this.tweens.push({obj,prop,start,target,duration,startTime})}
  update(dt){const now=performance.now();this.tweens=this.tweens.filter(t=>{const elapsed=now-t.startTime;const progress=Math.min(elapsed/t.duration,1);const eased=1-(1-progress)**2;t.obj[t.prop]=t.start+(t.target-t.start)*eased;return progress<1})}
  clear(){this.tweens=[]}
}
