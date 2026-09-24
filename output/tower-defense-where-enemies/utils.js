// Utils: Spatial Hash, Object Pool
function spatialHash(obj,radius){const cellSize=50;const hx=Math.floor(obj.x/cellSize);const hy=Math.floor(obj.y/cellSize);return `${hx},${hy}`}
class Pool{constructor(cls){this.cls=cls;this.items=[];}
get(){return this.items.pop()||new this.cls();}release(o){this.items.push(o);}}
const particlePool=new Pool(class{constructor(){this.x=0;this.y=0;this.vx=0;this.vy=0;this.life=0;}});
const enemyPool=new Pool(class{constructor(){this.x=0;this.y=0;this.hp=0;this.surface='floor';this.speed=0;}});
const towerPool=new Pool(class{constructor(){this.x=0;this.y=0;this.surface='floor';this.type='turret';}});