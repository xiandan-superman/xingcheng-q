const gsap=require('../timeline');
const Core=require('../system-core');
module.exports=function(canvas){
  const ctx=canvas.getContext('2d'),s=Core.base();
  Object.assign(s,{x:156,y:302,sx:.84,sy:.88,eyeX:15,cardA:0,cardX:330,cardY:275,cardScale:.2});
  const draw=()=>Core.paint(canvas,ctx,s,'failure');
  const tl=gsap.timeline({paused:true,onUpdate:draw});
  tl.to(s,{cardA:1,cardScale:1.02,cardX:334,handA:1,rx:264,ry:303,eyeX:18,duration:.55,ease:'back.out(1.8)'},.25)
    .to(s,{x:178,rot:.08,sx:.92,sy:.8,rx:292,ry:286,cardX:370,sendA:1,duration:.62,ease:'power3.inOut'},1.05)
    .to(s,{cardX:420,cardScale:.94,sendA:.75,eyeX:22,duration:.45,ease:'power3.in'},1.82)
    .to(s,{cardX:354,cardY:282,cardRot:-.11,errorA:1,sendA:0,x:162,y:312,rot:-.11,sx:.9,sy:.65,squash:.55,eyeL:1.15,eyeR:1.15,duration:.34,ease:'expo.out'},2.32)
    .to(s,{cardX:346,cardRot:.055,x:154,rot:.05,squash:0,sx:.78,sy:.82,eyeY:5,eyeL:.45,eyeR:.45,duration:.62,ease:'back.out(2)'},2.78)
    .to(s,{cardRot:-.02,errorA:.88,retryA:1,eyeL:.92,eyeR:.92,eyeX:17,eyeY:1,handA:.9,rx:265,ry:319,duration:.7,ease:'power2.out'},3.62)
    .to(s,{retryA:.72,errorA:1,starTurn:2.4,cardScale:1.04,x:160,y:304,sx:.88,sy:.88,rot:-.03,duration:1.25,ease:'sine.inOut'},4.48)
    .to(s,{retryA:.62,starTurn:4.2,eyeY:3,duration:1.45,ease:'sine.out'},5.9);
  return {timeline:tl,draw};
}
