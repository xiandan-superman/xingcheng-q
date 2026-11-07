const gsap=require('../timeline');
const Core=require('../next-core');
module.exports=function(canvas){
const ctx=canvas.getContext('2d'),s=Core.base();Object.assign(s,{x:360,y:334,scaleX:.72,scaleY:.72,orbitAlpha:0,eyeX:-14,eyeY:-6});const draw=()=>Core.paint(canvas,ctx,s,'makeup');const tl=gsap.timeline({paused:true,onUpdate:draw});
tl.to(s,{orbitAlpha:1,reverseGlow:.4,duration:.65,ease:'power2.out'},.2)
 .to(s,{timeTurn:-1.15,reverseGlow:1,starTurn:1.5,x:346,y:326,rotation:-7,eyeX:-18,duration:1.25,ease:'power2.inOut'},.92)
 .to(s,{timeTurn:-2.65,starTurn:3.2,rotation:8,eyeX:8,duration:1.25,ease:'sine.inOut'},2.22)
 .to(s,{handAlpha:1,handLX:287,handLY:357,handRX:414,handRY:350,x:352,y:342,scaleX:.86,scaleY:.58,squash:.7,eyeX:-16,eyeY:10,duration:.48,ease:'back.out(1.7)'},3.62)
 .to(s,{hook:1,handLX:290,handLY:364,rotation:-10,duration:.5,ease:'power2.out'},4.14)
 .to(s,{retrieve:.3,x:375,y:349,scaleX:1.02,scaleY:.48,tug:1,rotation:12,eyeX:-18,timeTurn:-3.3,duration:.8,ease:'power3.inOut'},4.72)
 .to(s,{retrieve:.62,x:402,y:356,scaleX:1.18,scaleY:.42,tug:1.2,rotation:18,eyeOpenL:.7,eyeOpenR:.7,duration:.72,ease:'power3.inOut'},5.56)
 .to(s,{retrieve:1,x:330,y:310,scaleX:.62,scaleY:1.18,tug:0,rotation:-18,eyeOpenL:1.18,eyeOpenR:1.18,starGlow:1,sparkle:.85,timeTurn:-4.05,duration:.56,ease:'back.out(2.2)'},6.32)
 .to(s,{hook:0,handAlpha:0,x:256,y:270,scaleX:.88,scaleY:.88,rotation:0,smile:1,orbitAlpha:1,duration:.6,ease:'back.out(1.9)'},6.94)
 .to(s,{timeTurn:-4.55,reverseGlow:.5,starTurn:5.5,y:250,rotation:7,duration:.5,ease:'sine.inOut'},7.62)
 .to(s,{y:272,rotation:-6,duration:.38,ease:'sine.inOut'},8.14)
 .to(s,{smile:0,wink:.92,rotation:0,duration:.16,ease:'power3.in'},8.68)
 .to(s,{wink:0,sparkle:.28,reverseGlow:.18,duration:.38,ease:'back.out(1.5)'},8.84)
 .to(s,{orbitAlpha:.76,sparkle:0,timeTurn:-4.7,y:270,scaleX:.86,scaleY:.86,duration:.9,ease:'sine.out'},9.55);

return {timeline:tl,draw};
}
