export class PlatformerStateSystem {
    update(dt) {
        const player = this.world.playerEntity;
        if (!player) return;
        
        const vel = player.getComponent('velocity');
        const physics = player.getComponent('physicsBody');
        const state = player.getComponent('playerControl').stateMachineRef;
        
        // Simple state update
        if (physics.grounded) {
            player.getComponent('playerControl').stateMachineRef = 'idle';
        } else {
            player.getComponent('playerControl').stateMachineRef = 'falling';
        }
    }
}