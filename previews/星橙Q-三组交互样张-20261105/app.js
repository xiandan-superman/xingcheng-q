(()=>{'use strict';
const $=id=>document.getElementById(id),Q=QReview,R=QRefinement,B=QPetBehavior,V=QCompanionAppearance;
const make=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
const heroStorageKey='xingcheng-q-independent-20261105-hero-v1';
let heroHistory={};
try{const saved=JSON.parse(localStorage.getItem(heroStorageKey));if(saved?.version===1)heroHistory=saved;}catch{}
const renderer=new Q.Renderer($('hero'),'candidate',make),heroDirector=new QHeroDirector.Director(Q.LIBRARY,{history:heroHistory,remember(history){try{localStorage.setItem(heroStorageKey,JSON.stringify({version:1,...history}));}catch{storageOK=false;}}});
const stage=new B.Stage($('pets').clientWidth||350,3,V);
let phase='loading',generation=0,t=0,loadTime=0,storyTime=0,last=null,raf=0,frameCount=0;
let group='load',selectedStory='auto',forcedHide=false,petPaused=false,pickerOpen=false,pickerDraft=[];
let platformVisible=false,heroVisible=false,loaderVisible=true,study=false,studyTime=0,studyPlaying=true,errorAt=0;
let requestTimer=null,lastSave=0,lastUI=0,gazeX=0,gazeY=0,storageOK=true;
const storageKey='xingcheng-q-independent-20261105-v1';
let reward;
try{reward=JSON.parse(localStorage.getItem(storageKey));}catch{storageOK=false;}
if(!reward||![1,2].includes(reward.version)||!Array.isArray(reward.owned)||!Array.isArray(reward.done)||!Array.isArray(reward.queue))reward={version:2,owned:['round','blob','tip'],done:[],queue:[],active:null,history:[]};
reward.history=Array.isArray(reward.history)?reward.history:[];
const companions=new QHomeCompanions.Collection({owned:reward.owned,selected:reward.selected,profile:reward.profile});
reward.version=2;reward.done=QHomeCompanions.unique(reward.done);reward.queue=QHomeCompanions.unique(reward.queue).filter(id=>companions.owned.includes(id));
if(reward.active){reward.active.id=V.normalize(reward.active.id);if(reward.active.id==='round'||!companions.selected.includes(reward.active.id)){if(reward.active.id)reward.done.push(reward.active.id);reward.active=null;}}
function adaptSavedStage(raw){
 const data=JSON.parse(JSON.stringify(raw)),idMap=new Map(data.pets.map(p=>[p.id,(p.id.startsWith('arrival:')?'arrival:':'')+(V.normalize(p.id)||'round')])),map=id=>idMap.get(id)||id;
 data.pets=data.pets.map(p=>({...p,id:map(p.id)})).filter(p=>companions.selected.includes(V.normalize(p.id))).slice(0,5);data.count=data.pets.length;
 if(data.clip){data.clip.from=Object.fromEntries(Object.entries(data.clip.from).map(([id,p])=>[map(id),{...p,id:map(id)}]));const plan=data.clip.plan;plan.tracks=Object.fromEntries(Object.entries(plan.tracks).map(([id,tr])=>[map(id),tr]));plan.roles=plan.roles.map(map);plan.arcs.forEach(a=>a.id=map(a.id));plan.welcomeId=V.normalize(plan.welcomeId);}
 return data;
}
let resumedWelcome=false;try{if(reward.active?.stage)resumedWelcome=stage.restore(adaptSavedStage(reward.active.stage));}catch{reward.active.stage=null;}
if(!resumedWelcome){stage.setRoster(companions.selected.filter(id=>!reward.queue.includes(id)&&id!==reward.active?.id));stage.pets.forEach((p,i)=>{p.x=stage.pets.length===1?stage.width*.5:22+i*(stage.width-44)/Math.max(1,stage.pets.length-1);p.alpha=1;p.v=0;});stage.clip=null;stage.wait=0;}
function toast(text){$('sync').textContent=text;setTimeout(()=>{if($('sync').textContent===text)$('sync').textContent='';},2600);}
function updateReward(){
 $('reward-state').textContent=`模拟收藏 ${reward.owned.length} 位 · 待欢迎 ${reward.queue.length+(reward.active?1:0)} 位 · 已完成 ${reward.done.length} 次${storageOK?'':' · 浏览器未允许保存，刷新去重暂不可用'}`;
 $('history').replaceChildren(...reward.history.slice(-14).map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
 for(const option of $('saved-color-shape').options)option.disabled=!companions.owned.includes(option.value);
}
function persist(){
 reward.owned=[...companions.owned];reward.selected=[...companions.selected];reward.profile={...companions.profile};
 if(reward.active&&stage.clip?.plan.name==='welcome'){reward.active.elapsed=stage.clip.elapsed;reward.active.stage=stage.serialize();}
 let saved=true;try{localStorage.setItem(storageKey,JSON.stringify(reward));storageOK=true;}catch{storageOK=false;saved=false;}
 updateReward();return saved;
}
function unlock(){
 heroDirector.activity();
 const id=V.catalog.shapes.map(s=>s.id).find(id=>!companions.owned.includes(id));if(!id){toast('全部伙伴已收藏，可在“选伙伴”中更换展示。');return;}
 const added=companions.unlock(id);if(added.display&&!reward.done.includes(id)&&!reward.queue.includes(id)&&reward.active?.id!==id)reward.queue.push(id);else{reward.done.push(id);reward.history.push('已收藏：'+id+'（展示位已满）');toast('新伙伴已加入收藏，可在“选伙伴”中更换展示。');}persist();schedule();watchPhone();
}
function welcomeBeforeTick(){
 while(reward.queue.length&&(reward.done.includes(reward.queue[0])||!companions.selected.includes(reward.queue[0])||stage.pets.some(p=>V.normalize(p.id)===reward.queue[0]))){const id=reward.queue.shift();if(!reward.done.includes(id))reward.done.push(id);}
 if(reward.active&&reward.done.includes(reward.active.id))reward.active=null;
 if(reward.active&&stage.clip?.plan.name!=='welcome'){
  if(!reward.active.stage||!stage.restore(reward.active.stage))stage.start('welcome',{id:reward.active.id});
 }
 if(!reward.active&&reward.queue.length&&stage.pets.length<5&&!(heroVisible&&heroDirector.full)){const id=reward.queue.shift();reward.active={id,elapsed:0};reward.history.push('开始欢迎：'+id);stage.start('welcome',{id});persist();}
}
function welcomeAfterTick(){
 for(const event of stage.finished.splice(0)){
  if(event.name==='welcome'&&reward.active?.id===event.id){
   if(!reward.done.includes(event.id))reward.done.push(event.id);
   reward.history.push('完成欢迎：'+event.id);const arrived=stage.pets.find(p=>p.id==='arrival:'+event.id);if(arrived)arrived.id=event.id;reward.active=null;persist();
  }
 }
}
function syncCount(){
 const count=stage.pets.length;$('population').textContent=count+'位伙伴';
 document.querySelectorAll('[data-count]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.count===stage.count)));
 document.querySelectorAll('[data-pair]').forEach(b=>b.disabled=count<2);
 $('pet-access').replaceChildren(...stage.pets.map(p=>{const b=document.createElement('button');b.textContent='逗一逗'+V.get(p.id).shape.name;b.onclick=()=>{stage.react(p.id);schedule();};return b;}));
}
function renderPicker(message=''){
 $('pet-picker-count').textContent='已选 '+pickerDraft.length+' / 5';$('pet-picker-message').textContent=message;
 $('pet-picker-grid').replaceChildren(...V.catalog.shapes.map(shape=>{const owned=companions.owned.includes(shape.id),selected=pickerDraft.includes(shape.id),b=document.createElement('button');b.className='pet-picker-card';b.dataset.shape=shape.id;b.setAttribute('aria-label',shape.name+(owned?'':'，尚未获得'));b.setAttribute('aria-pressed',String(selected));b.disabled=!owned||shape.id==='round';const img=document.createElement('img');img.src=V.image(shape.id);img.alt='';const name=document.createElement('span');name.textContent=shape.name;const hint=document.createElement('small');hint.textContent=!owned?'尚未获得':shape.id==='round'?'常驻':selected?'已选择':'点选展示';b.append(img,name,hint);if(selected){const mark=document.createElement('span');mark.className='pet-selected';mark.textContent='✓';b.append(mark);}b.onclick=()=>{if(selected)pickerDraft=pickerDraft.filter(id=>id!==shape.id);else if(pickerDraft.length>=5){$('pet-picker-message').textContent='首页最多展示5只，请先取消一位伙伴。';return;}else pickerDraft.push(shape.id);renderPicker();};return b;}));
}
function openPicker(){pickerDraft=[...companions.selected];pickerOpen=true;cancelPointer();persist();$('phone').classList.add('pets-obscured');$('native-page').inert=true;document.querySelector('.tab-shell').inert=true;$('pet-picker').hidden=false;renderPicker();last=null;schedule();diagnostics();$('pet-picker-close').focus();}
function closePicker(){pickerOpen=false;$('pet-picker').hidden=true;$('phone').classList.remove('pets-obscured');$('native-page').inert=false;document.querySelector('.tab-shell').inert=false;last=null;schedule();$('pet-manage').focus();}
function applyRoster(save=true){stage.setRoster(companions.selected.filter(id=>!reward.queue.includes(id)));syncCount();if(save)persist();drawPets();schedule();}
function colorEditorState(){const shape=$('saved-color-shape').value||companions.profile.avatarShape;$('saved-color').value=companions.profile.avatarColors[shape];$('saved-color-state').textContent='已保存：'+V.get(shape).label+'。其他形状保留各自颜色。';}
function applySavedProfile(profile){companions.savedProfile(profile);$('saved-color-shape').value=companions.profile.avatarShape;colorEditorState();if(pickerOpen)renderPicker();persist();drawPets();schedule();diagnostics();}
function watchPhone(){if(innerWidth<=720)$('phone').scrollIntoView({behavior:$('reduce').checked?'instant':'smooth',block:'start'});}
function startScene(name){
 heroDirector.activity();stage.auto=false;petPaused=false;stage.start(name);syncCount();schedule();updatePetControls();watchPhone();
}
function drawPets(){
 const el=$('pets'),w=el.clientWidth,h=el.clientHeight,dpr=Math.min(devicePixelRatio||1,2);stage.resize(w);
 if(el.width!==Math.round(w*dpr)||el.height!==Math.round(h*dpr)){el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);}
 const c=el.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);const floor=h-19*deviceGeometry.width/390;
 for(const p of stage.pets){
  const r=stage.radius;c.save();c.globalAlpha=p.alpha??1;c.fillStyle='rgba(111,79,44,.14)';c.beginPath();c.ellipse(p.x,floor+3,r*.8/(1+(p.lift||0)/30),2.1,0,0,Math.PI*2);c.fill();c.restore();
  V.draw(c,V.get(p.id),p.x,floor,r,p);
 }
 const star=stage.prop;if(star){c.save();c.globalAlpha=star.alpha;c.fillStyle='#D7A640';c.beginPath();for(let i=0;i<8;i++){const a=-Math.PI/2+i*Math.PI/4,r=i%2?star.r*.32:star.r;c.lineTo(star.x+Math.cos(a)*r,floor-star.lift+Math.sin(a)*r);}c.closePath();c.fill();c.restore();}
}
let pointer=null,holdTimer=null;
function cancelPointer(){clearTimeout(holdTimer);pointer=null;}
$('pets').addEventListener('pointerdown',e=>{
 const rect=$('pets').getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,r=stage.radius,floor=rect.height-19*deviceGeometry.width/390;
 const hit=stage.pets.map(p=>{const m=V.metrics(V.get(p.id),r,p);return {p,d:Math.hypot(x-p.x-(m.left+m.right)/2,y-(floor-(p.lift||0)-m.height/2))};}).sort((a,b)=>a.d-b.d)[0];
 if(!hit||hit.d>r+9)return;
 pointer={id:e.pointerId,x:e.clientX,y:e.clientY,pet:hit.p.id,fired:false};
 holdTimer=setTimeout(()=>{if(pointer){pointer.fired=true;stage.react(pointer.pet,true);schedule();}},550);
});
$('pets').addEventListener('pointermove',e=>{if(pointer&&Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>9)cancelPointer();});
$('pets').addEventListener('pointercancel',cancelPointer);
$('pets').addEventListener('pointerup',e=>{clearTimeout(holdTimer);if(pointer&&e.pointerId===pointer.id&&!pointer.fired){stage.react(pointer.pet);schedule();}pointer=null;});
function heroScene(){return heroDirector.sample;}
function drawHero(dt){
 const s=heroScene(),still=$('reduce').checked;renderer.render(s.name,s.time,{still});
 const attention=stage.playing||stage.reaction,targetX=attention?(stage.focusX/Math.max(stage.width,1)-.5)*32:0,targetY=attention?18:0;
 const k=1-Math.exp(-dt*7);gazeX+=(targetX-gazeX)*k;gazeY+=(targetY-gazeY)*k;
 if(s.name==='idle'&&!still&&(Math.abs(gazeX)+Math.abs(gazeY)>.05)){
  const p={...renderer.pose,eyeX:renderer.pose.eyeX+gazeX,eyeY:renderer.pose.eyeY+gazeY,shadowA:0};R.drawComic(renderer.sctx,p);renderer.ctx.clearRect(0,0,512,512);renderer.ctx.drawImage(renderer.scratch,0,0,512,512);
 }
}
function drawLoader(){const sec=study?studyTime:phase==='error'?errorAt:loadTime;const beat=QLoadingStory.draw($('loader').getContext('2d'),sec,{still:$('reduce').checked,error:phase==='error'});$('loader-static').hidden=true;if(study){$('load-scrub').value=studyTime;$('load-beat').textContent=beat;}}
function setHero(line1,line2,completed=false){$('hero-title').innerHTML='<span class="hero-title-line">'+line1+'</span><span class="hero-title-line"><span class="hl"'+(completed?' style="background:var(--green)"':'')+'>'+line2+'</span></span>';}
function setStats(streak,total){$('stats').innerHTML='<div class="track-stat"><span class="energy-num h-orange">'+streak+'</span><span class="track-label">连续星能（天）</span></div><div class="track-stat"><span class="energy-num h-cyan">'+total+'</span><span class="track-label">累计星能（天）</span></div>';}
function selectTab(id){const names={today:'today',practice:'practice',wrong:'wrong',collection:'me'};for(const [key,asset]of Object.entries(names)){const on=key===id;$(key).classList.toggle('is-active',on);$(key).setAttribute('aria-pressed',String(on));$(key).querySelector('img').src='ui-assets/tab-'+asset+(on?'-on':'')+'.png';}}
function showPage(){
 selectTab('today'); $('loading').hidden=true;$('page').hidden=false;$('answer-page').hidden=true;$('other-page').hidden=true;
 $('today').setAttribute('aria-pressed','true');$('collection').setAttribute('aria-pressed','false');
}
function finish(token,empty=false){
 if(token!==generation)return;const stayingElsewhere=!$('other-page').hidden;phase=empty?'empty':'ready';study=false;$('study-controls').hidden=true;if(!stayingElsewhere)showPage();
 setHero(empty?'今天的星域':'今天也来<span class="h-orange">充</span>',empty?'慢慢展开':'一格星能');
 $('streak').textContent=empty?'连续星能 0 天':'连续星能 7 天';setStats(empty?0:7,empty?0:18);
 document.querySelector('.question-card').classList.remove('is-done');$('answer').classList.add('btn-yellow','btn-pulse');$('answer').classList.remove('btn-cyan-o');document.querySelector('.question-label').textContent='今日星题 · 待作答';
 $('question-title').textContent=empty?'今天还没有安排星题':'为什么相同成分的材料，性能仍会不同？';
 $('question-copy').textContent=empty?'这是正常空状态。设定学习航程后，再回来探索。':'从组织结构与加工过程出发，试着解释它们之间的联系。';
 $('voyage').textContent=empty?'我的航程 · 尚未设定':'我的航程 · 材料科学基础 / 第三章';$('answer').textContent=empty?'模拟设定航程':'开始答题';
 document.querySelector('.days').style.opacity=empty?'.35':'1';$('load-state').textContent=empty?'正常空状态：全页一起出现，0天是已确认的数据。':'准备完成：题目、轨迹与航程已整体显示。';
 if(!stayingElsewhere&&!$('reduce').checked)$('page').animate([{opacity:.3},{opacity:1}],{duration:160,easing:'ease-out'});
 {const from=QLoadingStory.sample(study?studyTime:loadTime).p;renderer.reset();renderer.render('idle',0,{cut:true});renderer.pose={...renderer.pose,...from};renderer.record={from,velocity:{},target0:renderer.sample('idle',0),targetVelocity:{},at:0};}
 heroDirector.enter({welcoming:!!reward.active,empty});if(selectedStory!=='auto')heroDirector.select(selectedStory);if(!stayingElsewhere)drawPets();syncCount();schedule();
}
function enter(){
 study=false;$('study-controls').hidden=true;const token=++generation;clearTimeout(requestTimer);phase='loading';loadTime=0;
 $('page').hidden=true;$('answer-page').hidden=true;$('other-page').hidden=true;$('loading').hidden=false;$('retry').hidden=true;selectTab('today');
 $('loading-title').textContent='星橙Q陪你等一会儿';$('loading-copy').textContent='正在准备今日星题、轨迹和航程…';$('load-state').textContent='准备今日星题、轨迹与航程';
 const type=$('scenario').value;
 requestTimer=setTimeout(()=>{if(token!==generation)return;if(type==='fail'){
  phase='error';errorAt=loadTime;$('loading-title').textContent='这次没能准备好';$('loading-copy').textContent='首页内容暂时未能读取，请重新试一次。';$('retry').hidden=false;$('load-state').textContent='读取失败：没有显示默认天数或残缺首页。';schedule();
 }else finish(token,type==='empty');},({normal:2400,fast:120,slow:12000,fail:3000,empty:1000})[type]);
 drawLoader();schedule();
}
function silent(){if(phase==='loading'||phase==='error')return;$('sync').textContent='正在同步，继续使用即可';const token=generation;setTimeout(()=>{if(token!==generation)return;$('sync').textContent='已更新';setTimeout(()=>$('sync').textContent='',1500);},900);}
function home(kind='tab'){heroDirector.returned(kind);if(phase==='loading'||phase==='error'){$('other-page').hidden=true;$('answer-page').hidden=true;$('page').hidden=true;$('loading').hidden=false;selectTab('today');schedule();return;}showPage();silent();schedule();}
function viewOther(){$('loading').hidden=true;$('page').hidden=true;$('other-page').hidden=false;$('answer-page').hidden=true;$('today').setAttribute('aria-pressed','false');$('collection').setAttribute('aria-pressed','true');persist();cancelPointer();schedule();}
function updatePetControls(){
 const labels={entry:'刚进入：完整剧情',occasional:'停留中：偶尔的小剧场',quiet:'安静陪伴',manual:'手动观看完整剧情',answer:'答题后的简短回应',welcome:'看着新伙伴入场','entry-still':'入场静态呈现'};$('hero-state').textContent='大Q · '+(labels[heroDirector.reason]||'安静陪伴');
 const clip=stage.clip,name=clip?.plan.name;
 $('pet-caption').textContent=stage.beat;
 $('pet-scene-name').textContent=clip?(name==='welcome'?'首次欢迎':clip.plan.label):(stage.auto?'伙伴日常 · 连续生活':'这一段已收尾');
 $('pet-scrub').max=Math.max(stage.duration,1);$('pet-scrub').value=clip?.elapsed||0;
 $('pet-scrub').disabled=!clip||name==='welcome';$('pet-play').disabled=name==='welcome';$('pet-replay').disabled=name==='welcome';
 $('pet-play').textContent=petPaused?'继续这段':'暂停这段';$('pet-auto').setAttribute('aria-pressed',String(stage.auto));
 document.querySelectorAll('[data-act]').forEach(b=>b.setAttribute('aria-pressed',String(name===b.dataset.act)));
 if(stage.pets.length!==+$('population').dataset.count){$('population').dataset.count=stage.pets.length;syncCount();}
}
function snapshot(){return {revision:'per-shape-color-selection-v6',hero:heroDirector.snapshot(),phase,generation,t,loadTime,storyTime,pet:stage.snapshot(),petPaused,owned:[...companions.owned],selection:[...companions.selected],profile:{...companions.profile},pickerOpen,pickerDraft:[...pickerDraft],displayLimit:5,petAppearances:stage.pets.map(p=>({id:p.id,shape:V.get(p.id).shape.id,color:V.get(p.id).color.id,eyes:V.get(p.id).color.eyes,star:V.get(p.id).color.star})),done:[...reward.done],queue:[...reward.queue],active:reward.active?{id:reward.active.id,elapsed:reward.active.elapsed}:null,history:reward.history.slice(),paused:paused(),platformVisible,heroVisible,loaderVisible,frameCount,appearance:V.version,storageOK};}
function diagnostics(){const data=snapshot();$('diagnostics').textContent=JSON.stringify(data);$('diagnostics').dataset.phase=phase;}
function paused(){return document.hidden||forcedHide||$('pause').checked;}
function frame(now){
 raf=0;if(paused()){last=null;return;}const dt=last===null?0:Math.min(.05,(now-last)/1000);last=now;
 const reduced=$('reduce').checked,pageVisible=!$('page').hidden&&!pickerOpen;t+=dt;
 if((phase==='loading'||phase==='error')&&loaderVisible){if(phase==='loading'&&!reduced){if(study&&studyPlaying)studyTime=(studyTime+dt)%8;else if(!study)loadTime+=dt;}drawLoader();}
 if(pageVisible){
  if(heroVisible){heroDirector.tick(dt,{reduced,welcoming:!!reward.active,smallForeground:!!stage.clip&&!['quiet','gather'].includes(stage.clip.plan.name)});storyTime=heroDirector.clock;if(heroDirector.justSettled){selectedStory='auto';$('story').value='auto';}}
  if(platformVisible){
   welcomeBeforeTick();
   if(!petPaused)stage.tick(dt,{reduced,calm:heroVisible&&heroDirector.full});else stage.render(reduced);
   welcomeAfterTick();drawPets();
  }
  if(heroVisible)drawHero(dt);
 }
 frameCount++;
 if(t-lastSave>.5){if(reward.active)persist();lastSave=t;}
 if(t-lastUI>.18){updatePetControls();diagnostics();lastUI=t;}
 $('motion-state').textContent=pickerOpen?'正在选择伙伴：背景角色隐藏，关闭后接着刚才的动作。':reduced?'减少动态：保留静态角色、操作和欢迎结果。':!pageVisible&&phase!=='loading'&&phase!=='error'?'首页与伙伴已保留，动作暂停。':pageVisible&&!platformVisible?'平台离开可视区，伙伴动作暂停。':'大Q开演时，小Q继续自然活动，并逐步接轻缓日常。';
 if((!reduced&&(((phase==='loading'||phase==='error')&&loaderVisible)||(pageVisible&&(heroVisible||platformVisible))))||(pageVisible&&platformVisible&&(reward.active||reward.queue.length)))raf=requestAnimationFrame(frame);else last=null;
}
function schedule(){lastUI=-Infinity;if(!raf&&!paused()){last=null;raf=requestAnimationFrame(frame);}}
const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.target===$('platform'))platformVisible=e.isIntersecting;else if(e.target===$('hero'))heroVisible=e.isIntersecting;else loaderVisible=e.isIntersecting;}schedule();},{threshold:0});
observer.observe($('platform'));observer.observe($('hero'));observer.observe(document.querySelector('.loading-media'));
document.addEventListener('visibilitychange',()=>{cancelPointer();if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;last=null;persist();diagnostics();}else schedule();});window.addEventListener('pagehide',persist);
document.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{group=b.dataset.group;['load','pets'].forEach(id=>$(id+'-controls').hidden=id!==group);document.querySelectorAll('[data-group]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));if(group!=='load'&&(phase==='loading'||phase==='error')){clearTimeout(requestTimer);finish(generation);}schedule();});
document.querySelectorAll('[data-count]').forEach(b=>b.onclick=()=>{const n=+b.dataset.count;companions.choose(companions.owned.slice(0,n));applyRoster();if(companions.owned.length<n)toast('当前收藏不足'+n+'种，可先模拟解锁或集齐。');watchPhone();});
document.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>startScene(b.dataset.act));
$('pet-auto').onclick=()=>{stage.auto=true;petPaused=false;if(!stage.clip)stage.wait=2;schedule();updatePetControls();watchPhone();};
$('pet-play').onclick=()=>{petPaused=!petPaused;schedule();updatePetControls();watchPhone();};
$('pet-replay').onclick=()=>{const name=stage.lastName;if(name&&name!=='welcome')startScene(name);};
$('pet-scrub').oninput=()=>{petPaused=true;stage.seek(+$('pet-scrub').value);drawPets();updatePetControls();diagnostics();};
$('study').onclick=()=>{clearTimeout(requestTimer);generation++;study=true;studyTime=0;studyPlaying=true;phase='loading';$('page').hidden=true;$('answer-page').hidden=true;$('other-page').hidden=true;$('loading').hidden=false;$('retry').hidden=true;$('loading-title').textContent='轻轻等一会儿';$('loading-copy').textContent='星点绕过来，它慢半拍才发现。';$('study-controls').hidden=false;drawLoader();schedule();watchPhone();};
$('load-play').onclick=()=>{studyPlaying=!studyPlaying;$('load-play').textContent=studyPlaying?'暂停观看':'继续观看';schedule();};
$('load-scrub').oninput=()=>{studyTime=+$('load-scrub').value;studyPlaying=false;$('load-play').textContent='继续观看';drawLoader();};
$('frame-controls').onclick=()=>$(group+'-controls').scrollIntoView({behavior:'smooth',block:'start'});$('to-controls').onclick=()=>$(group+'-controls').scrollIntoView({behavior:'smooth',block:'start'});$('enter').onclick=()=>{enter();watchPhone();};$('scenario').onchange=enter;$('ready').onclick=()=>{clearTimeout(requestTimer);if(phase==='loading'||phase==='error')finish(generation,$('scenario').value==='empty');};
$('retry').onclick=()=>{$('scenario').value='normal';enter();};$('refresh').onclick=silent;
$('answer').onclick=()=>{if(phase==='empty'){finish(generation);return;}$('page').hidden=true;$('answer-page').hidden=false;persist();cancelPointer();schedule();};
$('return').onclick=()=>{home('answer');$('answer').textContent='回看星图';setHero('今天的星题','已点亮',true);$('answer').classList.remove('btn-yellow','btn-pulse');$('answer').classList.add('btn-cyan-o');document.querySelector('.question-card').classList.add('is-done');document.querySelector('.question-label').textContent='今日星题 · 已完成';$('sync').textContent='模拟答题完成，首页与伙伴已保留';};
$('collection').onclick=()=>{viewOther();selectTab('collection');$('other-title').textContent='我的收藏';};$('practice').onclick=()=>{viewOther();selectTab('practice');$('other-title').textContent='练习';};$('wrong').onclick=()=>{viewOther();selectTab('wrong');$('other-title').textContent='错题';};$('today').onclick=home;$('back-home').onclick=home;
$('reenter').onclick=()=>{viewOther();setTimeout(home,600);};$('unlock').onclick=unlock;$('batch').onclick=()=>{unlock();unlock();};
$('reset').onclick=()=>{reward={version:2,done:[],queue:[],active:null,history:[]};companions.owned=['round'];companions.selected=['round'];stage.clip=null;stage.pending=null;stage.pendingRoster=null;applyRoster();};
$('upgrade').onclick=()=>{const shape=$('saved-color-shape').value,colors=V.catalog.colors,index=colors.findIndex(c=>c.id===companions.profile.avatarColors[shape]);applySavedProfile({avatarShape:shape,avatarColor:colors[(index+1)%colors.length].id});toast('这个形状的新配色已同步到首页。');};
$('all-owned').onclick=()=>{companions.owned=V.catalog.shapes.map(s=>s.id);reward.done=QHomeCompanions.unique([...reward.done,...companions.owned.filter(id=>id!==reward.active?.id&&!reward.queue.includes(id))]);persist();if(pickerOpen)renderPicker();toast('演示收藏已集齐，可选择首页展示的伙伴。');};
$('saved-color-shape').replaceChildren(...V.catalog.shapes.map(shape=>{const option=document.createElement('option');option.value=shape.id;option.textContent=shape.name;return option;}));$('saved-color-shape').value=companions.profile.avatarShape;$('saved-color-shape').onchange=colorEditorState;
$('saved-color').replaceChildren(...V.catalog.colors.map(color=>{const option=document.createElement('option');option.value=color.id;option.textContent=color.name;return option;}));$('saved-color').onchange=()=>{$('saved-color-state').textContent='尚未保存：只预览当前形状的选择，首页颜色保持已保存状态。';};$('save-shape-color').onclick=()=>{const shape=$('saved-color-shape').value;if(!companions.owned.includes(shape)){toast('先获得这位伙伴，再调整它的配色。');return;}applySavedProfile({avatarShape:shape,avatarColor:$('saved-color').value});};colorEditorState();
$('pet-manage').onclick=openPicker;$('pet-picker-close').onclick=closePicker;$('pet-picker-save').onclick=()=>{const previous=[...companions.selected],previousStage={...stage},result=companions.choose(pickerDraft);if(!result.ok){$('pet-picker-message').textContent=result.message;return;}applyRoster(false);if($('save-failure').checked||!persist()){companions.selected=previous;reward.selected=previous;Object.assign(stage,previousStage);syncCount();$('pet-picker-message').textContent='暂时未能保存，选择已保留，请重试。';diagnostics();return;}closePicker();};
$('pet-picker').onclick=e=>{if(e.target===$('pet-picker'))closePicker();};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&pickerOpen)closePicker();});
$('reduce').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;$('reduce').onchange=()=>{$('phone').classList.toggle('reduce-motion',$('reduce').checked);schedule();watchPhone();};
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{$('reduce').checked=e.matches;$('phone').classList.toggle('reduce-motion',e.matches);schedule();});
$('large').onchange=()=>{document.body.classList.toggle('large',$('large').checked);schedule();watchPhone();};$('pause').onchange=()=>{last=null;schedule();};
$('hide').onclick=()=>{forcedHide=true;last=null;cancelPointer();persist();diagnostics();$('motion-state').textContent='已模拟隐藏，5秒后从原动作恢复。';setTimeout(()=>{forcedHide=false;last=null;schedule();},5000);};
$('story').onchange=()=>{selectedStory=$('story').value;heroDirector.select(selectedStory);schedule();watchPhone();};
$('long-text').onclick=()=>{$('long-copy').hidden=!$('long-copy').hidden;$('long-copy').textContent=('材料的微观组织、热处理与加工过程会共同影响最终性能。请结合实际例子思考它们的联系。\n').repeat(15);};
const presets={'390x844':{width:390,height:844,status:47,safe:34},'375x667':{width:375,height:667,status:20,safe:0},'320x740':{width:320,height:740,status:24,safe:24}};
let deviceGeometry=presets['390x844'];
function fitPhone(){const g=deviceGeometry,wrap=$('device-wrap'),space=wrap.parentElement.clientWidth;const top=document.querySelector('.lab-head').offsetHeight+parseFloat(getComputedStyle(document.querySelector('main')).paddingTop)+document.querySelector('.frame-options').offsetHeight+12;const available=Math.max(260,innerHeight-top-20);const fit=$('actual-size').checked?1:Math.min(1,(space-8)/(g.width+6),available/(g.height+6));wrap.style.setProperty('--device-width',g.width+'px');wrap.style.setProperty('--device-height',g.height+'px');wrap.style.setProperty('--device-scale',fit);$('phone').style.setProperty('--rpx',g.width/750+'px');$('phone').style.setProperty('--status-height',g.status+'px');$('phone').style.setProperty('--safe-bottom',g.safe+'px');$('phone').dataset.safe=g.safe;$('phone').dataset.status=g.status;$('phone').dataset.width=g.width;$('phone').dataset.height=g.height;}
$('phone-size').onchange=()=>{deviceGeometry=presets[$('phone-size').value];fitPhone();stage.setScale(deviceGeometry.width/390);stage.resize($('pets').clientWidth);$('mini-scroll').scrollTop=0;schedule();};$('actual-size').onchange=fitPhone;window.addEventListener('resize',()=>{fitPhone();schedule();});fitPhone();
window.QPreview={snapshot,appearance:V.version,applySavedProfile};
$('pets-controls').insertBefore($('pet-caption'),$('welcome-heading'));syncCount();persist();diagnostics();enter();
})();
