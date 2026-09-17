export const C=Object.freeze({W:960,H:720,LEFT:24,RIGHT:936,TOP:80,LOSS:736,PADDLE_Y:652,PADDLE_H:16,PADDLE_W:128,R:8,COLS:14,BW:58,BH:20,GAP:6,GX:35,GY:120,STEP:1/120,MAX_SPEED:820,EPS:.015});
export const STATES=Object.freeze({TITLE:'TITLE',LEVEL_INTRO:'LEVEL_INTRO',READY:'READY',PLAYING:'PLAYING',PAUSED:'PAUSED',LEVEL_CLEAR:'LEVEL_CLEAR',GAME_OVER:'GAME_OVER'});
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const startSpeed=level=>Math.min(420+18*(level-1),720);
export const palettes=[['#65f5da','#a995ff','#75bcff','#ff91b3'],['#ff8e9e','#ffd080','#dca0ff','#ffb983'],['#82ffbc','#66c9ff','#9fafff','#68ebdf']];
export const powerInfo={expand:{icon:'↔',label:'EXPAND',duration:12},slow:{icon:'◷',label:'SLOW',duration:8},multi:{icon:'⁙',label:'MULTIBALL'},shield:{icon:'⌁',label:'SHIELD'}};
