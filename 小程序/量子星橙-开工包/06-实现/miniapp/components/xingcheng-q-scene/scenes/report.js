const gsap=require('../timeline');
const Core=require('../next-core');
module.exports=function(canvas){
const ctx=canvas.getContext('2d'),s=Core.base();Object.assign(s,{x:118,y:320,scaleX:.68,scaleY:.68,mapAlpha:0,mapOpen:.03,eyeX:14,eyeY:-5});const draw=()=>Core.paint(canvas,ctx,s,'report');const tl=gsap.timeline({paused:true,onUpdate:draw});
tl.to(s,{mapAlpha:1,mapOpen:.12,duration:.45,ease:'power2.out'},.25)
 .to(s,{x:157,y:322,rotation:8,handAlpha:1,handRX:232,handRY:310,eyeX:18,duration:.55,ease:'power3.out'},.65)
 .to(s,{mapOpen:.42,handRX:303,handRY:306,scaleX:.78,scaleY:.62,tug:.65,duration:.85,ease:'power3.inOut'},1.22)
 .to(s,{mapOpen:1,handRX:422,handRY:305,x:188,rotation:-8,scaleX:.94,scaleY:.55,tug:1,duration:1.05,ease:'power4.inOut'},2.12)
 .to(s,{x:215,y:207,rotation:6,scaleX:.78,scaleY:.82,tug:0,handAlpha:0,eyeX:15,eyeY:15,mapTilt:-.02,duration:.62,ease:'back.out(1.8)'},3.22)
 .to(s,{starsPlaced:2,mapOrbit:1.2,eyeX:-12,duration:.6,ease:'power2.out'},3.92)
 .to(s,{starsPlaced:4,mapOrbit:2.5,eyeX:12,rotation:-5,duration:.62,ease:'power2.out'},4.58)
 .to(s,{starsPlaced:7,mapOrbit:4.2,eyeX:0,rotation:5,duration:.78,ease:'power3.out'},5.26)
 .to(s,{lensAlpha:1,lensScale:1,lensX:316,lensY:294,lensRot:-.55,handAlpha:1,handRX:351,handRY:333,x:189,y:206,eyeX:16,eyeY:14,duration:.5,ease:'back.out(1.9)'},6.18)
 .to(s,{lensX:226,lensY:315,lensRot:.35,eyeX:-13,mapOrbit:5.4,duration:.75,ease:'sine.inOut'},6.75)
 .to(s,{lensX:352,lensY:276,lensRot:-.3,eyeX:17,lensPulse:1,mapOrbit:6.8,duration:.82,ease:'sine.inOut'},7.55)
 .to(s,{lensAlpha:0,handAlpha:0,x:256,y:185,rotation:0,scaleX:.88,scaleY:.88,smile:1,sparkle:1,mapTilt:.015,duration:.55,ease:'back.out(2)'},8.45)
 .to(s,{y:167,rotation:-6,duration:.32,ease:'sine.inOut'},9.08)
 .to(s,{y:183,rotation:5,duration:.32,ease:'sine.inOut'},9.4)
 .to(s,{smile:0,wink:.92,rotation:0,duration:.16,ease:'power3.in'},9.82)
 .to(s,{wink:0,sparkle:.22,mapAlpha:.92,mapOpen:.96,duration:.42,ease:'back.out(1.5)'},9.98)
 .to(s,{sparkle:0,y:185,scaleX:.86,scaleY:.86,duration:.78,ease:'sine.out'},10.66);

return {timeline:tl,draw};
}
