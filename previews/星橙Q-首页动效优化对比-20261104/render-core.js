(function(G){
const S=G.QSource,R=G.QRefinement,Home=S.require('/components/xingcheng-q-home/core'),Sleep=S.require('/components/xingcheng-q-home/sleep'),Timeline=S.require('/components/xingcheng-q-home/timeline');
const OLD={idle:{label:'留心观察',duration:8.2},snack:{label:'零食小剧场',duration:15.8},asteroid:{label:'小行星小剧场',duration:15.8},sleep:{label:'困倦与唤醒',duration:21.5}};
const LIBRARY={...OLD,...R.GESTURES};
function velocity(a,b,dt){const out={};for(const k of R.BRIDGE_KEYS)if(Number.isFinite(a[k])&&Number.isFinite(b[k]))out[k]=(b[k]-a[k])/dt;return out;}
class Renderer{
 constructor(canvas,variant,makeCanvas){this.canvas=canvas;this.variant=variant;this.makeCanvas=makeCanvas;this.ctx=canvas.getContext('2d');this.scratch=makeCanvas(512,512);this.sctx=this.scratch.getContext('2d');this.sctx._qCandidate=variant==='candidate';const runtime=variant==='candidate'?G.QCandidateSource:S;this.Home=runtime.require('/components/xingcheng-q-home/core');this.Sleep=runtime.require('/components/xingcheng-q-home/sleep');this.Timeline=runtime.require('/components/xingcheng-q-home/timeline');this.scenes=new Map();this.name=null;this.pose=null;this.lastTime=0;this.velocity={};this.record=null;}
 scene(name){
  if(this.scenes.has(name))return this.scenes.get(name);
  let raw;
  if(name==='sleep')raw=this.Sleep.create(this.scratch);
  else if(name==='idle')raw=this.Home.createPolished(this.scratch);
  else if(OLD[name])raw=this.Home.create(this.scratch,name);
  else {raw=this.Home.create(this.scratch,'idle');const gesture=R.GESTURES[name]?R.makeGesture(this.Home.base(),name,this.Timeline.timeline):null;raw._gesture=gesture;}
  this.scenes.set(name,raw);return raw;
 }
 sample(name,t){
  const scene=this.scene(name);let raw;
  if(scene._gesture){scene._gesture.timeline.seek(t);raw=R.prepareComic(scene._gesture.state,t);}
  else if(name.startsWith('feedback:'))raw=R.feedback(Home.base(),name.split(':')[1],t);
  else{scene.timeline.seek(t);raw={...scene.state};}
  if(this.variant==='candidate')raw={square:0,bean:0,eyeCross:0,smileL:0,smileR:0,shadowA:0,...raw};return raw;
 }
 render(name,t,{cut=false,still=false}={}){
  const effective=this.variant==='baseline'&&!OLD[name]?'idle':name;
  const frozenFeedback={pending:.7,success:.5,failure:.6,cancelled:0,idle:0};
  const sampleTime=still?(effective.startsWith('feedback:')?frozenFeedback[effective.split(':')[1]]:0):(this.variant==='baseline'&&!OLD[name]?t%8.2:t);
  const changed=this.name!==effective||(!cut&&sampleTime<this.lastTime-.002);
  if(changed){
   const from=this.pose&&{...this.pose},v={...this.velocity};
   if(this.variant==='candidate'&&from&&!cut&&!still){const old=this.scene(this.name),restore={...old.state};Object.assign(old.state,from);if(R.GESTURES[this.name])R.drawComic(this.sctx,from,{propsOnly:true});else{this.sctx._qPropsOnly=true;old.draw();this.sctx._qPropsOnly=false;}const image=this.makeCanvas(512,512);image.getContext('2d').drawImage(this.scratch,0,0);this.exitProps={image,at:sampleTime};Object.assign(old.state,restore);}else this.exitProps=null;
   this.name=effective;
   const target0=this.sample(effective,0),target1=this.sample(effective,1/120);
   this.record=this.variant==='candidate'&&!cut&&from?{from,velocity:v,target0,targetVelocity:velocity(target0,target1,1/120),at:sampleTime}:null;
  }
  if(cut||still)this.record=null;
  const raw=this.sample(effective,sampleTime);
  let pose={...raw};if(this.record)pose=R.bridge(this.record.from,this.record.velocity,this.record.target0,this.record.targetVelocity,sampleTime-this.record.at,raw);
  // Gentle breathing only in the resting margin; story props and event clocks stay exact.
  if(this.variant==='candidate'&&effective==='idle'&&!still){const u=sampleTime%8.2;const edge=Math.min(1,u/.6,(8.2-u)/.6);pose.scaleX+=.0025*Math.sin(u*Math.PI/2.6)*Math.max(0,edge);pose.scaleY-=.0025*Math.sin(u*Math.PI/2.6)*Math.max(0,edge);}
  const scene=this.scene(effective),restore={...scene.state};if(R.GESTURES[effective]){pose=R.prepareComic(pose,sampleTime,{keepPose:true});R.drawComic(this.sctx,pose);}else{Object.assign(scene.state,pose);const handoff=this.variant==='candidate'&&this.record?.from.comic&&sampleTime-this.record.at<R.BRIDGE_SECONDS;if(handoff)this.sctx._qPropsOnly=true;scene.draw();this.sctx._qPropsOnly=false;if(handoff)R.drawComic(this.sctx,R.prepareComic(pose,sampleTime,{keepPose:true}),{clear:false});Object.assign(scene.state,restore);}
  this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);if(this.exitProps){const age=sampleTime-this.exitProps.at;if(age<.18&&!still){this.ctx.save();this.ctx.globalAlpha=1-Math.max(0,age)/.18;this.ctx.drawImage(this.exitProps.image,0,0,this.canvas.width,this.canvas.height);this.ctx.restore();}else this.exitProps=null;}this.ctx.drawImage(this.scratch,0,0,this.canvas.width,this.canvas.height);
  const dt=sampleTime-this.lastTime;if(!changed&&dt>0&&dt<.1&&this.pose)this.velocity=velocity(this.pose,pose,dt);else if(changed)this.velocity={};
  this.lastTime=sampleTime;this.pose=pose;this.raw=raw;return {pose,raw,name:effective};
 }
 reset(){this.name=null;this.pose=null;this.record=null;this.velocity={};this.exitProps=null;}
}
function seeded(seed){let x=seed>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
function originalPlaylist(seconds=260){const random=seeded(20261104),out=[];let clock=0,last=null,idles=1;while(clock<seconds){for(let i=0;i<idles;i++){out.push({name:'idle',at:clock,duration:8.2});clock+=8.2;}const choices=['sleep','snack','asteroid'].filter(x=>x!==last);last=choices[Math.floor(random()*choices.length)];out.push({name:last,at:clock,duration:OLD[last].duration});clock+=OLD[last].duration;idles=1+Math.floor(random()*3);}return out;}
const CANDIDATE_ORDER=['idle','sneeze','idle','snack','idle','pancake','idle','asteroid','idle','clone','idle','sleep','idle'];
function candidatePlaylist(){let at=0;return CANDIDATE_ORDER.map(name=>{const row={name,at,duration:LIBRARY[name].duration};at+=row.duration;return row;});}
function locate(rows,time){const duration=rows.at(-1).at+rows.at(-1).duration,t=((time%duration)+duration)%duration;return {...rows.find(row=>t>=row.at&&t<row.at+row.duration),time:t};}
class Feedback{
 constructor(){this.generation=0;this.phase='idle';this.since=0;this.ignored=0;}
 begin(now){this.generation++;this.phase='pending';this.since=now;return this.generation;}
 settle(token,ok,now){if(token!==this.generation||this.phase!=='pending'){this.ignored++;return false;}this.phase=ok?'success':'failure';this.since=now;return true;}
 cancel(now){this.generation++;this.phase='cancelled';this.since=now;}
 tick(now){if(this.phase==='success'&&now-this.since>1.8||this.phase==='cancelled'&&now-this.since>.6){this.phase='idle';this.since=now;}return this.phase;}
}
G.QReview={Renderer,Feedback,OLD,LIBRARY,originalPlaylist,candidatePlaylist,locate,velocity};
})(globalThis);
