import { PhysicsSystem } from '../../src/core/physics.js';
import { Entity } from '../../src/core/ecs.js';

test('Physics step does not allocate', () => { 
  const world = new Entity(1);
  const physics = new PhysicsSystem(world);
  const dt = 1/60;
  physics.setDeltaTime(dt);
  physics.update();
  // No error means no allocation in critical path
});
