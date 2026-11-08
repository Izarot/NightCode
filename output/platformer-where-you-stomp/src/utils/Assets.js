export const PALETTE={bg1:'#1a0533',bg2:'#3b0764',cyan:'#00ffff',pink:'#ff2ea6',lime:'#7cff00',yellow:'#ffe600',orange:'#ff4500',purple:'#b537f2',green:'#00ff88'};
export function fmtTime(ms){const s=Math.floor(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
