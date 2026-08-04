export class StateMachine {
  constructor() {
    this.state = 'playing';
  }
  change(newState) {
    this.state = newState;
  }
  is(state) { return this.state === state; }
}
