class Player {
    public x: number;
    public y: number;
    public vx: number = 0;
    public vy: number = 0;
    public grounded: boolean = false;
    public velocity = { length: () => Math.sqrt(this.vx*this.vx + this.vy*this.vy), x: this.vx, y: this.vy };
    private readonly radius = 24;
    private readonly gravity = 1400;
    private readonly maxFallSpeed = 450;
    private readonly walkSpeed = 180;
    private readonly jumpImpulse = -550;
    private coyoteTime = 0;
    private jumpBuffer = 0;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public update(dt: number, input: any, platforms: any[]) {
        // Apply gravity
        this.vy += this.gravity * dt;
        if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;
        
        // Horizontal movement
        if (input.isKeyDown('KeyA')) this.vx = -this.walkSpeed;
        else if (input.isKeyDown('KeyD')) this.vx = this.walkSpeed;
        else this.vx *= 0.85;
        
        // Jumping
        if (this.grounded) this.coyoteTime = 0.1;
        else this.coyoteTime -= dt;
        
        if (input.isKeyDown('Space') && this.coyoteTime > 0) {
            this.vy = this.jumpImpulse;
            this.coyoteTime = 0;
        }
        
        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Collision
        this.grounded = false;
        platforms.forEach(p => {
            if (this.checkCollision(p)) {
                this.grounded = true;
                this.vy = 0;
            }
        });
        
        // Update velocity object
        this.velocity.x = this.vx;
        this.velocity.y = this.vy;
    }

    private checkCollision(platform: any): boolean {
        return this.x + this.radius > platform.x &&
               this.x - this.radius < platform.x + platform.width &&
               this.y + this.radius > platform.y &&
               this.y - this.radius < platform.y + platform.height;
    }
}

export { Player };