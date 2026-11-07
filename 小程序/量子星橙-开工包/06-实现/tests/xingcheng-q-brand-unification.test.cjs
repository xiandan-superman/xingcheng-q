const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
const {createCanvasRecorder,assertBrandDrawing,brandedBodies,mean}=require('./helpers/mascot-canvas.cjs')
const Appearance=require('../miniapp/components/xingcheng-q-motion/appearance')
const Motion=require('../miniapp/components/xingcheng-q-motion/core')
const Home=require('../miniapp/components/xingcheng-q-home/core')
const Entry=require('../miniapp/components/xingcheng-q-entry/draw')
const Story=require('../miniapp/components/xingcheng-q-story/draw')
const Variety=require('../miniapp/components/xingcheng-q-variety/draw')
const System=require('../miniapp/components/xingcheng-q-scene/system-core')
const Next=require('../miniapp/components/xingcheng-q-scene/next-core')
const root=path.join(__dirname,'../miniapp')
const near=(a,b,message,tolerance=1e-7)=>assert.ok(Math.abs(a-b)<=tolerance,`${message}: ${a} != ${b}`)
const bounds=p=>({left:Math.min(...p.map(q=>q[0])),right:Math.max(...p.map(q=>q[0])),top:Math.min(...p.map(q=>q[1])),bottom:Math.max(...p.map(q=>q[1]))})
const eyePaths=c=>c.fills.filter(f=>f.style==='#FFF8EE').map(f=>f.points).sort((a,b)=>bounds(a).left-bounds(b).left)
function boundaryDistance(a,b){
 const directed=(p,q)=>Math.max(...p.map(([x,y])=>Math.min(...q.map(([ax,ay],i)=>{
  const [bx,by]=q[(i+1)%q.length],dx=bx-ax,dy=by-ay,denom=dx*dx+dy*dy,t=denom?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/denom)):0
  return Math.hypot(x-ax-t*dx,y-ay-t*dy)
 }))))
 return Math.max(directed(a,b),directed(b,a))
}
const neutral={x:256,y:256,alpha:1,scaleX:1,scaleY:1,sx:1,sy:1,rotation:0,rot:0,pebble:0,drop:0,cloud:0,bean:0,tug:0,squash:0,stamp:0,
 eyeX:0,eyeY:0,eyeL:.9,eyeR:.9,eyeOpenL:.9,eyeOpenR:.9,eyeAlpha:1,eyeTilt:0,eyeTiltL:0,eyeTiltR:0,eyeDepth:0,eyeOptical:1,starOptical:1,
 starGlow:0,starTurn:0,smile:0,wink:0,handAlpha:0,halo:0,cheek:0,mouth:0,brow:0,shine:0,expressionScene:undefined,nextExpression:undefined,motionPolished:true}

function drawNeutral(family){
 const ctx=createCanvasRecorder()
 if(family==='home'){
  const h=Home.create({getContext:()=>ctx},'idle');Object.assign(h.state,neutral);ctx.commands.length=0;ctx.fills.length=0;h.draw()
 }else{
  const draw={entry:Entry,story:Story,variety:Variety,system:System,next:Next}[family]
  const state=Object.assign((draw.baseState||draw.base)(),neutral)
  draw.paint({},ctx,state,family==='system'?'empty':family==='next'?'waiting':undefined)
 }
 return ctx
}

