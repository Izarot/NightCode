const COLORS = {
 bg:'#0a0a12', paddle:'#00ffff', ball:'#ffff00',
 t1:'#00ff88', t2:'#ff8800', t3:'#ff0044', boss:'#ff00ff',
 cyan:'#00ffff', magenta:'#ff00ff', yellow:'#ffff00', red:'#ff0044'
};
const CFG = {
 w:800, h:600, hud:40, pad:20,
 paddleW:120, paddleH:15, paddlePad:10,
 ballR:6, ballBase:7, ballMax:12,
 brickW:70, brickH:25, brickGap:5,
 cols:10, rows:5
};
function buildLevel(n) {
 const bricks = [];
 let dist = {1:1, 2:0.6, 3:0.3}[Math.min(n,3)] || 0.4;
 const t2p = {1:0, 2:0.4, 3:0.5}[Math.min(n,3)] || 0.35;
 const t3p = {1:0, 2:0, 3:0.2}[Math.min(n,3)] || 0.2;
 const total = CFG.cols * CFG.rows;
 let bossEvery3 = n % 3 === 0;
 let center = Math.floor(CFG.cols/2);
 for (let r=0;r<CFG.rows;r++) {
 for (let c=0;c<CFG.cols;c++) {
 const x = CFG.pad + c*(CFG.brickW+CFG.brickGap);
 const y = CFG.hud + CFG.pad + r*(CFG.brickH+CFG.brickGap);
 let tier = 1;
 const roll = Math.random();
 if (roll < t3p) tier = 3;
 else if (roll < t3p + t2p) tier = 2;
 let hp = tier === 1 ? 1 : tier === 2 ? 2 : 3;
 let color = tier===1?COLORS.t1:tier===2?COLORS.t2:COLORS.t3;
 let pts = tier===1?10:tier===2?25:50;
 let fire = tier===1?0:tier===2?4:tier===3?2.5:0;
 if (bossEvery3 && r===2 && (c===center-1||c===center||c===center+1) && r===Math.floor(CFG.rows/2)) {
 if (c===center) { hp=5; color=COLORS.boss; pts=100; fire=1.5; tier=4; }
 }
 bricks.push({x,y,w:CFG.brickW,h:CFG.brickH,hp,maxHp:hp,color,pts,fire,charge:0,tier,flash:0,recoil:0});
 }}
 return bricks;
}
