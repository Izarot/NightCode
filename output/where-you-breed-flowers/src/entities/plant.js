export class Plant {
    constructor(genes, plotId) {
        this.genes = genes;
        this.plotId = plotId;
        this.age = 0;
        this.growthTime = 30 + genes.L4 * 0.2; // seconds
        this.mature = false;
    }

    update(dt) {
        this.age += dt;
        if (this.age >= this.growthTime && !this.mature) {
            this.mature = true;
        }
    }

    isMature() {
        return this.mature;
    }
}