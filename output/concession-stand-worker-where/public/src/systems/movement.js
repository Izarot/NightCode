// Movement system
import { AssetManager } from '../assets.js';

export class MovementSystem {
    constructor() {
        this.world = null;
        this.laneY = [100, 250, 400]; // Y positions for lanes
        this.nodeX = [150, 350, 550]; // X positions for nodes
        this.moveSpeed = { walk: 12, sprint: 20 }; // tiles/sec
        this.laneSwitchTime = 0.15;
    }
    
    update(dt) {
        const player = this.world.player;
        if (!player) return;
        
        const transform = player.getComponent(Transform);
        const physics = player.getComponent(Physics);
        const input = player.getComponent(InputIntent)?.intent || {};
        
        // Handle lane switching
        if (input.action === 'LANE_UP' && transform.lane > 0) {
            transform.lane--;
            transform.targetNode = Math.min(transform.targetNode, this.nodeX.length - 1);
            player.addComponent(new LaneSwitchLock());
        } else if (input.action === 'LANE_DOWN' && transform.lane < 2) {
            transform.lane++;
            transform.targetNode = Math.min(transform.targetNode, this.nodeX.length - 1);
            player.addComponent(new LaneSwitchLock());
        }
        
        // Handle node movement
        if (input.action === 'MOVE_LEFT' && transform.targetNode > 0) {
            transform.targetNode--;
            transform.moving = true;
            transform.progress = 0;
        } else if (input.action === 'MOVE_RIGHT' && transform.targetNode < this.nodeX.length - 1) {
            transform.targetNode++;
            transform.moving = true;
            transform.progress = 0;
        }
        
        // Apply movement
        if (transform.moving) {
            const startX = this.nodeX[transform.node];
            const endX = this.nodeX[transform.targetNode];
            const startY = this.laneY[transform.lane];
            const endY = this.laneY[transform.lane];
            
            const speed = (physics && (input.sprint || physics.stamina > 20)) ? this.moveSpeed.sprint : this.moveSpeed.walk;
            const distance = Math.abs(endX - startX);
            const timeToMove = distance / speed;
            
            transform.progress += dt;
            const t = Math.min(transform.progress / timeToMove, 1);
            
            transform.x = startX + (endX - startX) * t;
            transform.y = startY + (endY - startY) * t;
            
            if (t >= 1) {
                transform.moving = false;
                transform.node = transform.targetNode;
                transform.progress = 0;
            }
        }
        
        // Handle lane switch lockout
        const lock = player.getComponent(LaneSwitchLock);
        if (lock) {
            lock.timer -= dt;
            if (lock.timer <= 0) {
                player.removeComponent(LaneSwitchLock);
            }
        }
    }
    
    render(alpha) {
        // Interpolation for smooth rendering
        const player = this.world.player;
        if (!player) return;
        
        const transform = player.getComponent(Transform);
        const prevTransform = player.getComponent(PrevTransform) || new Transform();
        
        // Store current as previous for next frame
        if (!player.hasComponent(PrevTransform)) {
            player.addComponent(new PrevTransform(transform.x, transform.y, transform.lane, transform.node));
        } else {
            const prev = player.getComponent(PrevTransform);
            prev.x = transform.x;
            prev.y = transform.y;
            prev.lane = transform.lane;
            prev.node = transform.node;
        }
        
        // Interpolate
        const ix = prevTransform.x + (transform.x - prevTransform.x) * alpha;
        const iy = prevTransform.y + (transform.y - prevTransform.y) * alpha;
        
        // Apply to render component
        const sprite = player.getComponent(Sprite);
        if (sprite) {
            sprite.renderX = ix;
            sprite.renderY = iy;
        }
    }
}

class LaneSwitchLock extends Component {
    constructor() {
        super();
        this.timer = 0.15;
    }
}

class PrevTransform extends Component {
    constructor(x = 0, y = 0, lane = 1, node = 0) {
        super();
        this.x = x;
        this.y = y;
        this.lane = lane;
        this.node = node;
    }
}