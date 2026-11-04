// Phase Shift - Precision Action Platformer
// ECS Lite + Fixed Timestep Loop

const Config = {
  physics: {GRAVITY: 2400, MAX_FALL: 1200, ACCEL_GROUND: 4800, DECEL_GROUND: 6000, ACCEL_AIR: 2400, DECEL_AIR: 400, MAX_SPEED_G: 320, MAX_SPEED_A: 300, JUMP: -680, JUMP_CUT: 0.45, COYOTE: 0.1, BUFFER: 0.12, WALL_SLIDE: 180, WALL_JUMP_X: 420, WALL_JUMP_Y: -580, WALL_LOCK: 0.15, CORNER: 2},
  phase: {DUR: 0.35, COOLDOWN: 1.2, WINDOW: 0.08, PUSH: 8, TRAIL_LIFE: 0.15},
  player: {W: 32, H: 48, SPEED: 320},
  level: {TILE: 16, GRAVITY: 2400}
}

const PHASE = {active: false, timer: 0, cooldown: 0, dir: 0, windup: 0}
let highScore = 0
let gameStart = 0
let lastTime = 0
let accumulator = 0
const FIXED_DT = 1/60

// LocalStorage High Score
if(localStorage.getItem('psHighScore')) highScore = parseFloat(localStorage.psHighScore)

// Simple Web Audio API Sound Synth
const ctx = new AudioContext()
function makeSynth(freq, type='sine', duration=0.1, volume=0.3){
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
gain.gain.value = volume
osc.frequency.value = freq
osc.connect(gain).connect(ctx.destination)
osc.start(ctx.currentTime)
setTimeout(()=>osc.stop(ctx.currentTime+0.001), duration*1000)
}
function playJump(){makeSynth(440,'sine',0.08,0.2)}
function playLand(v){makeSynth(200+ v*0.5,'sine',0.05,0.15*(v/1200))}
function playPhase(){makeSynth(220,'sine',0.15,0.3);makeSynth(330,'triangle',0.2,0.25)}
function playDie(){makeSynth(110,'sawtooth',0.3,0.4);setTimeout(()=>makeSynth(55,'noise',0.1,0.3),150)}

// Input
const keys = {left:false, right:false, jump:false, phase:false}
const gamepad = {connected:false}
window.addEventListener('keydown',e=>{
  if(e.key=='ArrowLeft'||e.key=='a') keys.left=true
  if(e.key=='ArrowRight'||e.key=='d') keys.right=true
  if(e.key=='ArrowUp'||e.key=='w'||e.key=='space') keys.jump=true
  if(e.key=='Shift'||e.key=='Enter') keys.phase=true
  if(e.key=='Escape') document.getElementById('pause').click()
})
window.addEventListener('keyup',e=>{
  if(e.key=='ArrowLeft'||e.key=='a') keys.left=false
  if(e.key=='ArrowRight'||e.key=='d') keys.right=false
  if(e.key=='ArrowUp'||e.key=='w'||e.key=='space') keys.jump=false
  if(e.key=='Shift'||e.key=='Enter') keys.phase=false
})
navigator.getGamepads?().forEach(g=>{if(g){gamepad.connected=true;window.addEventListener('gamepadconnected',e=>gamepad.connected=true)}}
)
function pollGamepad(){const gp = navigator.getGamepads()[0]
if(!gp) return
  keys.left = gp.axes[0]<-0.15
  keys.right = gp.axes[0]>0.15
  keys.jump = gp.buttons[0].pressed||gp.buttons[1].pressed
  keys.phase = gp.buttons[2].pressed||gp.buttons[3].pressed
}

// Player state
const Player = {
  x: 0, y: 0, vx: 0, vy: 0,
  w: Config.player.W, h: Config.player.H,
  grounded: false, headBonk: false, touchingWall: {left:false, right:false},
  facing: 1, phaseWindup: 0,
  lastGrounded: 0, lastJumpPress: 0,
  wallJumpLockout: 0
}

// Simple level - single phaseable wall
const Level = {
  tiles: new Uint8Array(1920/16 * 1080/16).fill(0),
  phaseable: new Set(),
  init(){for(let i=0;i<this.tiles.length;i++){if(Math.random()>0.7){this.tiles[i]=1;this.phaseable.add(i)}}}
,
  isSolid(idx){return this.tiles[idx]&1},
  isPhaseable(idx){return this.phaseable.has(idx)}
}
Level.init()

// Safety clamp
function clamp(v,min,max){return v<min?min:v>max?max:v}

// Fixed timestep loop
function loop(time){
  if(!gameStart){gameStart=time;lastTime=time}else{const dt = (time-lastTime)/1000
    accumulator += dt
    while(accumulator >= FIXED_DT){
      update(FIXED_DT)
      accumulator -= FIXED_DT
    }
    render()
    lastTime = time
  }
  requestAnimationFrame(loop)
}

