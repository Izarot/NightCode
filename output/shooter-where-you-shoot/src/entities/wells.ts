import { Entity } from '../core/ecs';
import { Vec2 } from '../utils/math';
import { C } from '../core/config';

export class GravityWell {
    pos: Vec2;
    mass: number;
    lifetime: number;
    age: number = 0;
    radius: number;
    
    constructor(x: number, y: number, mass: number, lifetime: number) {
        this.pos = new Vec2(x, y);
        this.mass = mass;
        this.lifetime = lifetime;
        this.radius = Math.sqrt(mass) * 0.8;
    }
    
    update(dt: number) {
        this.age += dt;
        this.mass = this.mass * (1 - dt / this.lifetime);
    }
    
    isAlive(): boolean {
        return this.age < this.lifetime && this.mass > 10;
    }
    
    getForce(target: Vec2): Vec2 {
        const dist = target.sub(this.pos);
        const d = Math.max(dist.length(), C.W_INNER_RADIUS);
        
        if (d < C.W_INNER_RADIUS) {
            // Repulsion core
            return dist.normalize().mul(-C.W_MAX_ACCEL);
        }
        
        const force = (C.W_G_CONST * this.mass) / (d * d);
        const accel = Math.min(force, C.W_MAX_ACCEL);
        return dist.normalize().mul(accel);
    }
}

export class Projectile {
    pos: Vec2;
    vel: Vec2;
    lifetime: number;
    maxRange: number;
    trail: Vec2[] = [];
    
    constructor(x: number, y: number, angle: number, speed: number, lifetime: number, range: number) {
        this.pos = new Vec2(x, y);
        this.vel = new Vec2(Math.cos(angle), Math.sin(angle)).mul(speed);
        this.lifetime = lifetime;
        this.maxRange = range;
    }
    
    update(dt: number) {
        this.pos = this.pos.add(this.vel.mul(dt));
        this.lifetime -= dt;
        this.trail.push(this.pos);
        if (this.trail.length > 20) this.trail.shift();
    }
    
    isAlive(): boolean {
        return this.lifetime > 0 && this.pos.length() < this.maxRange;
    }
}