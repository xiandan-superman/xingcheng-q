(function(){
const $=id=>document.getElementById(id),Q=QReview,R=QRefinement;
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const before=new Q.Renderer($('before'),'baseline',canvas),after=new Q.Renderer($('after'),'candidate',canvas);
const original=Q.originalPlaylist(),candidate=Q.candidatePlaylist(),feedback=new Q.Feedback();
const cssMain=$('css-before'),cssSmall=cssMain.cloneNode(true);cssSmall.removeAttribute('id');cssSmall.classList.add('css-mini');$('before-small').parentElement.append(cssSmall);
let mode='continuous',selected='idle',time=0,playing=true,lastNow=null,raf=null,lastUI=-1,pendingTimer=null,feedbackToken=null,loopIteration=-1;
let reducedBySystem=matchMedia('(prefers-reduced-motion: reduce)').matches;$('still').checked=reducedBySystem;if(reducedBySystem)playing=false;
const messages={idle:'等你操作',pending:'正在处理…',success:'处理完成',failure:'这次未完成，可以重试',cancelled:'已取消等待'};
function maxTime(){return mode==='continuous'?candidate.at(-1).at+candidate.at(-1).duration:mode==='feedback'?12:Q.LIBRARY[selected].duration;}
function cssPhase(visible,t){
 const alpha=visible?Math.max(0,Math.min(1,(4.11-t)/.16)):0;
 for(const el of [cssMain,cssSmall]){el.style.display=alpha>0?'block':'none';el.style.opacity=String(alpha);for(const animation of el.getAnimations({subtree:true})){animation.pause();animation.currentTime=Math.min(t,3.95)*1000;}}
 $('before').style.opacity=String(1-alpha);$('before-small').style.opacity=String(1-alpha);
}
function copy(source,target){const c=target.getContext('2d');c.clearRect(0,0,target.width,target.height);c.drawImage(source,0,0,target.width,target.height);}
function draw(force=false){
 const still=$('still').checked;let b,a;
 if(mode==='continuous'){
  const left=Q.locate(original,time),right=Q.locate(candidate,time);b={name:left.name,t:left.time-left.at};a={name:right.name,t:right.time-right.at};
 }else if(mode==='feedback'){
  const phase=feedback.tick(time);b={name:'idle',t:time%8.2};a={name:'feedback:'+phase,t:Math.max(0,time-feedback.since)};
 }else{b={name:Q.OLD[selected]?selected:'idle',t:Q.OLD[selected]?time:time%8.2};a={name:selected,t:time};}
 if(still){b={name:'idle',t:0};if(mode!=='feedback')a={name:'idle',t:0};}
 before.render(b.name,b.t,{cut:force,still});after.render(a.name,a.t,{cut:force,still});
 copy($('before'),$('before-small'));copy($('after'),$('after-small'));
 cssPhase(b.name==='idle'&&b.t<4.11&&!still,b.t);
 $('before-caption').textContent=mode==='feedback'?'当前首页按原小剧场播放':(Q.OLD[b.name]?.label||'留心观察')+(mode==='scene'&&!Q.OLD[selected]?' · 原首页没有此动作':'');
 $('after-caption').textContent=a.name.startsWith('feedback:')?messages[feedback.phase]:Q.LIBRARY[a.name].label;
 const bucket=Math.floor(time*10);if(force||bucket!==lastUI){$('clock').value=time.toFixed(2)+' 秒';if(mode==='feedback')$('timeline').max=Math.max(12,time);$('timeline').value=time;lastUI=bucket;}
 if(mode==='feedback'){$('feedback-status').textContent=messages[feedback.phase];$('success').disabled=feedback.phase!=='pending';$('failure').disabled=feedback.phase!=='pending';$('cancel').disabled=feedback.phase!=='pending';}
}
function frame(now){raf=null;if(lastNow!==null&&playing&&!$('still').checked)time+=Math.min(.08,(now-lastNow)/1000)*Number($('speed').value);lastNow=now;
 if(mode==='scene'&&time>maxTime()){time=maxTime();playing=false;}
 if(mode==='continuous'&&time>maxTime()){time=0;before.reset();after.reset();}
 draw();$('play').textContent=playing?'暂停':'继续播放';if(playing&&!document.hidden&&!$('still').checked)raf=requestAnimationFrame(frame);
}
function schedule(){if(raf!==null)cancelAnimationFrame(raf);raf=null;lastNow=null;draw();if(playing&&!document.hidden&&!$('still').checked)raf=requestAnimationFrame(frame);$('play').textContent=playing?'暂停':'继续播放';}
function updateControls(){
 $('continuous').setAttribute('aria-pressed',String(mode==='continuous'));
 for(const el of document.querySelectorAll('[data-scene]'))el.setAttribute('aria-pressed',String(mode==='scene'&&selected===el.dataset.scene));
 $('timeline').max=maxTime();$('timeline').disabled=mode==='feedback';$('timeline-label').textContent=mode==='continuous'?'连播时间':mode==='feedback'?'反馈时间':'片段进度';
 $('context').textContent=mode==='continuous'?'两侧按各自首页编排连续播放。点选下方片段，可用相同时间对照。':mode==='feedback'?'本地状态演示：左侧保留当前首页行为，右侧展示候选的响应与衔接。':Q.OLD[selected]?'同一完整剧情、相同时刻。可暂停、半速或拖动查看。':'新短剧情对照：左侧为当前待机，右侧为新剧情。';
}
function leaveFeedback(){clearTimeout(pendingTimer);feedback.cancel(time);feedback.phase='idle';feedbackToken=null;for(const id of ['success','failure','cancel'])$(id).disabled=true;}
function selectScene(id){leaveFeedback();mode='scene';selected=id;time=0;playing=!$('still').checked;before.reset();updateControls();schedule();}
for(const [id,meta]of Object.entries(Q.LIBRARY)){const button=document.createElement('button');button.type='button';button.dataset.scene=id;button.setAttribute('aria-pressed','false');button.textContent=meta.label;const small=document.createElement('small');small.textContent=meta.duration.toFixed(1)+'秒';button.append(small);button.addEventListener('click',()=>selectScene(id));$(Q.OLD[id]?'original-clips':'new-clips').append(button);}
$('continuous').addEventListener('click',()=>{leaveFeedback();mode='continuous';time=0;playing=!$('still').checked;before.reset();updateControls();schedule();});
$('play').addEventListener('click',()=>{if(mode==='scene'&&time>=maxTime())time=0;playing=!playing;schedule();});
$('replay').addEventListener('click',()=>{if(mode==='feedback')leaveFeedback();time=0;before.reset();after.reset();playing=!$('still').checked;updateControls();schedule();});
$('speed').addEventListener('change',schedule);
$('timeline').addEventListener('input',()=>{if(mode==='feedback')return;time=Number($('timeline').value);playing=false;before.reset();after.reset();draw(true);schedule();});
$('still').addEventListener('change',()=>{if(!$('still').checked){lastNow=null;playing=true;}schedule();});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{$('still').checked=e.matches;playing=!e.matches;schedule();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf!==null)cancelAnimationFrame(raf);raf=null;lastNow=null;}else schedule();});
function feedbackMode(){if(mode!=='feedback'){mode='feedback';time=0;feedback.since=0;}playing=!$('still').checked;updateControls();}
$('request').addEventListener('click',()=>{clearTimeout(pendingTimer);feedbackMode();feedbackToken=feedback.begin(time);$('feedback-note').textContent='正在模拟处理。点击完成、失败或取消，检查不同结果如何接上当前动作。';schedule();});
for(const [id,ok]of [['success',true],['failure',false]])$(id).addEventListener('click',()=>{feedbackMode();feedback.settle(feedbackToken,ok,time);schedule();});
$('cancel').addEventListener('click',()=>{clearTimeout(pendingTimer);feedbackMode();feedback.cancel(time);$('feedback-note').textContent='已取消。恢复安静姿态，不等待动画结束才允许继续操作。';schedule();});
$('late').addEventListener('click',()=>{clearTimeout(pendingTimer);feedbackMode();const token=feedback.begin(time);feedback.cancel(time);$('feedback-note').textContent='已取消，稍后会模拟旧请求返回完成；这条过期结果应被忽略。';schedule();pendingTimer=setTimeout(()=>{const accepted=feedback.settle(token,true,time);$('feedback-note').textContent=accepted?'校验失败：过期结果被接收':'旧请求已返回，结果已忽略，没有触发庆祝。';draw();},1400);});
function drawSizes(){const A=QSource.require('/components/xingcheng-q-motion/appearance'),M=QSource.require('/components/xingcheng-q-motion/core');for(const variant of ['before','after'])for(const bodySize of [32,48,84]){const box=document.createElement('div');box.className='size-item';const c=canvas(256,256);c.style.width=(bodySize*1.35)+'px';c.style.height=(bodySize*1.35)+'px';const g=c.getContext('2d'),k=256/(252*1.35);g._qCandidate=variant==='after';g.translate(128,128);g.scale(k,k);A.drawBody(g,()=>{g.beginPath();g.arc(0,0,126,0,Math.PI*2);g.closePath();},126,{simple:false});A.drawBrandStar(g,{},'home',{autoOptical:false});M.drawFace(g,{eyeOpenL:.9,eyeOpenR:.9,eyeX:0,eyeY:0,scaleX:1,scaleY:1});box.append(c);const label=document.createElement('span');label.textContent=bodySize+'px';box.append(label);$('sizes-'+variant).append(box);}}
window.qReviewApp={before,after,feedback,selectScene,seek(t){time=t;playing=false;before.reset();after.reset();draw(true);schedule();},get state(){return {mode,selected,time,playing,phase:feedback.phase,ignored:feedback.ignored,rafActive:raf!==null};}};
for(const id of ['success','failure','cancel'])$(id).disabled=true;drawSizes();updateControls();schedule();
})();
