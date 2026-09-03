export class Menu {
  constructor(ctx, game) {
    this.ctx = ctx;
    this.game = game;
    this.selected = 0;
    this.options = ['STORY MODE', 'VERSUS', 'TRAINING', 'OPTIONS', 'CREDITS'];
  }
  update(input, dt) {
    if (input.isPressed('KeyW') || input.isPressed('ArrowUp')) this.selected = (this.selected - 1 + this.options.length) % this.options.length;
    if (input.isPressed('KeyS') || input.isPressed('ArrowDown')) this.selected = (this.selected + 1) % this.options.length;
    if (input.isPressed('Enter') || input.isPressed('Space')) {
      if (this.selected === 1) {
        this.game.setupMatch();
        this.game.state = 'PLAY';
      }
    }
  }
  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.font = '48px serif';
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.fillText('RESONANCE', 640, 100);
    ctx.font = '24px sans-serif';
    this.options.forEach((opt, i) => {
      ctx.fillStyle = i === this.selected ? '#E74C3C' : '#FFFFF0';
      ctx.fillText(opt, 640, 200 + i * 40);
    });
    ctx.restore();
  }
}