export class LevelLoader{
  async loadAll(){return [this.makeLevel(0),this.makeLevel(1),this.makeLevel(2)]}
  makeLevel(n){return {cols:10,rows:10,cellSize:64,walls:[{x:0,y:0},{x:9,y:0},{x:0,y:9},{x:9,y:9},{x:3,y:3},{x:4,y:3},{x:5,y:3},{x:6,y:3}],blocks:[{x:2,y:2,color:'blue'},{x:7,y:7,color:'blue'}],plates:[{x:1,y:1,color:'standard'},{x:8,y:8,color:'standard'}],player:{x:5,y:5}}}
}
