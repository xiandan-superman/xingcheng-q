/* 星橙Q experience: original miniapp artwork and choreography, local-only preferences. */
(function(){
'use strict';
const $=id=>document.getElementById(id),{catalog,avatar,createAppearance,behavior}=QHub,{Stage,LIBRARY}=behavior;
const css=getComputedStyle(document.documentElement),ink=css.getPropertyValue('--color-ink').trim(),paper=css.getPropertyValue('--color-paper-3').trim(),shadow=css.getPropertyValue('--color-shadow').trim();
const soloScenes=[['still','自然陪伴'],['blink','努力眨一只眼'],['star','星点躲猫猫'],['shadow','影子怎么甩不掉']];
let stored={};try{stored=JSON.parse(localStorage.getItem('xingcheng-q-hub-v1')||'{}')}catch{}
let shape=catalog.shapes.some(s=>s.id===stored.shape)?stored.shape:'round',colors=avatar.normalizeColors(stored),soloScene='still',petScene='prank',count=3,tab='avatar',paused=matchMedia('(prefers-reduced-motion: reduce)').matches,theatrePaused=paused,soloTime=0,petTime=0,currentSolo,currentPets,petLead=null,activeExport=null,toastTimer;
const stateName=()=>catalog.shapes.find(s=>s.id===shape).name+'-'+catalog.colors.find(c=>c.id===colors[shape]).name;
const params=new URLSearchParams(location.search);if(catalog.shapes.some(s=>s.id===params.get('shape')))shape=params.get('shape');if(catalog.colors.some(c=>c.id===params.get('color')))colors[shape]=params.get('color');if(soloScenes.some(s=>s[0]===params.get('motion')))soloScene=params.get('motion');
const dataSVG=s=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
function remember(){try{localStorage.setItem('xingcheng-q-hub-v1',JSON.stringify({shape,avatarShape:shape,avatarColor:colors[shape],avatarColors:colors}))}catch{}}
function say(text){$('message').textContent=text;$('message').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('message').hidden=true,5500)}
function button(text,fn,cls){const b=document.createElement('button');b.type='button';b.textContent=text;if(cls)b.className=cls;b.addEventListener('click',fn);return b}
function seed(){let n=73;return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296}}
function makeModel(kind,scene,petCount=count){
 const appearance=createAppearance();appearance.setProfile({avatarShape:shape,avatarColor:colors[shape],avatarColors:colors});
 const isSolo=kind==='solo',n=isSolo?1:petCount,worldWidth=!isSolo&&matchMedia('(max-width:640px)').matches?250:350,stage=new Stage(worldWidth,n,appearance,{random:seed()});stage.auto=false;
 const ids=isSolo?[shape]:[shape,...catalog.shapes.map(s=>s.id).filter(s=>s!==shape)].slice(0,n);
 stage.pets.forEach((p,i)=>{p.id=ids[i];p.x=isSolo?126:25+i*(worldWidth-50)/Math.max(1,n-1);p.alpha=1});
 if(scene!=='still'){let casting;if(!isSolo&&petLead&&ids.includes(petLead)){casting=stage.mixer.pick(stage.pets,LIBRARY,scene);if(casting){casting.leadId=petLead;if(casting.partnerId===petLead)casting.partnerId=ids.find(id=>id!==petLead)||petLead}}stage.start(scene,casting?{casting}:{})}
 const duration=stage.duration||4, bounds={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};
 if(scene!=='still')for(let t=0;t<=duration+.025;t+=.04){stage.seek(Math.min(t,duration));for(const p of stage.pets){const m=appearance.metrics(appearance.get(p.id),stage.radius,p);bounds.left=Math.min(bounds.left,p.x+m.left);bounds.right=Math.max(bounds.right,p.x+m.right);bounds.top=Math.min(bounds.top,-p.lift-m.height);bounds.bottom=Math.max(bounds.bottom,-p.lift)}if(stage.prop){bounds.left=Math.min(bounds.left,stage.prop.x-6);bounds.right=Math.max(bounds.right,stage.prop.x+6);bounds.top=Math.min(bounds.top,-stage.prop.lift-12)}}
 if(scene==='still'){bounds.left=95;bounds.right=157;bounds.top=-60;bounds.bottom=12}
 const cx=(bounds.left+bounds.right)/2,cy=(bounds.top+bounds.bottom)/2;
 const minWidth=isSolo?42:worldWidth,minHeight=isSolo?42:100;
 const view={cx,cy,w:Math.max(minWidth,bounds.right-bounds.left+(isSolo?18:26)),h:Math.max(minHeight,bounds.bottom-bounds.top+(isSolo?18:30))};
 if(isSolo&&scene==='still')Object.assign(view,{cx:126,cy:-14,w:42,h:42});
 if(scene!=='still')stage.seek(0);
 return {stage,appearance,kind,scene,duration,view};
}
function draw(model,canvas,time,{background=false}={}){
 const ctx=canvas.getContext('2d'),{stage,appearance,scene,view}=model,w=canvas.width,h=canvas.height;
 ctx.clearRect(0,0,w,h);if(background){ctx.fillStyle=paper;ctx.fillRect(0,0,w,h)}
 if(scene!=='still')stage.seek(Math.min(time,model.duration));
 const scale=Math.min(w/view.w,h/view.h)*.9;
 ctx.save();ctx.translate(w/2,h/2);ctx.scale(scale,scale);ctx.translate(-view.cx,-view.cy);
 for(const p of stage.pets){const r=stage.radius,m=appearance.metrics(appearance.get(p.id),r,p);ctx.save();ctx.globalAlpha=.2*(p.alpha??1);ctx.fillStyle=shadow;ctx.beginPath();ctx.ellipse(p.x,2,r*.8/(1+(p.lift||0)*.025),2,0,0,Math.PI*2);ctx.fill();ctx.restore();appearance.draw(ctx,appearance.get(p.id),p.x,0,r,p)}
 if(stage.prop&&stage.prop.alpha>0){const p=stage.prop;ctx.globalAlpha=p.alpha;ctx.fillStyle=ink;ctx.beginPath();ctx.arc(p.x,-p.lift-7,p.r||3,0,Math.PI*2);ctx.fill()}
 ctx.restore();
}
function updateChoices(){
 $('shape-list').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.shape===shape)));
 $('color-list').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.color===colors[shape])));
 $('solo-scenes').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===soloScene)));
 $('selection-label').textContent=stateName().replace('-',' · ');$('color-label').textContent=catalog.colors.find(c=>c.id===colors[shape]).name;
 $('shape-list').querySelectorAll('img').forEach(img=>img.src=dataSVG(avatar.svg(img.dataset.shape,colors[img.dataset.shape])));
 $('play-toggle').textContent=paused?'播放':'暂停';$('play-toggle').setAttribute('aria-pressed',String(paused));
 const ids=currentPets.stage.pets.map(p=>p.id).join(',');if($('pet-greetings').dataset.ids!==ids){$('pet-greetings').replaceChildren(...currentPets.stage.pets.map(p=>button('和'+appearanceName(p.id)+'打招呼',()=>greet(p.id),'quiet')));$('pet-greetings').dataset.ids=ids}
 $('theatre-play').textContent=theatrePaused?'播放':'暂停';$('theatre-play').setAttribute('aria-pressed',String(theatrePaused));
 $('theatre-scenes').querySelectorAll('button').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.scene===petScene));b.disabled=!!LIBRARY[b.dataset.scene].pair&&count===1});
 $('save-gif').textContent=soloScene==='still'?'保存眨眼 GIF':'保存动画 GIF';
}
function refresh(){currentSolo=makeModel('solo',soloScene);currentPets=makeModel('pets',petScene);soloTime=0;petTime=0;updateChoices();draw(currentSolo,$('avatar-canvas'),0);draw(currentPets,$('theatre-canvas'),0);$('avatar-fallback').hidden=true;remember();try{const url=new URL(location.href);url.searchParams.set('shape',shape);url.searchParams.set('color',colors[shape]);url.searchParams.set('motion',soloScene);history.replaceState(null,'',url)}catch{}}
for(const s of catalog.shapes){const b=button('',()=>{shape=s.id;refresh()},'shape-option');b.dataset.shape=s.id;b.setAttribute('aria-label',s.name);const img=new Image(44,44);img.dataset.shape=s.id;img.alt='';b.append(img,document.createTextNode(s.name));$('shape-list').append(b)}
for(const color of catalog.colors){const b=button('',()=>{colors[shape]=color.id;refresh()},'color-swatch');b.dataset.color=color.id;b.title=color.name;b.setAttribute('aria-label',color.name);const img=new Image(24,24);img.alt='';img.src=dataSVG('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="11" fill="'+color.hex+'"/></svg>');b.append(img);$('color-list').append(b)}
for(const [id,name]of soloScenes){const b=button(name,()=>{soloScene=id;soloTime=0;paused=false;refresh()});b.dataset.scene=id;$('solo-scenes').append(b)}
for(const [id,scene]of Object.entries(LIBRARY)){const b=button(scene.label,()=>{petScene=id;petLead=null;petTime=0;theatrePaused=false;currentPets=makeModel('pets',id);updateChoices()});b.dataset.scene=id;$('theatre-scenes').append(b)}
for(const ref of QHubReferences){const f=document.createElement('figure'),img=new Image(512,512);img.src=ref.path;img.alt=ref.name;img.loading='lazy';const cap=document.createElement('figcaption');cap.append(document.createTextNode(ref.name));const a=document.createElement('a');a.href=ref.path;a.download='';a.textContent='保存 PNG';cap.append(a);f.append(img,cap);$('brand-references').append(f)}
function setTab(){tab=['avatar','theatre','brand'].includes(location.hash.slice(1))?location.hash.slice(1):'avatar';for(const id of ['avatar','theatre','brand'])$(id+'-panel').hidden=id!==tab;document.querySelectorAll('.topbar nav a').forEach(a=>{if(a.hash==='#'+tab)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});document.querySelector('.page-heading').hidden=tab!=='avatar';document.querySelectorAll('video').forEach(v=>v.pause());last=performance.now()}
window.addEventListener('hashchange',setTab);
$('reset-avatar').onclick=()=>{shape='round';colors=avatar.normalizeColors({});soloScene='still';refresh();say('已恢复标准橙色圆形Q。')};
$('background').onclick=()=>{const dark=document.querySelector('.stage-region').classList.toggle('dark');$('background').textContent=dark?'浅色底':'深色底';$('background').setAttribute('aria-pressed',String(dark))};
$('play-toggle').onclick=()=>{paused=!paused;updateChoices()};$('avatar-stage-button').onclick=()=>{soloScene='blink';soloTime=0;paused=false;refresh()};
$('pet-count').onchange=()=>{count=Number($('pet-count').value);if(count===1&&LIBRARY[petScene].pair)petScene='shadow';currentPets=makeModel('pets',petScene);petTime=0;updateChoices()};
$('theatre-play').onclick=()=>{theatrePaused=!theatrePaused;updateChoices()};$('theatre-replay').onclick=()=>{petTime=0;theatrePaused=false;updateChoices()};
$('theatre-seek').oninput=()=>{petTime=Number($('theatre-seek').value)/100*currentPets.duration;theatrePaused=true;draw(currentPets,$('theatre-canvas'),petTime);updateChoices()};
function greet(id){petLead=id;petScene='blink';petTime=0;currentPets=makeModel('pets',petScene);theatrePaused=false;updateChoices()}
$('theatre-canvas').onclick=e=>{const canvas=e.currentTarget,rect=canvas.getBoundingClientRect(),{view}=currentPets,paintScale=Math.min(rect.width/canvas.width,rect.height/canvas.height),drawWidth=canvas.width*paintScale,left=(rect.width-drawWidth)/2,innerX=(e.clientX-rect.left-left)/paintScale,scale=Math.min(canvas.width/view.w,canvas.height/view.h)*.9,worldX=(innerX-canvas.width/2)/scale+view.cx;const pet=currentPets.stage.pets.reduce((a,b)=>Math.abs(a.x-worldX)<Math.abs(b.x-worldX)?a:b);greet(pet.id)};
function fitTheatre(){const mobile=matchMedia('(max-width:640px)').matches;$('theatre-canvas').width=mobile?640:1000;$('theatre-canvas').height=420;currentPets=makeModel('pets',petScene);petTime=0;draw(currentPets,$('theatre-canvas'),0)}
matchMedia('(max-width:640px)').addEventListener('change',fitTheatre);

