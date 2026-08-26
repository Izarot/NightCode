import {Grunt,Shooter,Dasher,Shielded} from '../entities/Enemies.js';

export class Spawner{
constructor(game){this.game=game;this.t=0;this.difficulty=1;}
update(dt){
this.t+=dt;
this.difficulty=1+this.game.runTime/60;
const interval=Math.max(0.4,2-this.difficulty*0.15);
if(this.t>=interval){
this.t=0;
this.spawn();
}
if(this.game.runTime>60&&Math.random()<0.005&&this.game.entities.length<20){
this.game.entities.push(new Dasher(this.randX(),this.randY(),this.game));
}
if(this.game.runTime>120&&Math.random()<0.003&&this.game.entities.length<20){
this.game.entities.push(new Shielded(this.randX(),this.randY(),this.game));
}
}
spawn(){
const x=this.randX(),y=this.randY();
const r=Math.random();
if(this.game.runTime>30&&r<0.3){this.game.entities.push(new Shooter(x,y,this.game));}
else{this.game.entities.push(new Grunt(x,y,this.game));}
}
randX(){return 50+Math.random()*1180;}
randY(){return 50+Math.random()*620;}
}