const Appearance=require('./appearance')
const Motion=require('./core')
const acceptedFace=Motion.drawFace
const {drawExpressionFace,eyeContour}=require('./expressions')
const {cloneWorkers,drawCloneWorkers:acceptedWorkers,drawLoadingFace:acceptedLoadingFace}=require('./followup')
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v))
const TAU=Math.PI*2,mix=(a,b,t)=>a+(b-a)*t
const ease=(a,b,t)=>{const u=clamp((t-a)/(b-a));return u*u*(3-2*u)}
const beat=(t,a,b,c,d)=>ease(a,b,t)*(1-ease(c,d,t))
const SCENES={curiosity:{duration:10.8},waiting:{duration:12.8,period:6.4},regroup:{duration:12.4},restful:{duration:14.2},proud:{duration:11.6}}
function curiosityBase(base,elapsed,mode='normal'){
 const t=!Motion.isStill(mode)?clamp(elapsed,0,10.8):10.8,s={...base};
 const approach=beat(t,2.1,4.65,7.55,10.15),reach=beat(t,4.55,5.25,7.15,8.25);
 const enter=ease(.9,1.55,t),leave=1-ease(9.1,9.9,t);
 const travel=ease(1.5,5.8,t),retreat=ease(6.7,8.95,t);
 s.x=232+25*approach;s.y=316-7*approach+1.4*Math.sin(TAU*t/5.4);
 s.rotation=-5*beat(t,2.65,3.6,5.2,6.15)+3*beat(t,6.6,7.25,8.15,9.25);
 s.scaleX=1+.018*approach;s.scaleY=1-.012*approach;s.pebble=.12;
 s.signalAlpha=enter*leave;s.signalScale=.85+.15*ease(1,1.8,t);
 s.signalX=mix(438,365,travel)+61*retreat;
 s.signalY=mix(145,236,travel)-89*retreat-12*Math.sin(Math.PI*travel);
 s.signalRotation=.18*Math.sin(t*1.1);
 s.handAlpha=reach;s.handLX=-98;s.handLY=22;s.handRX=111+5*reach;s.handRY=mix(25,-50,reach);
 s.eyeX=0;s.eyeY=0;s.eyeOpenL=.94;s.eyeOpenR=.94;s.smile=0;s.wink=0;
 s.motionPolished=true;s.eyeOptical=1;s.starOptical=1;s.eyeDepth=0;
 return s;
}

