import { Vec2 } from '../utils/math';

export function integratePosition(pos: Vec2, vel: Vec2, accel: Vec2, dt: number): Vec2 {
    // Semi-implicit Euler: v = v + a*dt; p = p + v*dt
    const newVel = vel.add(accel.mul(dt));
    const newPos = pos.add(newVel.mul(dt));
    return newPos;
}

export function integrateAngular(vel: number, accel: number, dt: number): number {
    return vel + accel * dt;
}