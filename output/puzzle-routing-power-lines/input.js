export class Input {
  constructor(canvas) {
    this.mouseDown = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.transformerClick = false;
    this.touchActive = false;

    canvas.addEventListener('mousedown', e => {
      this.mouseDown = true;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    canvas.addEventListener('mousemove', e => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    canvas.addEventListener('mouseup', e => {
      this.mouseDown = false;
    });

    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      this.touchActive = true;
      this.mouseDown = true;
      const touch = e.touches[0];
      this.mouseX = touch.clientX;
      this.mouseY = touch.clientY;
    });
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const touch = e.touches[0];
      this.mouseX = touch.clientX;
      this.mouseY = touch.clientY;
    });
    canvas.addEventListener('touchend', e => {
      e.preventDefault();
      this.touchActive = false;
      this.mouseDown = false;
    });

    canvas.addEventListener('click', e => {
      this.transformerClick = true;
      setTimeout(() => this.transformerClick = false, 100);
    });
  }

  update() {
    this.transformerClick = false;
  }
}
