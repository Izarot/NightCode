class Seesaw {
  constructor() {
    this.angle = 0; // radians
    this.angularVelocity = 0;
    this.angularAcceleration = 0;
    this.momentOfInertia = 0;
    this.weights = []; // { type, mass, slotIndex, x, y, targetX, targetY, placed: bool }
    this.slots = []; // { side, index, distance, occupied: bool, locked: bool, x, y }
    this.fulcrumX = 0;
    this.fulcrumY = 0;
    this.isBalanced = false;
    this.balanceTimer = 0;
    this.lastTorqueDiff = 0;
  }

  init(level) {
    this.angle = 0;
    this.angularVelocity = 0;
    this.weights = [];
    this.slots = [];
    this.isBalanced = false;
    this.balanceTimer = 0;
    
    // Create slots from config
    CONFIG.SEESAW.slotPositions.forEach((pos, i) => {
      const locked = level.lockedSlots.some(ls => ls.side === pos.side && ls.index === pos.index);
      this.slots.push({
        ...pos,
        occupied: false,
        locked,
        x: 0, y: 0 // will be set in updateSlotPositions
      });
    });
    
    // Initialize available weights
    level.availableWeights.forEach((typeId, i) => {
      const type = CONFIG.WEIGHT_TYPES.find(w => w.id === typeId);
      this.weights.push({
        type,
        mass: type.mass,
        slotIndex: -1,
        x: 0, y: 0,
        targetX: 0, targetY: 0,
        placed: false,
        id: i
      });
    });
    
    // Moment of inertia of seesaw beam (rod about center)
    const beamMass = 5; // arbitrary
    this.momentOfInertia = (1/12) * beamMass * CONFIG.SEESAW.length ** 2;
    // Add weight contributions when placed
  }

  updateSlotPositions(fulcrumX, fulcrumY, angle) {
    this.fulcrumX = fulcrumX;
    this.fulcrumY = fulcrumY;
    this.slots.forEach(slot => {
      const dist = slot.distance;
      slot.x = fulcrumX + dist * Math.cos(angle);
      slot.y = fulcrumY + dist * Math.sin(angle);
    });
    // Update placed weights positions
    this.weights.forEach(w => {
      if (w.placed && w.slotIndex >= 0) {
        const slot = this.slots[w.slotIndex];
        w.targetX = slot.x;
        w.targetY = slot.y - w.type.radius; // sit on top
        // Smooth move
        w.x += (w.targetX - w.x) * 0.2;
        w.y += (w.targetY - w.y) * 0.2;
      }
    });
  }

  calculateTorque() {
    let leftTorque = 0, rightTorque = 0;
    this.weights.forEach(w => {
      if (w.placed && w.slotIndex >= 0) {
        const slot = this.slots[w.slotIndex];
        const torque = w.mass * CONFIG.GRAVITY * Math.abs(slot.distance) * Math.cos(this.angle);
        if (slot.side === -1) leftTorque += torque;
        else rightTorque += torque;
      }
    });
    return { left: leftTorque, right: rightTorque, diff: leftTorque - rightTorque };
  }

  updatePhysics(dt) {
    const { diff } = this.calculateTorque();
    this.lastTorqueDiff = diff;
    // Torque = I * alpha
    this.angularAcceleration = diff / this.momentOfInertia;
    this.angularVelocity += this.angularAcceleration * dt;
    // Damping
    this.angularVelocity *= 0.98;
    this.angle += this.angularVelocity * dt;
    
    // Clamp angle to reasonable range
    const maxAngle = Math.PI / 3; // 60 degrees
    if (this.angle > maxAngle) { this.angle = maxAngle; this.angularVelocity = 0; }
    if (this.angle < -maxAngle) { this.angle = -maxAngle; this.angularVelocity = 0; }
    
    // Check balance
    const totalTorque = Math.abs(diff);
    const tolerance = CONFIG.TORQUE_TOLERANCE * (Math.abs(this.calculateTorque().left) + Math.abs(this.calculateTorque().right) + 0.001);
    if (totalTorque <= tolerance) {
      this.balanceTimer += dt * 1000;
      if (this.balanceTimer >= CONFIG.BALANCE_HOLD_TIME) this.isBalanced = true;
    } else {
      this.balanceTimer = 0;
      this.isBalanced = false;
    }
  }

  tryPlaceWeight(weightIndex, slotIndex) {
    const weight = this.weights[weightIndex];
    const slot = this.slots[slotIndex];
    if (!weight || weight.placed) return false;
    if (!slot || slot.occupied || slot.locked) return false;
    
    weight.placed = true;
    weight.slotIndex = slotIndex;
    slot.occupied = true;
    // Add to moment of inertia
    this.momentOfInertia += weight.mass * slot.distance ** 2;
    audio.play('drop', weight.mass);
    return true;
  }

  removeWeight(weightIndex) {
    const weight = this.weights[weightIndex];
    if (!weight || !weight.placed) return false;
    const slot = this.slots[weight.slotIndex];
    if (slot) slot.occupied = false;
    this.momentOfInertia -= weight.mass * slot.distance ** 2;
    weight.placed = false;
    weight.slotIndex = -1;
    audio.play('pickup');
    return true;
  }

  getAvailableWeights() {
    return this.weights.filter(w => !w.placed);
  }

  getPlacedWeights() {
    return this.weights.filter(w => w.placed);
  }

  reset() {
    this.weights.forEach(w => {
      if (w.placed) {
        const slot = this.slots[w.slotIndex];
        if (slot) slot.occupied = false;
        w.placed = false;
        w.slotIndex = -1;
      }
    });
    this.momentOfInertia = (1/12) * 5 * CONFIG.SEESAW.length ** 2;
    this.angle = 0;
    this.angularVelocity = 0;
    this.isBalanced = false;
    this.balanceTimer = 0;
  }
}
