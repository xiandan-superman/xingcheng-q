const canvas=document.querySelector('canvas'),make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c},player=new QPlayer.Renderer(canvas,'candidate',make);
const labels={'feedback:pending':'等待思考','feedback:success':'成功反馈','feedback:failure':'失败后陪伴',idle:'安静陪伴',snack:'原有零食剧情'};
const durations={'feedback:pending':9.2,'feedback:success':1.8,'feedback:failure':9.2,idle:8.2,snack:15.8};
let state='feedback:pending',time=0,last=performance.now(),paused=matchMedia('(prefers-reduced-motion:reduce)').matches,job=null;
for(const [id,name]of Object.entries(labels)){const b=document.createElement('button');b.type='button';b.textContent=name;b.onclick=()=>{state=id;time=.7;mark()};b.dataset.state=id;document.querySelector('#buttons').append(b)}
function mark(){document.querySelectorAll('[data-state]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.state===state))}mark();
const still=document.querySelector('#still');still.checked=paused;document.querySelector('#pause').onclick=()=>{paused=!paused;document.querySelector('#pause').textContent=paused?'继续':'暂停'};
function frame(now){const dt=Math.max(0,Math.min(.08,(now-last)/1000));last=now;if(!paused&&!document.hidden)time+=dt;const duration=state==='snack'?15.8:state==='idle'?8.2:30;if(time>duration)time=0;player.render(state,time,{still:still.checked});if(!job)document.querySelector('#status').textContent='当前：'+labels[state]+'，'+time.toFixed(1)+'秒';requestAnimationFrame(frame)}requestAnimationFrame(frame);
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)}
document.querySelector('#save-png').onclick=()=>canvas.toBlob(blob=>{if(blob)download(blob,'星橙Q-'+labels[state]+'.png')});
document.querySelector('#cancel').onclick=()=>job?.cancel();
document.querySelector('#save-gif').onclick=async()=>{
 if(job)return;const selected=state,renderer=new QPlayer.Renderer(make(320,320),'candidate',make),output=renderer.canvas,ctx=output.getContext('2d',{willReadFrequently:true});
 const worker=new Worker('../../portal/gif-worker.js');let rejectPending,cancelled=false;job={cancel(){cancelled=true;worker.terminate();rejectPending?.(Error('cancelled'))}};
 const send=(message,transfer=[])=>new Promise((resolve,reject)=>{rejectPending=reject;worker.onmessage=e=>e.data.error?reject(Error(e.data.error)):resolve(e.data);worker.onerror=()=>reject(Error('worker'));worker.postMessage(message,transfer)});
 document.querySelector('#save-gif').disabled=true;document.querySelector('#cancel').hidden=false;
 try{await send({type:'start',width:320,height:320});const frames=Math.ceil(durations[selected]*12)+1;
 for(let i=0;i<frames;i++){if(cancelled)throw Error('cancelled');renderer.render(selected,Math.min(i/12,durations[selected]),{cut:i===0});ctx.save();ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#faf6ee';ctx.fillRect(0,0,320,320);ctx.restore();const data=ctx.getImageData(0,0,320,320).data;await send({type:'frame',data:data.buffer,delay:(Math.round((i+1)*100/12)-Math.round(i*100/12))*10},[data.buffer]);document.querySelector('#status').textContent='正在制作动画：'+Math.round((i+1)/frames*100)+'%'}
 const result=await send({type:'finish'});download(new Blob([result.bytes],{type:'image/gif'}),'星橙Q-'+labels[selected]+'.gif');
 }catch(e){document.querySelector('#status').textContent=cancelled?'已取消生成':'生成失败，请重试。'}finally{worker.terminate();job=null;document.querySelector('#save-gif').disabled=false;document.querySelector('#cancel').hidden=true}
};
