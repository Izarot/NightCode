import Target from '../entities/Target.js';

export class LevelLoader {
    static load(game, levelIndex) {
        const level = levels[levelIndex];
        game.targets = [];
        for (let i = 0; i < level.targets; i++) {
            game.targets.push(new Target(800 + i*50, 500 - i*20));
        }
        game.currentLevel = level;
    }
}