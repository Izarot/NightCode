export class UI{
  constructor(game){this.game=game;}
  drawBackground(c){
    const s=this.game.state;
    const off=(s.elapsed*s.bpm/60*40)%720;
    for(let i=0;i<3;i++){
      c.fillStyle=['#2d1b4e','#3d2b5e','#4d3b6e'][i];
      c.fillRect(0,i*240-off%240,1280,240);
    }
    if(s.showGrid){
      c.strokeStyle='rgba(255,255,255,0.2)';
      c.lineWidth=2;
      c.strokeRect(540,300,200,200);
    }
  }
  drawCauldron(c,s){
    const x=s.cauldron.x,y=s.cauldron.y;
    c.fillStyle='#2c1810';
    c.beginPath();c.arc(x,y,s.cauldron.r,0,Math.PI*2);c.fill();
    c.fillStyle='#1a0f08';
    c.beginPath();c.arc(x-10,y-10,s.cauldron.r-15,0,Math.PI*2);c.fill();
    const pulse=0.5+0.5*Math.sin(s.elapsed*s.bpm/60*Math.PI*2);
    c.fillStyle=`rgba(150,80,200,${0.4+pulse*0.3})`;
    c.beginPath();c.arc(x,y-20,s.cauldron.r*0.6*pulse,0,Math.PI*2);c.fill();
  }
  drawIngredients(c,s){
    for(const ing of s.ingredients){
      const drag=window.game.input.dragging===ing;
      c.save();
      c.translate(ing.x,ing.y);
      c.fillStyle=ing.color;
      c.shadowColor=ing.color;c.shadowBlur=drag?30:15;
      c.beginPath();c.arc(0,0,ing.r,0,Math.PI*2);c.fill();
      c.shadowBlur=0;
      c.font='28px serif';c.textAlign='center';c.textBaseline='middle';
      c.fillText(ing.emoji,0,0);
      c.restore();
    }
  }
  drawAvatar(c,s){
    const a=s.avatar;
    c.fillStyle='#fff';
    c.beginPath();c.arc(a.x,a.y,a.r,0,Math.PI*2);c.fill();
    c.fillStyle='#000';
    c.beginPath();c.arc(a.x-8,a.y-5,4,0,Math.PI*2);c.fill();
    c.beginPath();c.arc(a.x+8,a.y-5,4,0,Math.PI*2);c.fill();
    c.fillStyle='#9c27b0';
    c.beginPath();c.moveTo(a.x,a.y+10);c.lineTo(a.x-10,a.y+20);c.lineTo(a.x+10,a.y+20);c.fill();
    if(s.dashCd>0){
      c.strokeStyle='rgba(0,0,0,0.5)';c.lineWidth=3;
      c.beginPath();c.arc(a.x,a.y,a.r+5,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-s.dashCd/0.8));c.stroke();
    }
  }
  drawHUD(c,s){
    const pulse=0.5+0.5*Math.sin(s.elapsed*s.bpm/60*Math.PI*2);
    c.strokeStyle='#fff';c.lineWidth=3;
    c.beginPath();c.arc(640,60,20+pulse*15,0,Math.PI*2);c.stroke();
    c.fillStyle='#fff';c.font='14px sans-serif';c.textAlign='center';
    c.fillText(s.bpm+' BPM',640,90);
    c.fillStyle='#ffd700';c.font='bold 32px sans-serif';c.textAlign='left';
    c.fillText('Score: '+s.score,20,50);
    c.fillStyle='#aaa';c.font='14px sans-serif';
    c.fillText('High: '+s.highScore,20,72);
    const col=s.combo>5?'#ff4444':s.combo>2?'#ffaa00':'#44ff44';
    c.fillStyle=col;c.font='bold 24px sans-serif';
    c.fillText('x'+s.combo,20,110);
    c.fillStyle='#444';c.fillRect(1000,30,260,20);
    c.fillStyle='#9c27b0';c.fillRect(1000,30,260*(s.progress/100),20);
    c.strokeStyle='#fff';c.strokeRect(1000,30,260,20);
    c.fillStyle='#fff';c.font='14px sans-serif';c.textAlign='right';
    c.fillText('Lv '+s.level,1255,25);
    c.fillText(Math.floor(s.elapsed/60)+':'+String(Math.floor(s.elapsed%60)).padStart(2,'0'),1255,65);
    c.textAlign='left';
    c.fillStyle='#fff';c.font='14px sans-serif';
    c.fillText('Next:',20,690);
    for(let i=0;i<s.queue.length;i++){
      c.fillStyle=s.queue[i].color;
      c.beginPath();c.arc(80+i*40,685,15,0,Math.PI*2);c.fill();
      c.font='18px serif';c.textAlign='center';c.textBaseline='middle';
      c.fillText(s.queue[i].emoji,80+i*40,685);
    }
  }
}