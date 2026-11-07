const gsap=require('../timeline');
const Core=require('../system-core');
module.exports=function(canvas){
  const ctx=canvas.getContext('2d'),s=Core.base();
  Object.assign(s,{x:142,y:315,sx:.76,sy:.82,eyeX:18,eyeY:-5,trackA:0,trackGap:1});
  const draw=()=>Core.paint(canvas,ctx,s,'resume');
  const tl=gsap.timeline({paused:true,onUpdate:draw});
  tl.to(s,{trackA:1,duration:.58,ease:'back.out(1.7)'},.18)
    .to(s,{x:158,rot:.06,eyeX:21,duration:.48,ease:'sine.inOut'},.86)
    .to(s,{handA:1,rx:236,ry:300,x:170,sx:.84,sy:.72,tug:.35,duration:.58,ease:'back.out(1.8)'},1.42)
    .to(s,{joinGlow:1,trackGap:.48,rx:274,ry:292,starTurn:1.3,duration:.55,ease:'power3.inOut'},2.08)
    .to(s,{trackGap:0,joinGlow:.7,rideA:1,rideT:.08,eyeL:.18,eyeR:.18,squash:.5,sx:.94,sy:.62,duration:.36,ease:'expo.out'},2.72)
    .to(s,{rideT:.55,joinGlow:.24,x:246,y:249,rot:-.28,squash:0,sx:.64,sy:.82,handA:0,eyeL:.98,eyeR:.98,duration:.62,ease:'power2.out'},3.16)
    .to(s,{rideT:1,x:286,y:225,rot:.16,sx:.78,sy:.7,starTurn:3.4,duration:.56,ease:'power3.inOut'},3.86)
    .to(s,{rideA:.25,x:205,y:286,rot:-.03,sx:.78,sy:.82,handA:.75,rx:286,ry:282,eyeL:.92,eyeR:.92,duration:.68,ease:'back.out(2)'},4.52)
    .to(s,{trackGap:0,joinGlow:.12,starTurn:5.1,eyeX:19,eyeY:-3,duration:1.05,ease:'sine.out'},5.28);
  return {timeline:tl,draw};
}
