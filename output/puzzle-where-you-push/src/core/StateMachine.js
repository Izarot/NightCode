export class StateMachine{
  constructor(){this.states=[];this.current='menu'}
  push(s){this.states.push(this.current);this.current=s}
  pop(){this.current=this.states.pop()||this.current}
}
