/* Original choreography, independent of a drawing engine or future shape assets. */

'use strict';
const {Mixer}=require('./scheduler');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=x=>{x=clamp(x);return x*x*x*(10+x*(-15+6*x));};
const lerp=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2;
const neutral={x:0,lift:0,sx:1,sy:1,rot:0,gaze:0,eyeY:0,openL:.9,openR:.9,smile:0,alpha:1};
const LIBRARY={
 prank:{label:'偷戳后装睡',seconds:9,pair:true},
 chase:{label:'追过头了',seconds:8.9,pair:true},
 bounce:{label:'软团子弹回来',seconds:8.5,pair:true},
 peek:{label:'溜出去又探回来',seconds:10.2},
 nap:{label:'借个肩膀打盹',seconds:10.8,pair:true},
 seat:{label:'空位被谁占了',seconds:9.5,pair:true},
 contest:{label:'轮流蹦高',seconds:9.4,pair:true},
 shadow:{label:'影子怎么甩不掉',seconds:8.4},
 star:{label:'星点躲猫猫',seconds:9.2},
 mimic:{label:'你动我也动',seconds:10,pair:true},
 pass:{label:'星点传来又传走',seconds:10.5,pair:true},
 blink:{label:'努力眨一只眼',seconds:9.1}
};
function valueAt(segments,key,t,initial){let v=initial;for(const s of segments){if(s.key!==key||t<s.at)continue;v=t>=s.at+s.d?s.to:lerp(s.from,s.to,ease((t-s.at)/s.d));}return v;}
class Track{
 constructor(initial){this.initial={...neutral,...initial};this.segments=[];}
 to(at,d,pose){for(const [key,to]of Object.entries(pose)){const from=valueAt(this.segments,key,at,this.initial[key]??0);this.segments.push({key,at,d,from,to});}return this;}
 sample(t){const out={...this.initial};for(const key of Object.keys(out))out[key]=valueAt(this.segments,key,t,out[key]);return out;}
}
function trackFrom(raw){const t=new Track(raw.initial);t.segments=raw.segments;return t;}
function build(name,pets,w,r,seed,welcomeId,casting={}){
 const sorted=pets.filter(p=>!p.retiring).slice().sort((a,b)=>a.x-b.x);
 const lead=sorted.find(p=>p.id===casting.leadId),partner=sorted.find(p=>p.id===casting.partnerId);
 const rightFirst=name==='chase'||name==='peek';
 const sign=lead&&partner&&lead!==partner?((lead.x>partner.x)===rightFirst?1:-1):(casting.direction|| (seed%2===0?1:-1));
 const world=x=>sign>0?x:w-x,look=v=>v*sign;
 const n=sorted.length;
 const baseIndex=name==='peek'?Math.max(0,n-2):name==='bounce'?Math.max(0,n-3):Math.max(0,Math.floor(n/2)-1);
 const fallbackIndex=sign>0?baseIndex:Math.max(0,n-2-baseIndex);
 const low=sorted[fallbackIndex]||sorted[0],high=sorted[fallbackIndex+1]||low;
 const aOnRight=rightFirst?sign>0:sign<0;
 const a=lead||(aOnRight?high:low),b=partner||(aOnRight?low:high);
 const pairIndex=Math.min(sorted.indexOf(a),sorted.indexOf(b));
 const extras=sorted.filter(p=>p!==a&&p!==b),d=r*2;
 let startA=w*.36,startB=startA+d+24;
 if(name==='chase'){startA=Math.max(w*.40,4*r+72);startB=startA-d-16;}
 if(name==='bounce'){startB=Math.min(w-52,Math.max(158,w*.59));startA=startB-d-24;}
 if(name==='nap'){startA=w*.46;startB=startA+d+5;}
 if(name==='seat'){startA=w*.5-r-30;startB=w*.5+r+30;}
 if(name==='peek'){startB=Math.max(w*.33,(n-2)*(d+6)+r+12);startA=Math.max(w*.68,startB+d+16);}
 const targets=new Map([[a.id,world(startA)]]);if(b!==a)targets.set(b.id,world(startB));
 let leftLimit=Math.min(startA,startB)-d-6,rightLimit=Math.max(startA,startB)+d+6;
 if(name==='bounce')rightLimit=startB+2*d+29;
 if(name==='chase'){leftLimit=Math.min(startB,w*.30)-d-6;rightLimit=w-75+d+6;}
 const actualLeft=sign>0?leftLimit:w-rightLimit,actualRight=sign>0?rightLimit:w-leftLimit;
 const leftExtras=extras.filter(p=>sorted.indexOf(p)<pairIndex),rightExtras=extras.filter(p=>!leftExtras.includes(p));
 leftExtras.forEach((p,i)=>targets.set(p.id,leftExtras.length===1?22:lerp(22,Math.max(22,actualLeft),i/(leftExtras.length-1))));
 rightExtras.forEach((p,i)=>targets.set(p.id,rightExtras.length===1?w-22:lerp(Math.min(w-22,actualRight),w-22,i/(rightExtras.length-1))));
 const tracks={};
 pets.forEach(p=>tracks[p.id]=new Track({...neutral,x:targets.get(p.id)??p.x,gaze:0}));
 const A=tracks[a.id],B=tracks[b.id];
 const move=(track,at,seconds,x,pose={})=>track.to(at,seconds,{x:world(x),...pose});
 const pose=(track,at,seconds,vals)=>track.to(at,seconds,vals);
 const gaze=(track,at,seconds,x,y=0)=>pose(track,at,seconds,{gaze:look(x),eyeY:y});
 const arcs=[];
 const arc=(track,at,seconds,from,to,peak,endLift=0)=>{move(track,at,seconds,to);arcs.push({id:Object.keys(tracks).find(id=>tracks[id]===track),at,seconds,startLift:0,endLift,peak:peak*r/14});};
 const beats=[],say=(at,text)=>beats.push({at,text});
 let prop=null,contact=null,guest=null;
 if(name==='prank'){
  say(0,'它先看了看伙伴，悄悄靠近。');gaze(A,0,.35,20);gaze(B,0,.35,18);
  move(A,.5,.55,startA+9);move(A,1.2,.62,startB-d+1,{rot:look(.10),sy:.96,sx:1.04});
  say(1.84,'碰一下，马上闭眼装睡。');move(B,1.84,.15,startB+2,{sy:.93,sx:1.07,openL:1.15,openR:1.15});
  move(A,1.9,.24,startB-d-2,{rot:look(-.055),openL:.06,openR:.06});
  pose(B,2.02,.32,{sy:1,sx:1});gaze(B,2.15,.36,-21);pose(B,2.35,.3,{rot:look(-.07)});
  say(2.7,'伙伴回头检查，它一动不动。');gaze(B,3.55,.4,18);pose(B,3.55,.4,{rot:0});
  say(4.12,'刚偷睁开一只眼，伙伴又回头了。');pose(A,4.12,.25,{openL:.08,openR:.92,gaze:look(17)});
  gaze(B,4.7,.23,-22);pose(A,4.82,.14,{openL:.06,openR:.06});
  pose(B,5.15,.3,{openL:.7,openR:.95,smile:.25});
  say(5.8,'伙伴轻轻碰回来，这回装不下去了。');move(B,5.85,.62,startB-4,{rot:look(-.09)});
  move(A,6.45,.19,startB-d-7,{sy:.87,sx:1.13,openL:1.14,openR:1.14});
  pose(A,6.64,.3,{sy:1.04,sx:.96,lift:3,rot:look(-.09)});pose(A,6.94,.3,{sy:1,sx:1,lift:0,rot:0});
  gaze(A,6.65,.35,21);gaze(B,6.65,.3,-19);pose(B,7.3,.4,{smile:.62,rot:0});
  say(7.7,'互相看一眼，假装刚才什么也没发生。');gaze(A,7.7,.5,0);pose(A,7.7,.5,{openL:.75,openR:.9});
  contact={kind:'nudge',a:a.id,b:b.id,from:1.8,to:2.15};
 }else if(name==='chase'){
  say(0,'先逗一下，再蓄力开跑。');gaze(A,0,.3,-21);gaze(B,0,.3,20);
  move(A,.45,.28,startA-6,{smile:.42,rot:look(-.08)});
  pose(B,.76,.35,{openL:1.08,openR:1.08,sy:.82,sx:1.15});pose(A,.85,.25,{sy:.82,sx:1.15,rot:look(.12)});
  move(A,1.12,1.42,w-115,{sy:1,sx:1,gaze:look(18)});move(B,1.5,1.72,w-75,{sy:1,sx:1,rot:look(.12)});
  say(2.04,'前面的突然让路，后面的没刹住。');pose(A,2.08,.22,{sy:.60,sx:1.4,openL:.32,openR:.32,rot:0});
  arcs.push({id:b.id,at:2.05,seconds:.95,startLift:0,endLift:0,peak:27*r/14});
  pose(B,3.18,.13,{sy:.72,sx:1.3,rot:look(-.1)});pose(B,3.31,.4,{sy:1,sx:1,rot:0});
  pose(A,3.05,.58,{sy:1,sx:1,openL:.9,openR:.9});gaze(A,3.5,.35,19);
  say(3.7,'跑远了才发现，对方还在身后。');gaze(B,4.0,.5,-22);pose(B,4.0,.3,{openL:1.07,openR:1.07});pose(A,4.2,.4,{smile:.56});
  say(5.2,'这次换你追我，双方先刹住再转身。');pose(A,5.15,.3,{sy:.82,sx:1.16,smile:0,gaze:look(-18)});pose(B,5.4,.3,{sy:.81,sx:1.16,gaze:look(-20)});
  move(A,5.55,1.5,w*.30,{sy:1,sx:1});move(B,5.85,1.6,w*.30+d+8,{sy:1,sx:1});
  gaze(A,7.4,.4,20);gaze(B,7.5,.4,-20);say(7.8,'追到了，留一点距离，互相盯一会儿。');
  contact={kind:'vault',a:a.id,b:b.id,from:2.05,to:3.0};
 }else if(name==='bounce'){
  say(0,'它看中了伙伴软乎乎的肩膀。');gaze(A,0,.4,20,-10);pose(B,0,.4,{openL:.62,openR:.62});
  pose(A,.8,.42,{sy:.72,sx:1.25,eyeY:11});
  arc(A,1.25,1.15,startA,startB,26,d);pose(A,1.25,.18,{sy:1.08,sx:.93,rot:look(.08)});
  say(2.4,'落到伙伴身上，两只一起软下去。');pose(A,2.4,.13,{sy:.80,sx:1.2,rot:0,openL:.65,openR:.65});pose(B,2.4,.13,{sy:.65,sx:1.33,openL:.28,openR:.28,eyeY:-17});
  pose(A,2.65,.3,{sy:1,sx:1,openL:.9,openR:.9});pose(B,2.72,.3,{openL:1.08,openR:1.08});
  say(3.05,'下面那只慢慢撑起来，再一鼓劲。');pose(B,3.02,.60,{sy:1.10,sx:.91});
  move(A,3.65,1.08,startB+d+23,{rot:look(-.18)});
  arcs.push({id:a.id,at:3.65,seconds:1.08,startLift:d*1.1,endLift:0,peak:24*r/14});
  pose(B,3.65,.25,{sy:.94,sx:1.06});pose(B,3.95,.3,{sy:1,sx:1,gaze:look(20),eyeY:-11});
  say(4.73,'被弹到旁边，落地先扁一下。');pose(A,4.73,.12,{lift:0,sy:.65,sx:1.4,rot:0,openL:.22,openR:.22});pose(A,4.85,.42,{sy:1,sx:1,openL:1.1,openR:1.1});
  gaze(A,5.25,.35,-20);gaze(B,5.25,.35,20);say(5.5,'两只互相盯着，谁也不先承认。');
  pose(B,6.2,.4,{openL:.65,openR:.9});gaze(A,6.8,.4,0);pose(A,7,.4,{openL:.76,openR:.9});gaze(B,7.5,.4,0);
  contact={kind:'stack',a:a.id,b:b.id,from:2.4,to:3.65};
 }else if(name==='peek'){
  say(0,'边上有颗星点，先偷偷看一眼。');gaze(A,0,.35,21,-8);gaze(B,0,.4,20);
  pose(A,.6,.28,{sy:.84,sx:1.14});move(A,.95,2.0,w+r+11,{sy:1,sx:1,gaze:look(20)});
  say(3,n>1?'追出去了，伙伴留在平台等它。':'追出去了，星点先绕回了平台。');
  move(A,4.35,.7,w+2,{gaze:look(-21),openL:1.0,openR:1.0});
  say(4.5,n>1?'先露半个身子，发现大家都在看。':'先露半个身子，看看星点去了哪里。');move(A,5.2,.28,w+7,{openL:.65,openR:.9});
  move(A,5.95,1.25,w-43,{gaze:look(-16),rot:look(-.06)});pose(B,6.4,.4,{smile:.55});
  say(7.4,'若无其事地挪回来，星点又从身后溜走。');gaze(A,8.1,.4,18,-6);gaze(A,9.2,.4,0);
  prop={kind:'peek',at:0};
 }else if(name==='nap'){
  say(0,'困了，先往伙伴身上靠一点。');gaze(A,0,.5,12,9);pose(A,.7,.8,{openL:.16,openR:.16,rot:look(.14)});
  move(A,1.5,1.1,startB-d+1,{rot:look(.19),openL:.07,openR:.07});gaze(B,1.8,.4,-18);
  say(2.9,'伙伴挪开一点，它跟着歪过去。');move(B,2.9,.6,startB+8);move(A,3.4,1.0,startB-d+9,{rot:look(.26),sy:.96,sx:1.04});
  say(4.6,'快歪倒了，伙伴回来接住它。');move(B,4.65,.65,startB+3,{rot:look(-.08)});move(A,4.9,.7,startB-d+5,{rot:look(.11),sy:1,sx:1});
  say(5.9,'算了，一起打盹吧。');pose(B,5.95,.7,{openL:.07,openR:.07,rot:look(-.09)});
  pose(A,8,.3,{openR:.65});pose(A,8.55,.35,{openR:.07});
  say(8.8,'偷睁一只眼，发现伙伴也睡着了。');pose(A,9.7,.65,{rot:0,openL:.8,openR:.8});pose(B,9.9,.65,{rot:0,openL:.75,openR:.75});
  contact={kind:'lean',a:a.id,b:b.id,from:1.5,to:9.7};
 }else if(name==='seat'){
  say(0,'两只同时看中了中间的空位。');gaze(A,0,.35,20);gaze(B,0,.35,-20);
  move(A,.6,1.1,w*.5-r-1);move(B,.6,1.1,w*.5+r+1);
  pose(A,1.7,.17,{sy:.91,sx:1.08,openL:1.04,openR:1.04});pose(B,1.7,.17,{sy:.91,sx:1.08,openL:1.04,openR:1.04});
  say(2,'碰到一起了，那就一起让一让。');move(A,2.75,.7,w*.5-r-17,{sy:1,sx:1});move(B,2.75,.7,w*.5+r+17,{sy:1,sx:1});
  gaze(A,3.7,.4,-16);gaze(B,3.7,.4,16);
  if(extras[0]){guest=extras.slice().sort((x,y)=>Math.min(Math.abs(x.x-a.x),Math.abs(x.x-b.x))-Math.min(Math.abs(y.x-a.x),Math.abs(y.x-b.x)))[0];const C=tracks[guest.id];say(4.3,'它们还在客气，第三只已经坐进来了。');C.to(4.25,1.25,{x:world(w*.5),lift:3,sy:.92,sx:.96});arcs.push({id:guest.id,at:4.25,seconds:1.25,startLift:0,endLift:0,peak:34*r/14});C.to(5.6,.35,{lift:0,sy:1,sx:1,smile:.6});}
  else {say(4.3,'一客气，两边都不敢先过去。');gaze(A,4.4,.3,20);gaze(B,4.4,.3,-20);}
  gaze(A,5.9,.35,21);gaze(B,5.9,.35,-21);pose(A,6.4,.3,{openL:1.08,openR:1.08});pose(B,6.4,.3,{openL:.6,openR:.95});
  say(7,'看一眼空位的主人，再互相看一眼。');gaze(A,7.45,.45,18);gaze(B,7.45,.45,-18);
 }else if(name==='contest'){
  say(0,'谁能跳得高一点？先互相看看。');gaze(A,0,.3,18,-12);gaze(B,0,.3,-18,-12);
  pose(A,.8,.33,{sy:.78,sx:1.2});arc(A,1.18,.62,startA,startA,13);pose(A,1.18,.18,{sy:1.08,sx:.94});pose(A,1.8,.12,{sy:.79,sx:1.22});pose(A,1.92,.35,{sy:1,sx:1});
  say(2.4,'另一只看完，认真跳得更高一点。');pose(B,2.5,.4,{sy:.73,sx:1.25});arc(B,2.96,.83,startB,startB,23);pose(B,2.96,.15,{sy:1.09,sx:.93});pose(B,3.79,.13,{sy:.75,sx:1.27});pose(B,3.92,.36,{sy:1,sx:1});
  say(4.65,'不服，再蓄力一下，星点却换了方向。');pose(A,4.65,.55,{sy:.7,sx:1.3});arc(A,5.3,.94,startA,startA+10,31);pose(A,5.3,.2,{sy:1.07,sx:.94,gaze:look(-18)});
  pose(A,6.24,.14,{sy:.65,sx:1.38});pose(A,6.38,.5,{sy:1,sx:1,openL:1.08,openR:1.08});pose(B,6.8,.4,{smile:.62});
  say(7,'没够到，先装作只是伸个懒腰。');gaze(A,7.2,.5,0);gaze(B,8.2,.4,0);prop={kind:'contest',at:0};
 }else if(name==='shadow'){
  say(0,'低头看看，下面怎么还有一个。');gaze(A,.2,.6,0,21);pose(A,.9,.35,{openL:.65,openR:.95,rot:look(.07)});
  move(A,1.55,.75,startA-19,{gaze:look(-12),eyeY:18});say(2.5,'往旁边挪，影子也跟着挪。');
  move(A,2.65,.82,startA+22,{gaze:look(12)});pose(A,3.6,.3,{openL:1.1,openR:1.1,gaze:0});
  pose(A,4.3,.4,{sy:.75,sx:1.24});arc(A,4.78,.86,startA+22,startA+22,26);pose(A,4.78,.16,{sy:1.08,sx:.93});
  say(5.65,'跳一下，影子缩小了；一落地又回来了。');pose(A,5.64,.12,{sy:.69,sx:1.35});pose(A,5.76,.5,{sy:1,sx:1});
  gaze(A,6.6,.5,0,20);pose(A,7.2,.5,{openL:.6,openR:.9,eyeY:0});
 }else if(name==='star'){
  say(0,'看见一颗星点，先盯住它。');gaze(A,0,.4,20,-9);pose(A,.8,.4,{sy:.82,sx:1.17});
  arc(A,1.3,.75,startA,startA+23,16);pose(A,1.3,.2,{sy:1.06,sx:.95});pose(A,2.05,.14,{sy:.77,sx:1.24,eyeY:18});pose(A,2.2,.4,{sy:1,sx:1});
  say(2.7,'明明在这里，怎么不见了。');gaze(A,2.7,.4,0,20);pose(A,3.2,.35,{openL:.62,openR:.9});
  say(4.1,'星点从身后绕出来，它慢半拍才回头。');gaze(A,4.35,.4,-22,-12);move(A,5.15,.8,startA-5,{eyeY:-8});
  pose(A,6.4,.3,{smile:.42});gaze(A,7.5,.6,0);prop={kind:'star',at:0};
 }else if(name==='mimic'){
  const turn=casting.variant?-1:1;
  say(0,'先看着对方，慢慢歪一下脑袋。');gaze(A,0,.4,18);gaze(B,0,.4,-18);
  pose(A,.65,.65,{rot:turn*.16,openL:.7,openR:1});pose(B,1.5,.65,{rot:turn*.16,openL:.7,openR:1});
  say(2.5,'它换一边，对方又晚半拍跟上。');pose(A,2.5,.55,{rot:-turn*.14,openL:1,openR:.65});pose(B,3.25,.55,{rot:-turn*.14,openL:1,openR:.65});
  pose(A,4.1,.35,{rot:0,sy:.8,sx:1.18});arc(A,4.5,.58,startA,startA,10);pose(A,5.08,.16,{sy:.82,sx:1.18});pose(A,5.24,.35,{sy:1,sx:1});
  say(4.7,'学着跳了一下，却用力多了一点。');pose(B,4.8,.35,{rot:0,sy:.74,sx:1.25});arc(B,5.2,.78,startB,startB,22);pose(B,5.98,.17,{sy:.72,sx:1.28});pose(B,6.15,.4,{sy:1,sx:1});
  gaze(A,6.15,.35,20,-8);pose(A,6.8,.5,{smile:.65});pose(B,6.8,.4,{openL:.5,openR:.9});
  say(7.5,'互相看一眼，这次一起慢慢歪回去。');pose(A,7.55,.6,{rot:turn*.08});pose(B,7.75,.6,{rot:-turn*.08,smile:.45});pose(A,8.8,.7,{rot:0,gaze:0,smile:0});pose(B,8.9,.7,{rot:0,gaze:0,smile:0});
 }else if(name==='pass'){
  say(0,'脚边有颗星点，轻轻推给旁边的伙伴。');gaze(A,.2,.5,16,16);gaze(B,.5,.5,-12,12);
  pose(A,1,.3,{sy:.85,sx:1.13});move(A,1.4,.75,startA+5,{rot:look(.08)});pose(A,2.15,.4,{sy:1,sx:1,rot:0});
  say(2.2,'星点到了脚边，它低头才发现。');gaze(B,2.3,.45,-14,20);pose(B,2.9,.2,{openL:1.12,openR:1.12});
  move(B,3.5,.7,startB-4,{sy:.86,sx:1.15,rot:look(-.08)});pose(B,4.2,.4,{sy:1,sx:1,rot:0});
  say(4.2,'推回来太快，先把它藏在肚子下面。');gaze(A,4,.4,10,20);pose(A,4.65,.45,{sy:.73,sx:1.28,openL:.65,openR:.9});
  say(5.5,'刚以为藏好了，星点从另一边滚出来。');pose(A,5.5,.45,{sy:1,sx:1,openL:1.08,openR:1.08});gaze(A,5.8,.4,-20,15);gaze(B,6.05,.4,-22,14);pose(B,6.8,.45,{smile:.6});
  pose(A,7.2,.35,{sy:.86,sx:1.12});arc(A,7.6,.55,startA+5,startA+5,9);pose(A,8.15,.18,{sy:.8,sx:1.2});pose(A,8.33,.45,{sy:1,sx:1,smile:.4});gaze(A,9,.5,0,0);gaze(B,9.1,.5,0,0);prop={kind:'pass'};
 }else if(name==='blink'){
  const first=casting.variant?'openR':'openL',other=first==='openL'?'openR':'openL';
  say(0,'想眨一只眼，结果两只眼睛都闭上了。');pose(A,.7,.25,{openL:.06,openR:.06});pose(A,1.1,.4,{openL:.95,openR:.95,rot:look(.06)});
  pose(A,2,.3,{[first]:.08,[other]:.28});pose(A,2.5,.35,{openL:.95,openR:.95,rot:0});
  if(B!==A){say(2.8,'旁边的伙伴示范一次，再等它跟上。');pose(B,2.8,.25,{[first]:.07,[other]:.95});pose(B,3.25,.3,{openL:.9,openR:.9});gaze(A,2.9,.4,18);}
  say(4,'认真试一次，终于只闭上一只。');pose(A,4.1,.3,{[first]:.06,[other]:1.05,rot:look(-.08)});pose(A,4.7,.4,{openL:.9,openR:.9,rot:0,smile:.55});
  pose(A,6,.25,{[other]:.06,[first]:1});pose(A,6.4,.35,{openL:.9,openR:.9});
  if(B!==A){pose(B,6.55,.25,{[first]:.06,[other]:1,smile:.5});pose(B,6.95,.35,{openL:.9,openR:.9});}
  say(7.3,'得意地互相看看，最后当作什么也没发生。');gaze(A,7.5,.6,0);pose(A,8,.5,{smile:0});
 }
 extras.forEach((p,i)=>{
  const C=tracks[p.id];C.to(.1,.7,{gaze:look(-9),eyeY:-2});
  if(name!=='seat')C.to(2.2+i*.15,.4,{gaze:look(-17),eyeY:name==='bounce'?-18:0});
  C.to(5.4+i*.14,.5,{openL:.7,openR:.9,smile:.35});C.to(7.6+i*.13,.5,{gaze:0,eyeY:0,smile:0});
 });
 // Pack spectators outside the actual acting envelope, not a fixed pair of slots.
 let offsetX=0;
 if(casting.leadId){
  const participants=[...new Set([a,b,...(guest?[guest]:[])])],active=new Set(participants.map(p=>p.id));
  const left=sorted.filter(p=>!active.has(p.id)&&p.x<Math.min(...participants.map(p=>p.x))),right=sorted.filter(p=>!active.has(p.id)&&!left.includes(p));
  const values=participants.flatMap(p=>[tracks[p.id].initial.x,...tracks[p.id].segments.filter(s=>s.key==='x').flatMap(s=>[s.from,s.to])]);
  const lo=Math.min(...values),hi=Math.max(...values),edge=r+6*r/14,gap=2*r+8*r/14;
  const minShift=name==='peek'&&sign<0?-Infinity:edge+left.length*gap-lo,maxShift=name==='peek'&&sign>0?Infinity:w-edge-right.length*gap-hi;
  offsetX=minShift<=maxShift?clamp(0,minShift,maxShift):(minShift+maxShift)/2;
  for(const p of participants){const tr=tracks[p.id];tr.initial.x+=offsetX;for(const seg of tr.segments)if(seg.key==='x'){seg.from+=offsetX;seg.to+=offsetX;}targets.set(p.id,tr.initial.x);}
  left.forEach((p,i)=>{const x=left.length===1?edge:lerp(edge,lo+offsetX-gap,i/(left.length-1));tracks[p.id].initial.x=x;targets.set(p.id,x);});
  right.forEach((p,i)=>{const x=right.length===1?w-edge:lerp(hi+offsetX+gap,w-edge,i/(right.length-1));tracks[p.id].initial.x=x;targets.set(p.id,x);});
 }
 return {name,label:LIBRARY[name]?.label||name,seconds:LIBRARY[name]?.seconds||9,tracks,targets,roles:[a.id,...(a!==b?[b.id]:[])],sign,prop,beats,contact,arcs,radius:r,width:w,offsetX,variant:casting.variant||0};
}
class Stage{
 constructor(width=350,count=3,appearance=null,options={}){this.appearance=appearance;this.width=width;this.radius=count>3?12:14;this.time=0;this.sequence=0;this.pets=[];this.clip=null;this.lastName=null;this.wait=0;this.auto=true;this.pending=null;this.reaction=null;this.prop=null;this.reduced=false;this.beat='伙伴们先互相看一眼。';this.events=[];this.finished=[];this.setCount(count);this.mixer=new Mixer(options);this._nextWait=this.mixer.pause();this._nextCalmWait=this.mixer.pause(true);}
 measure(p,pose={}){if(this.appearance)return this.appearance.metrics(this.appearance.get(p.id),this.radius,{...p,...pose});const sy=pose.sy??p.sy??1;return {height:2*this.radius*sy,topX:0,bottomX:0,left:-this.radius,right:this.radius};}
 setRoster(ids){
  if(!Array.isArray(ids)||ids.length<1||ids.length>5||new Set(ids).size!==ids.length)return false;
  if(this.clip?.plan.name==='welcome'){this.pendingRoster=[...ids];return true;}
  const old=this.pets,normalize=id=>this.appearance?.normalize(id)||id;
  this.radius=14*(this.sizeScale||1);this.pets=ids.map((id,i)=>{const previous=old.find(p=>normalize(p.id)===id);return previous?{...previous,id}:{...neutral,id,x:this.width+this.radius+12+i*12,alpha:0,v:0};});this.count=ids.length;
  this.clip=null;this.pending=null;this.start('gather');return true;
 }
 setCount(n){if(this.clip?.plan.name==='welcome'){this.pendingCount=n;return;}const old=this.pets;this.radius=(n>3?12:14)*(this.sizeScale||1);this.pets=Array.from({length:n},(_,i)=>old[i]||{...neutral,id:i?'standin-'+i:'base',x:old.length?this.width+this.radius+12+(i-old.length)*(this.radius*2+8):n===1?this.width*.5:25+i*(this.width-50)/Math.max(1,n-1),alpha:old.length?0:1,v:0});this.count=n;
  if(this.clip){const name=this.clip.plan.name;this.clip=null;this.start(LIBRARY[name]?.pair&&n===1?'shadow':name);}else if(old.length&&n>old.length)this.start('gather');}
 setScale(scale){const k=scale/(this.sizeScale||1);this.sizeScale=scale;this.radius*=k;this.pets.forEach(p=>p.lift*=k);if(this.clip){const {plan,from}=this.clip;Object.values(from).forEach(p=>p.lift*=k);Object.values(plan.tracks).forEach(tr=>{tr.initial.lift*=k;tr.segments.filter(s=>s.key==='lift').forEach(s=>{s.from*=k;s.to*=k;});});for(const a of plan.arcs||[]){a.startLift*=k;a.endLift*=k;a.peak*=k;}plan.radius*=k;}}
 resize(w){if(!w||Math.abs(w-this.width)<.5)return;const k=w/this.width;this.pets.forEach(p=>{p.x*=k;p.v*=k;});if(this.clip){const {plan,from}=this.clip;for(const p of Object.values(from)){p.x*=k;p.v=(p.v||0)*k;}for(const tr of Object.values(plan.tracks)){tr.initial.x*=k;tr.segments.filter(s=>s.key==='x').forEach(s=>{s.from*=k;s.to*=k;});}plan.offsetX=(plan.offsetX||0)*k;plan.width=w;}this.width=w;}
 start(name,opts={}){
  if(name==='welcome'&&this.pets.length>=5)return false;
  if(LIBRARY[name]?.pair&&this.pets.length<2){this.beat='这段需要两位伙伴。单只时可以看影子和星点。';return false;}
  if(this.clip?.plan.name==='welcome'&&name!=='welcome'){this.pending={name,opts};this.beat='先把新伙伴迎进来，随后播放你选的互动。';return false;}
  const story=Object.prototype.hasOwnProperty.call(LIBRARY,name);if(!story&&!['welcome','gather','quiet'].includes(name))return false;
  const casting=story?(opts.casting||this.mixer.pick(this.pets,LIBRARY,name)):null;if(story&&!casting)return false;
  const plan=name==='welcome'?this.makeWelcome(opts.id):name==='gather'?this.makeGather():name==='quiet'?this.makeQuiet():build(name,this.pets,this.width,this.radius,this.sequence++,opts.id,casting);
  let maxDistance=0;const from={};this.pets.forEach(p=>{from[p.id]={...p};const tr=plan.tracks[p.id];if(tr)maxDistance=Math.max(maxDistance,Math.abs(p.x-tr.initial.x));});
  const prep=name==='welcome'?.65:clamp(maxDistance/85,.65,2.5);
  this.clip={plan,from,elapsed:0,prep,rate:opts.automatic?casting.rate:1};if(story)this.mixer.commit(casting,LIBRARY);this.prop=null;this.reaction=null;this.wait=0;this.lastName=name;this.beat=name==='welcome'?'新伙伴在平台外探头。':'先看向对方，顺着当前位置靠近。';return true;
 }
 makeQuiet(){
  const tracks={},sorted=this.pets.slice().sort((a,b)=>a.x-b.x),r=this.radius,scale=r/14;
  sorted.forEach(p=>tracks[p.id]=new Track({...neutral,x:p.x}));
  const a=this.mixer.gentle(this.pets),i=sorted.indexOf(a),A=tracks[a.id];
  const left=i?sorted[i-1].x+2*r+3:18,right=i<sorted.length-1?sorted[i+1].x-2*r-3:this.width-18;
  const dir=(right-a.x)>(a.x-left)?1:-1,target=clamp(a.x+dir*8*scale,Math.min(a.x,left),Math.max(a.x,right));
  A.to(.15,.7,{gaze:dir*12,eyeY:-13});A.to(1.2,1.5,{x:target,rot:dir*.035});A.to(3,.7,{eyeY:0,gaze:-dir*9,rot:0});
  A.to(4,.6,{sy:1.035,sx:.967,openL:.65,openR:.8});A.to(4.8,.8,{sy:1,sx:1,openL:.9,openR:.9,gaze:0});
  const other=sorted[(i+1)%sorted.length];if(other!==a){const C=tracks[other.id];C.to(.85,.7,{gaze:clamp((a.x-other.x)*.4,-16,16),eyeY:-6});C.to(3.25,.15,{openL:.12,openR:.12});C.to(3.5,.3,{openL:.8,openR:.8});C.to(4.3,.9,{rot:-dir*.045,eyeY:4});C.to(5.6,.8,{rot:0,gaze:0,eyeY:0});}
  return {name:'quiet',label:'轻缓日常 · 仍在活动',seconds:7.5,tracks,roles:[a.id],sign:1,prop:null,beats:[{at:0,text:'大Q在演，小伙伴慢慢走两步、看看它，再各自歇一会儿。'}],contact:null,arcs:[],width:this.width,radius:r};
 }
 makeGather(){const tracks={},sorted=this.pets.slice().sort((a,b)=>a.x-b.x);sorted.forEach((p,i)=>tracks[p.id]=new Track({...neutral,x:22+i*(this.width-44)/Math.max(1,sorted.length-1)}));return {name:'gather',label:'伙伴们挪一挪',seconds:.6,tracks,roles:[],sign:1,prop:null,beats:[{at:0,text:'大家挪一挪，新来的示例伙伴从边上走进来。'}],contact:null,arcs:[],width:this.width,radius:this.radius};}
 makeWelcome(id){
  const w=this.width,r=this.radius,old=this.pets.slice(),idKey='arrival:'+id;
  const targets=old.map((p,i)=>25+i*(w-105)/Math.max(1,old.length-1));
  const newcomer={...neutral,id:idKey,x:w+r+9,v:0,alpha:1};this.pets.push(newcomer);
  const tracks={};old.forEach((p,i)=>tracks[p.id]=new Track({...neutral,x:p.x}));tracks[idKey]=new Track({...neutral,x:w+r+9,gaze:-17});
  const N=tracks[idKey],beats=[{at:0,text:'先探出半个身子，看看这里住着谁。'},{at:1.55,text:'大家往旁边挪一点，留一个位置。'},{at:3.4,text:'鼓起勇气跳进来，落地没站稳。'},{at:4.8,text:'旁边的伙伴接了一下，再互相看一眼。'},{at:6.3,text:'站好了，从今天起一起生活。'}];
  N.to(.15,.65,{x:w+2,openL:1,openR:1});N.to(1.1,.35,{x:w+7});
  old.forEach((p,i)=>tracks[p.id].to(1.55,1,{x:targets[i],gaze:19}));
  N.to(2.6,.5,{sy:.8,sx:1.2});N.to(3.15,1.05,{x:w-45,sy:1,sx:1});
  const arcs=[{id:idKey,at:3.15,seconds:1.05,startLift:0,endLift:0,peak:24*r/14}];
  N.to(4.2,.12,{sy:.69,sx:1.33,rot:-.14,openL:.2,openR:.2});N.to(4.35,.55,{sy:1,sx:1,rot:0,openL:1.1,openR:1.1});
  const receiver=old.at(-1);if(receiver){const T=tracks[receiver.id];T.to(4.25,.3,{x:w-45-r*2-2,rot:.1,sy:.93,sx:1.07,openL:1.08,openR:1.08});T.to(4.65,.5,{rot:0,sy:1,sx:1,smile:.48});}
  N.to(5.25,.4,{gaze:-20,smile:.4});N.to(6.3,.6,{gaze:0,smile:.2});
  return {name:'welcome',label:'第一次来到平台',seconds:7.8,tracks,roles:[receiver?.id,idKey],sign:1,prop:null,beats,contact:null,arcs,radius:r,width:w,welcomeId:id};
 }
 restore(raw){if(!raw?.clip||raw.clip.plan.name!=='welcome')return false;this.time=raw.time;this.sequence=raw.sequence;this.pets=raw.pets;this.count=raw.count;this.radius=raw.radius;this.width=raw.width;this.clip=raw.clip;this.clip.rate=this.clip.rate||1;if(raw.behaviorHistory)this.mixer.load(raw.behaviorHistory);this.pendingRoster=raw.pendingRoster||null;Object.entries(this.clip.plan.tracks).forEach(([id,tr])=>this.clip.plan.tracks[id]=trackFrom(tr));this.render();return true;}
 serialize(){return JSON.parse(JSON.stringify({time:this.time,sequence:this.sequence,pets:this.pets,count:this.count,radius:this.radius,width:this.width,clip:this.clip,pendingRoster:this.pendingRoster||null,behaviorHistory:this.mixer.export()}));}
 react(id,long=false){this.reaction={id,long,at:this.time};this.beat=long?'它慢慢放松下来，旁边的伙伴也看过来了。':'先愣一下，再蹦给你看。';}
 tick(dt,{calm=false,reduced=false}={}){
  this.reduced=reduced;
  if(reduced){if(this.clip?.plan.name==='welcome'){this.clip.elapsed=this.clip.prep+this.clip.plan.seconds;this.render();this.complete();}this.render(true);return;}
  this.time+=dt;
  if(this.clip){this.clip.elapsed+=dt;this.render();if(this.clip.elapsed>=this.duration)this.complete();}
  else{this.wait+=dt;this.render();if(this.auto&&this.wait>(calm?this._nextCalmWait:this._nextWait)){if(calm)this.start('quiet');else{const casting=this.mixer.pick(this.pets,LIBRARY);if(casting)this.start(casting.name,{casting,automatic:true});}}}
 }
 complete(){if(!this.clip)return;const plan=this.clip.plan;this.finished.push({name:plan.name,id:plan.welcomeId});this.events.push({name:plan.name,time:this.time,roles:plan.roles});if(this.events.length>20)this.events.shift();this.clip=null;this.prop=null;this.wait=0;this._nextWait=this.mixer.pause();this._nextCalmWait=this.mixer.pause(true);if(plan.name==='welcome')this.count=this.pets.length;this.pets.forEach(p=>{p.v=0;});if(this.pendingRoster){const ids=this.pendingRoster;this.pendingRoster=null;this.setRoster(ids);}if(this.pendingCount){const n=this.pendingCount;this.pendingCount=null;this.setCount(n);}if(this.pending){const {name,opts}=this.pending;this.pending=null;this.start(name,opts);}}
 render(still=false){
  const clip=this.clip,r=this.radius;
  if(clip){const local=(clip.elapsed-clip.prep)*(clip.rate||1),{plan}=clip;
   this.pets.forEach(p=>{const tr=plan.tracks[p.id];if(!tr)return;let sampled,velocity=0;
    if(local<0){const u=clamp(clip.elapsed/clip.prep),from=clip.from[p.id]||p;sampled={...neutral};for(const key of Object.keys(neutral))sampled[key]=lerp(from[key]??neutral[key],tr.initial[key]??neutral[key],ease(u));
     velocity=(tr.initial.x-from.x)*30*u*u*(1-u)*(1-u)/clip.prep;
     // An interrupted leap lands continuously before the next interaction.
     const speed0=from.v||0;sampled.x+=speed0*clip.prep*(u-6*u**3+8*u**4-3*u**5);velocity+=speed0*(1-18*u*u+32*u**3-15*u**4);
    }else{sampled=tr.sample(local);const next=tr.sample(local+.002);velocity=(next.x-sampled.x)/.002*(clip.rate||1);}
    Object.assign(p,sampled,{v:velocity});
    const speed=Math.abs(velocity),step=2.5*(1-Math.cos(p.x*.22))/2*clamp(speed/65),airborne=(plan.arcs||[]).some(a=>a.id===p.id&&local>=a.at&&local<=a.at+a.seconds);
    if(!still&&!airborne&&sampled.lift<.1&&speed>2){const blend=local<0?ease(clip.elapsed/.18):1;p.lift+=step*blend;p.sy+=Math.sin(p.x*.44)*.035*clamp(speed/70)*blend;p.sx=lerp(p.sx,clamp(1/p.sy,.6,1.5),blend);p.rot+=clamp(velocity/950,-.12,.12)*blend;if(local<0)p.gaze=lerp(p.gaze,clamp(velocity/3,-20,20),blend);}
    if(still){p.lift=0;p.sx=1;p.sy=1;p.rot=0;}
   });
   if(local>=0){const beat=plan.beats.filter(b=>b.at<=local).at(-1);if(beat)this.beat=beat.text;if(!still)this.derive(plan,local);}
  }else if(!still){this.pets.forEach((p,i)=>{p.v=0;p.lift=0;p.sy=1+Math.sin(this.time*1.7+i)*.009;p.sx=1/p.sy;p.rot*=.97;});}
  if(this.reaction&&!still){const {id,long,at}=this.reaction,u=this.time-at,p=this.pets.find(p=>p.id===id);
   if(u>3.1||!p){this.reaction=null;return;}
   const k=(ease(u/.16)-ease((u-2.5)/.5));p.gaze*=1-k;p.eyeY*=1-k;
   if(long){p.openL=lerp(p.openL,.3,k);p.openR=lerp(p.openR,.3,k);p.smile=lerp(p.smile,.7,k);p.sy+=.035*k;p.sx=1/p.sy;}
   else if(u<.3){p.openL=1.13;p.openR=1.13;}
   else if(u<1.05){const q=(u-.3)/.75;p.lift+=Math.sin(Math.PI*q)*13*(r/14)*clamp(1-p.lift/8);p.sy=1+.09*Math.sin(Math.PI*q);p.sx=1/p.sy;}
   else if(u<1.4){p.sy=1-.20*Math.sin(Math.PI*(u-1.05)/.35);p.sx=1/p.sy;}else p.smile=.5*k;
   this.pets.filter(x=>x!==p).forEach(x=>x.gaze=clamp((p.x-x.x)*.5,-20,20));
  }
 }
 derive(plan,t){
  const [aid,bid]=plan.roles,A=this.pets.find(p=>p.id===aid),B=this.pets.find(p=>p.id===bid),r=this.radius,w=this.width;
  for(const arc of plan.arcs||[]){const p=this.pets.find(p=>p.id===arc.id);if(p&&t>=arc.at&&t<=arc.at+arc.seconds){const u=clamp((t-arc.at)/arc.seconds);p.lift=lerp(arc.startLift,arc.endLift,u)+arc.peak*4*u*(1-u);}}
  if(plan.contact?.kind==='stack'&&A&&B){
   const ma=this.measure(A),mb=this.measure(B),offset=mb.topX-ma.bottomX;
   if(t>=1.25&&t<2.4){const u=ease((t-1.25)/1.15);A.x+=offset*u;A.lift+=(mb.height-2*r)*u;}
   if(t>=2.4&&t<3.65){A.x=B.x+offset;A.lift=B.lift+mb.height;}
   if(t>=3.65&&t<=4.73){const u=clamp((t-3.65)/1.08),support=this.measure(B,{sx:.91,sy:1.10,rot:0}),foot=this.measure(A,{sx:1,sy:1,rot:0});A.x+=(support.topX-foot.bottomX)*(1-ease(u));A.lift+=(support.height-2*r*1.10)*(1-u);}
  }
  if(plan.prop){let x=0,lift=0,alpha=1;
   if(plan.prop.kind==='peek'){x=t<3?w-9:t<4.1?w+20:t<5.7?lerp(w+20,w-65,ease((t-4.1)/1.6)):t<8?w-65:lerp(w-65,w+22,ease((t-8)/1.5));lift=8+Math.sin(t*3)*3;}
   if(plan.prop.kind==='contest'){x=t<5.4?w*.5:lerp(w*.5,w*.23,ease((t-5.4)/1.4));lift=43+Math.sin(t)*3;alpha=t>8.5?1-ease((t-8.5)/.9):1;}
   if(plan.prop.kind==='star'){const a0=plan.tracks[aid].initial.x,s=plan.sign;x=t<1.3?a0+s*22:t<3.6?lerp(a0+s*22,a0-s*27,ease((t-1.3)/1.3)):t<6.3?a0-s*27:lerp(a0-s*27,a0+s*25,ease((t-6.3)/1.9));lift=14+Math.sin(t*1.6)*4;alpha=t>8.4?1-ease((t-8.4)/.8):1;this.prop={x,lift,r:3.8,alpha};return;}
   if(plan.prop.kind==='pass'){const a0=plan.tracks[aid].initial.x,b0=plan.tracks[bid].initial.x,s=plan.sign;const nearA=a0+s*20,nearB=b0-s*18;x=t<1.4?nearA:t<2.8?lerp(nearA,nearB,ease((t-1.4)/1.4)):t<3.6?nearB:t<4.8?lerp(nearB,a0+s*5,ease((t-3.6)/1.2)):t<5.5?a0+s*5:t<6.7?lerp(a0+s*5,a0-s*23,ease((t-5.5)/1.2)):a0-s*23;lift=3;alpha=t>8.8?1-ease((t-8.8)/.8):1;this.prop={x,lift,r:3.2,alpha};return;}
   if(plan.sign<0)x=w-x;x+=plan.offsetX||0;this.prop={x,lift,r:3.8,alpha};
  }
 }
 seek(seconds){if(!this.clip)return;this.clip.elapsed=clamp(seconds,0,this.duration);this.render();}
 get duration(){return this.clip?this.clip.prep+this.clip.plan.seconds/(this.clip.rate||1):0;}
 get behaviorHistory(){return this.mixer.export();}
 get playing(){return !!this.clip;}
 get focusX(){const ids=this.clip?.plan.roles||[];const active=this.pets.filter(p=>ids.includes(p.id));return active.length?active.reduce((sum,p)=>sum+p.x,0)/active.length:this.width*.5;}
 snapshot(){return {time:this.time,count:this.count,radius:this.radius,clip:this.clip?{name:this.clip.plan.name,elapsed:this.clip.elapsed,prep:this.clip.prep,duration:this.duration,roles:this.clip.plan.roles}:null,beat:this.beat,pets:this.pets.map(p=>({...p})),prop:this.prop,events:this.events.slice()};}
}
module.exports={Stage,LIBRARY,neutral,ease,build};


