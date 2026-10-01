export interface LevelData {
    meta: { id: string; name: string; parTime: number; inkBudget: number };
    spawn: { x: number; y: number };
    platforms: any[];
    hazards: any[];
    collectibles: any[];
}