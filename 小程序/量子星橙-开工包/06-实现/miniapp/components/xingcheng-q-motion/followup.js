const Appearance=require('./appearance');
// Approved full-story performances, integrated with bounded runtime state.
const Motion=require('./core');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2,RATE=240;
const smooth=(a,b,t)=>{const u=clamp((t-a)/(b-a));return u*u*(3-2*u);};
const windowAt=(t,a,b,c,d)=>smooth(a,b,t)*(1-smooth(c,d,t));
const DURATIONS={loading:6.4,capture:11.2,calibrate:12.4,recharge:14.2};
const GROUPS=[
 {keys:['x','y','rotation','scaleX','scaleY'],hz:9.2,damping:.69,lead:.024},
 {keys:['eyeX','eyeY','eyeOpenL','eyeOpenR','eyeTilt','smile','wink'],hz:14,damping:.82,lead:.075},
 {keys:['handLX','handLY','handRX','handRY'],hz:8.8,damping:.69,lead:.01},
 {keys:['resultX','resultY','resultScale','beadX','beadY','beadScale'],hz:12,damping:.86,lead:.012},
 {keys:['bean','pebble','cloud','drop'],hz:8,damping:.74,lead:.012},
 {keys:['moonY','moonScale','moonRotation'],hz:5.5,damping:.71,lead:0},
];
// Periodic seed derived from three canonical loading cycles at 240 Hz.
// Store only spring positions/velocities: no startup warmup or frame cache.
const LOADING_SEED={"x":{"x":256,"v":0},"y":{"x":272,"v":0},"rotation":{"x":0,"v":0},"scaleX":{"x":0.9999962607017665,"v":-0.00032959515429514276},"scaleY":{"x":1.0000037392982335,"v":0.00032959515429469336},"eyeX":{"x":0.08509315877199616,"v":2.5928426150002553},"eyeY":{"x":-0.019635190034893436,"v":-0.598549763967903},"eyeOpenL":{"x":0.9499999999999998,"v":5.954897435624494e-15},"eyeOpenR":{"x":0.9499999999999998,"v":5.954897435624494e-15},"eyeTilt":{"x":0,"v":0},"smile":{"x":0,"v":0},"wink":{"x":0,"v":0},"bean":{"x":0.12,"v":0}};
function loadingLocalTime(time){const t=Math.max(0,time),local=t%6.4;return t>0&&local<1e-9?6.4:local;}
function createMotion(raw,scene){
 const duration=DURATIONS[scene],cyclic=scene==='loading',period=duration,lastIndex=Math.round(period*RATE);
 if(!duration)throw new Error('Unknown follow-up performance');
 const at=time=>{
  const t=cyclic?((time%period)+period)%period:clamp(time,0,period),s=raw.sample(t);
  if(cyclic){s.scaleX=s.sx;s.scaleY=s.sy;s.rotation=s.rot*180/Math.PI;s.eyeOpenL=s.eyeL;s.eyeOpenR=s.eyeR;s.eyeTilt=0;s.smile=0;s.wink=0;}
  if(scene==='capture'){
   const weight=.62*clamp(s.resultAlpha||0);
   s.eyeX=mix(s.eyeX,clamp((s.resultX-s.x)*.11,-19,19),weight);
   s.eyeY=mix(s.eyeY,clamp((s.resultY-s.y)*.10,-18,16),weight);
  }
  if(scene==='recharge')s.eyeOpenR+=.11*windowAt(t,5.65,5.98,6.30,6.65);
  return s;
 };
 const initial=at(0),groups=GROUPS.map(g=>Object.assign({},g,{keys:g.keys.filter(k=>typeof initial[k]==='number')})).filter(g=>g.keys.length);
 let springs,index,previous,current;
 function integrate(to){
  while(index<to){
   index++;previous=current;current={};
   for(const g of groups){
    const target=at(index/RATE+g.lead),w=TAU*g.hz;
    for(const key of g.keys){const p=springs[key];p.v+=(w*w*(target[key]-p.x)-2*g.damping*w*p.v)/RATE;p.x+=p.v/RATE;current[key]=p.x;}
   }
  }
 }
 function reset(){
  springs={};previous=null;current={};index=0;
  if(cyclic){
   for(const key of Object.keys(LOADING_SEED)){springs[key]=Object.assign({},LOADING_SEED[key]);current[key]=springs[key].x;}
   return;
  }
  for(const g of groups)for(const key of g.keys){springs[key]={x:initial[key],v:0};current[key]=initial[key];}
 }
 reset();
 return {duration,sample(elapsed,mode='normal'){
  const dynamic=!Motion.isStill(mode),total=Math.max(0,elapsed),t=dynamic?(cyclic?total%period:clamp(total,0,period)):period;
  const s=raw.sample(cyclic?loadingLocalTime(dynamic?total:period):t);
  if(cyclic){s.scaleX=s.sx;s.scaleY=s.sy;s.rotation=s.rot*180/Math.PI;s.eyeOpenL=s.eyeL;s.eyeOpenR=s.eyeR;s.eyeTilt=0;s.smile=0;s.wink=0;}
  if(dynamic){
   const cursor=t*RATE,i=Math.min(Math.floor(cursor),lastIndex),next=Math.min(i+1,lastIndex);
   if(next<index)reset();integrate(next);
   const a=i===index?current:previous,u=cursor-i;
   for(const key of Object.keys(a))s[key]=mix(a[key],current[key],u);
  }
  s.eyeOpenL=clamp(typeof s.eyeOpenL==='number'?s.eyeOpenL:.95,.045,1.4);
  s.eyeOpenR=clamp(typeof s.eyeOpenR==='number'?s.eyeOpenR:.95,.045,1.4);
  s.smile=clamp(s.smile||0);s.wink=clamp(s.wink||0);s.eyeDepth=clamp((s.eyeX||0)/40,-.7,.7);
  s.eyeOptical=1;s.starOptical=1;s.motionPolished=true;s.followupScene=scene;s.followupTime=t;s.contact=0;s.contactAge=0;
  if(scene==='capture'){
   s.curiosity=clamp(s.confusion||0);s.eyeWide=.10*clamp(s.realization||0);
   if(dynamic){const u=t-6.31,impulse=u>=0?Math.sin(u*23)*Math.exp(-7*u)*smooth(0,.05,u):0;s.scaleX+=.018*impulse;s.scaleY-=.018*impulse;s.handLY+=2.6*impulse;s.handRY+=2.6*impulse;}
  }
  if(scene==='recharge'&&dynamic){
   const u=t-1.44,seat=u>=0?Math.sin(u*18)*Math.exp(-4.8*u)*windowAt(u,0,.06,1.35,1.7):0;
   s.moonRotation+=.028*seat;s.moonY+=2.8*seat;
   const rest=windowAt(t,2.3,2.8,5.2,5.7)+windowAt(t,9.9,10.2,13.6,14.2),breath=Math.sin(TAU*(t-2.35)/3.6)*rest;
   s.y+=2.2*breath;s.scaleX*=1+.006*breath;s.scaleY*=1-.008*breath;s.moonRotation+=.004*breath;
  }
  if(cyclic){
   if(dynamic){const theta=TAU*total/period;s.quantumTurn=theta;s.scanTurn=theta;s.rotation+=.8*Math.sin(theta);s.y+=1.6*Math.sin(theta*2);}
   s.starTurn=0;s.rot=s.rotation*Math.PI/180;s.sx=s.scaleX;s.sy=s.scaleY;s.eyeL=s.eyeOpenL;s.eyeR=s.eyeOpenR;
  }
  return s;
 }};
}

