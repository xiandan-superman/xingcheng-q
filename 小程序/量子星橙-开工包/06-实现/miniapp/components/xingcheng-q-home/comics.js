/* Three authored silent-comedy scenes for the current Xingcheng Q. */
module.exports=function installComics(R){
const A=require('../xingcheng-q-motion/appearance'),TAU=Math.PI*2,N=128;
R.drawFace=require('../xingcheng-q-motion/face');
const baseRing=Array.from({length:N},(_,i)=>{const a=i/N*TAU;return[126*Math.cos(a),126*Math.sin(a)];});
const area=p=>Math.abs(p.reduce((sum,q,i)=>{const n=p[(i+1)%p.length];return sum+q[0]*n[1]-q[1]*n[0];},0))/2,area0=area(baseRing);
function shape(s){
 const square=R.clamp(s.square||0),bean=s.bean||0,n=2+6*square;
 if(square<1e-8&&Math.abs(bean)<1e-8)return{points:baseRing,k:1,n,bean:0};
 const points=baseRing.map((_,i)=>{const a=i/N*TAU;let r=126/(Math.abs(Math.cos(a))**n+Math.abs(Math.sin(a))**n)**(1/n);r*=1+bean*.095*Math.sin(a*2+.7)+bean*.035*Math.cos(a*3);return[r*Math.cos(a),r*Math.sin(a)];});
 const k=Math.sqrt(area0/area(points));return{points:points.map(([x,y])=>[x*k,y*k]),k,n,bean};
}
function radialPoint(x,y,g){const a=Math.atan2(y,x),factor=g.k/(Math.abs(Math.cos(a))**g.n+Math.abs(Math.sin(a))**g.n)**(1/g.n)*(1+g.bean*.095*Math.sin(a*2+.7)+g.bean*.035*Math.cos(a*3));return[x*factor,y*factor];}
function prepare(s,t,{keepPose=false}={}){
 const out={...s},g=shape(out);if(!keepPose)out.scaleX=Math.min(1.65,1/Math.max(.6,out.scaleY||1));
 if(!keepPose&&out.comic==='pancake'){const p=(t-2.04)/.96;out.lift=p>=0&&p<=1?4*72*p*(1-p):0;}
 const a=(out.rotation||0)*Math.PI/180,c=Math.cos(a),sn=Math.sin(a);let bottom=-Infinity,top=Infinity,topX=0;
 for(const [x,y]of g.points){const wx=x*out.scaleX*c-y*out.scaleY*sn,wy=x*out.scaleX*sn+y*out.scaleY*c;if(wy<top){top=wy;topX=wx;}bottom=Math.max(bottom,wy);}
 if(!keepPose)out.y=404-bottom-Math.max(0,out.lift||0);out._shape=g;out._top=top;out._topX=topX;out._storyTime=t;
 const end=R.GESTURES[out.comic]?.duration||10;out.shadowA=Math.min(1,t/.4,(end-t)/.4);return out;
}
function bodyPath(c,g){c.beginPath();if(g.n===2&&!g.bean)c.arc(0,0,126,0,TAU);else g.points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();}
function star(c,g){c.fillStyle='#FFF3CE';c.beginPath();for(let i=0;i<8;i++){const a=-Math.PI/2+i*Math.PI/4,r=i%2?4.5:16.5,p=radialPoint(-68+Math.cos(a)*r,-67+Math.sin(a)*r,g);i?c.lineTo(...p):c.moveTo(...p);}c.closePath();c.fill();}
function actor(c,s,{x=s.x,y=s.y,k=1,alpha=1,mini=false}={}){
 const g=s._shape||shape(s);c.save();c.translate(x,y);c.rotate((s.rotation||0)*Math.PI/180);c.scale((s.scaleX||1)*k,(s.scaleY||1)*k);c.globalAlpha*=alpha;
 A.drawBody(c,()=>bodyPath(c,g),126,{simple:mini});c.save();bodyPath(c,g);c.clip();star(c,g);
 R.drawFace(c,{...s,eyeOptical:mini?1.10:1});
 if((s.mouth||0)>.04){c.fillStyle='#A94722';c.beginPath();c.ellipse(0,39,7+7*s.mouth,2+10*s.mouth,0,0,TAU);c.fill();}
 c.restore();c.restore();
}
function shadow(c,s){const a=Math.max(0,s.shadowA??1),lift=Math.max(0,s.lift||0),width=(81*(s.scaleX||1)+20*(s.impact||0))/(1+lift/150);c.save();c.translate(s.x,411);c.scale(1,.12);const grad=c.createRadialGradient(0,0,0,0,0,width);grad.addColorStop(0,'rgba(111,79,44,'+(.14*a/(1+lift/80))+')');grad.addColorStop(1,'rgba(111,79,44,0)');c.fillStyle=grad;c.beginPath();c.arc(0,0,width,0,TAU);c.fill();c.restore();}
function dot(c,x,y,r,color,alpha=1){c.save();c.globalAlpha*=alpha;c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
function miniPose(s){let x=s.smallX||380,y=s.smallY||250;const k=s.smallScale||.32,r=126*k,h=s.headSit||0;x=x*(1-h)+(s.x+(s._topX||0))*h;y=y*(1-h)+(s.y+(s._top||-126)-r+5)*h;return{x,y,k};}
function mini(c,s){if((s.smallA||0)<.002)return;const m=miniPose(s);actor(c,{x:m.x,y:m.y,rotation:s.smallRot||0,scaleX:1,scaleY:1,eyeX:s.smallEyeX||0,eyeY:s.smallEyeY||0,eyeOpenL:s.smallEyeL??.9,eyeOpenR:s.smallEyeR??.9,smile:s.smallSmile||0,wink:s.smallWink||0,square:0,bean:0},{...m,alpha:s.smallA,mini:true});}
function connector(c,s){if((s.connector||0)<.002||!s.smallA)return;const m=miniPose(s),dx=m.x-s.x,dy=m.y-s.y,d=Math.hypot(dx,dy);if(d<1)return;const ux=dx/d,uy=dy/d,r=1/Math.sqrt((ux/(126*s.scaleX))**2+(uy/(126*s.scaleY))**2),p=[s.x+ux*r*.90,s.y+uy*r*.90],q=[m.x-ux*126*m.k*.55,m.y-uy*126*m.k*.55],w=Math.max(3,17-(d-r)*.16)*s.connector;
 c.save();c.globalAlpha*=s.connector*s.smallA;const grad=c.createLinearGradient(...p,...q);grad.addColorStop(0,'#FF9636');grad.addColorStop(1,'#FF862C');c.fillStyle=grad;c.beginPath();c.moveTo(p[0]-uy*w,p[1]+ux*w);c.bezierCurveTo(p[0]+dx*.1,p[1]+dy*.1,q[0]-uy*w*.7,q[1]+ux*w*.7,q[0]-uy*w*.6,q[1]+ux*w*.6);c.lineTo(q[0]+uy*w*.6,q[1]-ux*w*.6);c.bezierCurveTo(q[0]+uy*w*.7,q[1]-ux*w*.7,p[0]+dx*.1,p[1]+dy*.1,p[0]+uy*w,p[1]-ux*w);c.closePath();c.fill();c.restore();
}
function props(c,s){shadow(c,s);if(s.speckA){dot(c,s.speckX,s.speckY,6,'#2BAAB8',s.speckA);dot(c,s.speckX-2,s.speckY-2,2,'#FFF8EE',s.speckA);}if(s.puffA){for(let i=0;i<4;i++){const k=(s.puffT||0),x=s.x+42+(45+i*16)*k,y=s.y+35+(i-1.5)*23*k;dot(c,x,y,3.5-i*.45,i%2?'#FFC857':'#2BAAB8',s.puffA*(1-k*.6));}}}
function draw(c,s,{clear=true,propsOnly=false}={}){if(clear)c.clearRect(0,0,512,512);props(c,s);connector(c,s);if(s.smallBehind>.5)mini(c,s);if(!propsOnly)actor(c,s);if(!(s.smallBehind>.5))mini(c,s);}
const common={square:0,bean:0,lift:0,eyeCross:0,smileL:0,smileR:0,smallA:0,smallX:390,smallY:250,smallScale:.32,smallBehind:0,connector:0,headSit:0,speckA:0,speckX:420,speckY:190,puffA:0,puffT:0};
Object.assign(R.GESTURES,{
 sneeze:{label:'憋住，没憋住',duration:9.8,initial:common,steps:[
  {at:.3,d:.8,speckA:1,speckX:355,speckY:235},{at:.65,d:.35,eyeX:14,eyeY:4,eyeOpenL:.85,eyeOpenR:1},
  {at:1.2,d:.9,speckX:284,speckY:300,eyeX:6,eyeY:15,eyeCross:.65,rotation:-2,scaleY:.95},
  {at:2.1,d:.48,scaleY:1.07,eyeOpenL:.36,eyeOpenR:.26,mouth:.24,eyeTiltL:7,eyeTiltR:-5,bean:.18},
  {at:2.7,d:.12,x:253},{at:2.84,d:.12,x:258},{at:3.0,d:.12,x:254},{at:3.14,d:.2,x:256,eyeOpenL:.10,eyeOpenR:.10,scaleY:1.11},
  {at:3.65,d:.48,eyeOpenL:.75,eyeOpenR:.75,eyeCross:0,scaleY:1,mouth:0,rotation:0,bean:0,speckX:365,speckY:235,speckA:.5},
  {at:4.42,d:.10,ease:'expo.out',eyeOpenL:.065,eyeOpenR:.065,mouth:1,eyeY:3},
  {at:4.48,d:.13,ease:'power3.out',scaleY:.78,square:1,x:246,rotation:-6,lift:13,puffA:1,puffT:.18,speckA:0,bean:.15},
  {at:4.64,d:.28,ease:'power2.in',lift:0,scaleY:.87,rotation:0,puffT:1,puffA:0,mouth:0},
  {at:5.0,d:.23,eyeOpenL:1.12,eyeOpenR:1.05,eyeX:0,eyeY:8,eyeCross:.25},
  {at:5.65,d:.8,ease:'back.out(1.1)',square:0,scaleY:1.03,bean:-.22,x:256,rotation:3,eyeCross:0,eyeOpenL:.82,eyeOpenR:.9},
  {at:6.48,d:.5,scaleY:1,bean:0,rotation:0,eyeX:17,eyeY:0,smileR:.28},
  {at:7.25,d:.15,wink:.65},{at:7.48,d:.32,wink:0,eyeX:0,smileR:0,eyeOpenL:.9,eyeOpenR:.9},
  {at:8.25,d:.22,scaleY:.96,eyeOpenL:.65,eyeOpenR:.65},{at:8.5,d:.45,scaleY:1,eyeOpenL:.9,eyeOpenR:.9}
 ]},
 pancake:{label:'没人在看吧',duration:10.4,initial:common,steps:[
  {at:.3,d:.32,eyeX:-19,eyeY:-1},{at:.9,d:.35,eyeX:18,eyeOpenL:.8,eyeOpenR:.95,rotation:2},
  {at:1.4,d:.5,scaleY:.84,rotation:0,eyeY:9,eyeX:0,smile:.16},
  {at:2.02,d:.13,ease:'power3.out',scaleY:1.1,eyeY:-7,eyeOpenL:1.05,eyeOpenR:1.05},
  {at:2.4,d:.40,scaleY:.98,rotation:-7},{at:2.83,d:.14,rotation:0,eyeY:7,smile:0},
  {at:3.0,d:.10,ease:'power3.out',scaleY:.62,square:.32,bean:.25,impact:1,eyeOpenL:.16,eyeOpenR:.16,mouth:.22},
  {at:3.18,d:.25,impact:.2,mouth:0,eyeOpenL:.65,eyeOpenR:.65},
  {at:3.7,d:.35,eyeX:17,eyeOpenL:.65,eyeOpenR:.9},{at:4.3,d:.14,eyeX:0,eyeOpenL:1.1,eyeOpenR:1.1,eyeCross:.15},
  {at:4.95,d:.9,ease:'back.out(1.1)',scaleY:1,square:0,bean:-.18,eyeOpenL:.78,eyeOpenR:.78,eyeCross:0},
  {at:5.95,d:.5,bean:0,eyeX:-12,eyeY:12,eyeOpenL:.7,eyeOpenR:.7,rotation:-1.5},
  {at:7.1,d:.4,smileR:.46,eyeX:3},{at:7.8,d:.2,smileR:0,eyeOpenL:.9,eyeOpenR:.9,rotation:0,eyeX:0,eyeY:0},
  {at:8.6,d:.1,eyeOpenL:.1,eyeOpenR:.1},{at:8.74,d:.25,eyeOpenL:.9,eyeOpenR:.9}
 ]},
 clone:{label:'分身甩不掉',duration:12.4,initial:common,steps:[
  {at:.35,d:.45,eyeX:18,eyeY:8,rotation:3,bean:.20},
  {at:.85,d:.65,smallA:1,smallScale:.20,smallX:378,smallY:272,connector:1,smallEyeX:-15,eyeOpenL:.8,eyeOpenR:1},
  {at:1.55,d:.42,ease:'power3.out',x:246,rotation:-7,bean:.45,smallX:416,smallY:215,smallScale:.32,eyeX:22,eyeY:-9},
  {at:2.0,d:.35,connector:0,smallX:406,smallY:166,smallRot:12,smallEyeX:-12},
  {at:2.45,d:.7,ease:'power2.inOut',smallX:270,smallY:130,smallRot:0,headSit:1,scaleY:.94,rotation:0,bean:0,x:256},
  {at:3.15,d:.22,eyeX:0,eyeY:-18,eyeCross:.65,smallEyeX:0,smallEyeY:8,smallSmile:.30},
  {at:3.9,d:.65,rotation:-12,bean:.26,eyeX:-16,eyeY:-10,headSit:0,smallX:158,smallY:232,connector:.8,smallEyeX:16,smallEyeY:4,eyeCross:0},
  {at:4.65,d:.45,rotation:0,bean:.15,eyeX:-18,eyeY:4,mouth:.45,scaleY:1.04},
  {at:5.15,d:.75,ease:'power3.in',smallX:220,smallY:286,smallScale:.08,smallA:0,connector:0,smallEyeL:1.1,smallEyeR:1.1},
  {at:5.95,d:.35,mouth:0,scaleY:1,bean:0,eyeX:0,eyeY:0,smile:.2},
  {at:6.55,d:.6,smallA:1,smallScale:.30,smallX:375,smallY:330,smallBehind:1,smallEyeX:5,smallEyeY:-3,smallEyeL:.9,smallEyeR:.9,smile:0},
  {at:7.15,d:.18,smallWink:.92},{at:7.38,d:.2,smallWink:0,smallSmile:.6},
  {at:7.8,d:.3,eyeX:22,eyeY:10,rotation:4,bean:.3,eyeOpenL:1.05,eyeOpenR:1.05},
  {at:8.3,d:.6,x:271,rotation:-5,bean:.65,smallX:352,smallY:317,smallA:.65,connector:.7,smallBehind:0,smallSmile:0},
  {at:8.95,d:.45,smallA:0,smallScale:.06,smallX:286,smallY:289,connector:0,scaleY:.9,bean:.38,eyeOpenL:.2,eyeOpenR:.2},
  {at:9.5,d:.7,ease:'back.out(1.15)',x:256,scaleY:1,rotation:0,bean:0,eyeX:0,eyeY:0,eyeOpenL:.9,eyeOpenR:.9,smileR:.36},
  {at:10.7,d:.5,smileR:0,smallSmile:0,smallWink:0,eyeTiltL:0,eyeTiltR:0}
 ]}
});
R.prepareComic=prepare;R.drawComic=draw;R.comicShape=shape;


};
