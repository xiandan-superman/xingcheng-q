// Approved timing, transition and response math. Independently authored.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),TAU=Math.PI*2;
function easing(name,t){
 const x=clamp(t);if(!name||name==='none'||name==='linear')return x;if(x===0||x===1)return x;
 const m=/^([a-z]+)(\d*)\.(inOut|in|out)(?:\(([^)]+)\))?$/.exec(name);if(!m)return x;
 const family=m[1],direction=m[3],back=Number(m[4])||1.70158;
 const bounce=u=>{const n=7.5625,d=2.75;if(u<1/d)return n*u*u;if(u<2/d){u-=1.5/d;return n*u*u+.75;}if(u<2.5/d){u-=2.25/d;return n*u*u+.9375;}u-=2.625/d;return n*u*u+.984375;};
 const incoming=u=>{if(family==='power')return u**(Number(m[2]||1)+1);if(family==='sine')return 1-Math.cos(u*Math.PI/2);if(family==='expo')return u===0?0:2**(10*u-10);if(family==='circ')return 1-Math.sqrt(Math.max(0,1-u*u));if(family==='back')return(back+1)*u**3-back*u*u;if(family==='bounce')return 1-bounce(1-u);return u;};
 if(direction==='in')return incoming(x);if(direction==='out')return 1-incoming(1-x);return x<.5?incoming(x*2)/2:1-incoming((1-x)*2)/2;
}// Quintic correction starts at the displayed pose and velocity and lands with
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
 // Long-lived feedback stays attentive after its authored opening. The
 // envelope starts with zero slope and never touches full-story choreography.
 if((phase==='pending'||phase==='failure')&&t>2.4){
  const enter=ease((t-2.4)/.8),cycle=(t-2.4)%6.8;
  const glance=ease((cycle-.8)/.6)*(1-ease((cycle-2.6)/.8));
  const blink=ease((cycle-4.1)/.08)*(1-ease((cycle-4.26)/.16));
  const weight=phase==='failure'?.55:1;
  s.eyeX+=enter*weight*4*glance;s.eyeY-=enter*weight*2*glance;
  s.eyeOpenL*=1-.9*enter*blink;s.eyeOpenR*=1-.9*enter*blink;
 }
 return s;
}
module.exports={bridge,BRIDGE_KEYS,BRIDGE_SECONDS,GESTURES,makeGesture,feedback,clamp,easing};
require('./comics')(module.exports);