test('all six real painters use the approved round neutral body, eye layout and upper-left star at their own radii',()=>{
 // Independent design values from the approved master, not production constants.
 const radii={home:126,entry:122,story:122,variety:105,system:103,next:104}
 for(const [family,radius]of Object.entries(radii)){
  const ctx=drawNeutral(family),{bodies,stars}=assertBrandDrawing(ctx,`${family} neutral`)
  assert.equal(bodies.length,1,`${family}: unexpected neutral body`)
  const body=bodies[0],b=bounds(body.points),cx=(b.left+b.right)/2,cy=(b.top+b.bottom)/2,k=radius/126
  near(cx,256,`${family} centre x`);near(cy,256,`${family} centre y`)
  for(const [x,y]of body.points)near(Math.hypot(x-cx,y-cy),radius,`${family} default silhouette must stay circular`)
  const star=stars.find(s=>s.matrix.every((v,i)=>Math.abs(v-body.matrix[i])<1e-9)),centre=mean(star.points)
  near((centre[0]-cx)/k,-68,`${family} normalized star x`);near((centre[1]-cy)/k,-67,`${family} normalized star y`)
  const sb=bounds(star.points);near((sb.right-sb.left)/k,33,`${family} normalized star diameter`)
  const eyes=ctx.fills.filter(f=>f.style==='#FFF8EE'&&f.points.length===64).map(f=>bounds(f.points)).sort((a,b)=>a.left-b.left)
  assert.equal(eyes.length,2,`${family}: neutral eyes must remain visible`)
  for(const [i,e]of eyes.entries()){
   near(((e.left+e.right)/2-cx)/k,i?34:-34,`${family} normalized eye centre x`,.15)
   near(((e.top+e.bottom)/2-cy)/k,-14,`${family} normalized eye centre y`,.15)
   near((e.right-e.left)/k,27.5,`${family} normalized eye width`,.2)
   near((e.bottom-e.top)/k,51.75,`${family} normalized eye height`,.2)
  }
 }
})

test('new identity layout keeps independent wink, gaze and smiling eye expression instead of painting fixed bars',()=>{
 for(const family of ['home','entry','story','variety','system','next']){
  const k={home:126,entry:122,story:122,variety:105,system:103,next:104}[family]/126
  const draw=s=>{const c=createCanvasRecorder();Motion.drawFace(c,{...neutral,...s},1,family);return c.fills.map(f=>bounds(f.points))}
  const rest=draw({}),wink=draw({wink:1}),look=draw({eyeX:12,eyeY:6}),smile=draw({smile:1})
  assert.ok(wink[0].bottom-wink[0].top<(rest[0].bottom-rest[0].top)*.1,`${family} wink must close one eye`)
  near(wink[1].bottom-wink[1].top,rest[1].bottom-rest[1].top,`${family} other eye stays open`)
  for(let i=0;i<2;i++){
   assert.ok(look[i].left-rest[i].left>8*k&&look[i].left-rest[i].left<14*k,`${family} projected gaze stays readable`)
   assert.ok(look[i].top-rest[i].top>2*k&&look[i].top-rest[i].top<8*k,`${family} gaze follows the rounded surface`)
   assert.ok(smile[i].bottom-smile[i].top>0,`${family} smiling eye disappeared`)
  }
  assert.notDeepEqual(smile,rest,`${family} smile must change the eye contours`)
 }
})

test('detail switches at the actual displayed body size and enlarges only small-surface identity marks',()=>{
 function draw(diameter){
  const c=createCanvasRecorder(),cssWidth=diameter*512/252,pixels=cssWidth*2
  c.setTransform(pixels/512,0,0,pixels/512,0,0);Appearance.setViewport(c,cssWidth,pixels)
  Appearance.drawBody(c,()=>{c.beginPath();c.arc(0,0,126,0,Math.PI*2);c.closePath()},126)
  Appearance.drawBrandStar(c,{},'home')
  return c
 }
 const small=draw(69.9),large=draw(70.1)
 assert.equal(brandedBodies(small)[0].style.stops.length,3)
 assert.equal(brandedBodies(large)[0].style.stops.length,5)
 const radius=c=>{const body=brandedBodies(c)[0],star=c.fills.find(f=>f.style==='#FFF3CE'),a=bounds(star.points);return(a.right-a.left)/Math.hypot(body.matrix[0],body.matrix[1])}
 near(radius(small),33*1.22,'small star optical correction')
 near(radius(large),33,'large star remains at approved proportion')
 const stretched=createCanvasRecorder(),cssWidth=69*512/252,pixels=cssWidth*2
 stretched.setTransform(pixels/512,0,0,pixels/512,0,0);Appearance.setViewport(stretched,cssWidth,pixels);stretched.scale(.8,1.2)
 Appearance.drawBody(stretched,()=>{stretched.beginPath();stretched.arc(0,0,126,0,Math.PI*2);stretched.closePath()},126)
 assert.equal(brandedBodies(stretched)[0].style.stops.length,5,'the larger vertical axis must prevent a stretched body from using the small skin')
})

