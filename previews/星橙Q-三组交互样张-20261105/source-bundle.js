/* Frozen current production sources. Review-only; no Aora code or expression data. */
(function(G){
const factories={
"/components/xingcheng-q-home/core.js":function(module,exports,require){
const Appearance=require('../xingcheng-q-motion/appearance');
const Motion=require('../xingcheng-q-motion/core');
const gsap=require('./timeline');
(function () {
  const TAU = Math.PI * 2;
  const P = { orange:'#FF6A1A', red:'#F04424', gold:'#FFC857', cyan:'#35C7D8', cream:'#FFF8EE', pale:'#FFF3CE' };

  function star(c,x,y,o,i,color,a=1,r=0){
    c.save(); c.translate(x,y); c.rotate(r); c.globalAlpha*=a; c.beginPath();
    for(let n=0;n<8;n++){const q=-Math.PI/2+n*Math.PI/4,d=n%2?i:o,px=Math.cos(q)*d,py=Math.sin(q)*d;n?c.lineTo(px,py):c.moveTo(px,py)}
    c.closePath(); c.fillStyle=color; c.fill(); c.restore();
  }
  function capsule(c,x,y,w,h,r,color=P.cream,a=1){
    const radius=Math.min(w,h)/2,left=-w/2,top=-h/2,right=w/2,bottom=h/2;
    c.save();c.translate(x,y);c.rotate(r);c.globalAlpha*=a;c.fillStyle=color;c.beginPath();c.moveTo(left+radius,top);c.arcTo(right,top,right,bottom,radius);c.arcTo(right,bottom,left,bottom,radius);c.arcTo(left,bottom,left,top,radius);c.arcTo(left,top,right,top,radius);c.closePath();c.fill();c.restore();
  }
  function base(){return{
    x:256,y:278,rotation:0,scaleX:1,scaleY:1,eyeX:0,eyeY:0,eyeOpenL:.9,eyeOpenR:.9,eyeTilt:0,
    mouth:0,smile:0,brow:0,shine:.45,halo:.12,handAlpha:0,handLX:144,handLY:308,handRX:368,handRY:308,
    snackAlpha:0,snackX:442,snackY:124,snackScale:1,snackTurn:0,snackTrail:0,ringAlpha:0,ringTurn:0,bellyGlow:0,
    looseAlpha:0,looseSpread:0,looseTurn:0,leftoverAlpha:0,leftoverX:392,leftoverY:354,leftoverScale:1,quantumAlpha:0,quantumSpread:1,
    asteroidAlpha:0,asteroidX:446,asteroidY:130,asteroidScale:.88,asteroidTurn:0,tetherAlpha:0,
    trailAlpha:0,trailPhase:0,ghostAlpha:0,wallAlpha:0,wallFlex:0,impactAlpha:0,
    idleAlpha:0,idleX:430,idleY:170,idleScale:1,idleTurn:0
  }}
  function hand(c,x,y,a){
    if(a<.01)return;c.save();c.translate(x,y);c.globalAlpha*=a;
    const g=c.createRadialGradient(-5,-6,1,0,0,20);g.addColorStop(0,'#FFD873');g.addColorStop(.36,'#FF9A22');g.addColorStop(1,P.red);
    c.fillStyle=g;c.shadowColor='rgba(255,154,34,.7)';c.shadowBlur=9;c.beginPath();c.arc(0,0,17,0,TAU);c.fill();c.restore();
  }
  function face(c,s){
    Motion.drawFace(c,s,1,'home');
    if(s.mouth>.02){c.save();c.translate(0,50);c.scale(1+s.smile*.32,Math.max(.2,s.mouth));c.fillStyle='#9E321D';c.beginPath();c.ellipse(0,0,18,14,0,0,TAU);c.fill();c.fillStyle='#FFB7A6';c.beginPath();c.ellipse(0,7,10,4,0,0,TAU);c.fill();c.restore()}
    else if(s.smile>.08){c.save();c.strokeStyle=P.cream;c.lineWidth=7;c.lineCap='round';c.beginPath();c.arc(0,37,20,.18*Math.PI,.82*Math.PI);c.stroke();c.restore()}
  }
  function orb(c,s,a=1,dx=0,dy=0,k=1){
    c.save();c.translate(s.x+dx,s.y+dy);c.rotate(s.rotation*Math.PI/180);c.scale(s.scaleX*k,s.scaleY*k);c.globalAlpha*=a;
    Appearance.drawBody(c,()=>{c.beginPath();c.arc(0,0,126,0,TAU);c.closePath();},126,{simple:false});
    Appearance.drawBrandStar(c,s,'home',{autoOptical:false});face(c,s);c.restore();hand(c,s.handLX,s.handLY,s.handAlpha);hand(c,s.handRX,s.handRY,s.handAlpha);
  }
  function snack(c,s){
    if(s.snackAlpha<.01)return;
    if(s.snackTrail>.01){c.save();c.globalAlpha=s.snackAlpha*s.snackTrail*.7;c.strokeStyle=P.cyan;c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(s.snackX+8,s.snackY+8);c.quadraticCurveTo(s.snackX+60,s.snackY-30,s.snackX+82,s.snackY+20);c.stroke();c.restore()}
    c.save();c.translate(s.snackX,s.snackY);c.rotate(s.snackTurn);c.scale(s.snackScale,s.snackScale);c.globalAlpha=s.snackAlpha;
    const g=c.createRadialGradient(-8,-9,1,0,0,29);g.addColorStop(0,P.cream);g.addColorStop(.26,P.gold);g.addColorStop(.72,P.orange);g.addColorStop(1,P.red);c.fillStyle=g;c.shadowColor=P.gold;c.shadowBlur=18;c.beginPath();c.arc(0,0,23,0,TAU);c.fill();star(c,0,0,12,3,P.cream,.96,-s.snackTurn);
    c.fillStyle=P.cyan;c.beginPath();c.arc(Math.cos(s.snackTurn*1.7)*34,Math.sin(s.snackTurn*1.7)*13,4,0,TAU);c.fill();c.restore();
  }
  function ring(c,s){
    if(s.ringAlpha<.01)return;c.save();c.translate(s.x,s.y);c.rotate(s.ringTurn);c.scale(s.scaleX,s.scaleY);c.globalAlpha=s.ringAlpha;c.lineCap='round';c.lineWidth=15;
    const g=c.createLinearGradient(-180,0,180,0);g.addColorStop(0,P.cyan);g.addColorStop(.5,P.gold);g.addColorStop(1,P.red);c.strokeStyle=g;c.shadowColor=P.gold;c.shadowBlur=12;c.beginPath();c.ellipse(0,8,174,55,0,0,TAU);c.stroke();c.restore();
  }
  function loose(c,s){
    if(Math.max(s.looseAlpha,s.leftoverAlpha)<.01)return;const pts=[[-74,-52,15,P.gold],[6,-86,11,P.cyan],[78,-38,13,P.red],[-92,38,9,P.cyan],[62,62,10,P.gold]];
    c.save();c.translate(s.x+30,s.y-10);pts.slice(0,4).forEach((p,i)=>star(c,p[0]*s.looseSpread,p[1]*s.looseSpread,p[2],p[2]*.25,p[3],s.looseAlpha,s.looseTurn+i*.45));c.restore();
    star(c,s.leftoverX,s.leftoverY,11*s.leftoverScale,2.8*s.leftoverScale,P.gold,Math.max(s.looseAlpha,s.leftoverAlpha),s.looseTurn);
  }
  function hiccup(c,s){
    if(s.impactAlpha<.01)return;
    c.save();c.globalAlpha=s.impactAlpha;c.strokeStyle=P.cyan;c.lineWidth=6;c.beginPath();c.arc(s.x+6,s.y+50,28+28*s.impactAlpha,-.55,.55);c.stroke();
    [[46,-18,10,P.gold],[62,2,7,P.cyan],[48,24,8,P.red]].forEach((p,i)=>star(c,s.x+p[0]*s.impactAlpha,s.y+50+p[1]*s.impactAlpha,p[2],2,p[3],s.impactAlpha,i));c.restore();
  }
  function quantum(c,s){
    if(s.quantumAlpha<.01)return;c.save();c.translate(256,278);c.globalAlpha=s.quantumAlpha;[[0,0,18,P.orange],[-44,-24,7,P.gold],[46,-18,6,P.cyan],[27,34,5,P.red]].forEach((p,i)=>{c.fillStyle=p[3];c.shadowColor=p[3];c.shadowBlur=i?10:18;c.beginPath();c.arc(p[0]*s.quantumSpread,p[1]*s.quantumSpread,p[2],0,TAU);c.fill()});star(c,0,0,9,2.2,P.cream,1);c.restore();
  }
  function asteroid(c,s){
    if(s.asteroidAlpha<.01)return;c.save();c.translate(s.asteroidX,s.asteroidY);c.rotate(s.asteroidTurn);c.scale(s.asteroidScale,s.asteroidScale);c.globalAlpha=s.asteroidAlpha;
    const g=c.createRadialGradient(-14,-18,2,0,0,50);g.addColorStop(0,'#FFF0B0');g.addColorStop(.35,P.gold);g.addColorStop(.78,P.orange);g.addColorStop(1,P.red);c.fillStyle=g;c.shadowColor=P.gold;c.shadowBlur=14;c.beginPath();
    for(let i=0;i<=20;i++){const a=i/20*TAU,r=39*(1+.1*Math.sin(i*2.7)),x=Math.cos(a)*r,y=Math.sin(a)*r;i?c.lineTo(x,y):c.moveTo(x,y)}c.closePath();c.fill();
    c.fillStyle='rgba(240,68,36,.35)';[[-12,-9,8],[15,10,6],[4,-21,4]].forEach(p=>{c.beginPath();c.arc(p[0],p[1],p[2],0,TAU);c.fill()});star(c,-5,-3,12,3,P.cream,.88,-s.asteroidTurn);c.restore();
  }
  function tether(c,s){
    if(s.tetherAlpha<.01)return;c.save();c.globalAlpha=s.tetherAlpha;c.strokeStyle=P.cyan;c.lineWidth=7;c.lineCap='round';c.shadowColor=P.cyan;c.shadowBlur=10;
    c.beginPath();c.moveTo(s.x+95*s.scaleX,s.y-20);c.quadraticCurveTo((s.x+s.asteroidX)/2,Math.min(s.y,s.asteroidY)-46,s.asteroidX,s.asteroidY);c.stroke();
    c.lineWidth=5;c.beginPath();c.ellipse(s.asteroidX,s.asteroidY,43*s.asteroidScale,17*s.asteroidScale,s.asteroidTurn,0,TAU);c.stroke();
    c.fillStyle=P.gold;c.beginPath();c.arc(s.x+95*s.scaleX,s.y-20,7,0,TAU);c.fill();c.restore();
  }
  function trail(c,s){if(s.trailAlpha<.01)return;c.save();c.globalAlpha=s.trailAlpha;c.lineCap='round';for(let i=0;i<3;i++){c.strokeStyle=i===0?P.gold:i===1?P.cyan:P.red;c.lineWidth=10-i*2;c.beginPath();c.arc(256,252,178-i*18,Math.PI*(.28+i*.08),Math.PI*(.28+1.42*s.trailPhase));c.stroke()}c.restore()}
  function wall(c,s){
    if(s.wallAlpha>.01){c.save();c.translate(438+s.wallFlex*13,260);c.scale(1-s.wallFlex*.35,1+s.wallFlex*.16);c.globalAlpha=s.wallAlpha;c.strokeStyle=P.cyan;c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(0,-130);c.bezierCurveTo(-18,-72,18,-28,0,0);c.bezierCurveTo(-18,36,18,84,0,142);c.stroke();[-120,-60,0,65,132].forEach((y,i)=>star(c,0,y,15+(i%2)*4,4,i%2?P.gold:P.cyan,1,i*.4));c.restore()}
    if(s.impactAlpha>.01)[[404,136,10,P.gold],[385,188,7,P.cyan],[400,336,12,P.red],[374,300,6,P.gold]].forEach((p,i)=>star(c,p[0],p[1],p[2]*s.impactAlpha,2,p[3],s.impactAlpha,i));
  }
  function idleSpeck(c,s){
    if(s.idleAlpha<.01)return;c.save();c.translate(s.idleX,s.idleY);c.rotate(s.idleTurn);c.scale(s.idleScale,s.idleScale);c.globalAlpha=s.idleAlpha;c.shadowColor=P.cyan;c.shadowBlur=14;c.fillStyle=P.cyan;c.beginPath();c.arc(0,0,7,0,TAU);c.fill();star(c,0,0,4,1,P.cream,1,-s.idleTurn);c.restore();
  }
  function paint(canvas,c,s,mode){
    c.clearRect(0,0,512,512);
    if(mode==='asteroid'){trail(c,s);wall(c,s);if(s.ghostAlpha>.01){orb(c,s,s.ghostAlpha*.16,-56,18,.84);orb(c,s,s.ghostAlpha*.09,-102,32,.7)}tether(c,s);asteroid(c,s);orb(c,s)}
    else if(mode==='idle'){idleSpeck(c,s);orb(c,s)}
    else{snack(c,s);ring(c,s);orb(c,s,1-s.quantumAlpha*.96);hiccup(c,s);loose(c,s);quantum(c,s)}
  }
  function lead(t,s){t.to(s,{y:273,scaleX:1.012,scaleY:.988,duration:.32,ease:'sine.inOut'},.08).to(s,{y:278,scaleX:1,scaleY:1,duration:.32,ease:'sine.inOut'},.4)}

  function snackTl(s,draw){
    const t=gsap.timeline({paused:true,onUpdate:draw});lead(t,s);
    t.to(s,{snackAlpha:1,snackX:405,snackY:145,snackTurn:1.4,duration:.52,ease:'back.out(1.7)'},.72)
     .to(s,{eyeX:12,eyeY:-9,eyeOpenL:1.06,eyeOpenR:1.06,duration:.3,ease:'power3.out'},.82)
     .to(s,{handAlpha:1,handRX:372,handRY:222,mouth:.45,duration:.38,ease:'back.out(1.8)'},1.26)
     .to(s,{x:302,y:256,scaleX:1.08,scaleY:.9,handRX:386,handRY:178,snackX:430,snackY:114,snackTrail:1,duration:.48,ease:'power3.inOut'},1.76)
     .to(s,{x:256,y:278,scaleX:.96,scaleY:1.04,eyeX:14,eyeY:-12,mouth:.1,duration:.42,ease:'back.out(1.6)'},2.27)
     .to(s,{snackX:122,snackY:168,snackTurn:4.2,duration:.62,ease:'power3.inOut'},2.32)
     .to(s,{eyeX:-13,eyeY:-8,rotation:-7,handLX:132,handLY:210,handRX:350,handRY:250,duration:.45,ease:'power2.inOut'},2.45)
     .to(s,{x:210,y:258,scaleX:1.1,scaleY:.88,handLX:126,handLY:172,duration:.48,ease:'power3.inOut'},3.02)
     .to(s,{snackX:356,snackY:122,snackTurn:7.2,duration:.58,ease:'circ.inOut'},3.08)
     .to(s,{x:256,y:278,rotation:0,scaleX:.95,scaleY:1.05,eyeX:10,eyeY:-11,eyeOpenL:.62,eyeOpenR:1.08,mouth:.72,duration:.5,ease:'back.out(2)'},3.62)
     .to(s,{x:284,y:242,scaleX:.9,scaleY:1.12,handLX:254,handLY:286,handRX:314,handRY:286,snackX:284,snackY:292,snackScale:.82,duration:.58,ease:'power4.in'},4.18)
     .to(s,{snackAlpha:0,snackScale:.15,mouth:1,eyeOpenL:.18,eyeOpenR:.18,duration:.18,ease:'expo.in'},4.64)
     .to(s,{x:256,y:286,scaleX:1.18,scaleY:1.13,bellyGlow:1,mouth:.1,smile:1,eyeOpenL:1,eyeOpenR:1,handAlpha:0,duration:.62,ease:'back.out(1.7)'},4.83)
     .to(s,{ringAlpha:1,ringTurn:.22,halo:.55,duration:.44,ease:'back.out(1.8)'},5.48)
     .to(s,{ringTurn:6.2,duration:1.32,ease:'power2.inOut'},5.55)
     .to(s,{y:290,scaleX:1.16,scaleY:1.17,duration:.94,ease:'sine.inOut'},5.8)
     .to(s,{y:307,scaleX:1.28,scaleY:.82,eyeY:8,eyeOpenL:.5,eyeOpenR:.5,mouth:.2,ringAlpha:.4,duration:.45,ease:'power3.in'},7.02)
     .to(s,{y:242,scaleX:.88,scaleY:1.22,mouth:1,eyeY:-8,eyeOpenL:1.1,eyeOpenR:1.1,ringAlpha:0,looseAlpha:1,looseSpread:1.55,looseTurn:1.2,impactAlpha:1,duration:.24,ease:'expo.out'},7.47)
     .to(s,{y:278,scaleX:1.03,scaleY:.97,bellyGlow:.3,looseSpread:1.9,looseTurn:2.4,impactAlpha:0,duration:.52,ease:'back.out(1.9)'},7.72)
     .to(s,{handAlpha:1,handLX:130,handLY:252,handRX:390,handRY:224,eyeX:8,eyeY:-5,eyeOpenL:1.08,eyeOpenR:1.08,mouth:.72,duration:.35,ease:'back.out(1.8)'},8.3)
     .to(s,{handLX:188,handLY:205,handRX:332,handRY:196,looseSpread:1.18,looseTurn:4.1,duration:.7,ease:'power3.inOut'},8.67)
     .to(s,{handLX:232,handLY:245,handRX:290,handRY:230,looseSpread:.48,looseAlpha:0,leftoverAlpha:1,duration:.76,ease:'power3.in'},9.4)
     .to(s,{handAlpha:0,x:256,y:278,scaleX:1,scaleY:1,mouth:0,smile:0,brow:0,bellyGlow:0,duration:.45,ease:'power3.out'},10.2)
     .to(s,{eyeX:12,eyeY:8,eyeOpenL:.72,eyeOpenR:1,duration:.36,ease:'power2.inOut'},11.12)
     .to(s,{eyeX:0,eyeY:0,duration:.28,ease:'power2.out'},11.52)
     .to(s,{looseTurn:8.4,leftoverX:350,leftoverY:278,leftoverScale:1.35,leftoverAlpha:1,duration:.58,ease:'power4.in'},12.34)
     .to(s,{x:230,y:292,rotation:-12,scaleX:1.18,scaleY:.74,eyeX:-10,eyeY:8,eyeOpenL:1.08,eyeOpenR:.45,leftoverAlpha:0,duration:.18,ease:'expo.out'},12.92)
     .to(s,{x:256,y:278,rotation:0,scaleX:.96,scaleY:1.06,eyeX:0,eyeY:0,brow:0,duration:.5,ease:'back.out(2)'},13.12)
     .to(s,{scaleX:.12,scaleY:.12,quantumAlpha:1,quantumSpread:1.65,duration:.42,ease:'power4.in'},13.7)
     .to(s,{quantumSpread:.48,duration:.4,ease:'power3.inOut'},14.12)
     .to(s,{scaleX:1.04,scaleY:.96,quantumAlpha:0,quantumSpread:1,eyeOpenL:.9,eyeOpenR:.9,duration:.5,ease:'back.out(1.8)'},14.53)
     .to(s,{scaleX:1,scaleY:1,x:256,y:278,rotation:0,halo:.12,duration:.28,ease:'sine.out'},15.04);
    return t;
  }
  function asteroidTl(s,draw){
    const t=gsap.timeline({paused:true,onUpdate:draw});lead(t,s);
    t.to(s,{asteroidAlpha:1,asteroidX:402,asteroidY:142,asteroidTurn:1.6,duration:.55,ease:'back.out(1.7)'},.72)
     .to(s,{eyeX:12,eyeY:-10,eyeOpenL:1.06,eyeOpenR:1.06,duration:.34,ease:'power3.out'},.84)
     .to(s,{asteroidX:360,asteroidY:188,asteroidTurn:3.2,duration:.68,ease:'sine.inOut'},1.35)
     .to(s,{handAlpha:1,handRX:362,handRY:208,mouth:.42,smile:.5,duration:.4,ease:'back.out(1.8)'},1.55)
     .to(s,{tetherAlpha:1,handRX:350,handRY:215,handLX:330,handLY:244,x:246,scaleX:1.08,scaleY:.92,duration:.46,ease:'power3.inOut'},2.05)
     .to(s,{asteroidX:420,asteroidY:112,asteroidTurn:5.5,x:285,y:252,rotation:10,scaleX:.86,scaleY:1.16,eyeX:13,eyeY:-10,eyeOpenL:1.12,eyeOpenR:1.12,mouth:.85,duration:.42,ease:'power4.in'},2.54)
     .to(s,{asteroidX:118,asteroidY:112,asteroidTurn:8.2,x:190,y:205,rotation:-42,scaleX:1.18,scaleY:.72,trailAlpha:.8,trailPhase:.36,ghostAlpha:1,duration:.65,ease:'power4.out'},2.98)
     .to(s,{asteroidX:98,asteroidY:350,asteroidTurn:11.5,x:190,y:328,rotation:-116,scaleX:.78,scaleY:1.18,trailPhase:.67,duration:.72,ease:'power2.inOut'},3.64)
     .to(s,{asteroidX:410,asteroidY:356,asteroidTurn:15.4,x:320,y:326,rotation:-214,scaleX:1.18,scaleY:.76,trailPhase:.92,duration:.8,ease:'power2.inOut'},4.38)
     .to(s,{asteroidX:418,asteroidY:136,asteroidTurn:18.5,x:318,y:188,rotation:-296,scaleX:.84,scaleY:1.12,eyeX:8,eyeY:-4,eyeOpenL:.72,eyeOpenR:.72,mouth:.5,smile:1,duration:.78,ease:'power2.inOut'},5.2)
     .to(s,{asteroidX:126,asteroidY:130,asteroidTurn:22.2,x:188,y:190,rotation:-382,scaleX:1.08,scaleY:.86,trailPhase:1,duration:.82,ease:'power2.inOut'},6)
     .to(s,{asteroidX:112,asteroidY:356,asteroidTurn:26.2,x:190,y:315,rotation:-470,scaleX:.82,scaleY:1.12,mouth:.9,smile:1,duration:.82,ease:'power2.inOut'},6.84)
     .to(s,{asteroidX:408,asteroidY:340,asteroidTurn:30.4,x:318,y:310,rotation:-558,scaleX:1.12,scaleY:.82,duration:.82,ease:'power2.inOut'},7.68)
     .to(s,{asteroidX:408,asteroidY:136,asteroidTurn:34.6,x:310,y:194,rotation:-646,scaleX:.84,scaleY:1.1,duration:.82,ease:'power2.inOut'},8.52)
     .to(s,{tetherAlpha:0,asteroidX:466,asteroidY:86,asteroidAlpha:.35,x:344,y:225,rotation:-610,scaleX:1.22,scaleY:.7,handLX:276,handLY:210,handRX:402,handRY:212,trailAlpha:.4,duration:.48,ease:'power4.in'},9.38)
     .to(s,{asteroidAlpha:0,x:372,y:260,rotation:-570,scaleX:.64,scaleY:1.08,wallAlpha:1,wallFlex:.72,impactAlpha:1,eyeX:10,eyeY:0,eyeOpenL:1.14,eyeOpenR:1.14,mouth:1,duration:.34,ease:'expo.out'},9.87)
     .to(s,{x:352,y:260,rotation:-560,scaleX:.78,scaleY:1.02,wallFlex:.18,impactAlpha:.35,duration:.34,ease:'back.out(2)'},10.22)
     .to(s,{x:190,y:270,rotation:-520,scaleX:1.18,scaleY:.76,handLX:126,handLY:225,handRX:258,handRY:230,trailAlpha:0,duration:.58,ease:'power4.out'},10.62)
     .to(s,{x:256,y:292,rotation:-360,scaleX:1.1,scaleY:.78,wallAlpha:0,impactAlpha:0,mouth:.3,brow:0,duration:.58,ease:'power3.in'},11.2)
     .to(s,{y:278,rotation:0,scaleX:.96,scaleY:1.06,smile:1,eyeX:0,duration:.46,ease:'back.out(2)'},11.78)
     .to(s,{scaleX:1,scaleY:1,handLX:146,handLY:290,handRX:370,handRY:250,duration:.32,ease:'sine.out'},12.24)
     .to(s,{handRX:392,handRY:220,smile:1,mouth:0,eyeOpenL:.72,eyeOpenR:.72,duration:.38,ease:'back.out(1.8)'},12.62)
     .to(s,{asteroidAlpha:1,asteroidX:458,asteroidY:230,asteroidScale:.46,asteroidTurn:38,duration:.42,ease:'power3.out'},12.78)
     .to(s,{asteroidX:330,asteroidY:242,asteroidScale:.36,asteroidTurn:41,duration:.48,ease:'power4.in'},13.24)
     .to(s,{x:238,y:284,rotation:-10,scaleX:1.15,scaleY:.78,eyeX:-10,eyeY:6,eyeOpenL:1.08,eyeOpenR:.4,eyeTilt:-8,smile:0,asteroidAlpha:0,handAlpha:0,impactAlpha:1,duration:.18,ease:'expo.out'},13.72)
     .to(s,{x:262,rotation:5,eyeX:10,duration:.12,ease:'none'},13.92)
     .to(s,{x:248,rotation:-4,eyeX:-8,duration:.12,ease:'none'},14.04)
     .to(s,{x:256,y:278,rotation:0,scaleX:1.02,scaleY:.98,eyeX:0,eyeY:0,eyeTilt:0,brow:0,impactAlpha:0,ghostAlpha:0,duration:.46,ease:'back.out(1.8)'},14.18)
     .to(s,{scaleX:1,scaleY:1,eyeOpenL:.9,eyeOpenR:.9,handLX:144,handLY:308,handRX:368,handRY:308,duration:.32,ease:'sine.out'},14.65);
    return t;
  }
  function idleTl(s,draw){
    const t=gsap.timeline({paused:true,onUpdate:draw});
    t.to(s,{y:271,scaleX:1.018,scaleY:.982,halo:.17,duration:.72,ease:'sine.inOut'},.08)
     .to(s,{y:278,scaleX:1,scaleY:1,halo:.12,duration:.72,ease:'sine.inOut'},.8)
     .to(s,{eyeOpenL:.08,eyeOpenR:.08,duration:.1,ease:'power3.in'},1.75)
     .to(s,{eyeOpenL:.9,eyeOpenR:.9,duration:.18,ease:'back.out(1.6)'},1.86)
     .to(s,{eyeX:-8,eyeY:1,rotation:-2,duration:.4,ease:'sine.inOut'},2.45)
     .to(s,{eyeX:8,rotation:2,duration:.55,ease:'sine.inOut'},2.92)
     .to(s,{eyeX:0,rotation:0,duration:.36,ease:'power2.out'},3.5)
     .to(s,{idleAlpha:1,idleX:408,idleY:164,idleScale:1,idleTurn:1.4,duration:.38,ease:'back.out(1.8)'},3.95)
     .to(s,{eyeX:11,eyeY:-9,duration:.28,ease:'power3.out'},4.04)
     .to(s,{idleX:112,idleY:144,idleTurn:5.8,duration:1.05,ease:'sine.inOut'},4.42)
     .to(s,{eyeX:-12,eyeY:-10,rotation:-4,duration:.68,ease:'sine.inOut'},4.62)
     .to(s,{handAlpha:1,handLX:126,handLY:222,scaleX:1.04,scaleY:.96,duration:.35,ease:'back.out(1.8)'},5.08)
     .to(s,{handLX:145,handLY:198,rotation:-6,duration:.26,ease:'sine.inOut'},5.45)
     .to(s,{handLX:124,handLY:218,rotation:-3,duration:.26,ease:'sine.inOut'},5.72)
     .to(s,{idleAlpha:0,idleScale:.3,idleX:82,idleY:116,duration:.32,ease:'power3.in'},5.9)
     .to(s,{handAlpha:0,eyeX:0,eyeY:0,rotation:0,y:273,scaleX:1.012,scaleY:.988,duration:.48,ease:'power3.out'},6.18)
     .to(s,{y:278,scaleX:1,scaleY:1,halo:.12,eyeOpenL:.9,eyeOpenR:.9,handLX:144,handLY:308,duration:.42,ease:'sine.out'},6.68);
    return t;
  }
  function create(canvas,mode){const c=canvas.getContext('2d'),s=base(),draw=()=>paint(canvas,c,s,mode),timeline=mode==='asteroid'?asteroidTl(s,draw):mode==='idle'?idleTl(s,draw):snackTl(s,draw);timeline.seek(0);draw();return{state:s,timeline,draw}}
  function createPolished(canvas){
    const c=canvas.getContext('2d'),s=base(),rawTimeline=idleTl(s,()=>{});
    const motion=Motion.createMotion({sample(t){rawTimeline.seek(t);return Object.assign({},s)}},'idle');
    const scene={state:null,draw(){paint(canvas,c,scene.state,'idle')}};
    scene.timeline={seek(t){scene.state=motion.sample(t);scene.draw();return this},duration(){return motion.duration}};
    return scene;
  }
  module.exports={create,createPolished,base,star};
})();

},
"/components/xingcheng-q-home/sleep.js":function(module,exports,require){
const Motion=require('../xingcheng-q-motion/core');
const Appearance=require('../xingcheng-q-motion/appearance');

      const gsap = require('./timeline');
      function create(canvas) {
      const ctx = canvas.getContext('2d');
      const s = {
        x: 256, y: 278, rotation: 0, scaleX: 1, scaleY: 1,
        eyeX: 0, eyeY: 0, eyeOpenL: 0.9, eyeOpenR: 0.9, eyeTilt: 0,
        eyeTiltL: 0, eyeTiltR: 0,
        halo: 0.12, starGlow: 0.2, shine: 0.45,
        handAlpha: 0, handLX: -118, handLY: 40, handRX: 118, handRY: 40,
        trail: 0, trailSweep: 0, ghost: 0,
        sleepMotes: 0, cue: 0, endSpark: 0, wink: 0,
        bubbleAlpha: 0, bubbleScale: 0.2, bubbleBurst: 0,
        ribbonAlpha: 0, ribbonRotation: 0, ribbonScale: 0.4, ribbonFlow: 0,
        charAlpha: 1, charScale: 1, dotAlpha: 0, dotSpread: 1.4
      };

      function fourStar(x, y, outer, inner, fill, alpha = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.globalAlpha *= alpha;
        ctx.beginPath();
        for (let i = 0; i < 8; i += 1) {
          const a = -Math.PI / 2 + i * Math.PI / 4;
          const r = i % 2 === 0 ? outer : inner;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.restore();
      }

      function capsule(x, y, w, h, rotation, alpha = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.globalAlpha *= alpha;
        ctx.fillStyle = '#FFF8EE';
        const radius = Math.min(w, h) / 2;
        const left = -w / 2;
        const top = -h / 2;
        const right = w / 2;
        const bottom = h / 2;
        ctx.beginPath();
        ctx.moveTo(left + radius, top);
        ctx.arcTo(right, top, right, bottom, radius);
        ctx.arcTo(right, bottom, left, bottom, radius);
        ctx.arcTo(left, bottom, left, top, radius);
        ctx.arcTo(left, top, right, top, radius);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      function hand(x, y, alpha) { if(ctx._qPropsOnly)return;
        ctx.save();
        ctx.translate(x, y);
        ctx.globalAlpha *= alpha;
        const g = ctx.createRadialGradient(-6, -7, 2, 0, 0, 24);
        g.addColorStop(0, '#FFC857');
        g.addColorStop(0.32, '#FF9A22');
        g.addColorStop(1, '#F04424');
        ctx.fillStyle = g;
        ctx.strokeStyle = 'rgba(255,200,87,.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,248,238,.72)';
        ctx.beginPath();
        ctx.arc(-6, -7, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      function sleepBubble() {
        if (s.bubbleAlpha <= 0.01 && s.bubbleBurst <= 0.01) return;
        ctx.save();
        ctx.translate(61, 30);
        if (s.bubbleAlpha > 0.01) {
          ctx.globalAlpha *= s.bubbleAlpha;
          ctx.scale(s.bubbleScale, s.bubbleScale);
          const bg = ctx.createRadialGradient(-9, -11, 2, 0, 0, 32);
          bg.addColorStop(0, 'rgba(255,255,255,.9)');
          bg.addColorStop(0.28, 'rgba(255,200,87,.56)');
          bg.addColorStop(0.72, 'rgba(53,199,216,.24)');
          bg.addColorStop(1, 'rgba(53,199,216,.08)');
          ctx.fillStyle = bg;
          ctx.strokeStyle = 'rgba(255,248,238,.92)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 29, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        if (s.bubbleBurst > 0.01) {
          const burst = [[-34,-8,11,3],[31,-20,9,2],[-10,-38,7,2],[38,16,6,2],[-22,30,5,1.5]];
          burst.forEach((p, i) => fourStar(p[0] * s.bubbleBurst, p[1] * s.bubbleBurst, p[2] * Math.min(1, s.bubbleBurst * 1.5), p[3], i % 2 ? '#35C7D8' : '#FFC857', 1 - s.bubbleBurst * 0.28));
        }
        ctx.restore();
      }

      function drawRibbons(front) {
        if (s.ribbonAlpha <= 0.01) return;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.scale(s.ribbonScale, s.ribbonScale);
        ctx.lineCap = 'round';
        const flow = Math.max(0.08, Math.min(1, s.ribbonFlow));
        const bands = [
          { rx: 172, ry: 63, tilt: -0.14, color: '#FFC857', glow: '#FF9A22', width: 13, length: 1.55, speed: 1, offset: 0.08 },
          { rx: 146, ry: 91, tilt: 0.78, color: '#35C7D8', glow: '#35C7D8', width: 9, length: 1.28, speed: -0.82, offset: 1.9 },
          { rx: 160, ry: 74, tilt: -0.8, color: '#F04424', glow: '#FF6A1A', width: 8, length: 0.96, speed: 1.16, offset: 3.45 }
        ];
        const point = (b, theta) => {
          const ex = Math.cos(theta) * b.rx;
          const ey = Math.sin(theta) * b.ry;
          const c = Math.cos(b.tilt);
          const sn = Math.sin(b.tilt);
          return { x: ex * c - ey * sn, y: ex * sn + ey * c };
        };
        bands.forEach((b) => {
          const head = s.ribbonRotation * Math.PI / 180 * b.speed + b.offset;
          const span = b.length * Math.PI * flow;
          const steps = 44;
          for (let i = 0; i < steps; i += 1) {
            const t0 = i / steps;
            const t1 = (i + 1) / steps;
            const p0 = point(b, head - span + span * t0);
            const p1 = point(b, head - span + span * t1);
            const isFront = (p0.y + p1.y) / 2 >= 0;
            if (isFront !== front) continue;
            const strength = Math.pow(t1, 1.55);
            const baseAlpha = s.ribbonAlpha * (0.05 + 0.95 * strength) * (front ? 1 : 0.76);
            ctx.globalAlpha = baseAlpha * 0.18;
            ctx.strokeStyle = b.glow;
            ctx.lineWidth = b.width * (0.55 + 0.45 * strength) + 10;
            ctx.shadowColor = b.glow;
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
            ctx.globalAlpha = baseAlpha;
            ctx.strokeStyle = b.color;
            ctx.lineWidth = b.width * (0.28 + 0.72 * strength);
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
          }
          const hp = point(b, head);
          const headFront = hp.y >= 0;
          if (headFront === front) {
            ctx.globalAlpha = s.ribbonAlpha;
            const bead = ctx.createRadialGradient(hp.x - 3, hp.y - 3, 1, hp.x, hp.y, b.width + 5);
            bead.addColorStop(0, '#FFF8EE');
            bead.addColorStop(0.3, b.color);
            bead.addColorStop(1, b.glow);
            ctx.fillStyle = bead;
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.arc(hp.x, hp.y, b.width * 0.72, 0, Math.PI * 2);
            ctx.fill();
            fourStar(hp.x, hp.y, b.width * 0.46, 1.6, '#FFF8EE', 0.9);
          }
        });
        ctx.restore();
      }

      function drawQuantumDots() { if(ctx._qPropsOnly)return;
        if (s.dotAlpha <= 0.01) return;
        ctx.save();
        ctx.translate(256, 278);
        ctx.globalAlpha = s.dotAlpha;
        const dots = [
          [0, 0, 18, '#FF6A1A'],
          [-44 * s.dotSpread, -24 * s.dotSpread, 7, '#FFC857'],
          [46 * s.dotSpread, -18 * s.dotSpread, 6, '#35C7D8'],
          [27 * s.dotSpread, 34 * s.dotSpread, 5, '#F04424']
        ];
        dots.forEach((d, i) => {
          ctx.shadowColor = d[3];
          ctx.shadowBlur = i === 0 ? 20 : 12;
          ctx.fillStyle = d[3];
          ctx.beginPath();
          ctx.arc(d[0], d[1], d[2], 0, Math.PI * 2);
          ctx.fill();
        });
        fourStar(0, 0, 9, 2.2, '#FFF3CE', s.dotAlpha);
        ctx.restore();
      }

      function drawCharacter(x, y, rotation, scaleX, scaleY, alpha = 1) { if(ctx._qPropsOnly)return;
        ctx.save();ctx.translate(x,y);ctx.rotate(rotation*Math.PI/180);ctx.scale(scaleX,scaleY);ctx.globalAlpha*=alpha;
        Appearance.drawBody(ctx,()=>{ctx.beginPath();ctx.arc(0,0,126,0,Math.PI*2);ctx.closePath();},126,{simple:false});
        Appearance.drawBrandStar(ctx,s,'sleep',{autoOptical:false});
        Motion.drawFace(ctx,s,1,'sleep');
        sleepBubble();hand(s.handLX,s.handLY,s.handAlpha);hand(s.handRX,s.handRY,s.handAlpha);ctx.restore();
      }

      function drawTrail() {
        if (s.trail <= 0.01) return;
        ctx.save();
        ctx.globalAlpha = s.trail;
        ctx.lineCap = 'round';
        ctx.lineWidth = 9;
        const grad = ctx.createLinearGradient(150, 340, 370, 120);
        grad.addColorStop(0, 'rgba(53,199,216,0)');
        grad.addColorStop(0.45, '#35C7D8');
        grad.addColorStop(1, '#FFC857');
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.arc(255, 250, 150, Math.PI * 0.24, Math.PI * (0.24 + 1.35 * s.trailSweep));
        ctx.stroke();
        ctx.restore();
      }

      function drawDecor() {
        ctx.save();
        ctx.globalAlpha = s.sleepMotes;
        [[376,154,5],[401,128,3],[419,101,2]].forEach((p, i) => {
          ctx.fillStyle = i === 1 ? '#35C7D8' : '#FFC857';
          ctx.beginPath();
          ctx.arc(p[0], p[1], p[2], 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();

        if (s.cue > 0.01) {
          ctx.save();
          ctx.globalAlpha = s.cue;
          ctx.strokeStyle = '#FFC857';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(412, 354, 28, 0.25 * Math.PI, 1.8 * Math.PI);
          ctx.stroke();
          ctx.fillStyle = '#35C7D8';
          ctx.beginPath();
          ctx.arc(438, 345, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (s.endSpark > 0.01) {
          fourStar(132, 168, 17, 4, '#FFC857', s.endSpark);
          fourStar(388, 214, 12, 3, '#35C7D8', s.endSpark * 0.9);
          fourStar(355, 116, 8, 2, '#FFF3CE', s.endSpark * 0.75);
        }
      }

      function draw() {
        ctx.clearRect(0, 0, 512, 512);
        drawDecor();
        drawTrail();
        drawRibbons(false);
        if (s.ghost > 0.01) {
          drawCharacter(s.x - 34, s.y + 20, s.rotation - 28, s.scaleX * 0.9, s.scaleY * 0.9, s.ghost * 0.22);
          drawCharacter(s.x - 66, s.y + 34, s.rotation - 52, s.scaleX * 0.8, s.scaleY * 0.8, s.ghost * 0.12);
        }
        drawCharacter(s.x, s.y, s.rotation, s.scaleX * s.charScale, s.scaleY * s.charScale, s.charAlpha);
        drawRibbons(true);
        drawQuantumDots();
      }

      const story = gsap.timeline({ paused: false });

      story.addLabel('doze', 0.22)
        .to(s, { y: 270, scaleX: 1.025, scaleY: 0.975, halo: 0.2, duration: 0.94, ease: 'sine.inOut' }, 0.22)
        .to(s, { y: 282, scaleX: 0.985, scaleY: 1.025, halo: 0.11, duration: 0.94, ease: 'sine.inOut' }, 1.17)
        .to(s, { y: 271, scaleX: 1.02, scaleY: 0.98, halo: 0.19, duration: 0.81, ease: 'sine.inOut' }, 2.12)
        .to(s, { y: 282, scaleX: 0.99, scaleY: 1.02, halo: 0.1, duration: 0.77, ease: 'sine.inOut' }, 2.94)
        .to(s, { eyeX: 8, eyeY: -4, eyeTiltL: -24, eyeTiltR: 13, duration: 0.42, ease: 'power2.inOut' }, 0.22)
        .to(s, { eyeX: -5, eyeY: 0, eyeOpenL: 0.82, eyeOpenR: 0.16, eyeTiltL: 4, eyeTiltR: 0, duration: 0.38, ease: 'circ.inOut' }, 0.78)
        .to(s, { eyeOpenL: 0.12, eyeOpenR: 0.12, eyeX: 0, eyeY: 5, eyeTiltL: 0, eyeTiltR: 0, duration: 0.58, ease: 'sine.inOut' }, 1.3)
        .to(s, { bubbleAlpha: 0.96, bubbleScale: 1.04, duration: 0.8, ease: 'sine.out' }, 1.15)
        .to(s, { bubbleScale: 0.76, duration: 0.55, ease: 'sine.inOut' }, 1.96)
        .to(s, { bubbleScale: 1.28, duration: 0.9, ease: 'sine.inOut' }, 2.52)
        .to(s, { bubbleScale: 1.18, duration: 0.28, ease: 'sine.out' }, 3.43)
        .to(s, { sleepMotes: 1, duration: 3.1, ease: 'none' }, 0.38);

      story.addLabel('flashWake', 3.8)
        .to(s, { starGlow: 1.7, shine: 1, duration: 0.2, ease: 'expo.out' }, 3.8)
        .to(s, { bubbleAlpha: 0, bubbleScale: 1.4, duration: 0.12, ease: 'power4.in' }, 3.8)
        .to(s, { bubbleBurst: 1, duration: 0.28, ease: 'expo.out' }, 3.87)
        .to(s, { bubbleBurst: 0, duration: 0.38, ease: 'sine.in' }, 4.16)
        .to(s, { y: 246, scaleX: 0.94, scaleY: 1.11, eyeOpenL: 1, eyeOpenR: 1, eyeY: -4, eyeTiltL: 0, eyeTiltR: 0, duration: 0.24, ease: 'back.out(2.2)' }, 3.87)
        .to(s, { starGlow: 0.45, shine: 0.55, duration: 0.62, ease: 'sine.out' }, 4.02)
        .to(s, { y: 278, scaleX: 1.03, scaleY: 0.97, duration: 0.48, ease: 'power3.out' }, 4.23)
        .to(s, { scaleX: 1, scaleY: 1, duration: 0.34, ease: 'sine.inOut' }, 4.72)
        .to(s, { sleepMotes: 0, duration: 0.3, ease: 'power2.in' }, 3.87);

      story.addLabel('lookAround', 5.1)
        .to(s, { eyeX: -12, eyeY: 0, rotation: -4, x: 250, duration: 0.38, ease: 'power2.inOut' }, 5.1)
        .to(s, { eyeOpenL: 0.78, eyeOpenR: 0.78, duration: 0.18, ease: 'power3.in' }, 5.57)
        .to(s, { eyeOpenL: 1, eyeOpenR: 1, duration: 0.24, ease: 'back.out(1.5)' }, 5.75)
        .to(s, { eyeX: 12, rotation: 5, x: 262, duration: 0.42, ease: 'circ.inOut' }, 5.93)
        .to(s, { eyeX: 0, eyeY: 2, rotation: 0, x: 256, duration: 0.42, ease: 'power3.out' }, 6.5);

      story.addLabel('tidy', 6.93)
        .to(s, { handAlpha: 1, handLX: -96, handLY: 18, handRX: 96, handRY: 18, duration: 0.3, ease: 'back.out(1.8)' }, 6.93)
        .to(s, { handLX: -64, handLY: -58, handRX: 55, handRY: -10, eyeX: -4, eyeY: -1, duration: 0.5, ease: 'power2.inOut' }, 7.27)
        .to(s, { starGlow: 0.9, handLX: -82, handLY: -35, handRX: 66, handRY: -20, eyeTilt: 5, duration: 0.38, ease: 'sine.inOut' }, 7.77)
        .to(s, { starGlow: 0.32, eyeTilt: 0, duration: 0.32, ease: 'circ.out' }, 8.15);

      story.addLabel('squash', 8.47)
        .to(s, { handLX: -118, handLY: 42, handRX: 118, handRY: 42, handAlpha: 0.55, duration: 0.35, ease: 'power3.inOut' }, 8.47)
        .to(s, { y: 323, scaleX: 1.19, scaleY: 0.68, eyeY: 13, eyeOpenL: 0.72, eyeOpenR: 0.72, halo: 0.38, duration: 0.72, ease: 'power3.in' }, 8.8)
        .to(s, { starGlow: 1.15, halo: 0.7, duration: 0.25, ease: 'expo.in' }, 9.53);

      story.addLabel('jump', 9.78)
        .to(s, { x: 286, y: 116, rotation: 38, scaleX: 0.88, scaleY: 1.14, eyeY: -5, eyeOpenL: 1, eyeOpenR: 1, handAlpha: 1, handLX: -136, handLY: 5, handRX: 136, handRY: 5, trail: 0.95, trailSweep: 0.62, ghost: 1, duration: 0.62, ease: 'power4.out' }, 9.78)
        .to(s, { x: 226, y: 292, rotation: 198, scaleX: 1.13, scaleY: 0.76, trailSweep: 1, ghost: 0.25, duration: 0.78, ease: 'power3.in' }, 10.4)
        .to(s, { scaleX: 0.96, scaleY: 1.05, duration: 0.22, ease: 'back.out(2)' }, 11.18);

      story.addLabel('roll', 11.4)
        .to(s, { x: 313, y: 282, rotation: 552, scaleX: 1, scaleY: 1, handLX: -138, handLY: -6, handRX: 138, handRY: 12, duration: 0.66, ease: 'power2.inOut' }, 11.4)
        .to(s, { x: 250, y: 278, rotation: 720, handLX: -120, handLY: 30, handRX: 120, handRY: 30, duration: 0.62, ease: 'power4.out' }, 12.06)
        .to(s, { trail: 0, ghost: 0, halo: 0.14, duration: 0.52, ease: 'sine.out' }, 12.23);

      story.addLabel('compose', 12.87)
        .to(s, { x: 256, y: 278, rotation: 720, scaleX: 1.05, scaleY: 0.95, handAlpha: 1, handLX: -88, handLY: 30, handRX: 88, handRY: 30, eyeX: 0, eyeY: 0, duration: 0.28, ease: 'expo.out' }, 12.87)
        .to(s, { scaleX: 1, scaleY: 1, handLX: -102, handLY: 42, handRX: 102, handRY: 42, duration: 0.42, ease: 'sine.inOut' }, 13.15)
        .to(s, { eyeOpenL: 0.12, eyeOpenR: 0.12, duration: 0.11, ease: 'power3.in' }, 13.67)
        .to(s, { eyeOpenL: 1, eyeOpenR: 1, handAlpha: 0, duration: 0.26, ease: 'back.out(1.7)' }, 13.78);

      story.addLabel('invite', 14.23)
        .to(s, { cue: 1, duration: 0.36, ease: 'power3.out' }, 14.23)
        .to(s, { eyeX: 11, eyeY: 7, x: 249, rotation: 723, duration: 0.38, ease: 'power2.inOut' }, 14.37)
        .to(s, { handAlpha: 1, handRX: 122, handRY: 66, duration: 0.42, ease: 'back.out(1.6)' }, 14.83)
        .to(s, { cue: 0.5, duration: 0.65, ease: 'sine.inOut' }, 15.17);

      story.addLabel('wink', 15.77)
        .to(s, { wink: 0.9, endSpark: 1, starGlow: 0.8, duration: 0.16, ease: 'power3.in' }, 15.77)
        .to(s, { wink: 0, starGlow: 0.32, duration: 0.34, ease: 'back.out(1.8)' }, 15.93)
        .to(s, { eyeX: 0, eyeY: 0, handAlpha: 0, cue: 0, duration: 0.3, ease: 'power2.out' }, 16.13);

      story.addLabel('quantumRibbons', 16.33)
        .to(s, { ribbonAlpha: 1, ribbonScale: 1, ribbonFlow: 1, endSpark: 0.7, halo: 0.46, duration: 0.46, ease: 'back.out(1.5)' }, 16.33)
        .to(s, { ribbonRotation: 338, duration: 1.58, ease: 'power2.inOut' }, 16.45)
        .to(s, { y: 266, rotation: 748, scaleX: 1.12, scaleY: 0.86, eyeX: 8, duration: 0.55, ease: 'power3.inOut' }, 16.47)
        .to(s, { y: 284, rotation: 784, scaleX: 0.86, scaleY: 1.13, eyeX: -8, duration: 0.56, ease: 'sine.inOut' }, 17.03)
        .to(s, { y: 278, rotation: 810, scaleX: 1, scaleY: 1, eyeX: 0, duration: 0.42, ease: 'circ.out' }, 17.6);

      story.addLabel('quantumCollapse', 18.05)
        .to(s, { x: 256, y: 278, charScale: 0.1, charAlpha: 0, eyeOpenL: 0.16, eyeOpenR: 0.16, halo: 0, starGlow: 1.1, ribbonScale: 0.14, ribbonAlpha: 0, endSpark: 0, duration: 0.72, ease: 'power4.in' }, 18.05)
        .to(s, { dotAlpha: 1, dotSpread: 1.7, duration: 0.34, ease: 'back.out(1.8)' }, 18.43)
        .to(s, { dotSpread: 0.72, duration: 0.46, ease: 'power3.inOut' }, 18.77)
        .to(s, { dotSpread: 0.86, duration: 0.22, ease: 'sine.out' }, 19.23);

      story.addLabel('reassemble', 19.47)
        .to(s, { charAlpha: 1, charScale: 1, rotation: 720, eyeOpenL: 1, eyeOpenR: 1, starGlow: 0.32, halo: 0.14, dotAlpha: 0, duration: 0.58, ease: 'back.out(1.75)' }, 19.47)
        .to(s, { scaleX: 1.03, scaleY: 0.97, duration: 0.16, ease: 'power2.inOut' }, 19.83)
        .to(s, {
          x: 256, y: 278, rotation: 720, scaleX: 1, scaleY: 1,
          eyeX: 0, eyeY: 0, eyeOpenL: 0.9, eyeOpenR: 0.9,
          eyeTilt: 0, eyeTiltL: 0, eyeTiltR: 0,
          halo: 0.12, starGlow: 0.2, shine: 0.45,
          handAlpha: 0, handLX: -118, handLY: 40, handRX: 118, handRY: 40,
          sleepMotes: 0, cue: 0, endSpark: 0, wink: 0,
          bubbleAlpha: 0, bubbleBurst: 0, ribbonAlpha: 0,
          charAlpha: 1, charScale: 1, dotAlpha: 0,
          duration: 0.22, ease: 'sine.out'
        }, 20.05);

      const tl = gsap.timeline({ paused: true, onUpdate: draw });
      tl.to(s, { y: 273, scaleX: 1.012, scaleY: 0.988, duration: 0.32, ease: 'sine.inOut' }, 0.08)
        .to(s, { y: 278, scaleX: 1, scaleY: 1, duration: 0.32, ease: 'sine.inOut' }, 0.4)
        .add(story, 0.65);
      tl.seek(0);
      draw();
      return { timeline: tl, draw, state:s };
      }
      module.exports = { create };
    

},
"/components/xingcheng-q-home/timeline.js":function(module,exports,require){
const clamp=v=>Math.max(0,Math.min(1,v))
function easing(name,t){const x=clamp(t);if(!name||name==='none')return x;if(name.indexOf('inOut')>=0)return-(Math.cos(Math.PI*x)-1)/2;if(name.indexOf('back.out')>=0){const c=1.70158;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)}if(name.indexOf('bounce.out')>=0){const n=7.5625,d=2.75;if(x<1/d)return n*x*x;if(x<2/d){const y=x-1.5/d;return n*y*y+.75}if(x<2.5/d){const y=x-2.25/d;return n*y*y+.9375}const y=x-2.625/d;return n*y*y+.984375}if(name.indexOf('.in')>=0)return x*x*x;return 1-Math.pow(1-x,3)}
function valueAt(track,time,initial){let value=initial;for(const seg of track){if(time<seg.start)break;const p=seg.end===seg.start?1:clamp((time-seg.start)/(seg.end-seg.start));value=typeof seg.from==='number'&&typeof seg.to==='number'?seg.from+(seg.to-seg.from)*easing(seg.ease,p):p>=1?seg.to:seg.from}return value}
function timeline(options={}){
  const segments=[],initial=new Map();let cursor=0,order=0,dirty=true,tracks=[]
  function compile(){if(!dirty)return;const grouped=new Map();segments.slice().sort((a,b)=>a.start-b.start||a.order-b.order).forEach(seg=>{let byKey=grouped.get(seg.target);if(!byKey){byKey={};grouped.set(seg.target,byKey)}const track=byKey[seg.key]||(byKey[seg.key]=[]);seg.from=valueAt(track,seg.start,initial.get(seg.target)[seg.key]);track.push(seg)});tracks=[];grouped.forEach((byKey,target)=>tracks.push({target,byKey,snapshot:initial.get(target)}));dirty=false}
  const api={
    to(target,props,position){const start=typeof position==='number'?position:cursor,duration=Number(props.duration)||0;if(!initial.has(target))initial.set(target,Object.assign({},target));Object.keys(props).forEach(key=>{if(key==='duration'||key==='ease')return;segments.push({target,key,start,end:start+duration,to:props[key],ease:props.ease||'none',order:order++})});cursor=Math.max(cursor,start+duration);dirty=true;return api},
    set(target,props,position){return api.to(target,Object.assign({},props,{duration:0}),position)},
    seek(time){compile();for(const item of tracks){for(const key of Object.keys(item.byKey))item.target[key]=valueAt(item.byKey[key],time,item.snapshot[key])}if(options.onUpdate)options.onUpdate();return api},
    addLabel(){return api},
    add(child,position=cursor){if(child&&child._segments){child._initial.forEach((snapshot,target)=>{if(!initial.has(target))initial.set(target,Object.assign({},snapshot))});child._segments.forEach(seg=>segments.push(Object.assign({},seg,{start:seg.start+position,end:seg.end+position,order:order++})));cursor=Math.max(cursor,position+child.duration());dirty=true}return api},
    duration(){return cursor},
    _segments:segments,
    _initial:initial
  };return api
}
module.exports={timeline}


},
"/components/xingcheng-q-motion/appearance.js":function(module,exports,require){
// Approved brand master. Motion states stay in their original coordinate systems.
const BASE=Object.freeze({radius:126,eyeWidth:24,eyeHeight:54,neutralOpen:.9,eyeHalfGap:33,eyeY:-10,starX:-68,starY:-67,starOuter:16.5,starInner:4.5});
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

// rpx is converted by the caller-supplied viewport. The main character's bounds,
// not the surrounding props or the whole 512px image, determine its detail level.
function assetForSize(src,rpxWidth,viewportWidth){
 if(typeof src!=='string')return src;
 const full=FULL_ASSET_BY_SMALL[src]||src;
 const item=ASSET_METADATA.assets[full];if(!item)return src;
 const width=Number(rpxWidth),viewport=Number(viewportWidth);
 if(!(width>0&&viewport>0))return full;
 const diameter=width*viewport/750*item.bodyDiameter/item.imageWidth;
 return diameter<ASSET_METADATA.thresholdCssPx?item.small:full;
}

module.exports={BASE,RADII,COLORS,unit,setViewport,drawBody,starPoints,drawBrandStar,assetForSize};

},
"/components/xingcheng-q-motion/core.js":function(module,exports,require){
const Appearance=require('./appearance');
const eyeContour=require('./eye-contour');
// Locally authored motion, matching the approved full-story comparison.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const TAU=Math.PI*2;
const DURATIONS={idle:8.2,thinking:11.8,complete:11.6};
// Deepest contact on the approved 240 Hz completion trajectory (frame 977).
const SEAL_IMPACT=977/240;
const GROUPS=[
 {keys:['x','y','rotation','scaleX','scaleY'],hz:8.5,damping:.66,lead:.024},
 {keys:['eyeX','eyeY','eyeOpenL','eyeOpenR','eyeTilt','smile','wink'],hz:14,damping:.82,lead:.075},
 {keys:['handLX','handLY','handRX','handRY'],hz:7.5,damping:.62,lead:.012},
 {keys:['thoughtX','thoughtY','thoughtScale','mapScale'],hz:8,damping:.64,lead:.018},
];

// Integrate only as playback advances. Retain two poses rather than a full
// animation cache; fixed steps keep replay and seek identical to the sample.
function createMotion(raw,scene){
 const duration=DURATIONS[scene],rate=240,dt=1/rate,lastIndex=Math.ceil(duration*rate);
 let springs,index,previous,current;
 function reset(){
  const initial=raw.sample(0);springs={};current={};index=0;previous=null;
  for(const group of GROUPS)for(const key of group.keys)if(typeof initial[key]==='number'){
   springs[key]={x:initial[key],v:0};current[key]=initial[key];
  }
 }
 function advance(to){
  if(to<index)reset();
  while(index<to){
   index++;previous=current;current={};const t=Math.min(index/rate,duration);
   for(const group of GROUPS){
    const target=raw.sample(Math.min(duration,t+group.lead)),omega=TAU*group.hz;
    for(const key of group.keys){
     const spring=springs[key];if(!spring||typeof target[key]!=='number')continue;
     spring.v+=(omega*omega*(target[key]-spring.x)-2*group.damping*omega*spring.v)*dt;
     spring.x+=spring.v*dt;current[key]=spring.x;
    }
   }
  }
 }
 reset();
 return {duration,impact:scene==='complete'?SEAL_IMPACT:4.04,sample(elapsed,mode='normal'){
  const still=mode==='still'||mode==='reduced',t=still?duration:clamp(elapsed,0,duration);
  const state=raw.sample(t);
  if(!still){
   const cursor=t*rate,i=Math.min(Math.floor(cursor),lastIndex),next=Math.min(i+1,lastIndex);
   advance(next);
   const a=i===index?current:previous,u=cursor-i;
   for(const key of Object.keys(a))state[key]=mix(a[key],current[key],u);
  }
  state.eyeOpenL=clamp(typeof state.eyeOpenL==='number'?state.eyeOpenL:.9,.045,1.4);
  state.eyeOpenR=clamp(typeof state.eyeOpenR==='number'?state.eyeOpenR:.9,.045,1.4);
  state.smile=clamp(state.smile||0);state.wink=clamp(state.wink||0);
  state.eyeOptical=1;state.starOptical=1;state.motionPolished=true;
  state.eyeDepth=clamp((state.eyeX||0)/40,-.7,.7);
  if(scene==='thinking'){
   const doubt=clamp(state.confusion||0);state.eyeOpenL*=1-.16*doubt;state.eyeOpenR*=1+.07*doubt;
   state.curiosity=doubt;state.eyeWide=clamp(state.realization||0)*.12;
  }
  state.contact=0;state.contactAge=0;
  if(scene==='complete'&&!still){
   const u=t-SEAL_IMPACT;if(u>=0&&u<1.15){
    state.contact=Math.exp(-3.2*u);state.contactAge=u;
    const recoil=Math.sin(u*25)*Math.exp(-7*u);state.scaleX+=.045*recoil;state.scaleY-=.045*recoil;
   }
  }
  return state;
 }};
}

function isStill(motion){return motion==='still'||motion==='reduced';}

// Follow the planned cadence rather than restarting the interval at each
// draw. Date.now() rounding can otherwise discard slightly early 60 Hz RAFs.
// Two milliseconds of tolerance absorbs jitter; 120/144 Hz remain capped.
function createFramePacer(frameMs){
 let nextAt=null;
 return function(now,force){
  if(!force&&nextAt!==null&&now+2+1e-6<nextAt)return false;
  nextAt=nextAt===null||now-nextAt>=frameMs?now+frameMs:nextAt+frameMs;
  return true;
 };
}
function drawFace(ctx,s,scale=1,family='home',contourOptions){
 const unit=Appearance.unit(family);
 const smile=clamp(s.smile||0),points=eyeContour(smile,contourOptions),spread=contourOptions&&typeof contourOptions.smileSpread==='number'?contourOptions.smileSpread:3,optical=s.eyeOptical||1,eyeX=s.eyeX||0,eyeY=s.eyeY||0;
 for(const [x,rawOpen,side]of[[-Appearance.BASE.eyeHalfGap,s.eyeOpenL,-1],[Appearance.BASE.eyeHalfGap,s.eyeOpenR,1]]){
  const open=Math.max(.045,(typeof rawOpen==='number'?rawOpen:.9)*(side<0?1-(s.wink||0):1)),depth=1-side*(s.eyeDepth||0)*.065;
  ctx.save();ctx.translate((x+eyeX+side*spread*smile)*unit*scale,(Appearance.BASE.eyeY+eyeY)*unit*scale);
  ctx.rotate(((s.eyeTilt||0)+(side<0?(s.eyeTiltL||0):(s.eyeTiltR||0))+side*(s.curiosity||0)*5)*Math.PI/180);
  ctx.scale(unit*scale*optical*depth*(1+(s.eyeWide||0)),unit*scale*optical*open);
  ctx.globalAlpha*=(typeof s.eyeAlpha==='number'?s.eyeAlpha:1);ctx.fillStyle='#FFF8EE';ctx.beginPath();
  for(let i=0;i<points.length;i++){
   const [px,py]=points[i];
   if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);
  }
  ctx.closePath();ctx.fill();ctx.restore();
 }
}
function drawContact(ctx,s){
 if(s.contact<.004)return;const u=s.contactAge;
 ctx.save();ctx.translate(256,321);ctx.scale(1,.43);
 for(let i=0;i<2;i++){
  const radius=36+u*172-i*20;if(radius<25)continue;
  ctx.globalAlpha=clamp(s.contact*(i ? .42 : .65));ctx.lineWidth=i?2.8:4;
  ctx.strokeStyle=i?'#FFC857':'#35C7D8';ctx.beginPath();ctx.arc(0,0,radius,0,TAU);ctx.stroke();
 }
 ctx.restore();
}

// Put the identity mark on the same deforming surface as the body. It does not
// float, turn independently, or get cut by the stamp/pebble silhouette.
function brandStarPoints(s,family){return Appearance.starPoints(s,family);}
function drawBrandStar(ctx,s,family){Appearance.drawBrandStar(ctx,s,family);}

module.exports={createMotion,isStill,createFramePacer,drawFace,drawContact,brandStarPoints,drawBrandStar};

},
"/components/xingcheng-q-motion/eye-contour.js":function(module,exports,require){
// A fixed, symmetric point correspondence keeps every in-between eye rounded.
// Neutral is the approved 24 x 60 capsule (54 high at eyeOpen .9).
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
function eyeContour(smile=0,{smileWidth=30,smileRadius,smileStroke=10}={}){
 const weight=clamp(smile),radius=smileRadius??(smileWidth-smileStroke)/2/Math.cos(END_ANGLE),target=smileProfile(radius,smileStroke);
 return neutral.map((p,i)=>[p[0]+(target[i][0]-p[0])*weight,p[1]+(target[i][1]-p[1])*weight]);
}
module.exports=eyeContour;

},
"/assets/xingcheng-q/appearance-assets.js":function(module,exports,require){
// Shared full/small asset geometry. Single runtime metadata source.
module.exports = {
  "version": 1,
  "thresholdCssPx": 70,
  "assets": {
    "/assets/xingcheng-q/static/01-peek.png": {
      "imageWidth": 512,
      "bodyDiameter": 232,
      "small": "/assets/xingcheng-q/static/small/01-peek.png",
      "smallImageWidth": 384,
      "smallBodyDiameter": 174
    },
    "/assets/xingcheng-q/static/02-launch.png": {
      "imageWidth": 512,
      "bodyDiameter": 234,
      "small": "/assets/xingcheng-q/static/small/02-launch.png",
      "smallImageWidth": 384,
      "smallBodyDiameter": 175.5
    },
    "/assets/xingcheng-q/static/03-snap.png": {
      "imageWidth": 512,
      "bodyDiameter": 226,
      "small": "/assets/xingcheng-q/static/small/03-snap.png",
      "smallImageWidth": 384,
      "smallBodyDiameter": 169.5
    },
    "/assets/xingcheng-q/static/04-ponder.png": {
      "imageWidth": 512,
      "bodyDiameter": 234,
      "small": "/assets/xingcheng-q/static/small/04-ponder.png",
      "smallImageWidth": 384,
      "smallBodyDiameter": 175.5
    },
    "/assets/xingcheng-q/static/05-confirm.png": {
      "imageWidth": 512,
      "bodyDiameter": 232,
      "small": "/assets/xingcheng-q/static/small/05-confirm.png",
      "smallImageWidth": 384,
      "smallBodyDiameter": 174
    },
    "/assets/xingcheng-q/static/06-calibrate.png": {
      "imageWidth": 512,
      "bodyDiameter": 224,
      "small": "/assets/xingcheng-q/static/small/06-calibrate.png",
      "smallImageWidth": 384,
      "smallBodyDiameter": 168
    },
    "/assets/xingcheng-q/static/07-seal.png": {
      "imageWidth": 512,
      "bodyDiameter": 224,
      "small": "/assets/xingcheng-q/static/small/07-seal.png",
      "smallImageWidth": 384,
      "smallBodyDiameter": 168
    },
    "/assets/xingcheng-q/static/08-recharge.png": {
      "imageWidth": 512,
      "bodyDiameter": 232,
      "small": "/assets/xingcheng-q/static/small/08-recharge.png",
      "smallImageWidth": 384,
      "smallBodyDiameter": 174
    },
    "/assets/xingcheng-q/formal/01-加载-量子点扫描-V1-结束静态图.png": {
      "imageWidth": 512,
      "bodyDiameter": 206.00127,
      "small": "/assets/xingcheng-q/formal/small/01-加载-量子点扫描-V1-结束静态图.png",
      "smallImageWidth": 384,
      "smallBodyDiameter": 154.500953
    },
    "/assets/xingcheng-q/formal/02-空数据-Q寻找后摊手-V1-结束静态图.png": {
      "imageWidth": 512,
      "bodyDiameter": 185.1969,
      "small": "/assets/xingcheng-q/formal/small/02-空数据-Q寻找后摊手-V1-结束静态图.png",
      "smallImageWidth": 384,
      "smallBodyDiameter": 138.897675
    },
    "/assets/xingcheng-q/formal/03-断网-天线打结-V1-结束静态图.png": {
      "imageWidth": 512,
      "bodyDiameter": 191.56535,
      "small": "/assets/xingcheng-q/formal/small/03-断网-天线打结-V1-结束静态图.png",
      "smallImageWidth": 384,
      "smallBodyDiameter": 143.674013
    },
    "/assets/xingcheng-q/formal/04-提交失败-信号舱熄火-V2-结束静态图.png": {
      "imageWidth": 512,
      "bodyDiameter": 181.28,
      "small": "/assets/xingcheng-q/formal/small/04-提交失败-信号舱熄火-V2-结束静态图.png",
      "smallImageWidth": 384,
      "smallBodyDiameter": 135.96
    },
    "/assets/xingcheng-q/formal/05-网络恢复-青色信号接入-V1-结束静态图.png": {
      "imageWidth": 512,
      "bodyDiameter": 181.28805,
      "small": "/assets/xingcheng-q/formal/small/05-网络恢复-青色信号接入-V1-结束静态图.png",
      "smallImageWidth": 384,
      "smallBodyDiameter": 135.966037
    },
    "/assets/xingcheng-q/formal/06-继续练习-进度接续-V2-结束静态图.png": {
      "imageWidth": 512,
      "bodyDiameter": 168.92,
      "small": "/assets/xingcheng-q/formal/small/06-继续练习-进度接续-V2-结束静态图.png",
      "smallImageWidth": 384,
      "smallBodyDiameter": 126.69
    },
    "/assets/xingcheng-q/formal/07-提醒成功-提醒确认-V2-结束静态图.png": {
      "imageWidth": 512,
      "bodyDiameter": 189.52,
      "small": "/assets/xingcheng-q/formal/small/07-提醒成功-提醒确认-V2-结束静态图.png",
      "smallImageWidth": 384,
      "smallBodyDiameter": 142.14
    },
    "/assets/xingcheng-q/formal/01-星轨报告-分享静态图-V2.png": {
      "imageWidth": 512,
      "bodyDiameter": 183.87226,
      "small": "/assets/xingcheng-q/formal/small/01-星轨报告-分享静态图-V2.png",
      "smallImageWidth": 384,
      "smallBodyDiameter": 137.904195
    },
    "/assets/xingcheng-q/formal/02-回溯补能-倒转打捞-V1-静态终帧.png": {
      "imageWidth": 512,
      "bodyDiameter": 178.92565,
      "small": "/assets/xingcheng-q/formal/small/02-回溯补能-倒转打捞-V1-静态终帧.png",
      "smallImageWidth": 384,
      "smallBodyDiameter": 134.194237
    },
    "/assets/xingcheng-q/formal/03-校准反馈-靶心确认-V2-静态终帧.png": {
      "imageWidth": 512,
      "bodyDiameter": 166.4,
      "small": "/assets/xingcheng-q/formal/small/03-校准反馈-靶心确认-V2-静态终帧.png",
      "smallImageWidth": 384,
      "smallBodyDiameter": 124.8
    },
    "/assets/xingcheng-q/formal/04-等待邀请-邀请卡等待-V2-静态终帧.png": {
      "imageWidth": 512,
      "bodyDiameter": 158.08,
      "small": "/assets/xingcheng-q/formal/small/04-等待邀请-邀请卡等待-V2-静态终帧.png",
      "smallImageWidth": 384,
      "smallBodyDiameter": 118.56
    }
  }
};

},
"/review/timeline.js":function(module,exports,require){
const clamp=v=>Math.max(0,Math.min(1,v))
const easing=(name,t)=>globalThis.QRefinement.easing(name,t);
function valueAt(track,time,initial){let value=initial;for(const seg of track){if(time<seg.start)break;const p=seg.end===seg.start?1:clamp((time-seg.start)/(seg.end-seg.start));value=typeof seg.from==='number'&&typeof seg.to==='number'?seg.from+(seg.to-seg.from)*easing(seg.ease,p):p>=1?seg.to:seg.from}return value}
function timeline(options={}){
  const segments=[],initial=new Map();let cursor=0,order=0,dirty=true,tracks=[]
  function compile(){if(!dirty)return;const grouped=new Map();segments.slice().sort((a,b)=>a.start-b.start||a.order-b.order).forEach(seg=>{let byKey=grouped.get(seg.target);if(!byKey){byKey={};grouped.set(seg.target,byKey)}const track=byKey[seg.key]||(byKey[seg.key]=[]);seg.from=valueAt(track,seg.start,initial.get(seg.target)[seg.key]);track.push(seg)});tracks=[];grouped.forEach((byKey,target)=>tracks.push({target,byKey,snapshot:initial.get(target)}));dirty=false}
  const api={
    to(target,props,position){const start=typeof position==='number'?position:cursor,duration=Number(props.duration)||0;if(!initial.has(target))initial.set(target,Object.assign({},target));Object.keys(props).forEach(key=>{if(key==='duration'||key==='ease')return;segments.push({target,key,start,end:start+duration,to:props[key],ease:props.ease||'none',order:order++})});cursor=Math.max(cursor,start+duration);dirty=true;return api},
    set(target,props,position){return api.to(target,Object.assign({},props,{duration:0}),position)},
    seek(time){compile();for(const item of tracks){for(const key of Object.keys(item.byKey))item.target[key]=valueAt(item.byKey[key],time,item.snapshot[key])}if(options.onUpdate)options.onUpdate();return api},
    addLabel(){return api},
    add(child,position=cursor){if(child&&child._segments){child._initial.forEach((snapshot,target)=>{if(!initial.has(target))initial.set(target,Object.assign({},snapshot))});child._segments.forEach(seg=>segments.push(Object.assign({},seg,{start:seg.start+position,end:seg.end+position,order:order++})));cursor=Math.max(cursor,position+child.duration());dirty=true}return api},
    duration(){return cursor},
    _segments:segments,
    _initial:initial
  };return api
}
module.exports={timeline}


},
};function normalize(p){const out=[];for(const part of p.split("/")){if(!part||part===".")continue;if(part==="..")out.pop();else out.push(part)}return "/"+out.join("/")}function runtime(overrides={}){const cache={};function load(p,from="/"){let key=normalize(p.startsWith("/")?p:from.slice(0,from.lastIndexOf("/"))+"/"+p);if(!key.endsWith(".js"))key+=".js";if(overrides[key])return overrides[key];if(cache[key])return cache[key].exports;if(!factories[key])throw Error("Missing review module: "+key);const mod={exports:{}};cache[key]=mod;factories[key](mod,mod.exports,p=>load(p,key));return mod.exports;}return {require:load};}G.QSource=runtime();G.QSource.fork=runtime;})(globalThis);
