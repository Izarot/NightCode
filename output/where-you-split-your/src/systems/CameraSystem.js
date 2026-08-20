export class CameraSystem {
    constructor() {
        this.deadzone = { x: 48, y: 27 }; // 48x27px deadzone
        this.lookAhead = 0;
        this.shake = { offsetX: 0, offsetY: 0, trauma: 0 };
    }
    
    update(dt) {
        const player = this.world.playerEntity;
        if (!player) return;
        
        const transform = player.getComponent('transform');
        const vel = player.getComponent('velocity');
        
        // Deadzone camera
        const camX = this.world.renderOffsetX || 0;
        const camY = this.world.renderOffsetY || 0;
        
        let targetX = transform.x - camX;
        let targetY = transform.y - camY;
        
        const deadzoneHalfX = this.deadzone.x / 2;
        const deadzoneHalfY = this.deadzone.y / 2;
        
        if (targetX < -deadzoneHalfX) targetX = -deadzoneHalfX;
        else if (targetX > deadzoneHalfX) targetX = deadzoneHalfX;
        
        if (targetY < -deadzoneHalfY) targetY = -deadzoneHalfY;
        else if (targetY > deadzoneHalfY) targetY = deadzoneHalfY;
        
        // Lookahead
        const lookAheadDist = Math.sign(vel.x) * Math.min(Math.abs(vel.x) / 200 * 48, 48);
        targetX += lookAheadDist;
        
        // Apply shake
        targetX += this.shake.offsetX;
        targetY += this.shake.offsetY;
        
        // Update world render offset
        this.world.renderOffsetX = transform.x - targetX;
        this.world.renderOffsetY = transform.y - targetY;
        
        // Update shake trauma
        if (this.shake.trauma > 0) {
            this.shake.trauma = Math.max(0, this.shake.trauma - dt * 2);
            const shakeIntensity = this.shake.trauma * this.shake.trauma * 8;
            this.shake.offsetX = (Math.random() * 2 - 1) * shakeIntensity;
            this.shake.offsetY = (Math.random() * 2 - 1) * shakeIntensity;
        } else {
            this.shake.offsetX = 0;
            this.shake.offsetY = 0;
        }
    }
    
    snapToTarget() {
        const player = this.world.playerEntity;
        if (!player) return;
        const transform = player.getComponent('transform');
        this.world.renderOffsetX = transform.x - 240; // Center horizontally
        this.world.renderOffsetY = transform.y - 135; // Center vertically
    }
    
    addShake(intensity) {
        this.shake.trauma = Math.min(1, this.shake.trauma + intensity);
    }
}