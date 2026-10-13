export function initECS() {
  const entities = new Map();
  let entityId = 0;

  function createEntity() {
    const id = ++entityId;
    entities.set(id, { id, components: new Map() });
    return id;
  }

  function addComponent(entityId, component) {
    const entity = entities.get(entityId);
    if (entity) entity.components.set(component.constructor, component);
  }

  function getComponent(entityId, componentClass) {
    const entity = entities.get(entityId);
    return entity ? entity.components.get(componentClass) : null;
  }

  // Create player
  const playerId = createEntity();
  addComponent(playerId, new Transform(160, 90, 1, 2)); // x, y, lane, targetNode
  addComponent(playerId, new Sprite('worker', 'idle', 0));
  addComponent(playerId, new Physics(12, 20, 100)); // walkSpeed, sprintSpeed, stamina
  addComponent(playerId, new Inventory(6));

  // Create a test item
  const itemId = createEntity();
  addComponent(itemId, new Transform(100, 50, 0, 0));
  addComponent(itemId, new Sprite('burger', null, 0));
  addComponent(itemId, new Collectible());

  // Create enemy
  const enemyId = createEntity();
  addComponent(enemyId, new Transform(200, 100, 2, 2));
  addComponent(enemyId, new Sprite('enemy', null, 0));
  addComponent(enemyId, new Enemy());

  const systems = [
    new InputSystem(),
    new MovementSystem(),
    new InteractionSystem(),
    new RenderSystem()
  ];

  return { entities, systems };
}

class Transform {
  constructor(x, y, lane, targetNode) {
    this.x = x; this.y = y; this.lane = lane; this.targetNode = targetNode;
    this.moving = false; this.progress = 0;
  }
}

class Sprite {
  constructor(sheet, anim, frame) {
    this.sheet = sheet; this.anim = anim; this.frame = frame;
    this.timer = 0; this.fps = 12;
  }
}

class Physics {
  constructor(walkSpeed, sprintSpeed, maxStamina) {
    this.walkSpeed = walkSpeed; this.sprintSpeed = sprintSpeed; this.maxStamina = maxStamina;
  }
}

class Inventory {
  constructor(maxSlots) {
    this.slots = new Array(maxSlots).fill(null);
    this.maxSlots = maxSlots;
  }
}

class Collectible {}

class Enemy {}

class InputSystem {
  update(dt, entities, gameState) {
    const playerId = 1;
    const transform = getComponent(playerId, Transform);
    const physics = getComponent(playerId, Physics);
    if (!transform || !physics) return;

    const speed = keys['Shift'] ? physics.sprintSpeed : physics.walkSpeed;
    if (keys['ArrowLeft']) { transform.targetNode = Math.max(0, transform.targetNode - 1); transform.moving = true; }
    if (keys['ArrowRight']) { transform.targetNode = Math.min(4, transform.targetNode + 1); transform.moving = true; }
    if (keys['ArrowUp']) { transform.lane = Math.max(0, transform.lane - 1); }
    if (keys['ArrowDown']) { transform.lane = Math.min(2, transform.lane + 1); }

    if (keys[' '] && !transform.moving) {
      // Simplified interaction: check for collectibles/enemies at current node
      entities.forEach((entity, id) => {
        if (id === playerId) return;
        const t = getComponent(id, Transform);
        if (t && t.lane === transform.lane && t.targetNode === transform.targetNode) {
          const collectible = getComponent(id, Collectible);
          const enemy = getComponent(id, Enemy);
          if (collectible) {
            gameState.score += 10;
            entities.delete(id);
            playSound('collect');
          } else if (enemy) {
            gameState.strikes++;
            gameState.stamina = Math.max(0, gameState.stamina - 30);
            playSound('hit');
          }
        }
      });
    }
  }
}

class MovementSystem {
  update(dt, entities, gameState) {
    entities.forEach((entity, id) => {
      const transform = getComponent(id, Transform);
      const physics = getComponent(id, Physics);
      if (!transform || !physics) return;

      if (transform.moving) {
        const targetX = 60 + transform.targetNode * 60;
        const targetY = 40 + transform.lane * 60;
        const dx = targetX - transform.x;
        const dy = targetY - transform.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 5) {
          transform.x = targetX;
          transform.y = targetY;
          transform.moving = false;
        } else {
          const moveSpeed = keys['Shift'] ? physics.sprintSpeed : physics.walkSpeed;
          if (getComponent(id, Inventory) && getComponent(id, Inventory).slots.some(s => s !== null)) {
            transform.x += (dx / dist) * moveSpeed * dt * 0.85;
            transform.y += (dy / dist) * moveSpeed * dt * 0.85;
          } else {
            transform.x += (dx / dist) * moveSpeed * dt;
            transform.y += (dy / dist) * moveSpeed * dt;
          }
        }
      }
    });
  }
}

class InteractionSystem {
  update() {}
}

class RenderSystem {
  render(ctx, alpha, entities, gameState) {
    // Draw lanes
    ctx.strokeStyle = '#00FFE020'; ctx.lineWidth = 2;
    for (let lane = 0; lane < 3; lane++) {
      ctx.beginPath();
      ctx.moveTo(0, 40 + lane * 60);
      ctx.lineTo(320, 40 + lane * 60);
      ctx.stroke();
    }

    // Draw nodes
    ctx.fillStyle = '#FF2E8840'; ctx.beginPath();
    for (let node = 0; node < 5; node++) {
      ctx.arc(60 + node * 60, 40, 8, 0, Math.PI * 2);
    }
    ctx.fill();

    // Draw entities
    entities.forEach((entity, id) => {
      const transform = getComponent(id, Transform);
      const sprite = getComponent(id, Sprite);
      if (!transform || !sprite) return;

      const img = assets[sprite.sheet];
      if (!img) return;

      const frameWidth = 32, frameHeight = 32;
      ctx.drawImage(img, sprite.frame * frameWidth, 0, frameWidth, frameHeight,
        transform.x - 16, transform.y - 16, 32, 32);

      // Animate sprite
      sprite.timer += 1/12;
      if (sprite.timer >= 1) {
        sprite.timer = 0;
        sprite.frame = (sprite.frame + 1) % 4;
      }
    });
  }
}

const assets = {};
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function playSound(type) {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.connect(gain).connect(audioContext.destination);
  gain.gain.setValueAtTime(0.01, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
  oscillator.type = type === 'collect' ? 'sine' : 'square';
  oscillator.frequency.setValueAtTime(type === 'collect' ? 660 : 220, audioContext.currentTime);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.2);
}
}