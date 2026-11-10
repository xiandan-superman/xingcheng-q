const test=require('node:test'),assert=require('node:assert/strict');
const {Renderer}=require('../miniapp/components/xingcheng-q-home/player');
const R=require('../miniapp/components/xingcheng-q-home/performance');
function renderer(){
 const context=()=>({setTransform(){},clearRect(){},drawImage(){},save(){},restore(){}});
 const canvas=(width,height)=>({width,height,getContext:()=>context()});
 const r=new Renderer(canvas(512,512),'candidate',canvas);
 r.scene=name=>({state:{},timeline:{seek(){}},draw(){}});
 return r;
}
test('switching into a feedback midway begins at the displayed pose, including rapid interruption',()=>{
 const r=renderer();r.render('feedback:pending',.6,{cut:true});
 for(const [name,time]of [['feedback:failure',.8],['feedback:success',.4],['feedback:pending',3.7]]){
  const previous={...r.pose};r.render(name,time);
  for(const key of ['x','y','rotation','eyeX','eyeY','eyeOpenL','eyeOpenR'])assert.ok(Math.abs(r.pose[key]-previous[key])<1e-9,`${name} ${key} jumps`);
  const end=r.render(name,time+R.BRIDGE_SECONDS+.01);
  for(const key of R.BRIDGE_KEYS)if(Number.isFinite(end.raw[key]))assert.equal(end.pose[key],end.raw[key]);
 }
});
test('explicit cuts bypass the transition and reduced motion stays time independent',()=>{
 const r=renderer();r.render('feedback:pending',4);const result=r.render('feedback:success',.5,{cut:true});assert.equal(r.record,null);assert.deepEqual(result.pose,result.raw);
 const a=r.render('feedback:pending',3,{still:true}).pose,b=r.render('feedback:pending',80,{still:true}).pose;assert.deepEqual(a,b);
});
test('long feedback remains finite and adds a readable blink without changing its opening',()=>{
 const base={};
 for(const t of [0,.4,1,2.4]){const s=R.feedback(base,'pending',t);assert.equal(s.eyeX,-11*(1-Math.exp(-t*8)));}
 for(const phase of ['pending','failure']){
  let low=1;
  for(let t=2.4;t<150;t+=1/60){const s=R.feedback(base,phase,t);for(const v of Object.values(s))assert.ok(Number.isFinite(v));low=Math.min(low,s.eyeOpenL);assert.ok(s.eyeOpenL>=.045&&s.eyeOpenR>=.045);}
  assert.ok(low<.15,phase+' should blink during prolonged display');
  const a=R.feedback(base,phase,2.4),b=R.feedback(base,phase,2.40001);assert.ok(Math.abs(a.eyeX-b.eyeX)<.001);
 }
});
