export const COLORS=['#ff6b6b','#4ecdc4','#ffe66d','#a8e6cf','#c39bd3','#ff8c42'];
export const INGREDIENTS=[
  {id:'fire',name:'Fire Leaf',color:'#ff6b6b',sound:440,emoji:'🔥'},
  {id:'water',name:'Moon Water',color:'#4ecdc4',sound:330,emoji:'💧'},
  {id:'earth',name:'Stone Dust',color:'#a8e6cf',sound:260,emoji:'🪨'},
  {id:'air',name:'Wind Petal',color:'#ffe66d',sound:520,emoji:'🍃'},
  {id:'spirit',name:'Spirit',color:'#c39bd3',sound:600,emoji:'✨'},
  {id:'shadow',name:'Shadow',color:'#3d3d3d',sound:180,emoji:'🌑'}
];
export const COMPAT={
  'fire+water':{name:'Steam Burst',mult:1.2,fx:'steam'},
  'earth+fire':{name:'Magma',mult:1.3,fx:'lava'},
  'air+water':{name:'Mist',mult:1.15,fx:'mist'},
  'spirit+shadow':{name:'Void',mult:1.5,fx:'void'}
};export function getCombo(a,b){const k=[a,b].sort().join('+');return COMPAT[k];}