function cloneWorkers(s){
 const t=s.followupTime,positions=[[-110,-36,-.12],[0,-105,.08],[112,-24,-.08]];
 return positions.map((p,n)=>{
  const outward=smooth(3.02+n*.05,3.48+n*.05,t);
  const returning=1-smooth(7.02+n*.11,7.68+n*.11,t);
  const k=outward*returning,work=windowAt(t,3.62,3.9,6.92,7.15);
  const beat=s.cloneBeat+n*TAU/3,sc=(.42+.04*Math.sin(s.cloneBeat+n))*(.72+.28*k);
  return {index:n,k,scale:sc,alpha:smooth(.14,.58,k),rotation:p[2]*180/Math.PI+1.8*Math.sin(beat)*work,
   x:s.x+p[0]*k+2.5*Math.sin(beat)*work,
   y:s.y+p[1]*k+3*Math.cos(beat)*work,
   handX:(n-1)*22,handY:43*sc+3*Math.max(0,Math.sin(beat))*work};
 });
}

function drawCloneWorkers(ctx,s,orb,hand){
 for(const worker of cloneWorkers(s)){
  if(worker.alpha<.002)continue;
  const n=worker.index,eyeX=n===0?10:n===2?-10:0;
  const cs={...s,scaleX:1,scaleY:1,bean:.25,stamp:0,eyeX,eyeY:6,
   eyeDepth:clamp(eyeX/40,-.7,.7),eyeOpenL:.9,eyeOpenR:.9,wink:0,smile:smooth(.68,.92,s.repair)};
  orb(ctx,cs,worker.x,worker.y,worker.scale,worker.alpha,worker.rotation);
  hand(ctx,worker.x+worker.handX,worker.y+worker.handY,worker.alpha,.65);
 }
}

function loadingStarPoints(s){return Appearance.starPoints(s,'system');}
function drawLoadingStar(ctx,s){Appearance.drawBrandStar(ctx,s,'system');}
function drawLoadingFace(ctx,s){
 Motion.drawFace(ctx,{...s,eyeOpenL:s.eyeL,eyeOpenR:s.eyeR,eyeAlpha:1},1,'system');
}


module.exports={createMotion,loadingLocalTime,cloneWorkers,drawCloneWorkers,loadingStarPoints,drawLoadingStar,drawLoadingFace};
