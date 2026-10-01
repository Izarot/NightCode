class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.particles = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w * devicePixelRatio;
    this.canvas.height = h * devicePixelRatio;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    
    const scaleX = w / CONFIG.DESIGN_WIDTH;
    const scaleY = h / CONFIG.DESIGN_HEIGHT;
    this.scale = Math.min(scaleX, scaleY);
    this.offsetX = (w - CONFIG.DESIGN_WIDTH * this.scale) / 2;
    this.offsetY = (h - CONFIG.DESIGN_HEIGHT * this.scale) / 2;
  }

  clear() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = CONFIG.COLORS.bg;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
  }

  drawBackground() {
    // Parallax hills
    this.ctx.fillStyle = '#0f3460';
    this.ctx.beginPath();
    this.ctx.moveTo(0, CONFIG.DESIGN_HEIGHT * 0.7);
    for (let x = 0; x <= CONFIG.DESIGN_WIDTH; x += 50) {
      this.ctx.lineTothis.ctx.lineTo(x, CONFIG.DESIGN_HEIGHT * 0.7 + Math.sin(x * 0.01) * 20);
    }
    this.ctx.lineTo(CONFIG.DESIGN_WIDTH, CONFIG.DESIGN_HEIGHT);
    this.ctx.lineTo(0, CONFIG.DESIGN_HEIGHT);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Ground
    this.ctx.fillStyle = '#16213e';
    this.ctx.fillRect(0, CONFIG.DESIGN_HEIGHT * 0.85, CONFIG.DESIGN_WIDTH, CONFIG.DESIGN_HEIGHT * 0.15);
  }

  drawFulcrum(x, y) {
    this.ctx.save();
    this.ctx.translate(x, y);
    // Base
    this.ctx.fillStyle = CONFIG.COLORS.fulcrum;
    this.ctx.beginPath();
    this.ctx.moveTo(-30, 0);
    this.ctx.lineTo(30, 0);
    this.ctx.lineTo(20, 40);
    this.ctx.lineTo(-20, 40);
    this.ctx.closePath();
    this.ctx.fill();
    // Top triangle
    this.ctx.fillStyle = '#e94560';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -5);
    this.ctx.lineTo(-15, 0);
    this.ctx.lineTo(15, 0);
    this.ctx.closePath();
    this.ctx.fill();
    // Pivot circle
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#0f3460';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawSeesaw(fulcrumX, fulcrumY, angle) {
    this.ctx.save();
    this.ctx.translate(fulcrumX, fulcrumY);
    this.ctx.rotate(angle);
    // Beam
    this.ctx.fillStyle = CONFIG.COLORS.seesaw;
    this.ctx.beginPath();
    const halfLen = CONFIG.SEESAW.halfLength;
    const thick = CONFIG.SEESAW.thickness;
    this.ctx.roundRect(-halfLen, -thick/2, CONFIG.SEESAW.length, thick, thick/2);
    this.ctx.fill();
    // Center line
    this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(-halfLen, 0);
    this.ctx.lineTo(halfLen, 0);
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawSlots(seesaw) {
    seesaw.slots.forEach((slot, i) => {
      this.ctx.save();
      this.ctx.translate(slot.x, slot.y);
      this.ctx.rotate(seesaw.angle);
      // Slot outline
      this.ctx.strokeStyle = slot.locked ? '#ff6b6b' : (slot.occupied ? CONFIG.COLORS.slotActive : CONFIG.COLORS.slot);
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash(slot.locked ? [5, 5] : []);
      this.ctx.strokeRect(-CONFIG.SEESAW.slotWidth/2, -CONFIG.SEESAW.slotHeight/2, CONFIG.SEESAW.slotWidth, CONFIG.SEESAW.slotHeight);
      this.ctx.setLineDash([]);
      // Lock icon
      if (slot.locked) {
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🔒', 0, 5);
      }
      this.ctx.restore();
    });
  }

  drawWeights(seesaw) {
    // Draw unplaced weights in inventory area (handled by UI)
    // Draw placed weights
    seesaw.weights.forEach(w => {
      if (w.placed) {
        this.ctx.save();
        this.ctx.translate(w.x, w.y);
        // Shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, w.type.radius * 0.8, w.type.radius * 0.7, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
        // Weight body
        this.ctx.fillStyle = w.type.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, w.type.radius, 0, Math.PI * 2);
        this.ctx.fill();
        // Highlight
        this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this.ctx.beginPath();
        this.ctx.arc(-w.type.radius * 0.3, -w.type.radius * 0.3, w.type.radius * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        // Label
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(w.type.label, 0, 0);
        this.ctx.restore();
      }
    });
  }

  drawParticles() {
    this.particles.forEach((p, i) => {
      this.ctx.save();
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life -= 0.02;
      if (p.life <= 0) this.particles.splice(i, 1);
    });
  }

  addBalanceParticles(x, y) {
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 5 - 2,
        size: Math.random() * 4 + 2,
        color: CONFIG.COLORS.particle,
        life: 1
      });
    }
  }

  drawTorqueIndicator(seesaw) {
    // Visual torque arrows on seesaw
    const { left, right } = seesaw.calculateTorque();
    const maxTorque = Math.max(left, right, 1);
    
    // Left arrow
    if (left > 0) {
      const slot = seesaw.slots.find(s => s.side === -1 && s.index === 0);
      if (slot) {
        this.ctx.save();
        this.ctx.translate(slot.x, slot.y - 60);
        this.ctx.rotate(seesaw.angle);
        this.ctx.fillStyle = CONFIG.COLORS.torqueLeft;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-15, 10);
        this.ctx.lineTo(-15, -10);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
      }
    }
    // Right arrow
    if (right > 0) {
      const slot = seesaw.slots.find(s => s.side === 1 && s.index === 0);
      if (slot) {
        this.ctx.save();
        this.ctx.translate(slot.x, slot.y - 60);
        this.ctx.rotate(seesaw.angle);
        this.ctx.fillStyle = CONFIG.COLORS.torqueRight;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(15, 10);
        this.ctx.lineTo(15, -10);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
      }
    }
  }

  render(seesaw) {
    this.clear();
    this.drawBackground();
    this.drawFulcrum(seesaw.fulcrumX, seesaw.fulcrumY);
    this.drawSeesaw(seesaw.fulcrumX, seesaw.fulcrumY, seesaw.angle);
    this.drawSlots(seesaw);
    this.drawWeights(seesaw);
    this.drawParticles();
    this.drawTorqueIndicator(seesaw);
    
    // Balance glow
    if (seesaw.isBalanced) {
      this.ctx.save();
      this.ctx.translate(seesaw.fulcrumX, seesaw.fulcrumY);
      const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
      gradient.addColorStop(0, 'rgba(255,215,0,0.3)');
      gradient.addColorStop(1, 'rgba(255,215,0,0)');
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 100, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }
}
