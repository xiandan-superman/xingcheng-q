const gsap=require('../timeline');
const Core=require('../next-core');
module.exports=function(canvas){
  const ctx=canvas.getContext('2d'),s=Core.base();
  Object.assign(s,{x:138,y:324,scaleX:.72,scaleY:.76,eyeX:16,eyeY:-5,handLX:72,handLY:327,capsuleAlpha:0,capsuleX:342,capsuleY:280,capsuleScale:.2,coreAlpha:0,coreX:438,coreY:208});
  const draw=()=>Core.paint(canvas,ctx,s,'signal');
  const tl=gsap.timeline({paused:true,onUpdate:draw});
  tl.to(s,{capsuleAlpha:1,capsuleScale:1,duration:.58,ease:'back.out(1.8)'},.2)
    .to(s,{coreAlpha:1,coreSpread:1.2,coreX:430,coreY:232,eyeX:21,x:150,rotation:5,handLX:77,handLY:327,duration:.52,ease:'power2.out'},.88)
    .to(s,{coreX:414,coreY:270,handAlpha:1,handRX:245,handRY:302,x:164,scaleX:.8,scaleY:.7,duration:.62,ease:'sine.inOut'},1.46)
    .to(s,{coreX:391,coreY:297,coreSpread:.65,handRX:336,handRY:297,rotation:-4,duration:.68,ease:'power3.inOut'},2.18)
    .to(s,{coreFill:1,coreSpread:1.35,badgeAlpha:1,badgeScale:1,badgeX:414,badgeY:181,badgeRot:.08,eyeOpenL:.18,eyeOpenR:.18,squash:.45,starTurn:2.4,duration:.34,ease:'expo.out'},2.92)
    .to(s,{coreSpread:.7,eyeOpenL:.96,eyeOpenR:.96,squash:0,handAlpha:.72,handLX:78,handLY:326,handRX:284,handRY:310,x:150,y:312,rotation:2,scaleX:.76,scaleY:.8,duration:.58,ease:'back.out(2)'},3.36)
    .to(s,{smile:1,sparkle:1,badgeRot:-.05,starTurn:4.1,duration:.42,ease:'back.out(1.7)'},4.02)
    .to(s,{smile:0,wink:.88,sparkle:.28,duration:.3,ease:'power2.inOut'},4.54)
    .to(s,{wink:0,sparkle:0,badgeAlpha:1,badgeScale:.96,coreFill:1,coreAlpha:1,coreX:391,coreY:297,duration:1.2,ease:'sine.out'},4.94);
  return {timeline:tl,draw};
}
