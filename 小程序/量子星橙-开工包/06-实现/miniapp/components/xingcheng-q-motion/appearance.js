// Approved brand master. Motion states stay in their original coordinate systems.
const BASE=Object.freeze({radius:126,eyeWidth:27.5,eyeHeight:51.75,neutralOpen:.9,eyeHalfGap:34,eyeY:-14,starX:-68,starY:-67,starOuter:16.5,starInner:4.5});
const RADII=Object.freeze({home:126,sleep:126,entry:122,story:122,variety:105,system:103,next:104});
const COLORS=Object.freeze({eye:'#FFF8EE',star:'#FFF3CE'});
const ASSET_METADATA=require('../../assets/xingcheng-q/appearance-assets');
const FULL_ASSET_BY_SMALL=Object.fromEntries(Object.entries(ASSET_METADATA.assets).map(([full,item])=>[item.small,full]));
const TAU=Math.PI*2;
const viewports=new WeakMap();
function unit(family='home'){return (RADII[family]||BASE.radius)/BASE.radius;}
function setViewport(ctx,cssWidth,pixelWidth){
 if(ctx&&cssWidth>0&&pixelWidth>0)viewports.set(ctx,{cssWidth,pixelWidth});
}
function smallSurface(ctx,radius){
 const viewport=viewports.get(ctx);if(!viewport)return false;
 let scale=viewport.cssWidth/512;
 if(typeof ctx.getTransform==='function'){
  try{const m=ctx.getTransform();if(m&&[m.a,m.b,m.c,m.d].every(Number.isFinite))scale=Math.max(Math.hypot(m.a,m.b),Math.hypot(m.c,m.d))*viewport.cssWidth/viewport.pixelWidth;}catch(e){}
 }
 return 2*radius*scale<70;
}

// The callback supplies the existing story-specific outline, including temporary
// stamp/cloud/tug forms. No clock, lifecycle or deformation state is changed here.
function drawBody(ctx,path,radius=BASE.radius,{simple=smallSurface(ctx,radius)}={}){
 const light=ctx.createRadialGradient(-.36*radius,-.50*radius,0,-.36*radius,-.50*radius,1.68*radius);
 const stops=simple?[[0,'#FF9C41'],[.55,'#FF852F'],[1,'#EF6A2A']]:[[0,'#FFB65C'],[.30,'#FF9B36'],[.65,'#FF8027'],[.88,'#EF6B25'],[1,'#DC5A24']];
 stops.forEach(([at,color])=>light.addColorStop(at,color));
 ctx.save();ctx.shadowBlur=0;ctx.fillStyle=light;path();ctx.fill();
 if(!simple){
  const depth=ctx.createRadialGradient(-.02*radius,-.20*radius,0,-.02*radius,-.20*radius,1.34*radius);
  depth.addColorStop(.58,'rgba(196,77,29,0)');depth.addColorStop(1,'rgba(191,74,27,.12)');
  ctx.fillStyle=depth;path();ctx.fill();
 }
 ctx.restore();
}

function warpPoint(px,py,s,family){
 const a=Math.atan2(py,px),bean=s.bean||0,stamp=s.stamp||0;
 if(family==='variety'){
  const factor=1+bean*(.09*Math.sin(a*2+.8)+.045*Math.cos(a*3))+stamp*(.16*Math.cos(a*2)-.06*Math.cos(a*4));
  return [px*factor*(1+stamp*.16),py*factor*(1-stamp*.28)+stamp*18*Math.cos(a)**2];
 }
 if(family==='system'||family==='next'){
  const next=family==='next',squash=s.squash||0;
  const factor=1+bean*((next?.082:.07)*Math.sin(a*2+(next?.65:.5))+(next?.038:.03)*Math.cos(a*3))+(s.tug||0)*(next?.12:.11)*Math.cos(a);
  return [px*factor*(1+squash*(next?.16:.14)),py*factor*(1-squash*(next?.22:.20))+squash*(next?13:12)*Math.cos(a)**2];
 }
 if(family==='story'||family==='entry'){
  const delta=Math.atan2(Math.sin(a-(s.shapeAngle||0)),Math.cos(a-(s.shapeAngle||0)));
  const drop=Math.exp(-delta*delta/.13)*(s.drop||0)*.48;
  const factor=1+drop+(s.pebble||0)*(.055*Math.cos(a*2+.5)+.028*Math.cos(a*3+2.1))+(s.cloud||0)*(.065*Math.cos(a*4+.35)-.02*Math.sin(a*2));
  return [px*factor+drop*16,py*factor+drop*8];
 }
 return [px,py];
}
function starPoints(s={},family='home'){
 const k=unit(family),optical=s.starOptical||1,points=[];
 for(let i=0;i<8;i++){
  const a=-Math.PI/2+i*Math.PI/4,r=(i%2?BASE.starInner*(s.starInnerOptical||optical):BASE.starOuter*optical)*k;
  points.push(warpPoint(BASE.starX*k+Math.cos(a)*r,BASE.starY*k+Math.sin(a)*r,s,family));
 }
 return points;
}
function drawBrandStar(ctx,s={},family='home',{autoOptical=true}={}){
 const small=autoOptical&&smallSurface(ctx,RADII[family]||BASE.radius);
 const pose=small?{...s,starOptical:(s.starOptical||1)*1.22,starInnerOptical:(s.starInnerOptical||s.starOptical||1)*1.12}:s;
 const points=starPoints(pose,family);ctx.save();ctx.fillStyle=COLORS.star;ctx.beginPath();
 points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();ctx.restore();
}

// One original 512px PNG per state serves every fallback size. Keeping the
// approved raster avoids conversion defects; aliases preserve older small paths.
function assetForSize(src,rpxWidth,viewportWidth){
 if(typeof src!=='string')return src;
 return Object.prototype.hasOwnProperty.call(FULL_ASSET_BY_SMALL,src)?FULL_ASSET_BY_SMALL[src]:src;
}

module.exports={BASE,RADII,COLORS,unit,setViewport,drawBody,starPoints,drawBrandStar,assetForSize};
