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
  function orb(c,s,a=1,dx=0,dy=0,k=1){if(c._qPropsOnly===true)return;
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
  function quantum(c,s){if(c._qPropsOnly===true)return;
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
