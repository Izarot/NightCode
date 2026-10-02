export function loadLevel() {
  return {
    tiles: [],
    platforms: [
      {x:0, y:1000, w:1920, h:80, type:'static'},
      {x:200, y:800, w:300, h:20, type:'static'},
      {x:600, y:600, w:200, h:20, type:'sinusoid', freq:0.5, amp:50},
      {x:1000, y:400, w:300, h:20, type:'static'},
      {x:1400, y:200, w:200, h:20, type:'static'}
    ],
    orbs: [
      {x:250, y:750},
      {x:650, y:550},
      {x:1150, y:350},
      {x:1500, y:150}
    ],
    hazards: [
      {x:800, y:900, w:40, h:40, type:'spike'},
      {x:1200, y:800, w:80, h:20, type:'blade'}
    ]
  };
}