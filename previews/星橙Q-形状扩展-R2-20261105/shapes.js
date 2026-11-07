(function(G){
'use strict';
const VERSION='20261105-shape-study.2';let serial=0;
// Original paths. These identifiers are study labels, never collection/reward IDs.
const shapes=[
 {id:'base',label:'基础 Q',short:'基础 Q',status:'现行母版对照',note:'圆润主形象，作为共同材质与五官的基准。',face:[0,-14,34,27.5,51.75],star:[-68,-67,33]},
 {id:'d',label:'D · 歪尖',short:'歪尖',status:'候选，未定名',note:'整个身体向一边卷起；弹完之后，歪尖慢半拍才收住。',face:[-3,20,33,27.5,51.75],star:[-61,-37,33],start:[-114,-8],curves:[[-104,-54,-71,-92,-24,-123],[5,-144,41,-157,65,-145],[85,-133,59,-108,47,-90],[41,-78,50,-70,68,-61],[117,-37,139,6,128,52],[115,112,62,142,-1,139],[-77,136,-123,95,-122,41],[-123,22,-120,4,-114,-8]],bend:'tip'},
 {id:'e',label:'E · 胖星',short:'胖星',status:'候选，未定名',note:'五个厚软角长短不同；受力时会歪，不是规整的星形徽章。',face:[-5,0,33,27.5,51.75],star:[-56,-57,33],start:[-24,-129],curves:[[-6,-153,12,-139,23,-111],[32,-92,35,-75,53,-71],[71,-68,104,-83,122,-66],[143,-46,106,-13,91,5],[80,18,79,27,85,45],[93,69,112,102,90,119],[69,135,39,107,17,98],[2,91,-10,96,-27,110],[-55,134,-87,150,-103,123],[-118,98,-95,58,-101,36],[-104,21,-117,11,-133,-2],[-157,-22,-171,-47,-149,-66],[-130,-82,-96,-71,-76,-79],[-54,-87,-46,-105,-24,-129]],bend:'corners'},
 {id:'f',label:'F · 卷月',short:'卷月',status:'候选，未定名',note:'留出大凹口，脸落在厚厚的左腹；上下卷边会一起颤一下。',face:[-66,2,28,26,49],star:[-91,-58,31.5],start:[67,-126],curves:[[97,-112,84,-94,64,-87],[17,-71,-12,-39,-9,-4],[-7,40,27,69,74,76],[110,82,125,103,92,121],[24,160,-72,145,-118,87],[-161,34,-147,-55,-95,-108],[-54,-149,19,-153,67,-126]],bend:'curl'}
];
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
function contour(s){if(s.points)return s.points;if(s.id==='base')return s.points=Array.from({length:720},(_,i)=>{let a=i/720*Math.PI*2;return [126*Math.cos(a),126*Math.sin(a)]});let out=[],p=s.start;for(let c of s.curves){for(let i=0;i<72;i++){let t=i/72,u=1-t;out.push([u*u*u*p[0]+3*u*u*t*c[0]+3*u*t*t*c[2]+t*t*t*c[4],u*u*u*p[1]+3*u*u*t*c[1]+3*u*t*t*c[3]+t*t*t*c[5]])}p=[c[4],c[5]]}return s.points=out}
function bounds(s){const p=contour(s);return {minX:Math.min(...p.map(p=>p[0])),maxX:Math.max(...p.map(p=>p[0])),minY:Math.min(...p.map(p=>p[1])),maxY:Math.max(...p.map(p=>p[1]))}}
function warp(s,p,flex=0){let [x,y]=p;if(s.bend==='tip'){let a=smooth((-y-45)/100);x+=flex*a;y+=Math.abs(flex)*a*.16}else if(s.bend==='corners'){let a=smooth((Math.hypot(x,y)-65)/90),ang=Math.atan2(y,x);x+=flex*a*Math.cos(2*ang+.4)*.55;y+=flex*a*Math.sin(2*ang-.2)*.48}else if(s.bend==='curl'){let a=smooth((x+70)/150)*smooth((Math.abs(y)-12)/100);x+=flex*a*.34;y+=flex*a*Math.sign(y)*.58}return [x,y]}
function capsule(x,y,w,h){const rx=w/2,ry=Math.min(h/2,h*.2),line=h/2-ry,out=[];for(let i=0;i<=24;i++){let a=Math.PI+i/24*Math.PI;out.push([x+rx*Math.cos(a),y-line+ry*Math.sin(a)])}for(let i=0;i<=24;i++){let a=i/24*Math.PI;out.push([x+rx*Math.cos(a),y+line+ry*Math.sin(a)])}return out}
function star(x,y,d){const k=3.1819805153395/33;return [[0,-.5],[k,-k],[.5,0],[k,k],[0,.5],[-k,k],[-.5,0],[-k,-k]].map(p=>[x+p[0]*d,y+p[1]*d])}
const path=pts=>pts.length<3?'':`M${pts.map(p=>p.map(n=>n.toFixed(3)).join(' ')).join('L')}Z`;
function geometry(id,pose={}){const s=shapes.find(s=>s.id===id);if(!s)throw Error('Unknown study shape');let flex=pose.flex||0,[cx,cy,g,w,h]=s.face,blink=pose.blink===undefined?1:pose.blink;const map=p=>warp(s,p,flex);return {s,bounds:bounds(s),body:contour(s).map(map),eyes:[-1,1].map(sign=>capsule(cx+sign*g,cy,w,Math.max(4,h*blink)).map(map)),star:star(...s.star).map(map)}}
function svg(id,pose={}){const g=geometry(id,pose),uid='r2'+id+'_'+serial++,body=path(g.body),sx=pose.sx||1,sy=pose.sy||1,dy=pose.dy||0,rot=pose.rot||0;let features=pose.silhouette?'':`<g fill="#FFF8EE">${g.eyes.map(e=>`<path d="${path(e)}"/>`).join('')}</g><path fill="#FFF3CE" d="${path(g.star)}"/>`;return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-180 -180 360 360" role="img" aria-label="${g.s.label}${pose.silhouette?'剪影':'候选样张'}"><defs><radialGradient id="${uid}body" gradientUnits="userSpaceOnUse" cx="-45.36" cy="-63" r="211.68"><stop stop-color="#FFB65C"/><stop offset=".3" stop-color="#FF9B36"/><stop offset=".65" stop-color="#FF8027"/><stop offset=".88" stop-color="#EF6B25"/><stop offset="1" stop-color="#DC5A24"/></radialGradient><radialGradient id="${uid}depth" gradientUnits="userSpaceOnUse" cx="-2.52" cy="-25.2" r="168.84"><stop stop-color="#C44D1D" stop-opacity="0"/><stop offset=".58" stop-color="#C44D1D" stop-opacity="0"/><stop offset="1" stop-color="#BF4A1B" stop-opacity=".11764706"/></radialGradient><clipPath id="${uid}clip"><path d="${body}"/></clipPath></defs>${pose.shadow?`<ellipse cx="0" cy="${g.bounds.maxY+7}" rx="${83/(1+Math.abs(dy)/100)}" ry="6" fill="#683F27" opacity="${.12/(1+Math.abs(dy)/100)}"/>`:''}<g transform="translate(0 ${dy+g.bounds.maxY*(1-sy)}) rotate(${rot}) scale(${sx} ${sy})"><path fill="${pose.silhouette?'#48362C':`url(#${uid}body)`}" d="${body}"/>${pose.silhouette?'':`<path fill="url(#${uid}depth)" d="${body}"/>`}<g clip-path="url(#${uid}clip)">${features}</g></g></svg>`}
function motion(time,mode='bounce'){
 const t=((time%5)+5)%5;
 if(mode==='knead'){const z=Math.sin(time*2.1),f=Math.sin(time*2.1-.4);return {sx:1+.13*z,sy:1/(1+.13*z),rot:8*z,flex:14*f,shadow:true}}
 if(mode==='wobble'){const z=Math.sin(time*1.8);return {rot:12*z,flex:22*Math.sin(time*1.8-.65),blink:t>3.2&&t<3.4?.12:1,shadow:true}}
 // One weighted bounce; after the belly settles, the outer contour still catches up.
 let p={sx:1,sy:1,dy:0,rot:0,flex:0,shadow:true};
 if(t<.7){let z=smooth(t/.7);p.sx=1+.13*z;p.sy=1-.18*z;p.flex=-6*z}
 else if(t<1){let z=smooth((t-.7)/.3);p.sx=1.13-.24*z;p.sy=.82+.32*z;p.dy=-28*z;p.flex=-6+16*z}
 else if(t<1.85){let z=(t-1)/.85;p.dy=-28-46*Math.sin(Math.PI*z);p.sx=.89+.11*z;p.sy=1.14-.14*z;p.rot=-7*Math.sin(Math.PI*z);p.flex=10*Math.cos(Math.PI*z)}
 else if(t<2.15){let z=smooth((t-1.85)/.3);p.dy=-28*(1-z);p.sx=1+.2*z;p.sy=1-.23*z;p.flex=-10-5*z}
 else{let z=t-2.15,k=Math.exp(-z*5.2)*Math.cos(z*12);p.sx=1+.2*k;p.sy=1-.23*k;p.flex=-15*Math.exp(-z*2.8)*Math.cos(z*10);p.blink=z>1.4&&z<1.58?.12:1}
 return p;
}
G.ShapeStudyR2={VERSION,shapes,contour,bounds,geometry,path,svg,warp,motion};
})(globalThis);
