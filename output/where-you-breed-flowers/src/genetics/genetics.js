export class Genetics {
    constructor() {
        this.mutationRate = 0.02;
    }

    createRandomGenome() {
        return {
            L0: Math.floor(Math.random() * 7),
            L1: Math.floor(Math.random() * 100),
            L2: Math.floor(Math.random() * 6) + 3,
            L3: Math.floor(Math.random() * 5),
            L4: Math.floor(Math.random() * 100),
            L5: Math.floor(Math.random() * 4),
            L6: Math.floor(Math.random() * 5),
            L7: Math.floor(Math.random() * 4)
        };
    }

    cross(parent1, parent2) {
        const child = {};
        for (let key in parent1.genes) {
            // Random allele from each parent
            const p1Allele = Math.random() < 0.5 ? parent1.genes[key] : parent1.genes[key];
            const p2Allele = Math.random() < 0.5 ? parent2.genes[key] : parent2.genes[key];
            
            // Average with incomplete dominance
            let childGene = (p1Allele + p2Allele) / 2;
            
            // Mutation
            if (Math.random() < this.mutationRate) {
                childGene += (Math.random() - 0.5) * 10;
            }
            
            // Clamp values
            child[key] = Math.max(0, Math.min(this.getMaxValue(key), childGene));
        }
        return child;
    }

    getMaxValue(key) {
        const maxValues = { L0: 6, L1: 100, L2: 8, L3: 4, L4: 100, L5: 3, L6: 4, L7: 3 };
        return maxValues[key];
    }

    matchScore(genome, target) {
        let score = 0;
        for (let key in target) {
            if (Math.abs(genome[key] - target[key]) <= 1) score++;
        }
        return score;
    }
}