function update(dt){
  pollGamepad()

  // Phase mechanic
  if(keys.phase){n
    if(PHASE.cooldown>0){PHASE.cooldown-=dt}else{
      if(PHASE.windup<Config.phase.WINDOW){PHASE.windup+=dt}
      else if(!PHASE.active){
        if(keys.left||keys.right){PHASE.active=true;PHASE.timer=Config.phase.DUR;PHASE.dir=keys.right?1:-1
        playPhase()}
      }else{
        PHASE.timer-=dt
        if(PHASE.timer<=0||!(keys.left||keys.right)){PHASE.active=false
        PHASE.cooldown=Config.phase.COOLDOWN
        // Push out if solid
        const idx = Math.floor((Player.x+Player.w/2)/16)+(Math.floor((Player.y+Player.h)/16)*(1920/16))
        if(Level.isSolid(idx)||Level.isSolid(idx+1)){Player.x=clamp(Player.x-PHASE.PUSH,0,1920-Player.w)}
        }
      }
    }
  }

  if(!PHASE.active){
    // Gravity
    Player.vy += Config.physics.GRAVITY*dt
    Player.vy = clamp(Player.vy,-Config.physics.MAX_FALL,Config.physics.MAX_FALL)

    // Horizontal movement
    const acc = keys.right?Config.physics.ACCEL_GROUND:keys.left?-Config.physics.ACCEL_GROUND:0
    const dec = keys.right?-Config.physics.DECEL_GROUND:keys.left?Config.physics.DECEL_GROUND:0
    Player.vx += acc*dt
    if(!keys.right&&!keys.left) Player.vx += dec*dt
    Player.vx = clamp(Player.vx,-Config.physics.MAX_SPEED_A,Config.physics.MAX_SPEED_G)

    // Coyote/Buffer
    if(Player.grounded){Player.lastGrounded=performance.now()/1000;Player.vy=0}
    const canJump = (performance.now()/1000 - Player.lastGrounded)<Config.physics.COYOTE
    const canBuffer = (performance.now()/1000 - Player.lastJumpPress)<Config.physics.BUFFER
    if(keys.jump&&(canJump||canBuffer)){Player.vy=Config.physics.JUMP;Player.lastJumpPress=performance.now()/1000;playJump()}

    // Wall slide
    if(!Player.grounded&&Player.touchingWall.left&&Player.vy>0){Player.vy=-Config.physics.WALL_SLIDE;playPhase()}

    // Wall jump
    if(keys.jump&&!Player.grounded&&Player.touchingWall.left&&Player.wallJumpLockout<=0){Player.vx=Config.physics.WALL_JUMP_X;Player.vy=Config.physics.WALL_JUMP_Y;Player.wallJumpLockout=Config.physics.WALL_LOCK*1000}

    // Apply movement
    Player.x += Player.vx*dt
    Player.y += Player.vy*dt

    // World bounds
    Player.x = clamp(Player.x,0,1920-Player.w)
    Player.y = clamp(Player.y,0,1080-Player.h)

    // Phase cooldown drain
    if(PHASE.cooldown>0)PHASE.cooldown-=dt
    const gauge = document.getElementById('phaseGauge').getElementsByClassName('fill')[0]
    if(PHASE.cooldown>0)gauges.style.width = (1-PHASE.cooldown/Config.phase.COOLDOWN)*100+'%'
    else gauges.style.width='100%'
  }

  // UI
  const timer = (performance.now()/1000 - gameStart/1000).toFixed(3)
  document.querySelector('.timer').textContent = timer.padStart(9,'0')
  if(!highScore||timer<highScore){highScore=timer;localStorage.psHighScore=highScore}
}

function render(){const c=document.getElementById('game');const ctx=c.getContext('2d')
  c.width=1920;c.height=1080;const scale=Math.min(window.innerWidth/1920,window.innerHeight/1080)
  ctx.setTransform(scale,0,0,scale,0,0)
  ctx.fillStyle='#0d0d1a';ctx.fillRect(0,0,1920,1080)

  // Draw phaseable walls
  ctx.fillStyle='rgba(0,243,255,0.1)';Level.phaseable.forEach((i,idx)=>{
    const x=(i%(1920/16))*16*scale,y=(Math.floor(i/(1920/16)))*16*scale
    ctx.fillRect(x,y,16*scale,16*scale)
  })

  // Player
  ctx.fillStyle=PHASE.active?'#00f3ff':'#ff2e63'
  if(PHASE.active){ctx.globalAlpha=0.6;ctx.filter='hue-rotate(180deg) saturate(3)'}
  ctx.fillRect(Player.x,Player.y,Player.w,Player.h)
  ctx.globalAlpha=1;ctx.filter='none'

  // Draw gauge
  const gauge=document.getElementById('phaseGauge').getElementsByClassName('fill')[0]
  if(PHASE.active)gauges.style.background='linear-gradient(90deg,#ff2e63,#00f3ff)'
  else gauges.style.background='linear-gradient(90deg,#00f3ff,#aa00ff)'
}

requestAnimationFrame(loop)

// Touch controls for mobile
if('ontouchstart' in window){document.body.addEventListener('touchstart',e=>{keys.phase=true}, {passive:false})}
