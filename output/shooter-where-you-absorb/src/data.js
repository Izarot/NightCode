const PATTERNS={
cinderling_starburst:{name:'Starburst',color:'#ff3366',icon:'star',count:8,spread:Math.PI*2,speed:180,lifetime:2.5,interval:0.8,note:523.25},
geometer_crossfire:{name:'Crossfire',color:'#33ff99',icon:'cross',count:4,spread:Math.PI/2,speed:240,lifetime:2.0,interval:0.7,note:587.33},
halo_spiral:{name:'Spiral Arc',color:'#ffaa00',icon:'spiral',count:6,spread:Math.PI*0.6,speed:160,lifetime:2.8,interval:0.6,note:659.25},
sentinel_lattice:{name:'Laser Lattice',color:'#aa66ff',icon:'lattice',count:12,spread:Math.PI*0.5,speed:320,lifetime:1.5,interval:0.9,note:698.46},
archon_paradox:{name:'The Paradox',color:'#ff00ff',icon:'paradox',count:24,spread:Math.PI*2,speed:200,lifetime:3.0,interval:1.0,note:783.99}
};
const ENEMY_TYPES={
cinderling:{hp:2,speed:140,size:10,color:'#ff3366',pattern:'cinderling_starburst',score:10},
geometer:{hp:3,speed:60,size:14,color:'#33ff99',pattern:'geometer_crossfire',score:15},
halo:{hp:2,speed:100,size:12,color:'#ffaa00',pattern:'halo_spiral',score:20},
sentinel:{hp:4,speed:0,size:16,color:'#aa66ff',pattern:'sentinel_lattice',score:25},
boss:{hp:80,speed:40,size:40,color:'#ff00ff',pattern:'archon_paradox',score:500}
};
const CHAMBERS=[
{enemies:[{t:'cinderling',n:5}]},
{enemies:[{t:'cinderling',n:4},{t:'geometer',n:3}]},
{enemies:[{t:'geometer',n:4},{t:'halo',n:3}]},
{enemies:[{t:'halo',n:5},{t:'sentinel',n:3},{t:'cinderling',n:3}]},
{enemies:[{t:'cinderling',n:5},{t:'geometer',n:4},{t:'halo',n:3},{t:'sentinel',n:3}],boss:true}
];
function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const COLORS={bg:'#0a0e27',player:'#ffffff',cyan:'#00d9ff',magenta:'#ff00ff',amber:'#ffaa00',lime:'#33ff99'};