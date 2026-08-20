export class PlayerIntentSystem {
    update(dt) {
        const player = this.world.playerEntity;
        if (!player) return;
        
        const input = player.getComponent('playerControl').inputMap;
        const vel = player.getComponent('velocity');
        const physics = player.getComponent('physicsBody');
        const splitCtrl = player.getComponent('splitController');
        const fragmentData = player.getComponent('fragmentData');
        
        // Movement
        const accel = input.left || input.right ? (physics.oneWayPlatform && !input.jump ? 1800 : 4800) : 0;
        if (input.left) vel.x = Math.max(vel.x - accel * dt, -200);
        if (input.right) vel.x = Math.min(vel.x + accel * dt, 200);
        
        // Jump
        if (input.jump && physics.grounded && !input.jumpPressed) {
            vel.y = -380 * fragmentData.mass;
            audio.play('jump');
        }
        
        // Split
        if (input.split && splitCtrl.splitCooldown <= 0 && splitCtrl.currentSplitCount < splitCtrl.maxSplits) {
            this.splitPlayer(player);
            splitCtrl.splitCooldown = 0.25;
            audio.play('split');
        }
        
        // Merge
        if (input.merge && splitCtrl.mergeCooldown <= 0) {
            this.findMergeTarget(player);
        }
        
        // Switch
        if (input.switch && !input.switchPressed) {
            this.switchFragment(player);
        }
        
        // Update cooldowns
        if (splitCtrl.splitCooldown > 0) splitCtrl.splitCooldown -= dt;
        if (splitCtrl.mergeCooldown > 0) splitCtrl.mergeCooldown -= dt;
        
        // Store previous input state
        input.jumpPressed = input.jump;
        input.switchPressed = input.switch;
    }
    
    splitPlayer(player) {
        const transform = player.getComponent('transform');
        const vel = player.getComponent('velocity');
        const splitCtrl = player.getComponent('splitController');
        const fragmentData = player.getComponent('fragmentData');
        
        // Create new fragment
        const newEnt = this.world.createEntity();
        newEnt.addComponent('transform', { x: transform.x, y: transform.y - transform.h * 0.5, w: transform.w, h: transform.h });
        newEnt.addComponent('velocity', { x: vel.x + 40, y: vel.y, maxX: 200, maxY: 400, dragX: 0.1, dragY: 0.1 });
        newEnt.addComponent('physicsBody', { solid: true, sensor: false, friction: 0.1, restitution: 0.1, collisionLayer: 1, collisionMask: 2, oneWayPlatform: false });
        newEnt.addComponent('playerControl', { inputMap: {}, stateMachineRef: 'idle', splitCooldown: 0 });
        newEnt.addComponent('splitController', { maxSplits: splitCtrl.maxSplits, currentSplitCount: splitCtrl.currentSplitCount + 1, mergeRange: 24, mergeCooldown: 0, activeFragments: [...splitCtrl.activeFragments] });
        newEnt.addComponent('fragmentData', { 
            id: newEnt.id, 
            parentId: player.id, 
            isPrimary: false, 
            mass: fragmentData.mass * 0.5, 
            sizeMultiplier: Math.sqrt(fragmentData.mass * 0.5), 
            abilityFlags: fragmentData.abilityFlags & ~0b001 // Remove split ability
        });
        
        // Update primary
        fragmentData.mass *= 0.5;
        fragmentData.sizeMultiplier = Math.sqrt(fragmentData.mass);
        splitCtrl.currentSplitCount++;
        splitCtrl.activeFragments.push(newEnt.id);
        
        // Apply split impulse
        vel.x -= 40;
        newEnt.getComponent('velocity').x += 40;
    }
    
    findMergeTarget(player) {
        // Simplified: merge with closest fragment
        const playerTransform = player.getComponent('transform');
        let closest = null;
        let closestDist = Infinity;
        
        this.world.entities.forEach(entity => {
            if (entity.id === player.id) return;
            const fragData = entity.getComponent('fragmentData');
            if (!fragData || fragData.parentId !== player.id) return;
            
            const transform = entity.getComponent('transform');
            const dist = Math.hypot(playerTransform.x - transform.x, playerTransform.y - transform.y);
            if (dist < 24 && dist < closestDist) {
                closestDist = dist;
                closest = entity;
            }
        });
        
        if (closest) this.mergeFragments(player, closest);
    }
    
    mergeFragments(primary, target) {
        const primaryData = primary.getComponent('fragmentData');
        const targetData = target.getComponent('fragmentData');
        const primaryVel = primary.getComponent('velocity');
        
        // Conservation of mass
        primaryData.mass += targetData.mass;
        primaryData.sizeMultiplier = Math.sqrt(primaryData.mass);
        
        // Visual merge effect (simplified)
        const targetTransform = target.getComponent('transform');
        primary.getComponent('transform').x = (primary.getComponent('transform').x + targetTransform.x) / 2;
        primary.getComponent('transform').y = (primary.getComponent('transform').y + targetTransform.y) / 2;
        
        // Destroy target
        target.destroy();
        
        // Update split controller
        const splitCtrl = primary.getComponent('splitController');
        splitCtrl.currentSplitCount--;
        splitCtrl.activeFragments = splitCtrl.activeFragments.filter(id => id !== target.id);
        splitCtrl.mergeCooldown = 0.2;
        
        audio.play('merge');
    }
    
    switchFragment(player) {
        const splitCtrl = player.getComponent('splitController');
        if (splitCtrl.activeFragments.length <= 1) return;
        
        const currentIndex = splitCtrl.activeFragments.indexOf(player.id);
        const nextIndex = (currentIndex + 1) % splitCtrl.activeFragments.length;
        const nextId = splitCtrl.activeFragments[nextIndex];
        
        // Find next entity
        const nextEntity = this.world.entities.find(e => e.id === nextId);
        if (!nextEntity) return;
        
        // Switch player control
        this.world.playerEntity = nextEntity;
        
        // Snap camera
        const camSys = this.world.systems.find(s => s.constructor.name === 'CameraSystem');
        if (camSys) camSys.snapToTarget();
        
        audio.play('switch');
    }
}