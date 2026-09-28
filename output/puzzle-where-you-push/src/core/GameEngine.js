import { TweenManager } from './TweenManager.js';
import { Player } from '../entities/Player.js';
import { Block } from '../entities/Block.js';
import { PressurePlate } from '../entities/PressurePlate.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { ScreenShake } from '../systems/ScreenShake.js';

export class GameEngine{
  constructor(ctx){this.ctx=ctx;this.entities=[];this.player=null;this.plates=[];this.tween=new TweenManager();this.particles=new ParticleSystem();this.shake=new ScreenShake();this.onCompleteCallback=null;this.gridSize=64;this.cols=10;this.rows=10;this.offsetX=0;this.offsetY=0;this.scale=1;this.shakeTime=0}
  loadLevel(data){this.entities=[];this.player=null;this.plates=[];this.tween.clear();this.particles.clear();this.cols=data.cols;this.rows=data.rows;this.gridSize=data.cellSize||64;this.offsetX=(this.ctx.canvas.width-this.cols*this.gridSize)/2;this.offsetY=(this.ctx.canvas.height-this.rows*this.gridSize)/2;this.scale=Math.min(this.ctx.canvas.width/(this.cols*this.gridSize),this.ctx.canvas.height/(this.rows*this.gridSize),1);data.walls.forEach(w=>this.entities.push({type:'wall',x:w.x,y:w.y}));data.blocks.forEach(b=>this.entities.push(new Block(b.x,b.y,b.color||'blue')));data.plates.forEach(p=>{const plate=new PressurePlate(p.x,p.y,p.color||'standard');this.plates.push(plate);this.entities.push(plate)});this.player=new Player(data.player.x,data.player.y);this.entities.push(this.player);this.checkWin()}
  tryMovePlayer(dx,dy){if(!this.player.canMove)return false;const tx=this.player.gx+dx;const ty=this.player.gy+dy;if(this.isBlocked(tx,ty))return false;const block=this.getBlockAt(tx,ty);if(block){const bx=block.gx+dx;const by=block.gy+dy;if(this.isBlocked(bx,by)||this.getBlockAt(bx,by))return false;block.move(dx,dy,this.tween);this.particles.add(block.px,block.py,'dust');this.checkWin()}this.player.move(dx,dy,this.tween);this.particles.add(this.player.px,this.player.py,'dust');return true}
  isBlocked(x,y){return this.entities.some(e=>e.type==='wall'&&e.x===x&&e.y===y)}
  getBlockAt(x,y){return this.entities.find(e=>e instanceof Block&&e.gx===x&&e.gy===y)}
  checkWin(){const allPressed=this.plates.every(p=>p.isActivated());if(allPressed&&this.onCompleteCallback){this.onCompleteCallback()}}
  onComplete(cb){this.onCompleteCallback=cb}
  shake(){this.shakeTime=300}
  start(){this.loop()}
  loop=()=>{requestAnimationFrame(this.loop);const ctx=this.ctx;ctx.save();this.shake.apply(ctx,this.shakeTime);this.shakeTime=Math.max(0,this.shakeTime-16);this.render();ctx.restore()}
  render(){const ctx=this.ctx;ctx.fillStyle='#0d0221';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);this.entities.forEach(e=>{if(e.type==='wall'){ctx.fillStyle='#333';ctx.fillRect(this.toScreenX(e.x),this.toScreenY(e.y),this.gridSize,this.gridSize)}else if(e.render)e.render(ctx,this.offsetX,this.offsetY,this.gridSize,this.scale)});this.particles.update(16);this.particles.render(ctx,this.offsetX,this.offsetY,this.gridSize,this.scale);this.tween.update(16)}
  toScreenX(x){return this.offsetX+x*this.gridSize*this.scale}
  toScreenY(y){return this.offsetY+y*this.gridSize*this.scale}
}
