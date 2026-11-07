const gsap=require('../timeline');
const Core=require('../system-core');
module.exports=function(canvas){
  const ctx=canvas.getContext('2d'),s=Core.base();
  Object.assign(s,{x:178,y:306,sx:.86,sy:.9,eyeX:15,eyeY:-6,reminderA:0,reminderT:0});
  const draw=()=>Core.paint(canvas,ctx,s,'reminder');
  const tl=gsap.timeline({paused:true,onUpdate:draw});
  tl.to(s,{reminderA:1,reminderScale:.86,reminderT:.18,clockTurn:-.5,starTurn:.6,duration:.52,ease:'back.out(1.8)'},.22)
    .to(s,{reminderT:.68,reminderScale:1.12,reminderRot:.16,clockTurn:.35,eyeX:20,x:190,rot:.06,duration:.72,ease:'power2.inOut'},.92)
    .to(s,{reminderT:1,reminderRot:-.08,dockA:1,ringA:1,ringSpread:1,clockTurn:1.1,x:196,sx:.96,sy:.78,squash:.45,duration:.38,ease:'expo.out'},1.82)
    .to(s,{ringA:.38,ringSpread:.25,handA:1,rx:322,ry:286,squash:0,sx:.88,sy:.9,eyeX:18,duration:.5,ease:'back.out(2)'},2.28)
    .to(s,{rx:350,ry:282,clockTurn:2.3,reminderRot:.06,duration:.42,ease:'power2.inOut'},2.92)
    .to(s,{stampA:1,ringA:.85,ringSpread:.7,starTurn:2.5,eyeL:.16,eyeR:.16,sx:.9,sy:.72,duration:.3,ease:'expo.out'},3.42)
    .to(s,{eyeL:.96,eyeR:.96,ringA:.24,stampA:1,handA:.82,rx:326,ry:298,x:190,y:298,sx:.9,sy:.92,rot:-.03,duration:.62,ease:'back.out(1.8)'},3.82)
    .to(s,{eyeX:16,eyeY:-3,starTurn:4.1,reminderScale:1.08,stampA:1,ringA:.14,duration:1.65,ease:'sine.out'},4.62);
  return {timeline:tl,draw};

}
