import { Entity } from '../core/ecs';
import { Vec2 } from '../utils/math';

export class SpatialGrid {
    private grid: Map<string, Entity[]> = new Map();
    private cellSize: number;
    
    constructor(cellSize = 256) { this.cellSize = cellSize; }
    
    clear() { this.grid.clear(); }
    
    insert(entity: Entity, pos: Vec2, radius: number) {
        const minX = Math.floor((pos.x - radius) / this.cellSize);
        const maxX = Math.floor((pos.x + radius) / this.cellSize);
        const minY = Math.floor((pos.y - radius) / this.cellSize);
        const maxY = Math.floor((pos.y + radius) / this.cellSize);
        
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const key = `${x},${y}`;
                if (!this.grid.has(key)) this.grid.set(key, []);
                this.grid.get(key)!.push(entity);
            }
        }
    }
    
    query(x: number, y: number, radius: number): Entity[] {
        const results: Entity[] = [];
        const seen = new Set<number>();
        const minX = Math.floor((x - radius) / this.cellSize);
        const maxX = Math.floor((x + radius) / this.cellSize);
        const minY = Math.floor((y - radius) / this.cellSize);
        const maxY = Math.floor((y + radius) / this.cellSize);
        
        for (let cx = minX; cx <= maxX; cx++) {
            for (let cy = minY; cy <= maxY; cy++) {
                const key = `${cx},${cy}`;
                const cell = this.grid.get(key);
                if (cell) {
                    for (const e of cell) {
                        if (!seen.has(e.id)) {
                            seen.add(e.id);
                            results.push(e);
                        }
                    }
                }
            }
        }
        return results;
    }
}