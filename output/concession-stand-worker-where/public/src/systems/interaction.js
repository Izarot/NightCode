// Interaction system
export class InteractionSystem {
    constructor() {
        this.world = null;
        this.interactionRadius = 20;
    }
    
    update() {
        const player = this.world.player;
        if (!player) return;
        
        const transform = player.getComponent(Transform);
        const input = player.getComponent(InputIntent)?.intent;
        
        if (input && input.action === 'INTERACT') {
            // Clear input intent
            player.getComponent(InputIntent).intent = {};
            
            // Check for interactable entities
            const entities = this.world.getEntitiesWithComponent(Station);
            for (const entity of entities) {
                const stationTransform = entity.getComponent(Transform);
                const dx = transform.x - stationTransform.x;
                const dy = transform.y - stationTransform.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                if (distance < this.interactionRadius) {
                    const station = entity.getComponent(Station);
                    this.handleInteraction(station.type, entity, player);
                    break;
                }
            }
        }
    }
    
    handleInteraction(type, stationEntity, playerEntity) {
        const inventory = playerEntity.getComponent(Inventory);
        const physics = playerEntity.getComponent(Physics);
        
        switch (type) {
            case 'grill':
                // Check if we have raw patty to cook
                if (inventory.hasItem('raw-patty')) {
                    const grill = stationEntity.getComponent(Station);
                    if (!grill.processing) {
                        grill.processing = playerEntity;
                        grill.timer = 3.0; // Base cook time
                        
                        // Remove raw patty from inventory
                        const idx = inventory.slots.indexOf('raw-patty');
                        inventory.slots[idx] = null;
                        
                        // Play cook sound
                        AssetManager.sounds.cook.start();
                    }
                }
                break;
                
            case 'bun':
                // Give bun if we don't have one
                if (!inventory.hasItem('bun') && inventory.slots.includes(null)) {
                    const emptyIdx = inventory.slots.indexOf(null);
                    inventory.slots[emptyIdx] = 'bun';
                    AssetManager.sounds.assemble.play();
                }
                break;
                
            case 'register':
                // Check if we have a complete order
                if (inventory.hasItem('cooked-patty') && inventory.hasItem('bun')) {
                    // Find customer at register
                    const customers = this.world.getEntitiesWithComponent(Customer);
                    for (const customer of customers) {
                        const custTransform = customer.getComponent(Transform);
                        if (custTransform.lane === 1 && custTransform.node === 1) { // Register position
                            const order = customer.getComponent(Order);
                            if (order.recipeId === 'burger') {
                                // Serve order
                                inventory.clear();
                                customer.getComponent(Customer).state = 'served';
                                
                                // Add earnings
                                const earningsElem = document.getElementById('earnings-text');
                                let earnings = parseInt(earningsElem.textContent);
                                earnings += 1
                                earningsElem.textContent = earnings;
                                AssetManager.sounds.chaching.play();
                            }
                        }
                    }
                }
                break;
            default:
                break;
        }
    }
}
