const Appearance=require('./appearance')
const Motion=require('./core')
const roundedEyeContour=require('./eye-contour')
const acceptedFace=Motion.drawFace
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v))
const TAU=Math.PI*2,lerp=(a,b,t)=>a+(b-a)*t
const ease=(a,b,t)=>{const u=clamp((t-a)/(b-a));return u*u*(3-2*u)}
const beat=(t,a,b,c,d)=>ease(a,b,t)*(1-ease(c,d,t))
const SCENES={focus:{duration:9.6},insight:{duration:11.8},approval:{duration:11.2}}
function focusBase(base,t){
 const phase=TAU*t/4.8;
 return {...base,x:256,y:302+1.7*Math.sin(phase),scaleX:1+.005*Math.sin(phase),scaleY:1-.007*Math.sin(phase),rotation:.45*Math.sin(phase/2),eyeX:0,eyeY:0,eyeOpenL:.9,eyeOpenR:.9,smile:0,wink:0,handAlpha:0,motionPolished:true,eyeOptical:1,starOptical:1,eyeDepth:0};
}

function expressionPose(source,scene,elapsed,mode='normal'){
 const s={...source},dynamic=!Motion.isStill(mode),t=dynamic?clamp(elapsed,0,SCENES[scene].duration):SCENES[scene].duration;
 s.expressionScene=scene;s.expressionTime=t;
 s.focusWeight=0;s.doubtWeight=0;s.insightWeight=0;s.recognitionWeight=0;
 if(scene==='focus'){
  const read=beat(t,.3,1.25,6.2,7.4),leftToRight=ease(1.7,3.8,t);
  s.focusWeight=.82*read;
  s.eyeX=lerp(-7,7,leftToRight)*read;s.eyeY=12*read;
  const blink=1-.9*beat(t,4.65,4.74,4.81,4.99),hello=1-.83*beat(t,7.42,7.51,7.59,7.79);
  s.eyeOpenL*=blink*hello;s.eyeOpenR*=blink*hello;
 }else if(scene==='insight'){
  s.doubtWeight=beat(t,2.08,2.62,4.3,5.2);
  s.focusWeight=.72*beat(t,4.5,4.95,6.1,6.55);
  s.insightWeight=beat(t,6.32,6.54,6.82,7.16);
 }else{
  s.doubtWeight=.72*beat(t,3.36,3.72,4.05,4.5);
  s.insightWeight=.8*beat(t,5.43,5.65,5.92,6.16);
  const acknowledge=beat(t,7.65,8.02,8.86,9.18);
  s.recognitionWeight=acknowledge;
  s.eyeX=lerp(s.eyeX,0,acknowledge*.9);s.eyeY=lerp(s.eyeY,1,acknowledge*.9);
  // One deliberate nod after the real result, independent of the chase.
  const nod=dynamic?beat(t,8.02,8.23,8.34,8.66):0;
  s.y+=2.8*nod;s.rotation+=1.3*nod;
 }
 return s;
}

// Authored eye geometry in the incumbent proportions. All states share one
// closed outline, so the eye never crossfades between disconnected drawings.
function eyeContour(smile,focus,doubt,insight,side){
 const points=roundedEyeContour(smile);
 return points.map(([x,y])=>{
  const nx=x/12;
  let py=lerp(y,y*.66+3,focus*(1-smile));
  py+=side*doubt*nx*3.8*(1-smile);
  return [x*(1-.09*focus+.06*insight),py];
 });
}

function drawExpressionFace(ctx,s,scale=1,family='home'){
 if(!s.expressionScene){acceptedFace(ctx,s,scale,family);return;}
 const unit=Appearance.unit(family);
 const smile=clamp(s.smile||0),focus=s.focusWeight,doubt=s.doubtWeight,insight=s.insightWeight,recognition=s.recognitionWeight;
 for(const [x,rawOpen,side]of[[-Appearance.BASE.eyeHalfGap,s.eyeOpenL,-1],[Appearance.BASE.eyeHalfGap,s.eyeOpenR,1]]){
  const asymmetric=1+side*doubt*.14,open=Math.max(.045,(rawOpen??.9)*(side<0?1-(s.wink||0):1))*asymmetric;
  const eyeSmile=clamp(smile+recognition*.12),points=eyeContour(eyeSmile,focus,doubt,insight,side);
  ctx.save();ctx.translate((x+(s.eyeX||0)+side*3*eyeSmile-side*1.8*focus)*unit*scale,(Appearance.BASE.eyeY+(s.eyeY||0)+side*doubt*2.2)*unit*scale);
  ctx.rotate(((s.eyeTilt||0)+side*(s.curiosity||0)*5+doubt*(side<0?-5:2))*Math.PI/180);
  ctx.scale(unit*scale*(s.eyeOptical||1)*(1-side*(s.eyeDepth||0)*.065),unit*scale*open*(1+.09*insight));
  ctx.globalAlpha*=s.eyeAlpha??1;ctx.fillStyle='#FFF8EE';ctx.beginPath();
  points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();ctx.restore();
 }
}

module.exports={SCENES,focusBase,expressionPose,eyeContour,drawExpressionFace}
