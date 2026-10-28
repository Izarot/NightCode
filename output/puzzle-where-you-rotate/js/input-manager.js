class InputManager {
  constructor(){
    this.keys = {};
    window.addEventListener('keydown', e => { if(KEYS[e.key]) this.keys[KEYS[e.key]] = true; });
    window.addEventListener('keyup', e => { if(KEYS[e.key]) this.keys[KEYS[e.key]] = false; });
  }
  isDown(dir){ return !!this.keys[dir]; }
}