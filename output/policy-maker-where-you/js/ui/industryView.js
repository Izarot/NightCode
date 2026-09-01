const IndustryView = {
  canvas: null, ctx: null, particles: [], raf: null,
  init() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'canvas';
    document.getElementById('main').prepend(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.loop();
  },
  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  },
  loop() {
    this.draw();
    this.raf = requestAnimationFrame(() => this.loop());
  },
  spawn(x, y, color) {
    if (Math.random() > 0.3) return;
    this.particles.push({ x, y, vy: -0.5 - Math.random(), life: 60, color, alpha: 0.6 });
  },
  draw() {
    const c = this.canvas, ctx = this.ctx;
    ctx.fillStyle = 'rgba(44,62,80,0.2)';
    ctx.fillRect(0, 0, c.width, c.height);
    const cols = Math.max(1, Math.floor(c.width / 100));
    Simulation.industries.forEach((ind, i) => {
      if (i >= cols) return;
      const x = (i + 0.5) * (c.width / cols);
      const y = c.height - 100;
      ctx.fillStyle = ind.behavior === 'defiant' ? '#e63946' : ind.behavior === 'comply' ? '#2a9d8f' : '#f4a261';
      ctx.fillRect(x - 30, y - 60, 60, 60);
      ctx.fillStyle = '#ecf0f1';
      ctx.font = '10px sans-serif';
      ctx.fillText(ind.name, x - 25, y - 65);
      ctx.fillText('GDP:' + ind.gdp.toFixed(0), x - 25, y + 15);
      ctx.fillText('🌫️' + ind.pollution.toFixed(0), x - 25, y + 28);
      const smokeY = y - 60;
      for (let j = 0; j < ind.pollution / 8; j++) {
        this.spawn(x + (Math.random() - 0.5) * 20, smokeY - j * 8, '#7f8c8d');
      }
    });
    ctx.fillStyle = '#2d4a3e';
    ctx.fillRect(0, c.height - 40, c.width, 40);
    ctx.strokeStyle = '#3498db';
    ctx.beginPath();
    ctx.moveTo(0, c.height - 40);
    ctx.lineTo(c.width, c.height - 40);
    ctx.stroke();
    this.particles = this.particles.filter(p => {
      p.y += p.vy; p.life--; p.alpha -= 0.01;
      if (p.life <= 0) return false;
      ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
  }
};