function emotionPose(source,name,elapsed,mode='normal'){
 const config=SCENES[name],dynamic=!Motion.isStill(mode),total=Math.max(0,elapsed);
 const t=dynamic?(config.period?total%config.period:clamp(total,0,config.duration)):config.duration;
 const s={...source,nextExpression:name,expressionTime:t,faceFocus:0,faceDoubt:0,faceWide:0,faceCurious:0,faceSoft:0,faceProud:0,faceSleep:0};
 if(name==='curiosity'){
  const notice=beat(t,1.12,1.72,8.35,9.65),peek=beat(t,2.35,3.18,4.7,5.6);
  const returnLook=ease(8.25,9.3,t);
  s.faceCurious=peek;s.faceWide=.55*beat(t,1.16,1.53,1.92,2.6);
  const gaze=notice*(1-returnLook);
  s.eyeX=mix(0,clamp((s.signalX-s.x)*.115,-19,19),gaze);
  s.eyeY=mix(0,clamp((s.signalY-s.y)*.1,-18,14),gaze);
  const blink=1-.9*beat(t,4.08,4.18,4.27,4.46);
  s.eyeOpenL=(.94+.17*peek)*blink;s.eyeOpenR=(.94-.15*peek)*blink;
  s.smile=.35*beat(t,6.1,6.85,8.8,10.1);s.faceSoft=.25*ease(8,9.4,t);
 }else if(name==='waiting'){
  const u=dynamic?t:0,theta=TAU*u/6.4,follow=beat(u,.35,1.12,4.5,5.45);
  s.eyeX=mix(source.eyeX,12*Math.cos(theta-.4),follow*.5);
  s.eyeY=mix(source.eyeY,-3+9*Math.sin(theta-.4),follow*.5);
  // No instant per-eye swap: each blink closes and opens on its own envelope.
  const left=1-.88*beat(u,2.69,2.81,2.93,3.16),right=1-.88*beat(u,2.75,2.87,2.99,3.22);
  const greeting=1-.72*beat(u,5.32,5.43,5.5,5.72);
  s.eyeOpenL=source.eyeOpenL*left*greeting;s.eyeOpenR=source.eyeOpenR*right*greeting;
  s.faceSoft=.18;s.smile=0;s.wink=0;
  s.eyeL=s.eyeOpenL;s.eyeR=s.eyeOpenR;
 }else if(name==='regroup'){
  const setback=beat(t,.95,1.5,2.3,2.92),work=beat(t,2.6,3.2,6.8,7.4);
  s.faceDoubt=.35*setback;s.faceSoft=.35*setback;s.faceFocus=.55*work;
  s.eyeY=mix(s.eyeY,12,setback*.55);s.eyeOpenL*=1-.18*setback;s.eyeOpenR*=1-.08*setback;
  const relax=ease(7.0,7.8,t),back=beat(t,7.45,7.92,8.45,8.95);
  s.eyeX=mix(s.eyeX,0,back*.8);s.eyeY=mix(s.eyeY,1,back*.7);
  s.faceProud=.18*relax;s.smile=Math.max(s.smile,.28*beat(t,7.45,8.05,9.3,10.2));
 }else if(name==='restful'){
  const heavy=beat(t,2.6,3.75,6.45,6.96),wake=beat(t,5.67,6.17,6.58,7.02),settle=ease(10.1,11.65,t);
  s.faceSleep=clamp(.75*heavy+.9*settle);s.faceSoft=.48*(heavy+settle);
  s.eyeOpenL=mix(s.eyeOpenL,.12,heavy*.7);
  s.eyeOpenR=mix(s.eyeOpenR,.16,heavy*.55)+.44*wake;
  const track=beat(t,6.58,7.02,8.02,8.4)*clamp(source.beadAlpha);
  s.eyeX=mix(s.eyeX,clamp((source.beadX-source.x)*.14,-18,18),track*.8);
  s.eyeY=mix(s.eyeY,clamp((source.beadY-source.y)*.13,-17,14),track*.8);
  s.faceCurious=.35*wake;s.faceWide=.35*beat(t,6.87,7.12,7.5,7.87);
  s.eyeOpenL=mix(s.eyeOpenL,.11,settle*.94);s.eyeOpenR=mix(s.eyeOpenR,.12,settle*.94);
  s.eyeX=mix(s.eyeX,0,settle);s.eyeY=mix(s.eyeY,5,settle);s.smile=Math.max(s.smile,.18*settle);
 }else if(name==='proud'){
  const surprise=beat(t,4.32,4.63,5.22,5.66),confirm=beat(t,5.1,5.53,6.22,6.58);
  const share=ease(6.48,7.15,t),satisfied=ease(8.85,9.7,t);
  s.faceWide=.8*surprise;s.eyeOpenL*=1+.1*surprise;s.eyeOpenR*=1+.1*surprise;
  s.eyeX=mix(s.eyeX,1,share*.88);s.eyeY=mix(s.eyeY,18,confirm*.65);s.eyeY=mix(s.eyeY,-1,share*.9);
  s.faceProud=.5*satisfied;s.faceSoft=.2*share;
  s.smile=Math.max(s.smile,.44*satisfied);
 }
 s.eyeOpenL=clamp(s.eyeOpenL,.045,1.4);s.eyeOpenR=clamp(s.eyeOpenR,.045,1.4);
 s.eyeDepth=clamp((s.eyeX||0)/40,-.7,.7);
 return s;
}