test('home keeps its full skin and star across the CSS-to-Canvas size boundary',()=>{
 for(const diameter of [69,70,71]){
  const c=createCanvasRecorder(),cssWidth=diameter*512/252,pixels=cssWidth*2
  c.setTransform(pixels/512,0,0,pixels/512,0,0);Appearance.setViewport(c,cssWidth,pixels)
  const h=Home.create({getContext:()=>c},'idle');Object.assign(h.state,neutral);c.fills.length=0;c.commands.length=0;h.draw()
  const{bodies,stars}=assertBrandDrawing(c,`home ${diameter}px`)
  assert.equal(bodies[0].style.stops.length,5,'home matches the full-skin CSS body PNG')
  const b=bounds(stars[0].points),scale=Math.hypot(bodies[0].matrix[0],bodies[0].matrix[1])
  near((b.right-b.left)/scale,33,'home mark must not pop in size when Canvas takes over')
 }
})

test('the independent home sleep story keeps unified identity through its full timeline and returns to a round body',()=>{
 const Sleep=require('../miniapp/components/xingcheng-q-home/sleep'),c=createCanvasRecorder(),scene=Sleep.create({getContext:()=>c})
 for(let n=0;n<=86;n++){
  const t=Math.min(n/4,21.5);c.commands.length=0;c.fills.length=0;scene.timeline.seek(t)
  const{bodies}=assertBrandDrawing(c,`sleep ${t}`,{allowNoBody:true})
  if(t===0||t===21.5){
   assert.equal(bodies.length,1,`sleep ${t} must have returned to one body`)
   const b=bounds(bodies[0].points)
   near(b.right-b.left,b.bottom-b.top,`sleep ${t} round silhouette`)
   assert.equal(bodies[0].style.stops.length,5,'home sleep shares the full homepage skin')
  }
 }
})

test('report happy eyes retain their readable visible width and the new face anchors',()=>{
 const c=createCanvasRecorder(),s=Object.assign(Next.base(),neutral,{smile:1})
 Next.paint({},c,s,'report');assertBrandDrawing(c,'report happy eyes')
 const eyes=eyePaths(c)
 assert.equal(eyes.length,2,'report must keep both visible happy eyes')
 const k=104/126
 for(const [i,eye]of eyes.entries()){
  const b=bounds(eye),width=b.right-b.left,height=b.bottom-b.top
  assert.ok(width>=35&&width<=37,'report happy eyes keep their readable visible width')
  assert.ok(height>=14&&height<=21,'report happy eyes remain curved and open enough to read')
  near((b.left+b.right)/2,256+(i?34:-34)*k,'report happy-eye horizontal anchor',.2)
  near(b.bottom,256-14*k,'report happy-eye lower edge remains near its face anchor',2)
 }
})

test('half-smiles stay continuous in the real report, expression and emotion renderers while neutral and happy eyes remain distinct',()=>{
 const Expression=require('../miniapp/components/xingcheng-q-motion/expressions'),Emotion=require('../miniapp/components/xingcheng-q-motion/emotions')
 const renderers={
  report:{unit:104/126,draw(c,smile){Next.paint({},c,Object.assign(Next.base(),neutral,{smile}),'report')}},
  expression:{unit:1,draw(c,smile){Expression.drawExpressionFace(c,{...neutral,smile,expressionScene:'approval',focusWeight:0,doubtWeight:0,insightWeight:0,recognitionWeight:0})}},
  emotion:{unit:1,draw(c,smile){Emotion.drawFace(c,{...neutral,smile,nextExpression:'proud'})}}
 }
 for(const [name,{draw,unit}]of Object.entries(renderers)){
  const render=smile=>{const c=createCanvasRecorder();draw(c,smile);const eyes=eyePaths(c);assert.equal(eyes.length,2,`${name} ${smile}: both eyes stay visible`);return eyes}
  const rest=render(0),happy=render(1),half=[.49,.50,.51].map(render)
  for(let eye=0;eye<2;eye++){
   const a=bounds(rest[eye]),b=bounds(happy[eye])
   near((a.right-a.left)/unit,27.5,`${name} neutral width`,.2)
   near((a.bottom-a.top)/unit,51.75,`${name} neutral height`,.2)
   assert.ok(b.right-b.left>(a.right-a.left)*1.15,`${name} happy eye broadens visibly`)
   assert.ok(b.bottom-b.top<(a.bottom-a.top)*.5,`${name} happy eye changes into a readable curved smile`)
   if(name!=='report')assert.ok(b.right-b.left>=28&&b.right-b.left<=32,`${name} happy eye has the approved gentle widening`)
   for(let i=1;i<half.length;i++){
    assert.ok(boundaryDistance(half[i-1][eye],half[i][eye])/unit<1,`${name} smile ${[.49,.50,.51][i-1]}→${[.49,.50,.51][i]} must not jump`)
    assert.ok(bounds(half[i][eye]).right-bounds(half[i][eye]).left>bounds(half[i-1][eye]).right-bounds(half[i-1][eye]).left,`${name} half-smile keeps responding continuously`)
   }
  }
 }
})

