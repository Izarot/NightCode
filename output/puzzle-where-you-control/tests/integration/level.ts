import { Level } from '../../src/game/level.js';

test('Level loads and sets asymmetry', () => { 
  const json = { meta: { id: 'test' }, spawn: { prime: { x: 0, y: 0 }, echo: { x: 10, y: 10 } }, tilemaps: { prime: 'a', echo: 'b' }, entities: [] };
  const level = new Level(json);
  level.load();
  // Assert that prime and echo spawns are offset correctly
  expect(level.spawn.echo.x).toBe(10);
  expect(level.spawn.echo.y).toBe(10);
});
