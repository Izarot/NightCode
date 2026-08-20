export class InputSystem {
    constructor() {
        this.keys = {};
        this.actions = { left: false, right: false, jump: false, split: false, merge: false, switch: false };
        window.addEventListener('keydown', e => { this.keys[e.code] = true; this.updateActions(); });
        window.addEventListener('keyup', e => { this.keys[e.code] = false; this.updateActions(); });
    }
    
    updateActions() {
        this.actions.left = this.keys['KeyA'] || this.keys['ArrowLeft'];
        this.actions.right = this.keys['KeyD'] || this.keys['ArrowRight'];
        this.actions.jump = this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['Space'];
        this.actions.split = this.keys['KeyQ'];
        this.actions.merge = this.keys['KeyE'];
        this.actions.switch = this.keys['KeyTab'];
    }
    
    update(dt) {
        // Pass actions to entities via world
        const player = this.world.playerEntity;
        if (player) {
            player.getComponent('playerControl').inputMap = { ...this.actions };
        }
    }
}