/* Original review implementation, informed by motion principles, not Aora source. */
(function(G){
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const TAU=Math.PI*2,lerp=(a,b,u)=>a+(b-a)*u;
const Source=G.QSource,Motion=Source.require('/components/xingcheng-q-motion/core'),Appearance=Source.require('/components/xingcheng-q-motion/appearance'),contour=Source.require('/components/xingcheng-q-motion/eye-contour');
const originalFace=Motion.drawFace;
const profile={eyeWidth:27.5,eyeRawHeight:57.5,eyeHalfGap:34,eyeY:-14};
function easing(name,t){
 const x=clamp(t);if(!name||name==='none'||name==='linear')return x;if(x===0||x===1)return x;
 const m=/^([a-z]+)(\d*)\.(inOut|in|out)(?:\(([^)]+)\))?$/.exec(name);if(!m)return x;
 const family=m[1],direction=m[3],back=Number(m[4])||1.70158;
 const bounce=u=>{const n=7.5625,d=2.75;if(u<1/d)return n*u*u;if(u<2/d){u-=1.5/d;return n*u*u+.75;}if(u<2.5/d){u-=2.25/d;return n*u*u+.9375;}u-=2.625/d;return n*u*u+.984375;};
 const incoming=u=>{if(family==='power')return u**(Number(m[2]||1)+1);if(family==='sine')return 1-Math.cos(u*Math.PI/2);if(family==='expo')return u===0?0:2**(10*u-10);if(family==='circ')return 1-Math.sqrt(Math.max(0,1-u*u));if(family==='back')return(back+1)*u**3-back*u*u;if(family==='bounce')return 1-bounce(1-u);return u;};
 if(direction==='in')return incoming(x);if(direction==='out')return 1-incoming(1-x);return x<.5?incoming(x*2)/2:1-incoming((1-x)*2)/2;
}
function drawFace(c,s,scale=1,family='home',options){
 if(!c._qCandidate)return originalFace(c,s,scale,family,options);
 const gap=profile.eyeHalfGap*(1-.62*clamp(s.eyeCross||0)),unit=Appearance.unit(family)*scale,smile=clamp(s.smile||0),gazeX=clamp(s.eyeX||0,-34,34),gazeY=clamp(s.eyeY||0,-23,25);
 const yaw=gazeX/148,pitch=gazeY/190,points=contour(smile,options),depthZ=Math.sqrt(1-(gap/126)**2);
 const sx=Math.max(.4,Math.abs(s.scaleX||1)),sy=Math.max(.4,Math.abs(s.scaleY||1));
 const leftX=-gap*Math.cos(yaw)+126*depthZ*Math.sin(yaw),maxOpen=Math.max(s.eyeOpenL??.9,s.eyeOpenR??.9),projectedY=profile.eyeY+126*depthZ*Math.sin(pitch);
 // The brand star owns the upper-left space; extreme gaze must respect it.
 const faceY=leftX<-43?Math.max(projectedY,-46+profile.eyeRawHeight*maxOpen/2/Math.pow(sy,.18)):projectedY;
 for(const side of [-1,1]){
  const raw=side<0?s.eyeOpenL:s.eyeOpenR;
  const open=Math.max(.065,(raw??.9)*(side<0?1-(s.wink||0):1));
  const x=side*gap*Math.cos(yaw)+126*depthZ*Math.sin(yaw)+side*3*smile;
  const y=faceY;
  const localSmile=clamp(smile+(side<0?(s.smileL||0):(s.smileR||0))),localPoints=localSmile===smile?points:contour(localSmile,options);
  const width=(1-smile)*profile.eyeWidth/24+smile*1.055;
  const height=(1-smile)*profile.eyeRawHeight/60+smile;
  c.save();c.translate(x*unit,y*unit);
  c.rotate(((s.eyeTilt||0)+(side<0?(s.eyeTiltL||0):(s.eyeTiltR||0))+side*(s.curiosity||0)*4.2)*Math.PI/180);
  c.scale(unit*(s.eyeOptical||1)*(1-side*Math.sin(yaw)*.18)*width/Math.pow(sx,.20),unit*(s.eyeOptical||1)*open*height/Math.pow(sy,.18));
  c.globalAlpha*=s.eyeAlpha??1;c.fillStyle='#FFF8EE';c.beginPath();localPoints.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();c.fill();c.restore();
 }
}
Motion.drawFace=drawFace;
// Quintic correction starts at the displayed pose and velocity and lands with
// zero correction/velocity/acceleration, without discarding the target story.
const BRIDGE_SECONDS=.48;
const BRIDGE_KEYS=['x','y','rotation','scaleX','scaleY','eyeX','eyeY','eyeOpenL','eyeOpenR','eyeTilt','eyeTiltL','eyeTiltR','smile','wink','mouth','square','bean','eyeCross','smileL','smileR','shadowA'];
function bridge(from,velocity,target0,targetVelocity,t,target){
 if(!from||t>=BRIDGE_SECONDS)return {...target};
 const u=clamp(t/BRIDGE_SECONDS),h00=1-10*u**3+15*u**4-6*u**5,h10=u-6*u**3+8*u**4-3*u**5,out={...target};
 for(const key of BRIDGE_KEYS){
  if(!Number.isFinite(from[key])||!Number.isFinite(target0[key])||!Number.isFinite(target[key]))continue;
  let d=from[key]-target0[key];if(key==='rotation')d=((d+180)%360+360)%360-180;
  const v=(velocity?.[key]||0)-(targetVelocity?.[key]||0);out[key]+=d*h00+v*BRIDGE_SECONDS*h10;
 }
 out.eyeOpenL=clamp(out.eyeOpenL,.045,1.4);out.eyeOpenR=clamp(out.eyeOpenR,.045,1.4);if(Number.isFinite(out.scaleX))out.scaleX=clamp(out.scaleX,.09,1.75);if(Number.isFinite(out.scaleY))out.scaleY=clamp(out.scaleY,.09,1.75);return out;
}
const GESTURES={};

function makeGesture(base,id,timeline){
 const def=GESTURES[id],s={...base,...def.initial,comic:id},tl=timeline();
 for(const {at,d,ease='sine.inOut',...pose}of def.steps)tl.to(s,{...pose,duration:d,ease},at);
 tl.to(s,{x:256,y:278,rotation:0,scaleX:1,scaleY:1,eyeX:0,eyeY:0,eyeOpenL:.9,eyeOpenR:.9,eyeTilt:0,eyeTiltL:0,eyeTiltR:0,smile:0,wink:0,handAlpha:0,lift:0,square:0,bean:0,eyeCross:0,smileL:0,smileR:0,mouth:0,smallA:0,connector:0,speckA:0,puffA:0,impact:0,duration:.45,ease:'sine.out'},def.duration-.45);
 return {state:s,timeline:tl,duration:def.duration};
}
function feedback(base,phase,t){
 const s={...base},ease=x=>{x=clamp(x);return x*x*(3-2*x)},pulse=(a,b,c,d)=>ease((t-a)/(b-a))*(1-ease((t-c)/(d-c)));
 s.eyeX=0;s.eyeY=0;s.handAlpha=0;s.smile=0;s.wink=0;s.mouth=0;s.eyeOpenL=.9;s.eyeOpenR=.9;s.x=256;s.y=278;s.rotation=0;s.scaleX=1;s.scaleY=1;
 if(phase==='pending'){
  const k=1-Math.exp(-t*8);s.eyeX=-11*k;s.eyeY=9*k;s.rotation=-1.6*k;s.y+=Math.sin(t*TAU/4.6)*1.25;
  const blink=pulse(1.8,1.88,1.97,2.13);s.eyeOpenL*=1-.9*blink;s.eyeOpenR*=1-.9*blink;
 }else if(phase==='success'){
  const k=pulse(.12,.32,.85,1.3);s.smile=.8*k;s.y+=3.8*pulse(.25,.42,.55,.85);s.rotation=-1.8*k;
 }else if(phase==='failure'){
  const k=pulse(.1,.35,1.4,1.9);s.eyeX=12*k;s.eyeY=6*k;s.rotation=2.5*k;s.eyeOpenL=.9-.10*k;s.eyeOpenR=.9+.07*k;
 }else if(phase==='cancelled'){
  s.eyeOpenL=.9-.77*pulse(.1,.18,.25,.42);s.eyeOpenR=s.eyeOpenL;
 }
 return s;
}
G.QRefinement={profile,drawFace,bridge,BRIDGE_KEYS,BRIDGE_SECONDS,GESTURES,makeGesture,feedback,clamp,easing};
G.QCandidateSource=Source.fork({'/components/xingcheng-q-home/timeline.js':Source.require('/review/timeline')});
G.QCandidateSource.require('/components/xingcheng-q-motion/core').drawFace=drawFace;
})(globalThis);
