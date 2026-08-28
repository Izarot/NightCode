export const degToRad=deg=>deg*Math.PI/180;
export const radToDeg=rad=>rad*180/Math.PI;
export const clamp=(val,min,max)=>Math.min(Math.max(val,min),max);
export const randomRange=(min,max)=>min+Math.random()*(max-min);
export const distance=(x1,y1,x2,y2)=>Math.hypot(x2-x1,y2-y1);
export const vectorFromAngle=(angle,length)=>({x:Math.cos(angle)*length,y:Math.sin(angle)*length});