// Input handling system
import { AssetManager } from '../assets.js';

export class InputSystem {
    constructor() {
        this.world = null;
        this.keys = {};
        this.keyMap = {
            'ArrowLeft': 'MOVE_LEFT',
            'ArrowRight': 'MOVE_RIGHT',
            'ArrowUp': 'LANE_UP',
            'ArrowDown': 'LANE_DOWN',
            ' ': 'INTERACT',
            'Enter': 'INTERACT',
            'ShiftLeft': 'SPRINT',
            'ShiftRight': 'SPRINT'
        };
        
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            const action = this.keyMap[e.key];
            if (action) this[action.toLowerCase()]();
        });
        
        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
        });
    }
    
    moveLeft() { this.intent = 'MOVE_LEFT'; }
    moveRight() { this.intent = 'MOVE_RIGHT'; }
    laneUp() { this.intent = 'LANE_UP'; }
    laneDown() { this.intent = 'LANE_DOWN'; }
    interact() { this.intent = 'INTERACT'; }
    sprint() { this.intent = 'SPRINT'; }
    
    update() {
        if (!this.world.player) return;
        
        const input = {};
        if (this.intent) {
            input.action = this.intent;
            this.intent = null;
        }
        
        // Sprint handling
        if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) {
            input.sprint = true;
        } else {
            input.sprint = false;
        }
        
        const physics = this.world.player.getComponent(Physics);
        if (physics) {
            if (input.sprint && physics.stamina > 0) {
                physics.stamina = Math.max(0, physics.stamina - 2);
            } else if (!input.sprint && physics.stamina < physics.maxStamina) {
                physics.stamina = Math.min(physics.maxStamina, physics.stamina + 1);
            }
        }
        
        // Store input on player entity for other systems
        const player = this.world.player;
        if (!player.hasComponent(InputIntent)) {
            player.addComponent(new InputIntent());
        }
        player.getComponent(InputIntent).intent = input;
    }
}

class InputIntent extends Component {
    constructor() {
        super();
        this.intent = {};
    }
}