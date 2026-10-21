export class ECS {
  constructor(){ this.entities=[]; this.components={}; }
  createEntity(){ const id=this.entities.length; this.entities.push(id); return id; }
  addComponent(e,c,data){ if(!this.components[c])this.components[c]={}; this.components[c][e]=data; }
  getComponent(e,c){ return this.components[c]?this.components[c][e]:null; }
  removeComponent(e,c){ if(this.components[c])delete this.components[c][e]; }
}
