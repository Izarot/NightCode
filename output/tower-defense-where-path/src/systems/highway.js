import { state } from '../state.js';

export function drawHighway() {
  const { ctx } = state;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const hw of state.highways) {
    for (let i = 0; i < hw.nodes.length - 1; i++) {
      const a = hw.nodes[i];
      const b = hw.nodes[i + 1];
      const t = i / (hw.nodes.length - 1);
      // Gradient cyan to magenta
      const r = Math.round(0 + (255 - 0) * t);
      const g = Math.round(240 + (0 - 240) * t);
      const bl = Math.round(255 + (170 - 255) * t);
      const color = `rgb(${r},${g},${bl})`;

      ctx.shadowBlur = 20;
      ctx.shadowColor = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 24;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      ctx.lineWidth = 28;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // Draw nodes
    hw.nodes.forEach(n => {
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(n.x, n.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.restore();

  // Draw start node
  ctx.save();
  ctx.fillStyle = '#00FF88';
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#00FF88';
  ctx.globalCompositeOperation = 'lighter';
  ctx.beginPath();
  ctx.arc(state.startNode.x, state.startNode.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
