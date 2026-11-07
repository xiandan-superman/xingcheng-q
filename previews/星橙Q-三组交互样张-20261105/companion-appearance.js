/* Accepted native outlines, face placement and paint, adapted for animation. */
(function(G){
'use strict';
const {catalog,avatar}=G.QCompanionAssets,faceContour=G.QSource.require('/components/xingcheng-q-motion/eye-contour');
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),TAU=Math.PI*2;
const aliases={...catalog.legacyShapeAliases,base:'round',pebble:'blob',bud:'tip'};
let profile={avatarShape:'round',avatarColor:'xingcheng',avatarColors:avatar.normalizeColors({})};
function normalize(id){id=String(id||'').replace(/^arrival:/,'');if(/^standin-\d+$/.test(id))id=catalog.shapes[Number(id.slice(8))%catalog.shapes.length].id;return catalog.shapes.some(s=>s.id===id)?id:aliases[id]||null;}
const shapes=new Map(catalog.shapes.map(s=>{
 let start=null,curves=[],points=[];
 if(s.id==='round')points=Array.from({length:256},(_,i)=>[126*Math.cos(i/256*TAU),126*Math.sin(i/256*TAU)]);
 else{const match=/^M([^C]+)C(.+)Z$/.exec(s.body);if(!match)throw Error('Unsupported accepted contour');const nums=x=>x.trim().split(/\s+/).map(Number);start=nums(match[1]);const n=nums(match[2]);for(let i=0;i<n.length;i+=6)curves.push(n.slice(i,i+6));let p=start;for(const c of curves){for(let i=0;i<64;i++){const t=i/64,u=1-t;points.push([u*u*u*p[0]+3*u*u*t*c[0]+3*u*t*t*c[2]+t*t*t*c[4],u*u*u*p[1]+3*u*u*t*c[1]+3*u*t*t*c[3]+t*t*t*c[5]]);}p=c.slice(4);}}
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 return [s.id,{...s,start,curves,points,cx:(minX+maxX)/2,cy:(minY+maxY)/2,diameter:Math.max(maxX-minX,maxY-minY)}];
}));
function get(id){const shape=shapes.get(normalize(id)||'round'),color=profile.avatarColors[shape.id],ink=catalog.colors.find(c=>c.id===color)||catalog.colors[0];return {shape,color:ink,id:shape.id,label:shape.name+' · '+ink.name};}
function setProfile(value){const shape=normalize(value.avatarShape)||'round',avatarColors=avatar.normalizeColors({...value,avatarShape:shape});profile={...value,avatarShape:shape,avatarColor:avatarColors[shape],avatarColors};}
function setColor(id,shape='round'){shape=normalize(shape)||'round';const color=catalog.colors.some(c=>c.id===id)?id:'xingcheng';profile.avatarColors={...profile.avatarColors,[shape]:color};return color;}
function metrics(appearance,r,p={}){
 const s=appearance.shape,k=2*r/s.diameter,sx=p.sx??1,sy=p.sy??1,a=p.rot||0,c=Math.cos(a),sn=Math.sin(a);
 if(s.id==='round'){const bottom=r*Math.hypot(sx*sn,sy*c),right=r*Math.hypot(sx*c,sy*sn);return {bottom,top:-bottom,left:-right,right,height:2*bottom,width:2*right,topX:0,bottomX:0};}
 let bottom=-Infinity,top=Infinity,left=Infinity,right=-Infinity,topMoment=0,bottomMoment=0,topWeight=0,bottomWeight=0;
 // A soft contact patch avoids snapping between two equally low star tips.
 // The visible outline and exact floor height remain the accepted artwork.
 const patch=r*.065;
 for(const point of s.points){const x=(point[0]-s.cx)*k*sx,y=(point[1]-s.cy)*k*sy,wx=x*c-y*sn,wy=x*sn+y*c,tw=Math.exp(-wy/patch),bw=Math.exp(wy/patch);topMoment+=wx*tw;topWeight+=tw;bottomMoment+=wx*bw;bottomWeight+=bw;bottom=Math.max(bottom,wy);top=Math.min(top,wy);left=Math.min(left,wx);right=Math.max(right,wx);}
 return {bottom,top,left,right,height:bottom-top,width:right-left,topX:topMoment/topWeight,bottomX:bottomMoment/bottomWeight};
}
function draw(c,appearance,x,floor,r,p={}){
 const s=appearance.shape,ink=appearance.color,m=metrics(appearance,r,p),k=2*r/s.diameter,sx=p.sx??1,sy=p.sy??1;
 c.save();c.globalAlpha*=p.alpha??1;c.translate(x,floor-(p.lift||0)-m.bottom);c.rotate(p.rot||0);c.scale(k*sx,k*sy);c.translate(-s.cx,-s.cy);
 const light=c.createRadialGradient(-45.36,-63,0,-45.36,-63,211.68);[0,.3,.65,.88,1].forEach((at,i)=>light.addColorStop(at,ink.ramp[i]));c.fillStyle=light;bodyPath(c,s);c.fill();
 if(r>=18){const depth=c.createRadialGradient(-2.52,-25.2,0,-2.52,-25.2,168.84);depth.addColorStop(.58,ink.shade+'00');depth.addColorStop(1,ink.shade+'1e');c.fillStyle=depth;bodyPath(c,s);c.fill();}
 c.save();bodyPath(c,s);c.clip();
 const [cx,cy,gap,w,h]=s.face,optical=r<18?1.10:1,gaze=clamp(p.gaze||0,-23,23),eyeY=clamp(p.eyeY||0,-23,25),smile=clamp(p.smile||0,0,1),points=faceContour(smile);
 for(const side of [-1,1]){const open=clamp(side<0?p.openL??p.open??.9:p.openR??p.open??.9,.045,1.3);c.save();c.translate(cx+side*gap+gaze,cy+eyeY);c.scale(w/24*optical,h/60*(open/.9)*optical);c.fillStyle=ink.eyes;c.beginPath();points.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.closePath();c.fill();c.restore();}
 const [starX,starY,diameter]=s.star,d=diameter*(r<18?1.18:1),inner=3.1819805153395/33;c.fillStyle=ink.star;c.beginPath();[[0,-.5],[inner,-inner],[.5,0],[inner,inner],[0,.5],[-inner,inner],[-.5,0],[-inner,-inner]].forEach((q,i)=>i?c.lineTo(starX+q[0]*d,starY+q[1]*d):c.moveTo(starX+q[0]*d,starY+q[1]*d));c.closePath();c.fill();c.restore();c.restore();
}
function bodyPath(c,s){c.beginPath();if(s.id==='round')c.arc(0,0,126,0,TAU);else{c.moveTo(...s.start);for(const p of s.curves)c.bezierCurveTo(...p);}c.closePath();}
function image(shape,ink){const id=normalize(shape)||'round';return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(avatar.svg(id,ink||profile.avatarColors[id]));}
G.QCompanionAppearance={version:'accepted-native-per-shape-colors-20261105-v2',catalog,get,setProfile,setColor,normalize,metrics,draw,image};
})(globalThis);
