class PacketRouterGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.nodes = [];
    this.connections = [];
    this.packets = [];
    this.selectedNode = null;
    this.isDragging = false;
    this.camera = { x: 0, y: 0, zoom: 1, targetZoom: 1, momentum: { x: 0, y: 0 } };
    this.lastTime = 0;
    this.simulationSpeed = 1;
    this.isPaused = false;
    this.startTime = Date.now();
    this.highScore = localStorage.getItem('packetRouterHighScore') || 0;
    this.packetCount = 0;
    this.totalLatency = 0;
    this.packetLoss = 0;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.init();
  }

  init() {
    this.resizeCanvas();
    this.createInitialNetwork();
    this.bindEvents();
    this.gameLoop(0);
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.scale(dpr, dpr);
  }

  createInitialNetwork() {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    this.addNode('router', centerX, centerY - 100);
    this.addNode('switch', centerX, centerY);
    this.addNode('server', centerX, centerY + 100);
    this.addNode('device', centerX - 150, centerY + 150);
    this.addNode('device', centerX + 150, centerY + 150);
  }

  addNode(type, x, y) {
    const node = { type, x, y, id: Date.now() + Math.random(), connections: [], utilization: 0, packets: 0 };
    this.nodes.push(node);
    return node;
  }

  addConnection(from, to) {
    const connection = { from, to, id: Date.now() + Math.random(), utilization: 0, packets: [] };
    this.connections.push(connection);
    from.connections.push(connection);
    to.connections.push(connection);
    return connection;
  }

  spawnPacket() {
    if (this.nodes.length < 2) return;
    const startNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
    const endNode = this.nodes[Math.floor(Math.random() * this.nodes.length)];
    if (startNode === endNode) return;
    const packet = { 
      id: Date.now() + Math.random(), 
      from: startNode, 
      to: endNode, 
      progress: 0, 
      speed: 0.5 + Math.random() * 2,
      priority: Math.random() > 0.7 ? 'high' : 'normal'
    };
    this.packets.push(packet);
    this.packetCount++;
    this.playSound('packet');
  }

  playSound(type) {
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.frequency.setValueAtTime(type === 'packet' ? 440 : 220, this.audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop();
  }

  update(deltaTime) {
    if (!this.isPaused) {
      this.camera.momentum.x *= 0.92;
      this.camera.momentum.y *= 0.92;
      this.camera.x += this.camera.momentum.x * deltaTime;
      this.camera.y += this.camera.momentum.y * deltaTime;
      this.camera.targetZoom += (this.camera.zoom - this.camera.targetZoom) * 0.1;
      this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.1;
      this.updatePackets(deltaTime);
      this.updateStats();
      if (Math.random() < 0.02 * this.simulationSpeed) this.spawnPacket();
    }
  }

  updatePackets(deltaTime) {
    for (let i = this.packets.length - 1; i >= 0; i--) {
      const packet = this.packets[i];
      const connection = packet.from.connections.find(c => c.to === packet.to);
      if (!connection) { this.packets.splice(i, 1); continue; }
      packet.progress += packet.speed * this.simulationSpeed * deltaTime;
      connection.utilization = Math.min(1, connection.utilization + 0.001);
      if (packet.progress >= 1) {
        packet.to.packets++;
        packet.to.utilization = Math.min(1, packet.to.utilization + 0.01);
        this.packets.splice(i, 1);
        this.totalLatency += packet.speed;
      }
    }
    this.connections.forEach(c => { c.utilization *= 0.95; });
    this.nodes.forEach(n => { n.utilization *= 0.9; n.packets = 0; });
  }

  updateStats() {
    const avgLatency = this.packetCount > 0 ? Math.round(this.totalLatency / this.packetCount) : 0;
    const lossRate = this.packets.length > 1000 ? 5 : 0;
    document.getElementById('pkts').textContent = this.packetCount;
    document.getElementById('latency').textContent = avgLatency;
    document.getElementById('loss').textContent = lossRate;
    if (this.packetCount > this.highScore) {
      this.highScore = this.packetCount;
      localStorage.setItem('packetRouterHighScore', this.highScore);
    }
  }

  render() {
    const w = this.canvas.width; const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
    this.ctx.fillRect(0, 0, w, h);
    this.ctx.save();
    this.ctx.translate(w/2, h/2);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(-this.camera.x, -this.camera.y);
    this.renderConnections();
    this.renderPackets();
    this.renderNodes();
    this.ctx.restore();
  }

  renderConnections() {
    this.connections.forEach(c => {
      this.ctx.beginPath();
      this.ctx.moveTo(c.from.x, c.from.y);
      this.ctx.bezierCurveTo(
        (c.from.x + c.to.x) / 2 + (c.from.y - c.to.y) * 20,
        (c.from.y + c.to.y) / 2 + (c.to.x - c.from.x) * 20,
        c.to.x, c.to.y
      );
      const color = c.utilization > 0.7 ? '#FF6B6B' : c.utilization > 0.3 ? '#FFD93D' : '#6BCB77';
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2 + c.utilization * 10;
      this.ctx.stroke();
    });
  }

  renderPackets() {
    this.packets.forEach(p => {
      const t = p.progress;
      const x = p.from.x + (p.to.x - p.from.x) * t;
      const y = p.from.y + (p.to.y - p.from.y) * t;
      this.ctx.fillStyle = p.priority === 'high' ? '#FFD93D' : '#fff';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 4, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  renderNodes() {
    this.nodes.forEach(n => {
      this.ctx.save();
      this.ctx.translate(n.x, n.y);
      switch(n.type) {
        case 'router':
          this.ctx.fillStyle = 'linear-gradient(135deg, #2E86AB, #A23B72)';
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
          this.ctx.fill();
          break;
        case 'switch':
          this.ctx.fillStyle = 'linear-gradient(135deg, #1F6F4A, #5AC858)';
          this.ctx.fillRect(-15, -15, 30, 30);
          break;
        case 'server':
          this.ctx.fillStyle = 'linear-gradient(135deg, #FF6B35, #F2CC6D)';
          this.ctx.fillRect(-25, -15, 50, 30);
          break;
        case 'device':
          this.ctx.fillStyle = 'linear-gradient(135deg, #6B7C9C, #4A5568)';
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
          this.ctx.fill();
          break;
      }
      this.ctx.restore();
    });
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resizeCanvas());
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.onMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.onMouseUp());
    document.getElementById('pauseBtn').addEventListener('click', () => { this.isPaused = !this.isPaused; });
    document.getElementById('speedBtn').addEventListener('click', () => { 
      this.simulationSpeed = this.simulationSpeed === 1 ? 2 : this.simulationSpeed === 2 ? 5 : 1;
      document.getElementById('speedBtn').textContent = '⚡ Speed: ' + this.simulationSpeed + 'x';
    });
    document.getElementById('clearBtn').addEventListener('click', () => { 
      this.packets = []; this.packetCount = 0; this.totalLatency = 0;
    });
    document.querySelectorAll('#nodeInventory button').forEach(btn => {
      btn.addEventListener('click', (e) => { 
        const type = e.target.dataset.type;
        this.addNode(type, this.camera.x + 100, this.camera.y + 100);
      });
    });
  }

  onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * window.devicePixelRatio;
    const y = (e.clientY - rect.top) * window.devicePixelRatio;
    const wx = x / this.camera.zoom + this.camera.x;
    const wy = y / this.camera.zoom + this.camera.y;
    this.nodes.forEach(n => {
      if (Math.hypot(n.x - wx, n.y - wy) < 25) { this.selectedNode = n; return; }
    });
    if (!this.selectedNode) {
      this.isDragging = true;
      this.camera.momentum.x = (wx - this.camera.x) * 0.01;
      this.camera.momentum.y = (wy - this.camera.y) * 0.01;
    }
  }

  onMouseMove(e) {
    if (this.isDragging && !this.selectedNode) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * window.devicePixelRatio;
      const y = (e.clientY - rect.top) * window.devicePixelRatio;
      this.camera.x = x / this.camera.zoom;
      this.camera.y = y / this.camera.zoom;
    }
  }

  onMouseUp() {
    this.isDragging = false;
    this.selectedNode = null;
  }

  gameLoop(timestamp) {
    const deltaTime = (timestamp - this.lastTime) / 1000 || 0.016;
    this.lastTime = timestamp;
    this.update(deltaTime);
    this.render();
    this.updateTimer();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  updateTimer() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('speedrunTimer').textContent = '⏱️ ' + mins + ':' + secs;
  }
}

window.addEventListener('load', () => { new PacketRouterGame(); });