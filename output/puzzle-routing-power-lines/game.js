export class Game {
  constructor(levelData) {
    this.levelData = levelData;
    this.nodes = [];
    this.wires = [];
    this.transformers = [];
    this.walls = [];
    this.state = 'PLAYING';
    this.moves = 0;
    this.time = 0;
    this.startTime = 0;
    this.activeWire = null;
    this.loadLevel();
  }

  loadLevel() {
    this.nodes = [];
    this.wires = [];
    this.transformers = [];
    this.walls = [];
    this.levelData.nodes.forEach(n => {
      if (n.type === 'source') this.nodes.push({...n, powered:false});
      if (n.type === 'consumer') this.nodes.push({...n, powered:false});
      if (n.type === 'transformer') this.transformers.push({...n, rotation:0});
    });
    this.walls = this.levelData.walls || [];
    this.state = 'PLAYING';
    this.moves = 0;
    this.time = 0;
    this.startTime = Date.now();
  }

  update(deltaTime, input) {
    if (this.state !== 'PLAYING') return;

    this.time = (Date.now() - this.startTime) / 1000;

    if (input.mouseDown && !this.activeWire) {
      const node = this.getNodeAt(input.mouseX, input.mouseY);
      if (node && (node.type === 'source' || node.type === 'consumer')) {
        this.activeWire = {start: node, end: {x:input.mouseX, y:input.mouseY}};
      }
    }

    if (this.activeWire) {
      this.activeWire.end = {x:input.mouseX, y:input.mouseY};
      if (!input.mouseDown) {
        this.endWire();
      }
    }

    if (input.transformerClick) {
      const t = this.getTransformerAt(input.mouseX, input.mouseY);
      if (t) {
        t.rotation = (t.rotation + 90) % 360;
        assets.play('click');
      }
    }

    this.checkWin();
  }

  endWire() {
    if (!this.activeWire) return;
    const endNode = this.getNodeAt(this.activeWire.end.x, this.activeWire.end.y, 12);
    if (endNode && endNode !== this.activeWire.start &&
        ((this.activeWire.start.type === 'source' && endNode.type === 'consumer') ||
         (this.activeWire.start.type === 'consumer' && endNode.type === 'source'))) {
      if (!this.wiresIntersect(this.activeWire)) {
        this.wires.push({...this.activeWire, startId:this.activeWire.start.id, endId:endNode.id});
        this.moves++;
        assets.play('attach');
        this.updatePower();
      } else {
        assets.play('error');
      }
    } else {
      assets.play('error');
    }
    this.activeWire = null;
  }

  getNodeAt(x, y, radius=30) {
    return this.nodes.find(n => {
      const dx = (n.x - 0.5) * this.scale + this.offsetX - x;
      const dy = (n.y - 0.5) * this.scale + this.offsetY - y;
      return Math.sqrt(dx*dx + dy*dy) < radius;
    });
  }

  getTransformerAt(x, y) {
    return this.transformers.find(t => {
      const dx = (t.x - 0.5) * this.scale + this.offsetX - x;
      const dy = (t.y - 0.5) * this.scale + this.offsetY - y;
      return Math.sqrt(dx*dx + dy*dy) < 20;
    });
  }

  wiresIntersect(wire) {
    return this.wires.some(existing => {
      return this.segmentsIntersect(
        wire.start.x, wire.start.y, wire.end.x, wire.end.y,
        this.getNodeById(existing.startId).x, this.getNodeById(existing.startId).y,
        this.getNodeById(existing.endId).x, this.getNodeById(existing.endId).y
      );
    });
  }

  getNodeById(id) {
    return this.nodes.find(n => n.id === id);
  }

  segmentsIntersect(x1,y1,x2,y2,x3,y3,x4,y4) {
    const denom = ((y4-y3)*(x2-x1)) - ((x4-x3)*(y2-y1));
    if (denom === 0) return false;
    const ua = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / denom;
    const ub = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / denom;
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }

  updatePower() {
    this.nodes.forEach(n => n.powered = false);
    this.wires.forEach(w => {
      const start = this.getNodeById(w.startId);
      const end = this.getNodeById(w.endId);
      if (start && end) {
        if (start.type === 'source') start.powered = true;
        if (end.type === 'consumer') end.powered = true;
      }
    });
  }

  checkWin() {
    const allConsumersPowered = this.nodes.every(n => 
      n.type !== 'consumer' || n.powered
    );
    const noConflicts = !this.wires.some(w => this.wiresIntersect(w));
    if (allConsumersPowered && noConflicts) {
      this.state = 'VICTORY';
    }
  }
}
