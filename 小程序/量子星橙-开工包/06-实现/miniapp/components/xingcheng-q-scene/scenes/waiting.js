const gsap=require('../timeline');
const Core=require('../next-core');
module.exports=function(canvas){
  const ctx=canvas.getContext('2d'),s=Core.base();
  Object.assign(s,{x:138,y:348,scaleX:.7,scaleY:.76,gateAlpha:0,memberA:0,slotA:0,clockA:0,eyeX:18,eyeY:-8,bean:.14});
  const draw=()=>Core.paint(canvas,ctx,s,'waiting');
  const tl=gsap.timeline({paused:true,onUpdate:draw});
  tl.to(s,{gateAlpha:1,memberA:1,starTurn:.8,duration:.52,ease:'back.out(1.8)'},.18)
    .to(s,{memberA:2,eyeX:21,x:150,y:342,rotation:5,duration:.58,ease:'back.out(1.8)'},.82)
    .to(s,{slotA:1,clockA:1,gateTurn:1.2,eyeX:22,eyeY:-4,handAlpha:1,handRX:245,handRY:324,duration:.62,ease:'power2.out'},1.52)
    .to(s,{pulse:1,pulseSpread:.9,gateTurn:2.5,eyeOpenL:.18,eyeOpenR:.18,squash:.35,duration:.42,ease:'sine.inOut'},2.26)
    .to(s,{pulse:.22,pulseSpread:.18,eyeOpenL:.94,eyeOpenR:.94,squash:0,x:146,y:350,rotation:-4,gateTurn:3.8,duration:.62,ease:'back.out(1.7)'},2.78)
    .to(s,{eyeX:20,eyeY:-8,x:152,y:340,rotation:3,gateTurn:5.4,pulse:.65,pulseSpread:.5,duration:.78,ease:'sine.inOut'},3.5)
    .to(s,{pulse:.18,pulseSpread:.12,handAlpha:.55,handRX:238,handRY:327,gateTurn:7.1,starTurn:3.6,duration:1.05,ease:'sine.out'},4.4)
    .to(s,{gateAlpha:1,memberA:2,slotA:1,clockA:1,eyeOpenL:.92,eyeOpenR:.92,gateTurn:8.3,duration:.95,ease:'sine.inOut'},5.52);
  return {timeline:tl,draw};
}
