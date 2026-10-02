import { Input } from './Input.js';
import { Audio } from './Audio.js';
import { Player } from '../entities/Player.js';
import { Orb } from '../entities/Orb.js';
import { Platform } from '../entities/Platform.js';
import { Hazard } from '../entities/Hazard.js';
import { HUD } from '../ui/HUD.js';
import { LeaderboardModal } from '../ui/LeaderboardModal.js';
import { palette } from '../assets/palette.js';
import { loadLevel } from '../levels/level1.js';
import { getHighScore, setHighScore } from '../utils/storage.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input();
    this.audio = new Audio();
    this.hud = new HUD();
    this.leaderboardModal = new LeaderboardModal();
    this.state = 'PLAYING'; // PLAYING, PAUSED, GAMEOVER, VICTORY
    this.width = 1920;
    this.height = 1080;
    this.scale = 1;
    this.rewindBuffer = []; // stores {time, playerState}
    this.rewindDuration = 3000; // ms
    this.rewindActive = false;
    this.rewindTimer = 0;
    this.lastTime = 0;
    this.gameTime = 0;
    this.highScore = getHighScore();
    this.player = null;
    this.orbs = [];
    this.platforms = [];
    this.hazards = [];
    this.levelData = null;
    this.init();
  }
  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.levelData = loadLevel();
    this.createLevel();
    this.audio.init();
  }
  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ratio = this.width / this.height;
    if (w / h > ratio) {
      this.scale = h / this.height;
    } else {
      this.scale = w / this.width;
    }
    this.canvas.width = this.width * this.scale;
    this.canvas.height = this.height * this.scale;
    this.ctx.scale(this.scale, this.scale);
  }
  createLevel() {
    const { tiles, platforms, orbs, hazards } = this.levelData;
    this.player = new Player(100, 100, this.input, this.audio);
    this.orbs = orbs.map(o => new Orb(o.x, o.y));
    this.platforms = platforms.map(p => new Platform(p.x, p.y, p.w, p.h, p.type, p.freq||0, p.amp||0));
    this.hazards = hazards.map(h => new Hazard(h.x, h.y, h.w, h.h, h.type));
  }
  update(dt) {
    if (this.state !== 'PLAYING') return;
    this.gameTime += dt;
    // rewind buffer
    if (!this.rewindActive) {
      this.rewindBuffer.push({time: this.gameTime, player: this.player.cloneState()});
      // keep only last rewindDuration ms
      while (this.rewindBuffer.length > 0 && this.gameTime - this.rewindBuffer[0].time > this.rewindDuration) {
        this.rewindBuffer.shift();
      }
    }
    // input
    if (this.input.isPressedKey('r') && this.rewindBuffer.length > 1 && !this.rewindActive) {
      this.rewindActive = true;
      this.rewindTimer = this.rewindDuration;
      this.audio.playRewind();
    }
    if (this.rewindActive) {
      this.rewindTimer -= dt;
      if (this.rewindTimer <= 0) {
        this.rewindActive = false;
      } else {
        const targetTime = this.gameTime - this.rewindTimer;
        const state = this.rewindBuffer.find(s => s.time <= targetTime) || this.rewindBuffer[0];
        this.player.restoreState(state.player);
        // platforms/hazards not rewound for simplicity
      }
    } else {
      this.player.update(dt, this.platforms, this.orbs, this.hazards);
    }
    // collect orbs
    this.orbs = this.orbs.filter(orb => {
      if (!orb.collected && this.player.collidesWith(orb)) {
        orb.collected = true;
        this.audio.playOrb();
        return false;
      }
      return true;
    });
    // hazard collision
    if (!this.player.invincible) {
      for (const h of this.hazards) {
        if (this.player.collidesWith(h)) {
          this.player.takeDamage();
          this.audio.playDeath();
          break;
        }
      }
    }
    // win condition
    if (this.orbs.length === 0 && this.player.x > this.width - 100) {
      this.state = 'VICTORY';
      const score = this.calculateScore();
      if (score > this.highScore) {
        setHighScore(score);
        this.highScore = score;
      }
    }
    // game over
    if (this.player.lives <= 0) {
      this.state = 'GAMEOVER';
      const score = this.calculateScore();
      if (score > this.highScore) {
        setHighScore(score);
        this.highScore = score;
      }
    }
    // pause
    if (this.input.isPressedKey('Escape')) {
      this.state = this.state === 'PLAYING' ? 'PAUSED' : 'PLAYING';
      this.input.clearPressed('Escape');
    }
  }
  calculateScore() {
    const timePenalty = this.gameTime * 10; // 10 points per ms? adjust
    const orbBonus = (this.levelData.orbs.length - this.orbs.length) * 500;
    return Math.max(0, 50000 - timePenalty + orbBonus);
  }
  render() {
    this.ctx.clearRect(0,0,this.width,this.height);
    // background gradient
    const grad = this.ctx.createLinearGradient(0,0,0,this.height);
    grad.addColorStop(0, '#0a0a2a');
    grad.addColorStop(1, '#0a0a0a');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0,0,this.width,this.height);
    // platforms
    for (const p of this.platforms) p.draw(this.ctx);
    // hazards
    for (const h of this.hazards) h.draw(this.ctx);
    // orbs
    for (const o of this.orbs) o.draw(this.ctx);
    // player
    this.player.draw(this.ctx);
    // HUD
    this.hud.render(this.ctx, {
      time: this.gameTime,
      orbsCollected: this.levelData.orbs.length - this.orbs.length,
      orbsTotal: this.levelData.orbs.length,
      lives: this.player.lives,
      rewindActive: this.rewindActive,
      highScore: this.highScore
    });
    // overlays
    if (this.state === 'PAUSED') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(0,0,this.width,this.height);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '48px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('PAUSED', this.width/2, this.height/2);
    }
    if (this.state === 'GAMEOVER') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(0,0,this.width,this.height);
      this.ctx.fillStyle = '#f00';
      this.ctx.font = '48px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME OVER', this.width/2, this.height/2 - 40);
      this.ctx.font = '24px sans-serif';
      this.ctx.fillText(`Score: ${this.calculateScore()}`, this.width/2, this.height/2);
      this.ctx.fillText('Press R to Restart', this.width/2, this.height/2 + 40);
      if (this.input.isPressedKey('r')) {
        this.state = 'PLAYING';
        this.init();
        this.input.clearPressed('r');
      }
    }
    if (this.state === 'VICTORY') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(0,0,this.width,this.height);
      this.ctx.fillStyle = '#0f0';
      this.ctx.font = '48px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('LEVEL COMPLETE!', this.width/2, this.height/2 - 40);
      this.ctx.font = '24px sans-serif';
      this.ctx.fillText(`Score: ${this.calculateScore()}`, this.width/2, this.height/2);
      this.ctx.fillText('Press N for Next Level', this.width/2, this.height/2 + 40);
      if (this.input.isPressedKey('n')) {
        // for demo, just restart
        this.state = 'PLAYING';
        this.init();
        this.input.clearPressed('n');
      }
    }
  }
  loop(timestamp) {
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.update(dt);
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }
  start() {
    requestAnimationFrame(this.loop.bind(this));
  }
}
