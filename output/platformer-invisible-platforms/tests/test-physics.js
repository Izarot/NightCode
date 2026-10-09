import { updatePhysics, resolveCollisions } from '../src/physics.js';
import { Player } from '../src/entities/Player.js';

function testGravity() {
  const p = new Player(0, 0);
  p.onGround = false;
  updatePhysics(p);
  console.assert(p.vy === 0.25, 'Gravity should apply 0.25 vy');
}

testGravity();
console.log('Physics tests passed');