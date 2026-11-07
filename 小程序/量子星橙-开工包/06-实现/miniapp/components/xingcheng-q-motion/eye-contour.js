// A fixed, symmetric point correspondence keeps every in-between eye rounded.
// Canonical geometry is normalized; the approved shared profile is applied below.
const Appearance=require('./appearance');
const clamp=v=>Math.max(0,Math.min(1,v));
const END_ANGLE=Math.PI*.12;
const profiles=new Map();
function smileProfile(radius,stroke){
 const key=radius+':'+stroke;
 if(profiles.has(key))return profiles.get(key);
 const half=stroke/2,endX=radius*Math.cos(END_ANGLE),endY=-radius*Math.sin(END_ANGLE),extent=endX+half;
 function bounds(x){
  const ax=Math.abs(x),upper=[],lower=[];
  if(ax<=(radius+half)*Math.cos(END_ANGLE)+1e-9)upper.push(-Math.sqrt(Math.max(0,(radius+half)**2-x*x)));
  if(ax<=(radius-half)*Math.cos(END_ANGLE)+1e-9)lower.push(-Math.sqrt(Math.max(0,(radius-half)**2-x*x)));
  const dx=ax-endX;
  if(Math.abs(dx)<=half+1e-9){const dy=Math.sqrt(Math.max(0,half*half-dx*dx));upper.push(endY-dy);lower.push(endY+dy);}
  return [Math.min(...upper),Math.max(...lower)];
 }
 const points=[];
 for(let i=0;i<=24;i++){const x=-extent*Math.cos(i/24*Math.PI);points.push([x,bounds(x)[0]]);}
 for(let i=1;i<8;i++)points.push([extent,endY]);
 for(let i=0;i<=24;i++){const x=extent*Math.cos(i/24*Math.PI);points.push([x,bounds(x)[1]]);}
 for(let i=1;i<8;i++)points.push([-extent,endY]);
 profiles.set(key,points);return points;
}
const neutral=[];
for(let i=0;i<=24;i++){const a=i/24*Math.PI;neutral.push([-12*Math.cos(a),-18-12*Math.sin(a)]);}
for(let i=1;i<8;i++)neutral.push([12,-18+i/8*36]);
for(let i=0;i<=24;i++){const a=i/24*Math.PI;neutral.push([12*Math.cos(a),18+12*Math.sin(a)]);}
for(let i=1;i<8;i++)neutral.push([-12,18-i/8*36]);
function eyeContour(smile=0,{smileWidth=30,smileRadius,smileStroke=10,profile=true}={}){
 const weight=clamp(smile),radius=smileRadius??(smileWidth-smileStroke)/2/Math.cos(END_ANGLE),target=smileProfile(radius,smileStroke);
 const w=profile?(1-weight)*Appearance.BASE.eyeWidth/24+weight*1.055:1,h=profile?(1-weight)*(Appearance.BASE.eyeHeight/Appearance.BASE.neutralOpen)/60+weight:1;
 return neutral.map((p,i)=>[(p[0]+(target[i][0]-p[0])*weight)*w,(p[1]+(target[i][1]-p[1])*weight)*h]);
}
module.exports=eyeContour;
