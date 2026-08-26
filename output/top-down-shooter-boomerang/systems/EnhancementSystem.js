export class EnhancementSystem{
constructor(game){this.game=game;this.active=false;this.t=0;this.duration=3;this.choices=[];}
trigger(){this.active=true;this.t=0;this.game.state=4;this.choices=[{name:'Rapid Fire',id:'rapid',desc:'Faster boomerangs, shorter range'},{name:'Split Shot',id:'split',desc:'Throw 2 boomerangs'},{name:'Piercing',id:'piercing',desc:'Boomerangs pass through enemies'},{name:'Homing',id:'homing',desc:'Boomerangs track enemies'},{name:'Explosive',id:'explosive',desc:'Boomerangs explode on hit'}];
const pick=()=>{const a=this.choices;for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}};
pick();
this.choices=this.choices.slice(0,3);
}
choose(i){if(!this.active)return;this.active=false;this.game.state=1;const c=this.choices[i];if(c)this.game.player.enhancement=c.id;this.game.audio.beep(1000,0.2);}
update(dt){if(this.active)this.t+=dt;}
draw(ctx){ctx.fillStyle='rgba(0,0,0,0.85)';ctx.fillRect(0,0,1280,720);ctx.fillStyle='#00ffcc';ctx.font='bold 48px Orbitron';ctx.textAlign='center';ctx.fillText('CHOOSE ENHANCEMENT',640,180);ctx.font='24px Orbitron';ctx.fillStyle='#aaa';ctx.fillText('Press 1, 2, or 3 to select',640,230);this.choices.forEach((c,i)=>{const x=200+i*300,y=320,w=260,h=260;ctx.fillStyle='#1a0a3a';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#00ffcc';ctx.lineWidth=3;ctx.strokeRect(x,y,w,h);ctx.fillStyle='#fff';ctx.font='bold 22px Orbitron';ctx.fillText('['+(i+1)+'] '+c.name,x+w/2,y+50);ctx.fillStyle='#aaa';ctx.font='16px Orbitron';c.desc.split(' ').reduce((line,word)=>{const test=line+' '+word;if(ctx.measureText(test).width>w-20)return word;return test;},'').trim();let ly=y+100;ctx.fillText(c.desc,x+w/2,ly);});}
}