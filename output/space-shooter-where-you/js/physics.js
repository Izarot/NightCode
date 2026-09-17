export class Physics{
  constructor(){ this.entities = []; }
  
  update(dt){
    for(const e of this.entities){ e.update(dt); }
  }
  
  add(entity){ this.entities.push(entity); }
  
  remove(entity){ const i = this.entities.indexOf(entity); if(i>=0) this.entities.splice(i,1); }
}