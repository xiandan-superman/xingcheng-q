const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const dir=__dirname;
for(const f of ['source-bundle.js','refinement.js','comic.js','render-core.js','companion-assets.js','companion-appearance.js','loading-story.js','pet-scheduler.js','pet-behavior.js'])vm.runInThisContext(fs.readFileSync(path.join(dir,f),'utf8'),{filename:f});
const B=global.QPetBehavior,checks=[],check=(name,fn)=>{fn();checks.push({name,passed:true});};let frames=0,maxStep=0;
check('12段剧情在单只/三只/六只、窄平台下的数值与连续性',()=>{
 for(const count of [1,3,6])for(const w of [264,316,390])for(const [name,meta]of Object.entries(B.LIBRARY)){
  const s=new B.Stage(w,count);s.auto=false;if(meta.pair&&count===1){assert.equal(s.start(name),false);continue;}
  assert(s.start(name));let prev=s.snapshot().pets;let cap=0;
  while(s.playing&&cap++<1800){s.tick(1/120);for(const p of s.pets){for(const [k,v]of Object.entries(p))if(typeof v==='number')assert(Number.isFinite(v),name+'/'+k);assert(p.sy>.45&&p.sy<1.7,name+' scale');assert(p.lift>=-.001,name+' below floor');const old=prev.find(x=>x.id===p.id);const step=Math.hypot(p.x-old.x,p.lift-old.lift);maxStep=Math.max(maxStep,step);assert(step<9,name+' jumps '+step);}prev=s.snapshot().pets;frames++;}
  assert(cap<1800);assert.equal(s.events.length,1);
 }
});
check('中途更换剧情，首帧保留当前姿态',()=>{for(const name of ['prank','chase','bounce','peek'])for(const at of [1.6,3.1,4.4,6.8]){
 const s=new B.Stage(316,3);s.auto=false;s.start(name);s.seek(Math.min(at,s.duration));const old=s.snapshot();s.start('nap');s.tick(0);old.pets.forEach((p,i)=>{for(const k of ['x','lift','sx','sy','rot','openL','openR'])assert(Math.abs(p[k]-s.pets[i][k])<1e-6,`${name} ${at} ${k}`);});
}});
check('弹跳的双方接触和承重位置一致',()=>{const s=new B.Stage(316,3);s.auto=false;s.start('bounce');for(let t=2.4;t<3.65;t+=.02){s.seek(s.clip.prep+t);const [aid,bid]=s.clip.plan.roles,a=s.pets.find(p=>p.id===aid),b=s.pets.find(p=>p.id===bid);assert(Math.abs(a.x-b.x)<1e-8);assert(Math.abs(a.lift-2*s.radius*b.sy)<1e-8);}});
check('欢迎断点恢复、完成和串行下一位',()=>{const s=new B.Stage(316,3);s.auto=false;s.start('welcome',{id:'test-a'});s.tick(.9);const save=s.serialize(),restored=new B.Stage(316,3);assert(restored.restore(save));assert.equal(restored.clip.elapsed,s.clip.elapsed);for(let t=0;t<10;t+=1/60)restored.tick(1/60);assert.equal(restored.finished[0].id,'test-a');restored.start('welcome',{id:'test-b'});for(let t=0;t<10;t+=1/60)restored.tick(1/60);assert.equal(restored.finished[1].id,'test-b');});
check('减少动态仍交付欢迎完成事件',()=>{const s=new B.Stage(316,3);s.start('welcome',{id:'reduced'});s.tick(0,{reduced:true});assert.equal(s.finished[0].id,'reduced');});
check('加载循环接缝连续，静态首帧与动态同源',()=>{for(let t=0;t<24;t+=.01){const s=QLoadingStory.sample(t);Object.values(s.p).filter(x=>typeof x==='number').forEach(x=>assert(Number.isFinite(x)));assert.equal(s.stars.length,2);}const a=QLoadingStory.sample(0),b=QLoadingStory.sample(8);assert.deepEqual(a,b);assert.deepEqual(QLoadingStory.sample(4,true),a);});
check('三种手机尺寸下跳跃、叠放和小尺寸均不裁切',()=>{for(const width of [320,375,390])for(const count of [1,3,6])for(const [name,meta]of Object.entries(B.LIBRARY)){if(meta.pair&&count===1)continue;const scale=width/390,s=new B.Stage(width*(1-72/750),count);s.setScale(scale);s.auto=false;s.start(name);for(let i=0;i<1500&&s.playing;i++){s.tick(1/60);for(const p of s.pets){if(p.x<0||p.x>s.width)continue;const e=s.radius*Math.sqrt((p.sx*Math.sin(p.rot))**2+(p.sy*Math.cos(p.rot))**2);assert(77*scale-p.lift-2*e>-.2,name+' clipped at '+width);}}}});
const report={status:'passed',checks,sampledFrames:frames,maxStepAt120fps:maxStep,scope:'Independent preview only. No mini-program/cloud/phone performance acceptance.'};
fs.writeFileSync(path.join(dir,'motion-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
if(!process.env.CANVAS_MODULE)process.exit(0);
const {createCanvas,GlobalFonts}=require(process.env.CANVAS_MODULE);GlobalFonts.registerFromPath('/System/Library/Fonts/STHeiti Medium.ttc','Chinese');
const first=createCanvas(512,512);QLoadingStory.draw(first.getContext('2d'),0);fs.writeFileSync(path.join(dir,'loading-first.png'),first.toBuffer('image/png'));
const out=path.resolve(dir,'../../output/playwright/xq-motion-v2');fs.mkdirSync(out,{recursive:true});
function drawStage(c,s){const floor=77;c.clearRect(0,0,316,96);c.fillStyle='#FFFAF0';c.fillRect(0,0,316,96);c.fillStyle='#EFDFBD';c.fillRect(0,floor,316,5);c.fillStyle='#9B7651';c.fillRect(0,floor,316,1);s.pets.forEach(p=>{c.fillStyle='rgba(111,79,44,.14)';c.beginPath();c.ellipse(p.x,floor+3,s.radius*.8/(1+p.lift/30),2.1,0,0,Math.PI*2);c.fill();QCompanionAppearance.draw(c,QCompanionAppearance.get(p.id),p.x,floor,s.radius,p);});}
for(const name of ['prank','chase','bounce','nap','peek']){
 const s=new B.Stage(316,3);s.auto=false;s.start(name);const times={prank:[1.8,2.7,4.5,6.7,7.8],chase:[.8,2.1,2.65,4.5,6.8],bounce:[1.15,2,2.6,3.8,5.5],nap:[1,2.5,4.2,6.7,8.3],peek:[2,4.7,5.4,6.8,8.9]}[name],sheet=createCanvas(948,5*322),c=sheet.getContext('2d'),frame=createCanvas(316,96);
 times.forEach((time,i)=>{s.seek(s.clip.prep+time);drawStage(frame.getContext('2d'),s);c.fillStyle='#FFFAF0';c.fillRect(0,i*322,948,322);c.fillStyle='#302923';c.font='18px Chinese';c.fillText(B.LIBRARY[name].label+' · '+time+'秒',12,i*322+23);c.drawImage(frame,0,i*322+34,948,288);});
 fs.writeFileSync(path.join(out,name+'-sequence.png'),sheet.toBuffer('image/png'));
}
