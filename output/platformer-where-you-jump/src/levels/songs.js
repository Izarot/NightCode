function genBeats(bpm,startMs,notes){return notes.map((n,i)=>({...n,beat:startMs+n.t*(60000/bpm)}));}
export const SONGS=[
  {bpm:60,name:'First Steps',
   platforms:[{x:0,y:500,w:400},{x:500,y:480,w:200},{x:800,y:460,w:200},{x:1100,y:440,w:200},{x:1400,y:420,w:200},{x:1700,y:440,w:200},{x:2000,y:460,w:200},{x:2300,y:480,w:400}],
   notes:genBeats(60,0,[
     {x:450,y:440,pitch:'C',t:1},{x:750,y:420,pitch:'D',t:2},{x:1050,y:400,pitch:'E',t:3},
     {x:1350,y:380,pitch:'F',t:4},{x:1650,y:400,pitch:'G',t:5},{x:1950,y:420,pitch:'A',t:6},
     {x:2250,y:440,pitch:'B',t:7},{x:2400,y:420,pitch:'C',t:8}])
  },
  {bpm:90,name:'Night Walk',
   platforms:[{x:0,y:500,w:300},{x:400,y:470,w:150},{x:650,y:440,w:150},{x:900,y:470,w:150},{x:1150,y:430,w:150},{x:1400,y:460,w:150},{x:1650,y:430,w:150},{x:1900,y:470,w:150},{x:2150,y:440,w:150},{x:2400,y:480,w:400}],
   notes:genBeats(90,0,[
     {x:430,y:430,pitch:'E',t:1},{x:680,y:400,pitch:'G',t:2},{x:930,y:430,pitch:'C',t:3},{x:1180,y:390,pitch:'A',t:4},
     {x:1430,y:420,pitch:'F',t:5},{x:1680,y:390,pitch:'D',t:6},{x:1930,y:430,pitch:'B',t:7},{x:2180,y:400,pitch:'G',t:8},
     {x:2450,y:420,pitch:'C',t:9}])
  },
  {bpm:120,name:'Finale',
   platforms:[{x:0,y:520,w:300},{x:350,y:480,w:100},{x:520,y:440,w:100},{x:680,y:480,w:100},{x:850,y:440,w:100},{x:1020,y:480,w:100},{x:1180,y:440,w:100},{x:1350,y:400,w:100},{x:1520,y:440,w:100},{x:1700,y:480,w:100},{x:1880,y:440,w:100},{x:2050,y:480,w:200},{x:2300,y:500,w:400}],
   notes:genBeats(120,0,[
     {x:380,y:440,pitch:'C',t:1},{x:550,y:400,pitch:'E',t:2},{x:710,y:440,pitch:'G',t:3},{x:880,y:400,pitch:'B',t:4},
     {x:1050,y:440,pitch:'A',t:5},{x:1210,y:400,pitch:'F',t:6},{x:1380,y:360,pitch:'D',t:7},{x:1550,y:400,pitch:'C',t:8},
     {x:1730,y:440,pitch:'E',t:9},{x:1910,y:400,pitch:'G',t:10},{x:2080,y:440,pitch:'B',t:11},{x:2350,y:440,pitch:'C',t:12}])
  }
];
