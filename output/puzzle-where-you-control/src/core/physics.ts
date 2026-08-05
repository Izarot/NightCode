export const enum SurfaceType { Solid, OneWay, Ice, Conveyor, Kill }

export interface CollisionResult {
  collided: boolean;
  normal: { x: number; y: number; };
  timeOfImpact: number;
  surfaceType: SurfaceType;
}

export class PhysicsSystem {
  private static GRAVITY = 1600;
  private static MOVE_ACCEL = 4800;
  private static AIR_ACCEL = 1800;
  private static MAX_SPEED = 320;
  private static FRICTION = 2400;
  private static JUMP_VELOCITY = -520;
  private static COYOTE_TIME = 0.08;
  private static JUMP_BUFFER = 0.10;
  private static DASH_VELOCITY = 600;
  private static DASH_DURATION = 0.12;
  private static DASH_COOLDOWN = 0.80;
  private static FAST_FALL_GRAVITY = 2800;
  private static WALL_JUMP_FORCE_X = 400;
  private static WALL_JUMP_FORCE_Y = 380;
  private static MAX_WALL_SLIDE_SPEED = 120;
  private deltaTime: number;
  private accumulator: number = 0;
  private fixedDt = 1 / 60;
  constructor(private world: any) {}
  public setDeltaTime(dt: number) { this.deltaTime = dt; this.accumulator += dt; }
  public update() { while (this.accumulator >= this.fixedDt) { this.fixedUpdate(); this.accumulator -= this.fixedDt; } }
  private fixedUpdate() { this.stepSimulation(this.fixedDt); }
  private stepSimulation(dt: number) { this.world.entities.forEach(e => { const prime = e.getComponent(Prime); const echo = e.getComponent(Echo); const input = this.readInputFor(e); this.updateCharacter(prime, input, dt); this.updateCharacter(echo, input, dt); }); }
  private readInputFor(e: any): InputFrame { // simplified: both share same input buffer at start of frame
    return this.world.inputBuffer.shift() || { left: false, right: false, jump: false, jumpReleased: false, dash: false };
  }
  private updateCharacter(char: any, input: InputFrame, dt: number) { 
    // kinematic integration
    const wasGrounded = char.grounded;
    char.grounded = false;
    // horizontal acceleration
    let accel = char.input.left || char.input.right ? (char.input.left ? -1 : 1) * PhysicsSystem.MOVE_ACCEL : 0;
    if (!char.grounded) accel = char.input.left || char.input.right ? (char.input.left ? -1 : 1) * PhysicsSystem.AIR_ACCEL : 0;
    char.velX = this.limitSpeed(char.velX + accel * dt, PhysicsSystem.MAX_SPEED);
    // apply gravity
    if (!char.grounded) { char.velY += PhysicsSystem.GRAVITY * dt; if (char.velY > 0 && !char.input.jump) char.velY = Math.max(char.velY, PhysicsSystem.FAST_FALL_GRAVITY * dt); }
    // friction
    if (char.grounded && !char.input.left && !char.input.right) char.velX = this.limitSpeed(char.velX - PhysicsSystem.FRICTION * dt, 0);
    // jump handling
    if (char.input.jump && char.coyoteTimer <= 0) { char.velY = PhysicsSystem.JUMP_VELOCITY; char.grounded = false; }
    if (char.input.jumpReleased && char.velY < 0) char.velY = Math.max(char.velY + PhysicsSystem.GRAVITY * dt * 0.5, 0);
    // dash
    if (char.input.dash && char.dashCooldown <= 0) { char.velX = Math.sign(char.velX) * PhysicsSystem.DASH_VELOCITY; char.velY = 0; char.dashing = true; char.dashCooldown = PhysicsSystem.DASH_COOLDOWN; }
    // wall slide / jump
    if (char.wallNormal && !char.grounded && char.velY > 0) { char.velY = -Math.min(char.velY, PhysicsSystem.WALL_JUMP_FORCE_Y); char.velX = -PhysicsSystem.WALL_JUMP_FORCE_X * Math.sign(char.wallNormal.x); }
    // apply movement
    char.posX += char.velX * dt; char.posY += char.velY * dt;
    // collision resolution (simplified)
    const col = this.resolveCollision(char);
    if (col.collided) { char.posX -= char.velX * dt; char.posY -= char.velY * dt; }
    // state transitions
    if (char.dead) return;
    if (char.posY > 2000) char.dead = true;
    if (char.exitReached) { char.state = 'EXITED'; }
    // dash cooldown
    if (char.dashCooldown > 0) char.dashCooldown -= dt;
    // coyote timer
    if (char.grounded) char.coyoteTimer = COYOTE_TIME; else if (char.coyoteTimer > 0) char.coyoteTimer -= dt;
  }
  private limitSpeed(v: number, cap: number): number { return Math.max(Math.min(v, cap), -cap); }
  private resolveCollision(char: any): CollisionResult { 
    // placeholder: always return no collision
    return { collided: false, normal: { x: 0, y: 0 }, timeOfImpact: 0, surfaceType: SurfaceType.Solid };
  }
}

export class Prime {}
export class Echo {}
