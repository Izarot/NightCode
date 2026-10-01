class TentacleSystem {
    private tentacles: any[] = [];
    private maxTentacles = 2;

    constructor() {}

    public fireTentacle(from: any, to: any, input: any) {
        if (this.tentacles.length >= this.maxTentacles) return false;
        
        const tentacle = {
            start: { x: from.x, y: from.y },
            end: { x: to.x, y: to.y },
            attached: true,
            tension: 0
        };
        
        this.tentacles.push(tentacle);
        return true;
    }

    public update(dt: number) {
        // Update tentacle physics
        this.tentacles.forEach(t => {
            // Simple spring constraint
            const dx = t.end.x - t.start.x;
            const dy = t.end.y - t.start.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            t.tension = dist / 600; // Normalize to max range
        });
    }

    public detachAll() {
        this.tentacles = [];
    }
}

export { TentacleSystem };