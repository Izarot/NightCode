import { World } from '../core/ecs.js';
import { PhysicsSystem } from '../core/physics.js';
import { Camera } from '../render/camera.js';

export class DualityWorld {
  public world: World;
  public camera: Camera;
  public inputBuffer: any[];
  constructor() {
    this.world = new World();
    this.world.addSystem(new PhysicsSystem(this.world));
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    this.camera = new Camera([{ x: 0, y: 0 }, { x: 0, y: 0 }]);
    this.inputBuffer = [];
    this.init();
  }
  private init() { 
    // create player entities with Prime/Echo components
    const prime = new Entity(1);
    const echo = new Entity(2);
    prime.addComponent(Prime);
    echo.addComponent(Echo);
    this.world.addEntity(prime);
    this.world.addEntity(echo);
    // start input polling
    import { initInput } from '../core/input.js';
    initInput();
    // game loop
    let last = 0;
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      this.world.world.update(dt);
      this.render(ctx);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  private render(ctx: CanvasRenderingContext2D) { 
    const canvas = ctx.canvas;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    // draw tilemap, entities, etc. (placeholder)
    this.world.entities.forEach(e => {
      const prime = e.getComponent(Prime);
      const echo = e.getComponent(Echo);
      // draw prime
      ctx.fillStyle = '#00F3FF';
      ctx.fillRect(prime.posX, prime.posY, 32, 48);
      // draw echo
      ctx.fillStyle = '#FF2D7A';
      ctx.fillRect(echo.posX, echo.posY, 32, 48);
    });
    // draw camera viewport if needed
    const vp = this.camera.getViewPort();
    // ...
  }
}
