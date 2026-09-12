export class GridWarpShader {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private grid: {x: number, y: number}[] = [];
    private width: number;
    private height: number;
    
    constructor(width: number, height: number, resolution: number) {
        this.width = width;
        this.height = height;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d')!;
        
        // Initialize grid
        const step = width / resolution;
        for (let x = 0; x <= width; x += step) {
            for (let y = 0; y <= height; y += step) {
                this.grid.push({x, y});
            }
        }
    }
    
    render(wells: {pos: {x:number, y:number}, mass: number}[]) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw grid lines
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        
        for (const point of this.grid) {
            let dx = 0, dy = 0;
            
            for (const well of wells) {
                const distst = point.sub(well.pos);
                const d = dist.length();
                if (d < C.W_INNER_RADIUS) {
                    // Repulsion core
                    return dist.normalize().mul(-C.W_MAX_ACCEL);
                }
                
                const force = (C.W_G_CONST * this.mass) / (d * d);
                const accel = Math.min(force, C.W_MAX_ACCEL);
                return dist.normalize().mul(accel);
            }
            
            // Accumulate displacement
            const force = well.getForce(point);
            const accel = force.length();
            const angle = Math.atan2(force.y, force.x);
            
            // Apply distortion based on acceleration
            const distortionStrength = 0.5;
            dx += Math.cos(angle) * accel * distortionStrength;
            dy += Math.sin(angle) * accel * distortionStrength;
        }
        
        const displacedX = point.x + dx;
        const displacedY = point.y + dy;
        
        if (j === 0) {
            this.ctx.moveTo(displacedX, displacedY);
        } else {
            this.ctx.lineTo(displacedX, displacedY);
        }
    }
    this.ctx.stroke();
}

// Draw horizontal lines
for (let j = 0; j < this.grid[0].length; j++) {
    this.ctx.beginPath();
    for (let i = 0; i < this.grid.length; i++) {
        const point = this.grid[i][j];
        let dx = 0, dy = 0;
        
        for (const well of wells) {
            const dist = point.sub(well.pos);
            const d = dist.length();
            if (d < C.W_INNER_RADIUS) {
                // Repulsion core
                return dist.normalize().mul(-C.W_MAX_ACCEL);
            }
            
            const force = (C.W_G_CONST * this.mass) / (d * d);
            const accel = Math.min(force, C.W_MAX_ACCEL);
            return dist.normalize().mul(accel);
        }
        
        // Accumulate displacement
        const force = well.getForce(point);
        const accel = force.length();
        const angle = Math.atan2(force.y, force.x);
        
        // Apply distortion based on acceleration
        const distortionStrength = 0.5;
        dx += Math.cos(angle) * accel * distortionStrength;
        dy += Math.sin(angle) * accel * distortionStrength;
    }
    
    const displacedX = point.x + dx;
    const displacedY = point.y + dy;
    
    if (i === 0) {
        this.ctx.moveTo(displacedX, displacedY);
    } else {
        this.ctx.lineTo(displacedX, displacedY);
    }
}
this.ctx.stroke();
}
}