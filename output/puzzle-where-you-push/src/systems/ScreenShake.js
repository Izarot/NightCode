export class ScreenShake{
  apply(ctx,time){if(time>0){const amt=Math.min(time/100,5);ctx.translate((Math.random()-0.5)*amt*2,(Math.random()-0.5)*amt*2)}}
}
