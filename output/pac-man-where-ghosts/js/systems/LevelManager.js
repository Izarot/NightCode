import { Maze } from '../utils/Maze.js';
import { Ghost } from '../entities/Ghost.js';
import { Item } from '../entities/Item.js';

export class LevelManager {
  constructor() {
    this.maze = null;
    this.dots = [];
    this.items = [];
    this.ghosts = [];
    this.goal = null;
  }

  loadLevel(num) {
    this.maze = new Maze(num);
    this.dots = this.maze.generateDots();
    this.items = this.maze.generateItems();
    this.ghosts = [
      new Ghost(200, 200, '#ff0000'),
      new Ghost(300, 200, '#00ffff'),
      new Ghost(200, 300, '#ff1493'),
      new Ghost(300, 300, '#ffa500')
    ];
    this.goal = this.maze.goal;
  }

  update(dt) {
    this.ghosts.forEach(g => g.update(dt, { x: 100, y: 100 }, this.goal, this.maze));
  }
}
