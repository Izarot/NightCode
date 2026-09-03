export const WEAPONS = {
  piston:{name:'Piston',type:'pistol',dmg:12,rate:3,reload:1.2,mag:15,spd:900,spread:0.02,color:'#aaaaaa',rarity:'Common'},
  scatter:{name:'Scatter',type:'shotgun',dmg:8,rate:1,reload:2.0,mag:6,spd:700,spread:0.4,color:'#39ff14',rarity:'Uncommon',pellets:6},
  repeater:{name:'Repeater',type:'smg',dmg:10,rate:10,reload:2.5,mag:40,spd:1000,spread:0.06,color:'#00f0ff',rarity:'Rare'},
  lance:{name:'Lance',type:'sniper',dmg:75,rate:0.5,reload:2.5,mag:5,spd:2000,spread:0.0,color:'#ff00ff',rarity:'Epic',hitscan:true,scope:true},
  spitter:{name:'Spitter',type:'launcher',dmg:50,rate:0.8,reload:3.0,mag:3,spd:500,spread:0.02,color:'#ff8c00',rarity:'Epic',arc:true,splash:50},
  railgun:{name:'Railgun',type:'heavy',dmg:45,rate:1,reload:4.0,mag:3,spd:1500,spread:0,color:'#c080ff',rarity:'Epic',charge:0.8,pierce:1},
};

export class Weapon{
  constructor(key){
    const d = WEAPONS[key];
    Object.assign(this, d);
    this.key = key;
    this.ammo = d.mag;
    this.cool = 0;
    this.reloading = 0;
    this.chargeT = 0;
  }
}