test('waiting timeline actually reveals both members: orange is branded and cyan remains a distinct unbranded visitor',()=>{
 const build=require('../miniapp/components/xingcheng-q-scene/scenes/waiting'),c=createCanvasRecorder(),scene=build({getContext:()=>c})
 for(const [time,expectedOrange,expectedCyan]of [[0,1,false],[.72,2,false],[1.45,2,true],[3.2,2,true],[6.5,2,true]]){
  c.commands.length=0;c.fills.length=0;scene.timeline.seek(time)
  const{bodies}=assertBrandDrawing(c,`waiting ${time}`)
  assert.equal(bodies.length,expectedOrange,`waiting ${time} orange member must not be treated as unreachable`)
  const cyan=c.fills.filter(f=>f.style?.stops?.some(([,color])=>color==='#159CB3'))
  assert.equal(cyan.length>0,expectedCyan,`waiting ${time} cyan visitor visibility`)
  for(const visitor of cyan){
   const stars=c.fills.filter(f=>f.style==='#FFF3CE'&&f.points.every(p=>require('./helpers/mascot-canvas.cjs').inside(p,visitor.points)))
   assert.equal(stars.length,0,'cyan visitor does not acquire the brand identity mark')
  }
 }
})

test('fallback sizes share the original full PNG and preserve legacy small-path aliases',()=>{
 const metadata=require('../miniapp/assets/xingcheng-q/appearance-assets')
 assert.equal(metadata.thresholdCssPx,70)
 assert.equal(Object.keys(metadata.assets).length,19,'all small-surface fallbacks are described; homepage full-only assets stay separate')
 for(const [full,item]of Object.entries(metadata.assets)){
  assert.ok(item.bodyDiameter>0&&item.imageWidth>0,full)
  const rpx=70*750*item.imageWidth/(375*item.bodyDiameter)
  assert.equal(Appearance.assetForSize(full,rpx-.01,375),full,full)
  assert.equal(Appearance.assetForSize(full,rpx+.01,375),full,full)
  assert.equal(Appearance.assetForSize(item.small,rpx+.01,375),full,`${full} can grow back to full`)
  assert.equal(Appearance.assetForSize(full,0,375),full,`${full} invalid size keeps full`)
  for(const image of [full,item.small]){
   assert.match(image,/\.png$/,`${image} must use an uploadable image suffix`)
   const file=path.join(root,image);assert.ok(fs.existsSync(file),`${image} missing`)
   const png=fs.readFileSync(file)
   assert.deepEqual(png.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]),`${image} must contain real PNG data`)
   assert.equal(png.toString('ascii',12,16),'IHDR',`${image} must have a PNG size header`)
   const width=png.readUInt32BE(16),height=png.readUInt32BE(20)
   assert.ok(width>0&&height>0,`${image} dimensions must be valid`)
   assert.equal(width,height,`${image} keeps square source proportions`)
   if(image===full)assert.equal(width,item.imageWidth,`${image} full image must match its size-selection metadata`)
   else assert.equal(width,item.smallImageWidth,`${image} small image must match its decoding metadata`)
  }
 }
 assert.equal(Appearance.assetForSize('/unrelated.png',100,375),'/unrelated.png')
 assert.equal(Appearance.assetForSize('toString',100,375),'toString')
 assert.equal(Appearance.assetForSize('__proto__',100,375),'__proto__')
 assert.equal(Appearance.assetForSize(null,100,375),null)
})
