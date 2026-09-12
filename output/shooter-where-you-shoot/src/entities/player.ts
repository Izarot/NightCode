import { Entity } from '../core/ecs';
import { Vec2 } from '../utils/math';
import { C } from '../core/config';

export class Player {
    pos: Vec2;
    vel: Vec2;
    rot: number = 0;
    angVel: number = 0;
    hp: number = C.P_HP;
    iframes: number = 0;
    shield: number = 0;
    
    constructor(public width: number, public height: number) {
        this.pos = new Vec2(width/2, height/2);
        this.vel = new Vec2();
    }
    
    update(dt: number, input: { thrust: number, turn: number }) {
        // Apply forces
        const thrustAccel = new Vec2(Math.cos(this.rot), Math.sin(this.rot)).mul(input.thrust * C.P_THRUST);
        const revAccel = input.thrust < 0 ? new Vec2(Math.cos(this.rot), Math.sin(this.rot)).mul(-C.P_THRUST * C.P_REV_MULT) : new Vec2();
        const totalAccel = thrustAccel.add(revAccel);
        
        // Angular
        const angAccel = input.turn * C.P_TORQUE;
        this.angVel = clamp(this.angVel + angAccel * dt, -C.P_MAX_ROT, C.P_MAX_ROT);
        this.rot += this.angVel * dt;
        
        // Linear
        this.vel = this.vel.add(totalAccel.mul(dt));
        const speed = this.vel.length();
        if (speed > C.P_MAX_SPD) {
            this.vel = this.vel.normalize().mul(C.P_MAX_SPD);
        }
        
        // Damping
        this.vel = this.vel.mul(Math.pow(C.P_LIN_DAMP, dt));
        this.angVel *= Math.pow(C.P_ANG_DAMP, dt);
        
        // Position
        this.pos = this.pos.add(this.vel.mul(dt));
        
        // Timers
        if (this.iframes > 0) this.iframes -= dt;
        if (this.shield > 0) this.shield -= dt;
    }
    
    takeDamage(damage: number) {
        if (this.iframes > 0 || this.shield > 0) return false;
        this.hp -= damage;
        this.iframes = C.P_IFRAME;
        return true;
    }
}

export function createPlayerSystem() {
    return {
        update(dt: number, entities: Entity[]) {
            for (const e of entities) {
                const p = e.getComponent<Player>('player');
                const input = e.getComponent('input');
                if (p && input) {
                    p.update(dt, input);
                }
            }
        }
    };
}