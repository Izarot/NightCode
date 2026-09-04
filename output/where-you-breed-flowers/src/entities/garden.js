import { Plant } from './plant.js';

export class Garden {
    constructor(genetics) {
        this.genetics = genetics;
        this.plots = this.createGrid();
        this.selectedPlant = null;
    }

    createGrid() {
        const plots = [];
        const hexRadius = 60;
        const cols = 5, rows = 4;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = 640 + col * hexRadius * 1.5;
                const y = 360 + row * hexRadius * Math.sqrt(3) + (col % 2) * hexRadius * Math.sqrt(3) / 2;
                plots.push({ x, y, plant: null, id: row * cols + col });
            }
        }
        return plots;
    }

    plantSeed(plotId, genome) {
        const plot = this.plots[plotId];
        if (!plot.plant) {
            plot.plant = new Plant(genome, plotId);
            return true;
        }
        return false;
    }

    update(dt) {
        this.plots.forEach(plot => {
            if (plot.plant) plot.plant.update(dt);
        });
    }

    getPlantAt(x, y) {
        for (let plot of this.plots) {
            const dx = x - plot.x;
            const dy = y - plot.y;
            if (Math.sqrt(dx*dx + dy*dy) < 40) {
                return plot;
            }
        }
        return null;
    }
}