export class Level {
  public id: string;
  public spawn: { prime: { x: number; y: number; }, echo: { x: number; y: number; } };
  public tilemaps: { prime: string; echo: string; };
  public entities: any[];
  constructor(json: any) { 
    this.id = json.meta.id;
    this.spawn = json.spawn;
    this.tilemaps = json.tilemaps;
    this.entities = json.entities;
  }
  public load() { 
    // load tilemap CSV, instantiate entities, set up asymmetry
    // placeholder implementation
  }
}
