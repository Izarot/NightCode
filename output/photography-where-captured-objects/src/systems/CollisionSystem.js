export class CollisionSystem {
  constructor() {
    this.capturedObjects = [];
  }

  checkCapture(avatar, viewfinder, objects) {
    const captured = [];
    const R_VIEW = viewfinder.radius;

    objects.forEach(obj => {
      if (obj.captured) return;

      // Check if object is fully within viewfinder
      const dx = obj.x - avatar.x;
      const dy = obj.y - avatar.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Object fully inside if distance + radius <= R_VIEW
      if (distance + obj.radius <= R_VIEW) {
        captured.push(obj);
      }
    });

    return captured;
  }

  update(dt) {
    // Clean up captured objects that have fully faded
    // This would be handled in the game loop
  }
}
