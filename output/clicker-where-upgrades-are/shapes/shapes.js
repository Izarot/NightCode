// Shape definitions and growth algorithms
const ShapeTypes = {
  triangle: { name: 'Triangle', baseSize: 30, basePS: 0.5, baseCost: 50, color: '#FF1744' },
  square: { name: 'Square', baseSize: 30, basePS: 0.5, baseCost: 50, color: '#2979FF' },
  circle: { name: 'Circle', baseSize: 30, basePS: 0.5, baseCost: 50, color: '#00E676' },
  hexagon: { name: 'Hexagon', baseSize: 30, basePS: 0.5, baseCost: 50, color: '#FFEB3B' },
  star: { name: 'Star', baseSize: 30, basePS: 0.5, baseCost: 50, color: '#E040FB' }
};

const Shapes = {
  list: [],
  add(type, level) {
    if (level === undefined) level = 0;
    const config = ShapeTypes[type];
    if (!config) return null;
    const shape = {
      id: Date.now() + Math.random(),
      type: type,
      level: level,
      x: Math.random() * 1280,
      y: Math.random() * 720,
      size: config.baseSize * Math.pow(1.5, level),
      ps: config.basePS * Math.pow(1.2, level),
      cost: Math.min(config.baseCost * Math.pow(1.3, level), 10000000000),
      targetSize: config.baseSize * Math.pow(1.5, level),
      animProgress: 1
    };
    this.list.push(shape);
    return shape;
  },
  upgrade(shape) {
    if (typeof shape === 'number') shape = this.list[shape];
    if (!shape) return false;
    if (GameState.energy < shape.cost) return false;
    GameState.energy -= shape.cost;
    shape.level += 1;
    shape.targetSize = ShapeTypes[shape.type].baseSize * Math.pow(1.5, shape.level);
    shape.ps = ShapeTypes[shape.type].basePS * Math.pow(1.2, shape.level);
    shape.cost = Math.min(ShapeTypes[shape.type].baseCost * Math.pow(1.3, shape.level), 10000000000);
    shape.animProgress = 0;
    playSound('whoosh', shape.level);
    return true;
  },
  update(dt) {
    this.list.forEach(s => {
      if (s.animProgress < 1) {
        s.animProgress += dt / 0.2;
        s.animProgress = Math.min(s.animProgress, 1);
        s.size = interpolate(s.size, s.targetSize, s.animProgress);
      }
    });
  },
  draw(ctx) {
    const sorted = [].concat(this.list).sort((a, b) => b.size - a.size);
    sorted.forEach(shape => {
      const config = ShapeTypes[shape.type];
      ctx.save();
      ctx.translate(shape.x, shape.y);
      ctx.strokeStyle = config.color;
      ctx.fillStyle = config.color;
      ctx.globalAlpha = 0.3 + 0.7 * (shape.level / 10);
      ctx.lineWidth = 2 + shape.level * 0.5;
      switch (shape.type) {
        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(0, -shape.size);
          ctx.lineTo(shape.size, shape.size);
          ctx.lineTo(-shape.size, shape.size);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        case 'square':
          ctx.fillRect(-shape.size, -shape.size, shape.size * 2, shape.size * 2);
          ctx.strokeRect(-shape.size, -shape.size, shape.size * 2, shape.size * 2);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, shape.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;
        case 'hexagon':
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const px = Math.cos(angle) * shape.size;
            const py = Math.sin(angle) * shape.size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        case 'star':
          ctx.beginPath();
          const spikes = 5;
          const outer = shape.size;
          const inner = shape.size / 2;
          for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const r = i % 2 === 0 ? outer : inner;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
      }
      ctx.restore();
    });
  },
  checkCollision(x, y) {
    for (const shape of this.list) {
      const dx = x - shape.x;
      const dy = y - shape.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < shape.size) return { shape: shape, dist: dist };
    }
    return null;
  }
};
