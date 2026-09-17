export class RNG{
  constructor(seed){ this.seed = seed; this.a = 1664525; this.c = 1013904223; }
  
  next(){ this.seed = (this.a * this.seed + this.c) & 0xffffffff; return this.seed / 0xffffffff; }
  
  nextInt(max){ return Math.floor(this.next() * max); }
  
  range(min,max){ return min + this.next() * (max - min); }
}