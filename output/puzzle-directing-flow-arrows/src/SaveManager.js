export class SaveManager{
constructor(){this.k='arrowgrid_v1';}
getHigh(){try{return parseInt(localStorage.getItem(this.k))||0;}catch(e){return 0;}}
addHigh(n){const c=this.getHigh();if(n>c){try{localStorage.setItem(this.k,n);}catch(e){}}}
}
