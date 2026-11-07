/* Gentle waiting, with two small star points. No task progress is invented. */
(function(G){
'use strict';
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*x*(10+x*(-15+6*x));};
function ramp(t,a,b){return ease((t-a)/(b-a));}
function sample(sec,still=false){
 const t=still?0:((sec%8)+8)%8;
 const gaze=13*ramp(t,.25,1.05)-29*ramp(t,3.7,4.35)+16*ramp(t,6.1,7.15);
 const blink=(ramp(t,2.6,2.7)-ramp(t,2.77,2.96))*.88;
 const sy=1+.012*Math.sin(TAU*t/8),sx=1/sy;
 const p={x:256,y:404-126*sy,scaleX:sx,scaleY:sy,rotation:-1.4*(ramp(t,3.95,4.5)-ramp(t,5.6,6.45)),eyeX:gaze,eyeY:-3*(ramp(t,.3,1)-ramp(t,6.1,7.15)),eyeOpenL:.9-blink,eyeOpenR:.9-blink,shadowA:1,handAlpha:0};
 const stars=[{x:410+4*Math.sin(TAU*t/8),y:231+11*Math.sin(TAU*t/8),r:9,alpha:.9},
 {x:108+5*Math.sin(TAU*t/8),y:286-9*Math.sin(TAU*t/8),r:6.5,alpha:.66}];
 return {p,stars,time:t,beat:t<3.7?'轻轻等一会儿':t<5.5?'星点绕过来了，它慢半拍才发现':'看一眼，再安静地等一会儿'};
}
function star(c,s){c.save();c.globalAlpha*=s.alpha;c.translate(s.x,s.y);c.fillStyle='#ECC263';c.beginPath();for(let i=0;i<8;i++){const a=-Math.PI/2+i*Math.PI/4,r=i%2?s.r*.31:s.r;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();c.restore();}
function draw(c,sec,{still=false,error=false}={}){
 const s=sample(sec,still);c.clearRect(0,0,512,512);
 if(error){s.p.eyeOpenL=.72;s.p.eyeOpenR=.8;s.p.eyeY=8;s.p.eyeX=7;}
 c._qCandidate=true;G.QRefinement.drawComic(c,s.p,{clear:false});s.stars.forEach(p=>star(c,p));return s.beat;
}
G.QLoadingStory={draw,sample,duration:8};
})(globalThis);
