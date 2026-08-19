export class Input {
  constructor(renderer, audio, levelManager) {
    this.renderer = renderer;
    this.audio = audio;
    this.levelManager = levelManager;
    this.canvas = renderer.canvas;
    this.bindEvents();
  }

  bindEvents() {
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
    document.body.style.cursor = 'crosshair';
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.renderer.scale;
    const y = (e.clientY - rect.top) / this.renderer.scale;
    this.showClickFeedback(x, y);
    if (window.gameInstance) window.gameInstance.checkDifference(x, y);
  }

  handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / this.renderer.scale;
    const y = (touch.clientY - rect.top) / this.renderer.scale;
    this.showClickFeedback(x, y);
    if (window.gameInstance) window.gameInstance.checkDifference(x, y);
  }

  showClickFeedback(x, y) {
    const originalPath = this.canvas.style.transform;
    this.canvas.style.transform = `scale(${this.renderer.scale})`; 
    const feedback = () => {
      this.canvas.style.transform = `scale(${this.renderer.scale})`; 
    };
    setTimeout(feedback, 50);
  }
}