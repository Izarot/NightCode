export const levelData = {
    meta: { id: 'level_01', name: 'The Drop', parTime: 45.0, inkBudget: 100 },
    spawn: { x: 100, y: 900 },
    platforms: [
        { id: 'p1', type: 'Static', shape: 'Rect', w: 200, h: 30, pos: [400, 800], visuals: { tint: '#6C757D' } },
        { id: 'p2', type: 'Static', shape: 'Rect', w: 200, h: 30, pos: [800, 600], visuals: { tint: '#6C757D' } },
        { id: 'p3', type: 'Static', shape: 'Rect', w: 200, h: 30, pos: [1200, 400], visuals: { tint: '#6C757D' } }
    ],
    hazards: [],
    collectibles: []
};