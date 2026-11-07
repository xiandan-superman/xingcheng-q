const Appearance=require('./appearance');
const eyeContour=require('./eye-contour');
// Locally authored motion, matching the approved full-story comparison.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const TAU=Math.PI*2;
const DURATIONS={idle:8.2,thinking:11.8,complete:11.6};
// Deepest contact on the approved 240 Hz completion trajectory (frame 977).
const SEAL_IMPACT=977/240;
const GROUPS=[
 {keys:['x','y','rotation','scaleX','scaleY'],hz:8.5,damping:.66,lead:.024},
 {keys:['eyeX','eyeY','eyeOpenL','eyeOpenR','eyeTilt','smile','wink'],hz:14,damping:.82,lead:.075},
 {keys:['handLX','handLY','handRX','handRY'],hz:7.5,damping:.62,lead:.012},
 {keys:['thoughtX','thoughtY','thoughtScale','mapScale'],hz:8,damping:.64,lead:.018},
];

// Integrate only as playback advances. Retain two poses rather than a full
// animation cache; fixed steps keep replay and seek identical to the sample.
function createMotion(raw,scene){
 const duration=DURATIONS[scene],rate=240,dt=1/rate,lastIndex=Math.ceil(duration*rate);
 let springs,index,previous,current;
 function reset(){
  const initial=raw.sample(0);springs={};current={};index=0;previous=null;
  for(const group of GROUPS)for(const key of group.keys)if(typeof initial[key]==='number'){
   springs[key]={x:initial[key],v:0};current[key]=initial[key];
  }
 }
 function advance(to){
  if(to<index)reset();
  while(index<to){
   index++;previous=current;current={};const t=Math.min(index/rate,duration);
   for(const group of GROUPS){
    const target=raw.sample(Math.min(duration,t+group.lead)),omega=TAU*group.hz;
    for(const key of group.keys){
     const spring=springs[key];if(!spring||typeof target[key]!=='number')continue;
     spring.v+=(omega*omega*(target[key]-spring.x)-2*group.damping*omega*spring.v)*dt;
     spring.x+=spring.v*dt;current[key]=spring.x;
    }
   }
  }
 }
 reset();
 return {duration,impact:scene==='complete'?SEAL_IMPACT:4.04,sample(elapsed,mode='normal'){
  const still=mode==='still'||mode==='reduced',t=still?duration:clamp(elapsed,0,duration);
  const state=raw.sample(t);
  if(!still){
   const cursor=t*rate,i=Math.min(Math.floor(cursor),lastIndex),next=Math.min(i+1,lastIndex);
   advance(next);
   const a=i===index?current:previous,u=cursor-i;
   for(const key of Object.keys(a))state[key]=mix(a[key],current[key],u);
  }
  state.eyeOpenL=clamp(typeof state.eyeOpenL==='number'?state.eyeOpenL:.9,.045,1.4);
  state.eyeOpenR=clamp(typeof state.eyeOpenR==='number'?state.eyeOpenR:.9,.045,1.4);
  state.smile=clamp(state.smile||0);state.wink=clamp(state.wink||0);
  state.eyeOptical=1;state.starOptical=1;state.motionPolished=true;
  state.eyeDepth=clamp((state.eyeX||0)/40,-.7,.7);
  if(scene==='thinking'){
   const doubt=clamp(state.confusion||0);state.eyeOpenL*=1-.16*doubt;state.eyeOpenR*=1+.07*doubt;
   state.curiosity=doubt;state.eyeWide=clamp(state.realization||0)*.12;
  }
  state.contact=0;state.contactAge=0;
  if(scene==='complete'&&!still){
   const u=t-SEAL_IMPACT;if(u>=0&&u<1.15){
    state.contact=Math.exp(-3.2*u);state.contactAge=u;
    const recoil=Math.sin(u*25)*Math.exp(-7*u);state.scaleX+=.045*recoil;state.scaleY-=.045*recoil;
   }
  }
  return state;
 }};
}

function isStill(motion){return motion==='still'||motion==='reduced';}

// Follow the planned cadence rather than restarting the interval at each
// draw. Date.now() rounding can otherwise discard slightly early 60 Hz RAFs.
// Two milliseconds of tolerance absorbs jitter; 120/144 Hz remain capped.
function createFramePacer(frameMs){
 let nextAt=null;
 return function(now,force){
  if(!force&&nextAt!==null&&now+2+1e-6<nextAt)return false;
  nextAt=nextAt===null||now-nextAt>=frameMs?now+frameMs:nextAt+frameMs;
  return true;
 };
}
const drawFace=require('./face');

function drawContact(ctx,s){
 if(s.contact<.004)return;const u=s.contactAge;
 ctx.save();ctx.translate(256,321);ctx.scale(1,.43);
 for(let i=0;i<2;i++){
  const radius=36+u*172-i*20;if(radius<25)continue;
  ctx.globalAlpha=clamp(s.contact*(i ? .42 : .65));ctx.lineWidth=i?2.8:4;
  ctx.strokeStyle=i?'#FFC857':'#35C7D8';ctx.beginPath();ctx.arc(0,0,radius,0,TAU);ctx.stroke();
 }
 ctx.restore();
}

// Put the identity mark on the same deforming surface as the body. It does not
// float, turn independently, or get cut by the stamp/pebble silhouette.
function brandStarPoints(s,family){return Appearance.starPoints(s,family);}
function drawBrandStar(ctx,s,family){Appearance.drawBrandStar(ctx,s,family);}

module.exports={createMotion,isStill,createFramePacer,drawFace,drawContact,brandStarPoints,drawBrandStar};
