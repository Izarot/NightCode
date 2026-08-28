const UI={
drawPatternIcon(ctx,x,y,icon,color,size=20){
ctx.save();ctx.translate(x,y);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;
switch(icon){
case'star':for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.moveTo(0,-size*0.3);ctx.lineTo(size*0.1,0);ctx.stroke();}break;
case'cross':ctx.beginPath();ctx.moveTo(0,-size*0.4);ctx.lineTo(0,size*0.4);ctx.moveTo(-size*0.4,0);ctx.lineTo(size*0.4,0);ctx.stroke();break;
case'spiral':ctx.beginPath();for(let i=0;i<60;i++){const a=i*0.2;const r=i*size*0.01;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.stroke();break;
case'lattice':for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*size*0.3,-size*0.4);ctx.lineTo(i*size*0.3,size*0.4);ctx.stroke();}for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(-size*0.4,i*size*0.3);ctx.lineTo(size*0.4,i*size*0.3);ctx.stroke();}break;
case'paradox':ctx.beginPath();ctx.arc(0,0,size*0.3,0,Math.PI*2);ctx.stroke();for(let i=0;i<6;i++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(size*0.4,0);ctx.stroke();}break;
}
ctx.restore();
},
drawHUD(ctx,game){
ctx.save();
ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(20,20,200,40);
ctx.strokeStyle=COLORS.cyan;ctx.lineWidth=1;ctx.strokeRect(20,20,200,40);
ctx.fillStyle=COLORS.cyan;ctx.font='14px Orbitron';ctx.textAlign='left';
ctx.fillText('CHAMBER '+game.chamber+' / 5',30,40);
ctx.fillText('PATTERNS: '+game.absorbedPatterns.length+' / 5',30,60);
ctx.fillStyle='#ffaa00';ctx.fillText('SCORE: '+game.score,130,40);
ctx.fillStyle='#ff66aa';ctx.fillText('TIME: '+game.formatTime(),130,60);
ctx.textAlign='center';
const slotW=80,slotH=60;const slotsX=640-slotsW*1.5;
for(let i=0;i<3;i++){
const x=slotsX+i*slotW+10;const y=20;
ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(x,y,slotW-10,slotH);
ctx.strokeStyle='rgba(0,217,255,0.3)';ctx.lineWidth=1;ctx.strokeRect(x,y,slotW-10,slotH);
if(game.player.activePatterns[i]){const pid=game.player.activePatterns[i];const p=PATTERNS[pid];ctx.strokeStyle=p.color;ctx.lineWidth=2;ctx.strokeRect(x,y,slotW-10,slotH);this.drawPatternIcon(ctx,x+(slotW-10)/2,y+25,p.icon,p.color,18);ctx.fillStyle=p.color;ctx.font='9px Orbitron';ctx.fillText(p.name.toUpperCase(),x+(slotW-10)/2,y+slotH-5);}
}
ctx.textAlign='right';
const hpX=1200,hpY=680;const seg=20;
for(let i=0;i<game.player.maxHp;i++){
ctx.beginPath();
if(i<game.player.hp){ctx.strokeStyle=COLORS.cyan;ctx.lineWidth=3;}
else{ctx.strokeStyle='#330000';ctx.lineWidth=2;}
ctx.arc(hpX-i*seg-10,hpY,8,0,Math.PI*2);ctx.stroke();
}
ctx.fillStyle=COLORS.cyan;ctx.font='10px Orbitron';ctx.textAlign='right';ctx.fillText('CORE INTEGRITY',1255,710);
if(game.state==='WEAVE_STATE'){
const t=game.weaveTimer/1.5;
ctx.fillStyle='rgba(0,217,255,0.8)';ctx.font='12px Orbitron';ctx.textAlign='center';ctx.fillText('WEAVE STATE - PRESS [E] NEAR SHARD',640,100);
ctx.font='10px Orbitron';ctx.fillText(Math.max(0,game.weaveTimer).toFixed(1)+'s',640,115);
}
if(game.damageFlash>0){ctx.fillStyle='rgba(255,0,68,'+(game.damageFlash*0.3)+')';ctx.fillRect(0,0,1280,720);}
ctx.restore();
},
drawMenu(ctx,game){
ctx.save();
ctx.fillStyle='rgba(5,7,20,0.85)';ctx.fillRect(0,0,1280,720);
ctx.fillStyle=COLORS.cyan;ctx.font='60px Orbitron';ctx.textAlign='center';
ctx.shadowBlur=20;ctx.shadowColor=COLORS.cyan;ctx.fillText('VOID WEAVER',640,250);ctx.shadowBlur=0;
ctx.fillStyle='#e0e6ff';ctx.font='18px Orbitron';
ctx.fillText('A PATTERN-ABSORPTION SHOOTER',640,300);
ctx.fillStyle=COLORS.amber;ctx.font='16px Orbitron';ctx.fillText('HIGH SCORE: '+game.highScore,640,360);
ctx.fillStyle='#e0e6ff';ctx.font='14px Orbitron';
ctx.fillText('WASD / ARROWS - MOVE     MOUSE - AIM     CLICK / SPACE - FIRE',640,440);
ctx.fillText('[E] - ABSORB PATTERN     [Q] - CYCLE PATTERNS     [P] - PRACTICE',640,465);
ctx.fillText('[ESC] - PAUSE',640,490);
const pulse=0.7+Math.sin(Date.now()*0.005)*0.3;
ctx.fillStyle=`rgba(0,217,255,${pulse})`;ctx.font='24px Orbitron';
ctx.fillText('CLICK TO BEGIN',640,580);
ctx.fillStyle='#888';ctx.font='11px Orbitron';ctx.fillText('TOUCH CONTROLS ON MOBILE',640,630);
ctx.restore();
},
drawGameOver(ctx,game,won){
ctx.save();
ctx.fillStyle='rgba(5,7,20,0.9)';ctx.fillRect(0,0,1280,720);
ctx.fillStyle=won?COLORS.lime:'#ff3366';ctx.font='60px Orbitron';ctx.textAlign='center';
ctx.shadowBlur=20;ctx.shadowColor=won?COLORS.lime:'#ff3366';
ctx.fillText(won?'VOID COMPLETE':'VOID CONSUMED',640,300);ctx.shadowBlur=0;
ctx.fillStyle='#e0e6ff';ctx.font='20px Orbitron';ctx.fillText('FINAL SCORE: '+game.score,640,380);
ctx.fillText('TIME: '+game.formatTime(),640,420);
ctx.fillStyle=COLORS.amber;ctx.font='16px Orbitron';
ctx.fillText('HIGH SCORE: '+Math.max(game.highScore,game.score),640,470);
const pulse=0.7+Math.sin(Date.now()*0.005)*0.3;
ctx.fillStyle=`rgba(0,217,255,${pulse})`;ctx.font='20px Orbitron';
ctx.fillText('CLICK TO RESTART',640,560);
ctx.restore();
},
drawPause(ctx,game){
ctx.save();
ctx.fillStyle='rgba(5,7,20,0.85)';ctx.fillRect(0,0,1280,720);
ctx.fillStyle=COLORS.cyan;ctx.font='48px Orbitron';ctx.textAlign='center';
ctx.fillText('PAUSED',640,340);
ctx.fillStyle='#e0e6ff';ctx.font='14px Orbitron';
ctx.fillText('CLICK TO RESUME',640,400);
ctx.restore();
}
};