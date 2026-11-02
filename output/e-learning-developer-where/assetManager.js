// Asset management and cursor spawning
class AssetManager {
    constructor() {
        this.assets = [];
        this.cursor = null;
    }
    
    spawnCursor(type, x, y) {
        const colors = {
            video: '#3B82F6',
            text: '#10B981',
            quiz: '#EF4444'
        };
        
        this.cursor = {
            type: type,
            x: x,
            y: y,
            color: colors[type] || '#0D9488',
            width: 40,
            height: 40
        };
    }
    
    addAsset(x, y, type) {
        const colors = {
            video: '#3B82F6',
            text: '#10B981',
            quiz: '#EF4444'
        };
        
        this.assets.push({
            x: Math.floor(x / 40) * 40,
            y: Math.floor(y / 40) * 40,
            type: type,
            color: colors[type] || '#0D9488',
            width: 40,
            height: 40
        });
    }
    
    getAssetsByType(type) {
        return this.assets.filter(asset => asset.type === type);
    }
    
    calculateEngagementScore() {
        let score = 0;
        this.assets.forEach(asset => {
            score += 10;
            // Bonus for adjacent assets
            const adjacent = this.assets.filter(other => 
                other !== asset && 
                Math.abs(other.x - asset.x) <= 40 && 
                Math.abs(other.y - asset.y) <= 40
            );
            score += adjacent.length * 5;
        });
        return score;
    }
}