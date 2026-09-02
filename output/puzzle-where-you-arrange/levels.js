const LEVELS=[
  {target:4,blocks:{square:4}},
  {target:6,blocks:{square:2,domino:2}},
  {target:7,blocks:{square:3,lblock:2}},
  {target:8,blocks:{domino:2,lblock:2,square:2}},
  {target:9,blocks:{tblock:2,square:3}},
  {target:10,blocks:{square:2,domino:2,long:1,tblock:1,lblock:1}},
  {target:12,blocks:{long:2,lblock:2,square:1}},
  {target:14,blocks:{tblock:2,domino:2,lblock:2}},
  {target:15,blocks:{long:3,tblock:2,square:1}},
  {target:16,blocks:{long:2,tblock:2,lblock:2,domino:1,square:1}}
];
function calcStars(blocksLeft){
  if(blocksLeft>=3)return 3;
  if(blocksLeft>=1)return 2;
  return 1;
}
function totalRequired(){
  let n=0;
  for(let i=1;i<=10;i++){
    const max=state.starsEarned[i]||0;
    if(i<=3)n+=Math.min(max,3);
    else if(i<=7)n+=Math.min(max,2);
    else n+=Math.min(max,1);
  }
  return n;
}
function totalCollected(){
  let n=0;
  for(const k in state.starsEarned)n+=state.starsEarned[k];
  return n;
}
function levelUnlocked(idx){
  if(idx===1)return true;
  return (state.starsEarned[idx-1]||0)>0;
}
