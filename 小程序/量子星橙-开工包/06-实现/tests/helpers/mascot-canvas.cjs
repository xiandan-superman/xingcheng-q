const assert = require('node:assert/strict')

const multiply = (a,b) => [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]
const point = (m,x,y) => [m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]]
const mean = p => p.reduce((a,q)=>[a[0]+q[0]/p.length,a[1]+q[1]/p.length],[0,0])
const inverse = m => {const d=m[0]*m[3]-m[1]*m[2];return[m[3]/d,-m[1]/d,-m[2]/d,m[0]/d,(m[2]*m[5]-m[3]*m[4])/d,(m[1]*m[4]-m[0]*m[5])/d]}
function inside([x,y],poly){
 let result=false
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const [a,b]=poly[i],[c,d]=poly[j],dx=c-a,dy=d-b
  const cross=(x-a)*dy-(y-b)*dx
  if(Math.abs(cross)<1e-7&&x>=Math.min(a,c)-1e-7&&x<=Math.max(a,c)+1e-7&&y>=Math.min(b,d)-1e-7&&y<=Math.max(b,d)+1e-7)return true
  if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)result=!result
 }
 return result
}

// A real affine/path recorder, independent of the production appearance helper.
// Historical motion oracles remain untouched; this checks their new painted skin.
function createCanvasRecorder(){
 const commands=[],fills=[],stack=[]
 let m=[1,0,0,1,0,0],path=[],clipped=null,underflows=0
 const state={globalAlpha:1,fillStyle:'',strokeStyle:'',lineWidth:1}
 const add=(x,y)=>path.push(point(m,x,y))
 const methods={
  save(){stack.push({m:m.slice(),state:{...state},clipped})},
  restore(){const old=stack.pop();if(!old){underflows++;return}m=old.m;Object.assign(state,old.state);clipped=old.clipped},
  translate(x,y){m=multiply(m,[1,0,0,1,x,y])},scale(x,y){m=multiply(m,[x,0,0,y,0,0])},
  rotate(a){m=multiply(m,[Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0])},
  transform(...v){m=multiply(m,v)},setTransform(...v){m=v.length===1?[v[0].a,v[0].b,v[0].c,v[0].d,v[0].e,v[0].f]:v.slice()},
  resetTransform(){m=[1,0,0,1,0,0]},getTransform(){return{a:m[0],b:m[1],c:m[2],d:m[3],e:m[4],f:m[5]}},
  beginPath(){path=[]},moveTo:add,lineTo:add,closePath(){},
  arc(x,y,r,start,end,ccw=false){
   let span=end-start
   if(ccw){while(span>0)span-=Math.PI*2}else{while(span<0)span+=Math.PI*2}
   if(Math.abs(span)>Math.PI*2)span=Math.sign(span)*Math.PI*2
   const count=Math.max(4,Math.ceil(Math.abs(span)/(Math.PI*2)*128))
   for(let i=0;i<=count;i++){const a=start+span*i/count;add(x+r*Math.cos(a),y+r*Math.sin(a))}
  },
  ellipse(x,y,rx,ry,rotation,start,end,ccw=false){
   let span=end-start;if(ccw){while(span>0)span-=Math.PI*2}else{while(span<0)span+=Math.PI*2}
   const count=Math.max(4,Math.ceil(Math.abs(span)/(Math.PI*2)*128)),c=Math.cos(rotation),s=Math.sin(rotation)
   for(let i=0;i<=count;i++){const a=start+span*i/count,px=rx*Math.cos(a),py=ry*Math.sin(a);add(x+px*c-py*s,y+px*s+py*c)}
  },
  // Identity eyes are polygon paths; corner control points suffice for props.
  arcTo(x1,y1,x2,y2){add(x1,y1);add(x2,y2)},
  quadraticCurveTo(x1,y1,x2,y2){add(x1,y1);add(x2,y2)},
  bezierCurveTo(x1,y1,x2,y2,x3,y3){add(x1,y1);add(x2,y2);add(x3,y3)},
  rect(x,y,w,h){add(x,y);add(x+w,y);add(x+w,y+h);add(x,y+h)},
  clip(){clipped=path.map(p=>p.slice())},
  fill(){if(state.globalAlpha>.002)fills.push({style:state.fillStyle,points:path.map(p=>p.slice()),clip:clipped,alpha:state.globalAlpha,matrix:m.slice()})},
  createRadialGradient(){return{stops:[],addColorStop(at,color){this.stops.push([at,color]);commands.push(['addColorStop',at,color])}}},
  createLinearGradient(){return methods.createRadialGradient()}
 }
 const ctx=new Proxy(state,{
  get(target,key){
   if(key==='commands')return commands;if(key==='fills')return fills;if(key==='clipped')return clipped
   if(key==='balance')return()=>({depth:stack.length,underflows})
   if(key in target)return target[key]
   return(...args)=>{
    for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),`${String(key)} has a non-finite coordinate`)
    commands.push([key,...args]);return methods[key]?.(...args)
   }
  },
  set(target,key,value){if(typeof value==='number')assert.ok(Number.isFinite(value),`${String(key)} has a non-finite value`);target[key]=value;commands.push(['set',key,typeof value==='object'?'gradient':value]);return true}
 })
 return ctx
}

function brandedBodies(ctx){
 const unique=new Map()
 for(const f of ctx.fills){
  if(!f.style?.stops?.some(([,color])=>color==='#FFB65C'||color==='#FF9C41'))continue
  if(f.points.length<8)continue
  unique.set(JSON.stringify(f.points),f)
 }
 return [...unique.values()]
}
function assertBrandDrawing(ctx,label,{allowNoBody=false}={}){
 assert.ok(ctx.commands.length>0,`${label}: nothing was painted`)
 assert.deepEqual(ctx.balance(),{depth:0,underflows:0},`${label}: unbalanced canvas state`)
 const bodies=brandedBodies(ctx)
 if(!allowNoBody)assert.ok(bodies.length>0,`${label}: missing unified orange body`)
 const stars=ctx.fills.filter(f=>f.style==='#FFF3CE'&&f.points.length===8)
 const ownership=new Map(bodies.map(b=>[b,[]]))
 for(const star of stars){
  // Actual clip geometry is the strongest ownership signal for overlapping
  // workers. Unclipped circles (home ghosts and waiting-card members) use the
  // approved relative mark anchor after undoing each body's own transform.
  let owner=star.clip&&bodies.find(b=>JSON.stringify(b.points)===JSON.stringify(star.clip))
  if(!owner){
   const centre=mean(star.points),candidates=bodies.filter(b=>inside(centre,b.points))
   let best=Infinity
   for(const body of candidates){
    const inv=inverse(body.matrix),local=body.points.map(p=>point(inv,...p)),p=point(inv,...centre)
    const xs=local.map(p=>p[0]),ys=local.map(p=>p[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2
    const radius=(Math.max(...xs)-Math.min(...xs))/2,score=((p[0]-cx)/radius+68/126)**2+((p[1]-cy)/radius+67/126)**2
    if(score<best){best=score;owner=body}
   }
  }
  if(owner)ownership.get(owner).push(star)
 }
 for(const body of bodies){
  const owned=ownership.get(body)
  assert.ok(owned.length>0,`${label}: a visible orange body has no identity star`)
  for(const s of owned)assert.ok(s.points.every(p=>inside(p,body.points)),`${label}: identity star leaves its actual deformed body`)
 }
 return{bodies,stars}
}

module.exports={createCanvasRecorder,assertBrandDrawing,brandedBodies,inside,mean}
