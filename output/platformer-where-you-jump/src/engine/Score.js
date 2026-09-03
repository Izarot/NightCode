export class Score{
  constructor(){this.points=0;this.combo=0;this.maxCombo=0;
    this.perfect=0;this.good=0;this.off=0;}
  reset(){this.points=0;this.combo=0;this.maxCombo=0;this.perfect=0;this.good=0;this.off=0;}
  resetCombo(){this.combo=0;}
  add(quality){
    const base=quality===2?100:quality===1?50:10;
    const mult=Math.min(this.combo+1,4);
    const pts=base*mult;
    this.points+=pts;
    this.combo++;if(this.combo>this.maxCombo)this.maxCombo=this.combo;
    if(quality===2)this.perfect++;else if(quality===1)this.good++;else this.off++;
    return pts;
  }
}
