const Motion=require('../xingcheng-q-motion/core');
const Appearance=require('../xingcheng-q-motion/appearance');
(function(){
  const TAU=Math.PI*2;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  function star(c,x,y,o,i,color,a=1,r=0){if(a<=.001)return;c.save();c.translate(x,y);c.rotate(r);c.globalAlpha*=a;c.beginPath();for(let n=0;n<8;n++){const q=-Math.PI/2+n*Math.PI/4,d=n%2?i:o;n?c.lineTo(Math.cos(q)*d,Math.sin(q)*d):c.moveTo(Math.cos(q)*d,Math.sin(q)*d)}c.closePath();c.fillStyle=color;c.fill();c.restore()}
  function roundPath(c,x,y,w,h,r){const d=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+d,y);c.arcTo(x+w,y,x+w,y+h,d);c.arcTo(x+w,y+h,x,y+h,d);c.arcTo(x,y+h,x,y,d);c.arcTo(x,y,x+w,y,d);c.closePath()}
  function capsule(c,x,y,w,h,r,color='#FFF8EE',a=1){if(a<=.001)return;c.save();c.translate(x,y);c.rotate(r);c.globalAlpha*=a;roundPath(c,-w/2,-h/2,w,h,Math.min(w,h)/2);c.fillStyle=color;c.fill();c.restore()}
  function bodyPath(c,s){c.beginPath();for(let n=0;n<=112;n++){const a=n/112*TAU;const bean=s.bean*(.082*Math.sin(a*2+.65)+.038*Math.cos(a*3));const tug=s.tug*.12*Math.cos(a);const r=104*(1+bean+tug);const x=Math.cos(a)*r*(1+s.squash*.16),y=Math.sin(a)*r*(1-s.squash*.22)+s.squash*13*Math.cos(a)*Math.cos(a);n?c.lineTo(x,y):c.moveTo(x,y)}c.closePath()}
  function face(c,s){
    const k=Appearance.unit('next');
    // The full smile retains the incumbent 14px round arc and 10px stroke.
    // The same 64 points interpolate from neutral, including around smile .5.
    Motion.drawFace(c,s,1,'next',{smileRadius:14/k,smileStroke:10/k,smileSpread:0});
  }

  function orb(c,s){
    c.save();c.translate(s.x,s.y);c.rotate(s.rotation*Math.PI/180);c.scale(s.scaleX,s.scaleY);
    Appearance.drawBody(c,()=>bodyPath(c,s),104);
    c.save();bodyPath(c,s);c.clip();Appearance.drawBrandStar(c,s,'next');face(c,s);c.restore();c.restore();
  }
  function hand(c,x,y,a=1,sc=1){if(a<=.001)return;c.save();c.translate(x,y);c.scale(sc,sc);c.globalAlpha*=a;const g=c.createRadialGradient(-4,-5,1,0,0,18);g.addColorStop(0,'#FFD873');g.addColorStop(.4,'#FF9A22');g.addColorStop(1,'#F04424');c.fillStyle=g;c.shadowColor='#FF8A2A';c.shadowBlur=8;c.beginPath();c.arc(0,0,14,0,TAU);c.fill();c.restore()}
  function sparkField(c,s,aroundX=s.x,aroundY=s.y){if(s.sparkle<=.001)return;const pts=[[-115,-82,13],[-42,-132,8],[49,-126,14],[121,-62,9],[-132,22,7],[130,31,8],[0,-153,6]];pts.forEach((p,n)=>star(c,aroundX+p[0],aroundY+p[1],p[2]*s.sparkle,Math.max(1.3,p[2]*.24),'#'+(n%2?'35C7D8':'FFC857'),s.sparkle,n*.57+s.starTurn))}
  function reportMap(c,s){if(s.mapAlpha<=.001)return;c.save();c.translate(268,305);c.rotate(s.mapTilt);c.globalAlpha*=s.mapAlpha;const w=340*clamp(s.mapOpen),h=174,x=-w/2,y=-h/2;c.save();roundPath(c,x,y,w,h,25);c.clip();const paper=c.createLinearGradient(0,y,0,y+h);paper.addColorStop(0,'rgba(255,250,231,.97)');paper.addColorStop(1,'rgba(255,235,190,.94)');c.fillStyle=paper;c.fillRect(x,y,w,h);c.strokeStyle='rgba(53,199,216,.42)';c.lineWidth=4;for(let n=0;n<3;n++){c.beginPath();c.ellipse(0,10,62+n*46,27+n*22,.12*n,0,TAU);c.stroke()}c.strokeStyle='rgba(240,68,36,.28)';c.lineWidth=3;c.setLineDash([8,10]);c.beginPath();c.moveTo(-151,52);c.bezierCurveTo(-52,-53,61,66,153,-44);c.stroke();c.setLineDash([]);const places=[[-122,38],[-82,-20],[-30,43],[20,-30],[68,24],[111,-37],[143,13]];places.forEach((p,n)=>{const k=clamp(s.starsPlaced-n);star(c,p[0],p[1],8+3*k,2.1,n%3===0?'#F04424':n%2?'#35C7D8':'#FFC857',.2+.8*k,n*.31+s.mapOrbit);if(k>.02){c.strokeStyle=`rgba(255,200,87,${.35*k})`;c.lineWidth=2;c.beginPath();c.arc(p[0],p[1],13+5*k,0,TAU);c.stroke()}});c.restore();c.strokeStyle='rgba(240,68,36,.34)';c.lineWidth=4;roundPath(c,x,y,w,h,25);c.stroke();for(const side of [-1,1]){const rx=side*w/2;c.fillStyle='#35C7D8';roundPath(c,rx-9,-h/2-8,18,h+16,9);c.fill();c.fillStyle='#FFC857';c.beginPath();c.arc(rx,0,11,0,TAU);c.fill()}c.restore()}
  function lens(c,s){if(s.lensAlpha<=.001)return;c.save();c.translate(s.lensX,s.lensY);c.rotate(s.lensRot);c.globalAlpha*=s.lensAlpha;c.strokeStyle='#35C7D8';c.lineWidth=10;c.shadowColor='rgba(53,199,216,.35)';c.shadowBlur=12;c.beginPath();c.arc(0,0,34*s.lensScale,0,TAU);c.stroke();c.shadowBlur=0;c.strokeStyle='#FFC857';c.lineWidth=9;c.beginPath();c.moveTo(25*s.lensScale,25*s.lensScale);c.lineTo(53*s.lensScale,53*s.lensScale);c.stroke();c.fillStyle='rgba(53,199,216,.12)';c.beginPath();c.arc(0,0,29*s.lensScale,0,TAU);c.fill();star(c,-7,-8,7*s.lensPulse,1.8,'#FFF8EE',s.lensPulse,s.starTurn);c.restore()}
  function timeOrbit(c,s){if(s.orbitAlpha<=.001)return;c.save();c.translate(256,258);c.rotate(s.timeTurn);c.globalAlpha*=s.orbitAlpha;c.strokeStyle='rgba(53,199,216,.56)';c.lineWidth=8;c.setLineDash([27,16]);c.beginPath();c.ellipse(0,0,183,116,-.16,0,TAU);c.stroke();c.setLineDash([]);for(let n=0;n<7;n++){const a=-2.3+n*TAU/7,x=Math.cos(a)*183,y=Math.sin(a)*116;const missing=n===0;c.fillStyle=missing?'rgba(255,248,238,.9)':n%2?'#35C7D8':'#FFC857';c.strokeStyle=missing?'#F04424':'rgba(255,255,255,.6)';c.lineWidth=4;c.beginPath();c.arc(x,y,missing?13:9,0,TAU);c.fill();if(missing)c.stroke();if(!missing)star(c,x,y,5,1.4,'#FFF8EE',.75,n*.2)}c.restore();for(let n=0;n<3;n++){const a=-1.5+n*.72-s.timeTurn*.9,x=256+Math.cos(a)*210,y=258+Math.sin(a)*134;star(c,x,y,7,1.6,'#FFC857',s.reverseGlow,n*.5)}}
  function rescuedStar(c,s){if(s.hook<=.001)return;const t=clamp(s.retrieve),sx=132,sy=170;const tx=138,ty=166;const hx=mix(sx,tx,t)+Math.sin(t*Math.PI)*155,hy=mix(sy,ty,t)+Math.sin(t*Math.PI)*165;const startX=s.x+76,startY=s.y+28;c.save();c.globalAlpha*=s.hook;c.strokeStyle='#35C7D8';c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(startX,startY);c.quadraticCurveTo(295,432,hx,hy);c.stroke();c.strokeStyle='#FFC857';c.lineWidth=9;c.beginPath();c.arc(hx+13,hy+8,18,.1,Math.PI*1.55);c.stroke();star(c,hx,hy,16+5*s.starGlow,4,'#FFC857',.55+.45*s.starGlow,s.starTurn);c.restore()}
  function signalCapsule(c,s){
    if(s.capsuleAlpha<=.001)return;
    c.save();c.translate(s.capsuleX,s.capsuleY);c.rotate(s.capsuleRot);c.scale(s.capsuleScale,s.capsuleScale);c.globalAlpha*=s.capsuleAlpha;
    c.shadowColor='rgba(73,58,40,.15)';c.shadowBlur=16;c.fillStyle='rgba(255,253,244,.99)';roundPath(c,-104,-82,208,164,25);c.fill();c.shadowBlur=0;
    c.strokeStyle='rgba(53,199,216,.55)';c.lineWidth=5;roundPath(c,-104,-82,208,164,25);c.stroke();
    c.fillStyle='#FFC857';roundPath(c,-78,-57,72,11,6);c.fill();c.fillStyle='rgba(53,199,216,.28)';roundPath(c,-78,-34,95,9,5);c.fill();
    c.strokeStyle='rgba(155,186,189,.35)';c.lineWidth=5;c.beginPath();c.moveTo(-76,1);c.lineTo(0,1);c.moveTo(-76,27);c.lineTo(-20,27);c.moveTo(-76,53);c.lineTo(9,53);c.stroke();
    c.fillStyle='#FFC857';for(const y of [1,27,53]){c.beginPath();c.arc(-15+(y%4)*7,y,8,0,TAU);c.fill()}
    c.translate(49,17);c.strokeStyle='rgba(53,199,216,.35)';c.lineWidth=5;for(const r of [19,38,57]){c.beginPath();c.arc(0,0,r,0,TAU);c.stroke()}c.strokeStyle='#F04424';c.lineWidth=4;c.beginPath();c.moveTo(-48,0);c.lineTo(48,0);c.moveTo(0,-48);c.lineTo(0,48);c.stroke();star(c,0,0,10,2.5,'#FFC857',.9,s.starTurn);c.restore();
  }
  function signalCore(c,s){
    if(s.coreAlpha<=.001)return;
    c.save();c.translate(s.coreX,s.coreY);c.globalAlpha*=s.coreAlpha;
    const color=s.coreFill>.75?'#35C7D8':'#F04424';c.fillStyle=color;c.shadowColor=color;c.shadowBlur=16;c.beginPath();c.arc(0,0,12+3*s.coreSpread,0,TAU);c.fill();c.shadowBlur=0;star(c,0,0,6,1.5,'#FFF8EE',1,s.coreTurn);
    if(s.coreFill>.75){c.strokeStyle='#35C7D8';c.lineWidth=5;for(let n=0;n<2;n++){c.globalAlpha*=.75;c.beginPath();c.arc(0,0,23+n*13+s.coreSpread*4,0,TAU);c.stroke()}}
    c.restore();
  }
  function gate(c,s){
    if(s.gateAlpha<=.001)return;
    const members=[[286,164],[410,216]],slot=[360,336];
    c.save();c.globalAlpha*=s.gateAlpha;c.strokeStyle='rgba(53,199,216,.34)';c.lineWidth=5;c.setLineDash([10,12]);c.beginPath();c.moveTo(members[0][0],members[0][1]);c.lineTo(members[1][0],members[1][1]);c.lineTo(slot[0],slot[1]);c.lineTo(members[0][0],members[0][1]);c.stroke();c.setLineDash([]);c.restore();
    members.forEach((p,n)=>{
      const a=clamp(s.memberA-n);if(a<=.001)return;
      c.save();c.globalAlpha*=a;c.translate(p[0],p[1]);c.scale(.7+.3*a,.7+.3*a);
      const path=()=>{c.beginPath();c.arc(0,0,39,0,TAU);c.closePath();};
      if(n===0)Appearance.drawBody(c,path,39);
      else{
        const g=c.createRadialGradient(-.36*39,-.5*39,0,-.36*39,-.5*39,1.68*39);
        g.addColorStop(0,'#FFD575');g.addColorStop(.42,'#35C7D8');g.addColorStop(1,'#159CB3');
        c.shadowBlur=0;c.fillStyle=g;path();c.fill();
      }
      c.save();c.scale(39/126,39/126);
      if(n===0)Appearance.drawBrandStar(c,{},'home');
      Motion.drawFace(c,{eyeOpenL:.9,eyeOpenR:.9},1,'home');
      c.restore();c.restore();
    });
    if(s.slotA>.001){c.save();c.globalAlpha*=s.slotA;c.translate(slot[0],slot[1]);const pulse=1+.06*Math.sin(s.gateTurn*5);c.scale(pulse,pulse);c.strokeStyle='#35C7D8';c.lineWidth=6;c.setLineDash([9,8]);c.beginPath();c.arc(0,0,43,0,TAU);c.stroke();c.setLineDash([]);c.lineCap='round';c.beginPath();c.moveTo(-13,0);c.lineTo(13,0);c.moveTo(0,-13);c.lineTo(0,13);c.stroke();c.restore();}
    if(s.clockA>.001){c.save();c.globalAlpha*=s.clockA;c.translate(429,337);c.fillStyle='#FFF8EE';c.strokeStyle='#F04B28';c.lineWidth=5;c.beginPath();c.arc(0,0,24,0,TAU);c.fill();c.stroke();c.lineCap='round';c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(s.gateTurn)*12,Math.sin(s.gateTurn)*12);c.moveTo(0,0);c.lineTo(Math.cos(s.gateTurn-1.7)*8,Math.sin(s.gateTurn-1.7)*8);c.stroke();c.restore()}
    if(s.pulse>.01)for(let n=0;n<3;n++){c.save();c.globalAlpha*=s.pulse*(1-n*.24);c.strokeStyle=n%2?'#FFC857':'#35C7D8';c.lineWidth=4;c.beginPath();c.arc(slot[0],slot[1],52+n*17+s.pulseSpread*10,-.8,.8);c.stroke();c.restore()}
    for(let n=0;n<5;n++)star(c,245+n*47,112+Math.sin(n*1.7)*22,6+n%2*2,1.6,n%2?'#FFC857':'#35C7D8',s.gateAlpha*.55,n+s.starTurn);
  }
  function ping(c,s){
    if(s.pingAlpha<=.001)return;c.save();c.translate(s.pingX,s.pingY);c.scale(s.pingScale,s.pingScale);c.globalAlpha*=s.pingAlpha;c.fillStyle='#35C7D8';c.shadowColor='#35C7D8';c.shadowBlur=14;c.beginPath();c.arc(0,0,10,0,TAU);c.fill();star(c,0,0,5,1.4,'#FFF8EE',1,s.starTurn);c.restore()
  }
  function badge(c,s){
    if(s.badgeAlpha<=.001)return;c.save();c.translate(s.badgeX,s.badgeY);c.rotate(s.badgeRot);c.scale(s.badgeScale,s.badgeScale);c.globalAlpha*=s.badgeAlpha;c.fillStyle='#35C7D8';c.shadowColor='rgba(53,199,216,.35)';c.shadowBlur=15;c.beginPath();c.arc(0,0,31,0,TAU);c.fill();c.shadowBlur=0;c.strokeStyle='#FFF8EE';c.lineWidth=9;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(-14,0);c.lineTo(-4,11);c.lineTo(17,-14);c.stroke();c.restore()
  }
  function base(){return{x:256,y:286,rotation:0,scaleX:1,scaleY:1,bean:0,tug:0,squash:0,eyeX:0,eyeY:0,eyeOpenL:.96,eyeOpenR:.96,wink:0,smile:0,starTurn:0,sparkle:0,handAlpha:0,handLX:164,handLY:300,handRX:348,handRY:300,mapAlpha:0,mapOpen:.03,mapTilt:0,mapOrbit:0,starsPlaced:0,lensAlpha:0,lensX:320,lensY:250,lensScale:.2,lensRot:0,lensPulse:0,orbitAlpha:0,timeTurn:0,reverseGlow:0,hook:0,retrieve:0,starGlow:0,capsuleAlpha:0,capsuleX:318,capsuleY:252,capsuleRot:0,capsuleScale:.2,coreAlpha:0,coreX:330,coreY:270,coreTurn:0,coreSpread:1,coreFill:0,ignition:0,badgeAlpha:0,badgeX:260,badgeY:160,badgeScale:.2,badgeRot:0,gateAlpha:0,gateTurn:0,pulse:0,pulseSpread:0,pingAlpha:0,pingX:430,pingY:258,pingScale:1,memberA:0,slotA:0,clockA:0}}
  function paint(canvas,c,s,mode){c.clearRect(0,0,512,512);if(mode==='report'){reportMap(c,s);lens(c,s)}if(mode==='makeup'){timeOrbit(c,s);rescuedStar(c,s)}if(mode==='signal'){signalCapsule(c,s);signalCore(c,s);badge(c,s)}if(mode==='waiting'){gate(c,s);ping(c,s)}orb(c,s);hand(c,s.handLX,s.handLY,s.handAlpha);hand(c,s.handRX,s.handRY,s.handAlpha);sparkField(c,s)}
  module.exports={base,paint,star};
})();
