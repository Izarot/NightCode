export class FSM {
  constructor() {
    this.state = 'MENU';
  }
  set(state) {
    this.state = state;
  }
  is(state) {
    return this.state === state;
  }
}
