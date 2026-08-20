export class PhysicsSystem {
    update(dt) {
        const entities = this.world.entities.filter(e => e.getComponent('physicsBody')?.solid);
        
        // Apply gravity
        entities.forEach(entity => {
            const vel = entity.getComponent('velocity');
            const fragData = entity.getComponent('fragmentData');
            if (!vel || !fragData) return;
            
            const gravity = 1400 * fragData.mass; // Base gravity scaled by mass
            vel.y += gravity * dt;
            
            // Terminal velocity
            const terminal = 400 * fragData.mass;
            if (vel.y > terminal) vel.y = terminal;
            
            // Drag
            vel.x *= Math.pow(1 - vel.dragX, dt * 60);
            vel.y *= Math.pow(1 - vel.dragY, dt * 60);
        });
        
        // Simple AABB collision (broadphase skipped for brevity)
        entities.forEach(entity => {
            const transform = entity.getComponent('transform');
            const vel = entity.getComponent('velocity');
            const physics = entity.getComponent('physicsBody');
            if (!transform || !vel || !physics) return;
            
            let collided = false;
            entities.forEach(other => {
                if (entity === other) return;
                const otherTransform = other.getComponent('transform');
                const otherPhysics = other.getComponent('physicsBody');
                if (!otherTransform || !otherPhysics || !otherPhysics.solid) return;
                
                // Check Y collision first
                const nextY = transform.y + vel.y * dt;
                if (vel.y > 0 && nextY + transform.h > otherTransform.y && transform.y + transform.h <= otherTransform.y) {
                    // Landing on platform
                    transform.y = otherTransform.y - transform.h;
                    vel.y = 0;
                    physics.grounded = true;
                    collided = true;
                }
                // X collision
                const nextX = transform.x + vel.x * dt;
                if (nextX < otherTransform.x + otherTransform.w && 
                    nextX + transform.w > otherTransform.x && 
                    transform.y < otherTransform.y + otherTransform.h && 
                    transform.y + transform.h > otherTransform.y) {
                    if (vel.x > 0) transform.x = otherTransform.x - transform.w;
                    if (vel.x < 0) transform.x = otherTransform.x + otherTransform.w;
                    vel.x = 0;
                    collided = true;
                }
            });
            
            if (!collided && vel.y > 0) physics.grounded = false;
        });
    }
}