// Shared face proportions from the approved 2026-11-04 comparison.
const Appearance=require('./appearance'),contour=require('./eye-contour');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const profile={eyeWidth:Appearance.BASE.eyeWidth,eyeRawHeight:Appearance.BASE.eyeHeight/Appearance.BASE.neutralOpen,eyeHalfGap:Appearance.BASE.eyeHalfGap,eyeY:Appearance.BASE.eyeY};
function drawFace(c,s,scale=1,family='home',options){
 const gap=profile.eyeHalfGap*(1-.62*clamp(s.eyeCross||0)),unit=Appearance.unit(family)*scale,smile=clamp(s.smile||0),gazeX=clamp(s.eyeX||0,-34,34),gazeY=clamp(s.eyeY||0,-23,25);
 const yaw=gazeX/148,pitch=gazeY/190,points=contour(smile,{...options,profile:false}),depthZ=Math.sqrt(1-(gap/126)**2);
 const sx=Math.max(.4,Math.abs(s.scaleX||1)),sy=Math.max(.4,Math.abs(s.scaleY||1));
 const leftX=-gap*Math.cos(yaw)+126*depthZ*Math.sin(yaw),maxOpen=Math.max(s.eyeOpenL??.9,s.eyeOpenR??.9),projectedY=profile.eyeY+126*depthZ*Math.sin(pitch);
 // The brand star owns the upper-left space; extreme gaze must respect it.
 const faceY=leftX<-43?Math.max(projectedY,-46+profile.eyeRawHeight*maxOpen/2/Math.pow(sy,.18)):projectedY;
 for(const side of [-1,1]){
  const raw=side<0?s.eyeOpenL:s.eyeOpenR;
  const open=Math.max(.065,(raw??.9)*(side<0?1-(s.wink||0):1));
  const spread=options&&typeof options.smileSpread==='number'?options.smileSpread:3;
  const x=side*gap*Math.cos(yaw)+126*depthZ*Math.sin(yaw)+side*spread*smile;
  const y=faceY;
  const localSmile=clamp(smile+(side<0?(s.smileL||0):(s.smileR||0))),localPoints=localSmile===smile?points:contour(localSmile,{...options,profile:false});
  const width=((1-smile)*profile.eyeWidth/24+smile*(options&&(options.smileRadius||options.smileWidth)?1:1.055))*(1+(s.eyeWide||0));
  const height=(1-smile)*profile.eyeRawHeight/60+smile;
  c.save();c.translate(x*unit,y*unit);
  c.rotate(((s.eyeTilt||0)+(side<0?(s.eyeTiltL||0):(s.eyeTiltR||0))+side*(s.curiosity||0)*4.2)*Math.PI/180);
  c.scale(unit*(s.eyeOptical||1)*(1-side*Math.sin(yaw)*.18)*width/Math.pow(sx,.20),unit*(s.eyeOptical||1)*open*height/Math.pow(sy,.18));
  c.globalAlpha*=s.eyeAlpha??1;c.fillStyle='#FFF8EE';c.beginPath();localPoints.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();c.fill();c.restore();
 }
}
module.exports=drawFace;
