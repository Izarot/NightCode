export class HUDSystem {
  constructor() {
    this.state = null;
  }

  update(state) {
    if (!state) return;
    this.state = state;
    this.draw();
  }

  draw() {
    // This HUD is rendered in the HTML overlay, not the canvas
    // The canvas HUD is drawn in renderer.js
  }
}