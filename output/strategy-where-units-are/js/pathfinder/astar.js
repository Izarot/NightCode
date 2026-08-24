// A* Pathfinding Algorithm
const AStar = {
    CELL_SIZE: 32,
    
    buildGrid(width, height) {
        const grid = {};
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const key = x + ',' + y;
                grid[key] = {
                    x: x,
                    y: y,
                    walkable: true
                };
            }
        }
        return grid;
    },
    
    findPath(grid, start, goal) {
        const openSet = new Set();
        const closedSet = new Set();
        const cameFrom = {};
        const gScore = {};
        const fScore = {};
        
        const startKey = start.x + ',' + start.y;
        const goalKey = goal.x + ',' + goal.y;
        
        openSet.add(startKey);
        gScore[startKey] = 0;
        fScore[startKey] = this.heuristic(start, goal);
        
        while (openSet.size > 0) {
            let currentKey = null;
            let minF = Infinity;
            for (const key of openSet) {
                const f = (gScore[key] || Infinity) + (fScore[key] || Infinity);
                if (f < minF) {
                    minF = f;
                    currentKey = key;
                }
            }
            
            if (!currentKey) break;
            
            const current = grid[currentKey];
            if (!current) break;
            
            openSet.delete(currentKey);
            closedSet.add(currentKey);
            
            if (currentKey === goalKey) {
                return this.reconstructPath(cameFrom, currentKey);
            }
            
            const neighbors = [
                { dx: 1, dy: 0 },
                { dx: -1, dy: 0 },
                { dx: 0, dy: 1 },
                { dx: 0, dy: -1 }
            ];
            
            for (const dir of neighbors) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;
                const neighborKey = nx + ',' + ny;
                
                if (!grid.hasOwnProperty(neighborKey)) continue;
                if (!grid[neighborKey].walkable) continue;
                if (closedSet.has(neighborKey)) continue;
                
                const tentativeG = (gScore[currentKey] || Infinity) + 1;
                if (tentativeG < (gScore[neighborKey] || Infinity)) {
                    cameFrom[neighborKey] = currentKey;
                    gScore[neighborKey] = tentativeG;
                    fScore[neighborKey] = tentativeG + this.heuristic(grid[neighborKey], goal);
                    openSet.add(neighborKey);
                }
            }
        }
        
        return null;
    },
    
    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    },
    
    reconstructPath(cameFrom, currentKey) {
        const path = [];
        let key = currentKey;
        while (key !== undefined && key !== null) {
            const parts = key.split(',');
            const x = parseInt(parts[0], 10);
            const y = parseInt(parts[1], 10);
            path.push({ x: x, y: y });
            key = cameFrom[key];
        }
        return path.reverse();
    }
};
