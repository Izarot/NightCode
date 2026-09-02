function initUI(){
  buildPalette();buildLevelGrid();
  document.getElementById('btn-play').onclick=()=>{sndClick();showScreen('levels');};
  document.getElementById('btn-howto').onclick=()=>{sndClick();showScreen('howto');};
  document.getElementById('btn-back-title').onclick=()=>{sndClick();showScreen('title');};
  document.getElementById('btn-menu').onclick=()=>{sndClick();showScreen('pause');};
  document.getElementById('btn-resume').onclick=()=>{sndClick();showScreen('play');};
  document.getElementById('btn-pause-restart').onclick=()=>{sndClick();restartLevel();showScreen('play');};
  document.getElementById('btn-pause-levels').onclick=()=>{sndClick();showScreen('levels');};
  document.getElementById('btn-pause-title').onclick=()=>{sndClick();showScreen('title');};
  document.getElementById('btn-next').onclick=()=>{sndClick();if(state.currentLevel<10){state.currentLevel++;resetLevel();showScreen('play');}else{showScreen('levels');}};
  document.getElementById('btn-replay').onclick=()=>{sndClick();resetLevel();showScreen('play');};
  document.getElementById('btn-victory-levels').onclick=()=>{sndClick();showScreen('levels');};
  document.getElementById('btn-close-howto').onclick=()=>{sndClick();showScreen('title');};
  document.getElementById('btn-undo').onclick=()=>{sndClick();undoLast();};
  document.getElementById('btn-restart').onclick=()=>{sndClick();restartLevel();};
}
function buildPalette(){
  const pal=document.getElementById('palette');
  pal.innerHTML='';
  for(const type in BLOCK_TYPES){
    const item=document.createElement('div');item.className='pal-item';item.dataset.type=type;
    const c=document.createElement('canvas');c.width=96;c.height=72;
    const cnt=document.createElement('span');cnt.className='pal-count';cnt.textContent='0';
    item.appendChild(c);item.appendChild(cnt);
    item.onclick=()=>selectBlock(type);
    pal.appendChild(item);
    drawPaletteIcon(type,c);
  }
}
function refreshPalette(){
  const items=document.querySelectorAll('.pal-item');
  items.forEach(it=>{
    const t=it.dataset.type;
    const cnt=it.querySelector('.pal-count');
    const n=state.palette[t]||0;
    cnt.textContent=n;
    it.classList.toggle('depleted',n<=0);
    it.classList.toggle('selected',state.selectedBlock===t);
  });
}
function selectBlock(type){
  if((state.palette[type]||0)<=0){sndError();return;}
  state.selectedBlock=type;
  sndClick();refreshPalette();
}
function buildLevelGrid(){
  const grid=document.getElementById('level-grid');
  grid.innerHTML='';
  for(let i=1;i<=10;i++){
    const btn=document.createElement('button');
    btn.className='lvl-btn';
    if(!levelUnlocked(i))btn.classList.add('locked');
    btn.innerHTML='<span class="lvl-num">'+i+'</span><span class="lvl-stars">'+getStarsStr(i)+'</span>';
    btn.onclick=()=>{
      if(!levelUnlocked(i))return;
      sndClick();
      state.currentLevel=i;resetLevel();showScreen('play');
    };
    grid.appendChild(btn);
  }
}
function getStarsStr(i){
  const s=state.starsEarned[i]||0;
  return '★'.repeat(s)+'☆'.repeat(3-s);
}
function showScreen(name){
  state.activeScreen=name;
  document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
  if(name==='title')document.getElementById('screen-title').classList.remove('hidden');
  else if(name==='levels'){document.getElementById('screen-levels').classList.remove('hidden');buildLevelGrid();}
  else if(name==='pause')document.getElementById('screen-pause').classList.remove('hidden');
  else if(name==='victory')document.getElementById('screen-victory').classList.remove('hidden');
  else if(name==='howto')document.getElementById('screen-howto').classList.remove('hidden');
  if(name==='title'){
    document.getElementById('total-stars').textContent=totalCollected();
    document.getElementById('best-time').textContent=bestOverall();
  }
  if(name==='play'){
    document.getElementById('ui').style.display='block';
  }else{
    document.getElementById('ui').style.display='none';
  }
}
function bestOverall(){
  let best=null;
  for(const k in state.bestTimes){
    if(best===null||state.bestTimes[k]<best)best=state.bestTimes[k];
  }
  return best===null?'--':fmtTime(best);
}
function fmtTime(ms){
  const s=Math.floor(ms/1000),m=Math.floor(s/60);
  return m+':'+(s%60<10?'0':'')+(s%60);
}
function updateHUD(){
  document.getElementById('star-count').textContent=state.starsEarned[state.currentLevel]||0;
  document.getElementById('star-total').textContent=3;
  document.getElementById('lvl-num').textContent=state.currentLevel;
  const elapsed=state.elapsedTime||(Date.now()-state.startTime);
  document.getElementById('time-val').textContent=fmtTime(elapsed);
  const bt=state.bestTimes[state.currentLevel];
  document.getElementById('hs-val').textContent=bt?fmtTime(bt):'--';
  document.getElementById('target-h').textContent=state.targetHeight;
  document.getElementById('current-h').textContent=state.currentHeight;
  const pct=Math.min(100,(state.currentHeight/state.targetHeight)*100);
  document.getElementById('progress-fill').style.width=pct+'%';
  const stab=stabilityScore();
  document.getElementById('stab-pct').textContent=stab+'%';
  document.getElementById('stab-fill').style.width=stab+'%';
  let lbl='BALANCED';if(stab<50)lbl='UNSTABLE!';else if(stab<80)lbl='SHAKY';
  document.getElementById('stab-label').textContent=lbl;
  refreshPalette();
}
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  clearTimeout(window._toastTm);
  window._toastTm=setTimeout(()=>t.classList.remove('show'),1600);
}
function checkWin(){
  if(state.currentHeight>=state.targetHeight){
    const blocksLeft=Object.values(state.palette).reduce((a,b)=>a+b,0);
    const stars=calcStars(blocksLeft);
    state.starsEarned[state.currentLevel]=stars;
    state.elapsedTime=Date.now()-state.startTime;
    saveBest(state.currentLevel,state.elapsedTime);
    let tot=0;for(const k in state.starsEarned)tot+=state.starsEarned[k];
    state.totalStars=tot;saveStars();
    sndWin();
    document.getElementById('blocks-left').textContent=blocksLeft;
    document.getElementById('victory-time').textContent=fmtTime(state.elapsedTime);
    document.getElementById('victory-best').textContent=fmtTime(state.elapsedTime);
    const vs=document.getElementById('victory-stars');
    vs.innerHTML='';
    for(let i=0;i<3;i++){
      const s=document.createElement('span');s.className='v-star';s.textContent=i<stars?'★':'☆';
      vs.appendChild(s);
    }
    setTimeout(()=>showScreen('victory'),600);
  }
}
function restartLevel(){resetLevel();state.elapsedTime=0;}
