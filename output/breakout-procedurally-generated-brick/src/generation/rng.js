export function hash(value){let h=2166136261;for(const ch of String(value)){h^=ch.codePointAt(0);h=Math.imul(h,16777619);}h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;return h>>>0;}
export function mulberry32(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};}
export const stream=(seed,label)=>mulberry32(hash(`${seed}|${label}`));
export function shuffle(array,rng){for(let i=array.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[array[i],array[j]]=[array[j],array[i]];}return array;}
export function freshSeed(){try{const a=new Uint32Array(2);crypto.getRandomValues(a);return `${a[0].toString(36)}-${a[1].toString(36)}`.toUpperCase();}catch{return Date.now().toString(36).toUpperCase();}}
