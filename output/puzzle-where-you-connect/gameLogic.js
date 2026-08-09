// Wire connections and collision detection
let nodes = [];
let wires = [];
let currentLevel = 0;
let levels = [];

function initLevel(levelIndex) {
  nodes = [];
  wires = [];
  const level = levels[levelIndex];
  if (!level) return;
  level.powerSources.forEach(ps => {
    nodes.push({x: ps.x, y: ps.y, type: 'power', lit: false, charge: ps.charge || Infinity});
  });
  level.bulbs.forEach(b => {
    nodes.push({x: b.x, y: b.y, type: 'bulb', lit: false, required: b.required || 1});
  });
}

function findNodeAt(gridX, gridY) {
  return nodes.find(n => n.x === gridX && n.y === gridY);
}

function isValidWirePath(start, end) {
  // Check for straight horizontal or vertical line
  if (start.x !== end.x && start.y !== end.y) return false;
  // Check no intersections with existing wires
  for (const wire of wires) {
    if (lineIntersects(start, end, wire.start, wire.end)) return false;
  }
  return true;
}

function lineIntersects(p1, p2, p3, p4) {
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  return false;
}

function direction(p1, p2, p3) {
  return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
}

function updateGameLogic() {
  // Check win condition
  const allLit = nodes.filter(n => n.type === 'bulb').every(n => n.lit);
  if (allLit && nodes.some(n => n.type === 'bulb')) {
    if (elapsed < highScore || highScore === 0) {
      highScore = elapsed;
      localStorage.setItem('highScore', highScore);
    }
    playSound(1000, 0.5);
    setTimeout(() => {
      if (currentLevel < levels.length - 1) {
        currentLevel++;
        initLevel(currentLevel);
        startTime = performance.now();
      } else {
        alert('Level Complete! Time: ' + elapsed.toFixed(2) + 's');
      }
    }, 500);
  }
}

function drawGrid() {
  ctx.strokeStyle = '#1a1a3e';
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL_SIZE, 0);
    ctx.lineTo(i * CELL_SIZE, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * CELL_SIZE);
    ctx.lineTo(canvas.width, i * CELL_SIZE);
    ctx.stroke();
  }
}

function drawWires() {
  ctx.strokeStyle = '#ff00ea';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.7;
  wires.forEach(wire => {
    ctx.beginPath();
    ctx.moveTo(wire.start.x * CELL_SIZE + CELL_SIZE/2, wire.start.y * CELL_SIZE + CELL_SIZE/2);
    ctx.lineTo(wire.end.x * CELL_SIZE + CELL_SIZE/2, wire.end.y * CELL_SIZE + CELL_SIZE/2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}

function drawNodes() {
  nodes.forEach(node => {
    const cx = node.x * CELL_SIZE + CELL_SIZE/2;
    const cy = node.y * CELL_SIZE + CELL_SIZE/2;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    if (node.type === 'power') {
      ctx.fillStyle = '#ff0000';
      ctx.shadowBlur = node.lit ? 20 : 0;
      ctx.shadowColor = '#ff0000';
    } else {
      ctx.fillStyle = node.lit ? '#ffffff' : '#00ffff';
      ctx.shadowBlur = node.lit ? 20 : 0;
      ctx.shadowColor = '#ffffff';
    }
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function getProgress() {
  const bulbs = nodes.filter(n => n.type === 'bulb');
  if (bulbs.length === 0) return 0;
  const lit = bulbs.filter(n => n.lit).length;
  return (lit / bulbs.length) * 100;
}

function restartLevel() {
  initLevel(currentLevel);
  startTime = performance.now();
  elapsed = 0;
}

function skipLevel() {
  if (currentLevel < levels.length - 1) {
    currentLevel++;
    initLevel(currentLevel);
    startTime = performance.now();
    elapsed = 0;
  }
}

function togglePause() {
  gameState = gameState === 'playing' ? 'paused' : 'playing';
}

// Level definitions
levels = [
  {
    powerSources: [{x: 0, y: 0, charge: 3}],
    bulbs: [{x: 5, y: 0, required: 1}, {x: 0, y: 5, required: 1}]
  },
  {
    powerSources: [{x: 0, y: 0, charge: 2}, {x: 15, y: 15, charge: 2}],
    bulbs: [{x: 7, y: 7, required: 2}, {x: 3, y: 10, required: 1}]
  },
  {
    powerSources: [{x: 0, y: 0, charge: 4}],
    bulbs: [{x: 10, y: 0, required: 1}, {x: 0, y: 10, required: 1}, {x: 15, y: 15, required: 1}]
  }
];

function initGame() {
  initLevel(currentLevel);
  startTime = performance.now();
}