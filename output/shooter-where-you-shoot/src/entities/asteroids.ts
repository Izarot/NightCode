import { Entity } from '../core/ecs';
import { Vec2 } from '../utils/math';
import { C } from '../core/config';

export class Asteroid {
    pos: Vec2;
    vel: Vec2;
    radius: number;
    mass: number;
    hp: number;
    type: string;
    score: number;
    vertices: Vec2[] = [];
    rotation: number = 0;
    angVel: number = 0;
    life: number = 0;
    
    constructor(public canvasWidth: number, public canvasHeight: number, type: string = 'STANDARD') {
        const def = C.AST_TYPES[type as keyof typeof C.AST_TYPES];
        this.type = type;
        this.mass = def.mass;
        this.hp = def.hp;
        this.radius = def.radius;
        this.score = def.score;
        
        // Spawn at edge
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) { this.pos = new Vec2(Math.random() * canvasWidth, -this.radius); }
        else if (edge === 1) { this.pos = new Vec2(canvasWidth + this.radius, Math.random() * canvasHeight); }
        else if (edge === 2) { this.pos = new Vec2(Math.random() * canvasWidth, canvasHeight + this.radius); }
        else { this.pos = new Vec2(-this.radius, Math.random() * canvasHeight); }
        
        // Velocity toward center
        const center = new Vec2(canvasWidth/2, canvasHeight/2);
        const dir = center.sub(this.pos).normalize();
        const speed = 200 + Math.random() * 100;
        this.vel = dir.mul(speed);
        
        this.generateGeometry();
    }
    
    generateGeometry() {
        this.vertices = [];
        const segments = 8 + Math.floor(Math.random() * 4);
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const noise = 0.8 + Math.random() * 0.4;
            const r = this.radius * noise;
            this.vertices.push(new Vec2(Math.cos(angle) * r, Math.sin(angle) * r));
        }
    }
    
    applyForce(force: Vec2, dt: number) {
        this.vel = this.vel.add(force.mul(dt / this.mass));
    }
    
    update(dt: number) {
        this.pos = this.pos.add(this.vel.mul(dt));
        this.rotation += this.angVel * dt;
        
        if (this.type === 'FRAGMENT') {
            this.life -= dt;
            if (this.life <= 0) this.hp = 0;
        }
    }
}

export class AsteroidSystem {
    private spawnTimer = 0;
    
    constructor(private canvas: { w: number, h: number }) {}
    
    update(dt: number, entities: Entity[], threat: number) {
        // Spawning
        this.spawnTimer -= dt;
        const spawnRate = C.AST_SPAWN_BASE_RATE * (1 + threat);
        if (this.spawnTimer <= 0 && this.countActive(entities) < C.AST_MAX_ON_SCREEN) {
            this.spawnTimer = 1 / spawnRate;
            this.spawnAsteroid(entities, threat);
        }
        
        // Update existing
        for (const e of entities) {
            const a = e.getComponent<Asteroid>('asteroid');
            if (a) {
                a.update(dt);
                
                // Wrap
                if (a.pos.x < -a.radius) a.pos.x = this.canvas.w + a.radius;
                if (a.pos.x > this.canvas.w + a.radius) a.pos.x = -a.radius;
                if (a.pos.y < -a.radius) a.pos.y = this.canvas.h + a.radius;
                if (a.pos.y > this.canvas.h + a.radius) a.pos.y = -a.radius;
            }
        }
    }
    
    private countActive(entities: Entity[]): number {
        return entities.filter(e => e.getComponent<Asteroid>('asteroid')).length;
    }
    
    private spawnAsteroid(entities: Entity[], threat: number) {
        const e = new Entity(entities.length);
        const types = ['STANDARD', 'STANDARD', 'DENSE', 'VOLATILE'];
        const type = types[Math.floor(Math.random() * types.length)];
        const a = new Asteroid(this.canvas.w, this.canvas.h, type);
        e.addComponent('asteroid', a);
        entities.push(e);
    }
}