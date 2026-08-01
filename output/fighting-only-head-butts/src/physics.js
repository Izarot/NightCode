// Physics constants and helpers
const PHYSICS = {
  GRAVITY: 0.002,
  FRICTION_HIGH: 0.85,
  FRICTION_LOW: 0.97,
  WINDUP_FRAMES: 15,
  STUN_DURATION: 30,
  WOBBLE_DURATION: 90,
  DASH_FORCE: 0.45,
  HEADBUTT_FORCE: 0.35,
  IMPACT_THRESHOLD: 2.5,
  RECOIL_SCALE: 0.6
};

function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function dist(a,b){const dx=a.x-b.x,dy=a.y-b.y;return Math.sqrt(dx*dx+dy*dy);}
function vecAdd(a,b){return {x:a.x+b.x,y:a.y+b.y};}
function vecScale(a,s){return {x:a.x*s,y:a.y*s};}
function vecMag(v){return Math.sqrt(v.x*v.x+v.y*v.y);}