function drawFace(ctx,s,scale=1,family='home'){
 if(!s.nextExpression){if(s.expressionScene)drawExpressionFace(ctx,s,scale,family);else acceptedFace(ctx,s,scale,family);return;}
 const unit=Appearance.unit(family);
 const smile=clamp(s.smile||0),focus=s.faceFocus||0,doubt=s.faceDoubt||0,wide=s.faceWide||0,curious=s.faceCurious||0,soft=s.faceSoft||0,proud=s.faceProud||0;
 for(const[x,rawOpen,side]of[[-Appearance.BASE.eyeHalfGap,s.eyeOpenL,-1],[Appearance.BASE.eyeHalfGap,s.eyeOpenR,1]]){
  const open=Math.max(.045,(rawOpen??.94)*(side<0?1-(s.wink||0):1));
  const points=eyeContour(clamp(smile+.08*proud),focus,doubt,wide,side);
  ctx.save();ctx.translate((x+(s.eyeX||0)+side*2.8*smile)*unit*scale,(Appearance.BASE.eyeY+(s.eyeY||0)+side*(1.5*curious+1.2*doubt))*unit*scale);
  ctx.rotate(((s.eyeTilt||0)+side*(2.8*curious+1.8*doubt)-2*soft)*Math.PI/180);
  ctx.scale(unit*scale*(s.eyeOptical||1)*(1+.14*wide-side*.07*curious)*(1-side*(s.eyeDepth||0)*.065),unit*scale*open*(1+.08*wide));
  ctx.globalAlpha*=s.eyeAlpha??1;ctx.fillStyle='#FFF8EE';ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();ctx.restore();
 }
}
function drawLoadingFace(ctx,s){
 if(!s.nextExpression){acceptedLoadingFace(ctx,s);return;}
 drawFace(ctx,{...s,eyeOpenL:s.eyeL,eyeOpenR:s.eyeR,eyeOptical:1,eyeAlpha:1},1,'system');
}
function expressionWorkers(s){
 return cloneWorkers(s).map(worker=>{
  const n=worker.index,work=beat(s.followupTime,3.62,3.96,6.92,7.15),phase=s.cloneBeat+n*TAU/3;
  const target=[[119,246],[239,214],[369,215]][n];
  const targetX=clamp((target[0]-worker.x)*.15,-13,13),targetY=clamp((target[1]-worker.y)*.14,-14,10);
  const cs={...s,scaleX:1,scaleY:1,bean:.25,stamp:0,wink:0,eyeX:targetX,eyeY:targetY,eyeOpenL:.89,eyeOpenR:.89,smile:ease(.68,.92,s.repair),faceDoubt:0,faceFocus:.52*work,faceCurious:0,faceWide:0,faceProud:.2*ease(.8,1,s.repair),faceSoft:.1};
  const blink=1-.78*beat(s.followupTime,4.35+n*.25,4.44+n*.25,4.52+n*.25,4.68+n*.25);
  cs.eyeOpenL*=blink;cs.eyeOpenR*=blink;cs.eyeY+=1.8*Math.sin(phase)*work;cs.eyeDepth=clamp(cs.eyeX/40,-.7,.7);
  return {...worker,state:cs};
 });
}
function drawWorkers(ctx,s,orb,hand){
 if(s.nextExpression!=='regroup'){acceptedWorkers(ctx,s,orb,hand);return;}
 for(const worker of expressionWorkers(s)){
  if(worker.alpha<.002)continue;
  orb(ctx,worker.state,worker.x,worker.y,worker.scale,worker.alpha,worker.rotation);
  hand(ctx,worker.x+worker.handX,worker.y+worker.handY,worker.alpha,.65);
 }
}

module.exports={SCENES,curiosityBase,emotionPose,drawFace,drawLoadingFace,expressionWorkers,drawWorkers}
