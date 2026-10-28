class Vector2D {
  constructor(x=0,y=0){this.x=x;this.y=y;}
  set(x,y){this.x=x;this.y=y;return this;}
  add(v){this.x+=v.x;this.y+=v.y;return this;}
  sub(v){this.x-=v.x;this.y-=v.y;return this;}
  mul(s){this.x*=s;this.y*=s;return this;}
  copy(){return new Vector2D(this.x,this.y);}
  rotate(angle){
    const r = angle * Math.PI / 180;
    const cos = Math.cos(r), sin = Math.sin(r);
    const nx = this.x * cos - this.y * sin;
    const ny = this.x * sin + this.y * cos;
    this.x = nx; this.y = ny;
    return this;
  }
}