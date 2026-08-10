export class EvolutionEngine {
    constructor() {
        this.mutationLevel = 0;
        this.tier = 1;
        this.mutationHistory = [];
    }
    
    mutate(wave) {
        const baseMutation = wave * 0.1;
        const randomFactor = (Math.random() - 0.5) * 0.2;
        this.mutationLevel = baseMutation + randomFactor;
        
        if (wave >= 10) this.tier = 4;
        else if (wave >= 7) this.tier = 3;
        else if (wave >= 4) this.tier = 2;
        else this.tier = 1;
        
        this.mutationHistory.push({
            wave,
            tier: this.tier,
            mutation: this.mutationLevel
        });
    }
    
    getTier() { return this.tier; }
    getMutationLevel() { return this.mutationLevel; }
}