function appearanceName(id){return catalog.shapes.find(s=>s.id===id)?.name||'星橙Q'}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
async function savePNG(kind){try{const model=kind==='solo'?currentSolo:currentPets,size=kind==='solo'?Number($('export-size').value):1024,canvas=document.createElement('canvas');canvas.width=size;canvas.height=kind==='solo'?size:480;draw(model,canvas,kind==='solo'?soloTime:petTime);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('图片生成失败');download(blob,'星橙Q-'+(kind==='solo'?stateName():LIBRARY[petScene].label)+'.png');say('图片已准备好，请在浏览器下载中查看。')}catch(e){say('图片未保存成功，请重试。')}}
$('save-png').onclick=()=>savePNG('solo');$('theatre-png').onclick=()=>savePNG('pets');
function setBusy(busy){for(const id of ['save-gif','theatre-gif','save-png','theatre-png'])$(id).disabled=busy;$('export-notice').hidden=!busy}
async function saveGIF(kind){
 if(activeExport)return;
 const exportName=stateName(),scene=kind==='solo'?(soloScene==='still'?'blink':soloScene):petScene,model=makeModel(kind,scene),size=kind==='solo'?Number($('export-size').value):640,h=kind==='solo'?size:300;
 const job={worker:null,cancelled:false};activeExport=job;setBusy(true);$('export-title').textContent='正在制作 GIF 动画';$('export-progress').textContent='正在准备完整动作…';
 try{
  const worker=new Worker('portal/gif-worker.js');job.worker=worker;
  let rejectPending;
  const send=(message,transfer=[])=>new Promise((resolve,reject)=>{rejectPending=reject;worker.onmessage=e=>{rejectPending=null;if(e.data.error)reject(Error(e.data.error));else resolve(e.data)};worker.onerror=()=>reject(Error('动画组件加载失败'));worker.postMessage(message,transfer)});
  job.abort=()=>{job.cancelled=true;worker.terminate();if(rejectPending)rejectPending(Error('cancelled'))};
  await send({type:'start',width:size,height:h});
  const canvas=document.createElement('canvas');canvas.width=size;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const fps=12,frames=Math.ceil(model.duration*fps)+1;
  for(let i=0;i<frames;i++){
   if(job.cancelled)throw Error('cancelled');draw(model,canvas,Math.min(i/fps,model.duration),{background:true});const data=ctx.getImageData(0,0,size,h).data;
   await send({type:'frame',data:data.buffer,delay:(Math.round((i+1)*100/fps)-Math.round(i*100/fps))*10},[data.buffer]);$('export-progress').textContent='正在生成 '+Math.round((i+1)/frames*100)+'%，请稍候。';
  }
  const result=await send({type:'finish'});if(job.cancelled)throw Error('cancelled');
  download(new Blob([result.bytes],{type:'image/gif'}),'星橙Q-'+(kind==='solo'?exportName+'-'+soloScenes.find(s=>s[0]===scene)[1]:LIBRARY[scene].label)+'.gif');say('动画已准备好，请在浏览器下载中查看。');
 }catch(e){say(job.cancelled?'已取消生成，可以重新选择。':'动画未能生成，请重试，或先保存图片。')}finally{job.worker?.terminate();activeExport=null;setBusy(false)}
}
$('save-gif').onclick=()=>saveGIF('solo');$('theatre-gif').onclick=()=>saveGIF('pets');$('cancel-export').onclick=()=>activeExport?.abort?.();
$('saved-kind').textContent='图片透明底，动画暖白底，保存完整动作。';
let last=performance.now();function animate(now){const dt=Math.min(.08,(now-last)/1000);last=now;if(!document.hidden){if(tab==='avatar'){if(!paused)soloTime=(soloTime+dt)%currentSolo.duration;draw(currentSolo,$('avatar-canvas'),soloTime);$('scene-caption').textContent=soloScene==='still'?'不赶时间，陪你待一会儿。':currentSolo.stage.beat}else if(tab==='theatre'){if(!theatrePaused)petTime=(petTime+dt)%currentPets.duration;draw(currentPets,$('theatre-canvas'),petTime);$('theatre-seek').value=petTime/currentPets.duration*100;$('theatre-time').textContent=petTime.toFixed(1)+' / '+currentPets.duration.toFixed(1)+' 秒';$('theatre-caption').textContent=currentPets.stage.beat}}requestAnimationFrame(animate)}
refresh();fitTheatre();setTab();requestAnimationFrame(animate);
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{paused=e.matches;theatrePaused=e.matches;updateChoices()});
})();
