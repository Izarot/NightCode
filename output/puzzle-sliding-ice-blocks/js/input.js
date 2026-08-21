let keys = {};
export function initInput(){
  window.addEventListener('keydown',e=>{keys[e.key]=true;});
  window.addEventListener('keyup',e=>{keys[e.key]=false;});
}
export function getInput(){
  return {
    left: keys['ArrowLeft']||keys['a']||keys['A'],
    right: keys['ArrowRight']||keys['d']||keys['D'],
    up: keys['ArrowUp']||keys['w']||keys['W'],
    down: keys['ArrowDown']||keys['s']||keys['S']
  };
}
