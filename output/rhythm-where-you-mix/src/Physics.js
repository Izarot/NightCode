export class Physics{
  constructor(state){this.state=state;}
  update(dt){
    if(this.state.dashTarget){
      this.state.avatar.x=this.state.dashTarget.x;
      this.state.avatar.y=this.state.dashTarget.y;
      this.state.dashTarget=null;
    }
  }
}