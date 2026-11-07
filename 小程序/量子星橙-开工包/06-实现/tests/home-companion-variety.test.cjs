'use strict'
const test=require('node:test'),assert=require('node:assert/strict')
const {Mixer}=require('../miniapp/components/home-companions/scheduler')
const {Stage,LIBRARY,neutral}=require('../miniapp/components/home-companions/behavior')
const appearance=require('../miniapp/components/home-companions/appearance')
const shapes=appearance().catalog.shapes.map(s=>s.id)
function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
function roster(n,offset=0){return Array.from({length:n},(_,i)=>({id:shapes[(offset+i)%shapes.length],x:24+i*65}))}
const pair=c=>[c.leadId,c.partnerId].sort().join('|')
function draw(m,p){const c=m.pick(p,LIBRARY);assert(c,'automatic scheduler must keep making progress');m.commit(c,LIBRARY);return c}

test('one to five pets get balanced leading turns, shuffled stories and no consecutive repeated actor, story or pair',()=>{
 const signatures=new Set()
 for(let n=1;n<=5;n++)for(let seed=1;seed<=80;seed++){
  const pets=roster(n,seed%shapes.length),m=new Mixer({random:random(seed)}),seen=new Set(),leads=[],sequence=[];let previous
  for(let turn=0;turn<120;turn++){
   const c=draw(m,pets);seen.add(c.name);leads.push(c.leadId);sequence.push(c.name+':'+c.leadId)
   assert(pets.some(p=>p.id===c.leadId));assert(c.rate>=.94&&c.rate<=1.06)
   if(previous){assert.notEqual(c.name,previous.name);if(n>1)assert.notEqual(c.leadId,previous.leadId);if(LIBRARY[c.name].pair&&LIBRARY[previous.name].pair)assert.notEqual(pair(c),pair(previous))}
   if(LIBRARY[c.name].pair)assert.equal(Math.abs(pets.findIndex(p=>p.id===c.leadId)-pets.findIndex(p=>p.id===c.partnerId)),1,'partners approach from neighboring positions')
   else assert.equal(c.partnerId,c.leadId)
   if(c.name==='peek')assert([pets[0].id,pets.at(-1).id].includes(c.leadId))
   if((turn+1)%n===0)assert.equal(new Set(leads.slice(-n)).size,n,'each pet leads once in a round')
   previous=c
  }
  assert.equal(seen.size,Object.values(LIBRARY).filter(meta=>!meta.pair||n>1).length,'no story becomes permanently blocked')
  if(n===5)signatures.add(sequence.slice(0,12).join(','))
 }
 assert.equal(signatures.size,80,'independent visits do not follow one fixed story/role list')
})

test('stories use varied lead/partner combinations and can reverse active and responding roles',()=>{
 const m=new Mixer({random:random(44)}),pets=roster(5),actors=new Map(),pairs=new Set(),directed=new Set()
 for(let i=0;i<1200;i++){
  const c=draw(m,pets);if(!actors.has(c.name))actors.set(c.name,new Set());actors.get(c.name).add(c.leadId)
  if(LIBRARY[c.name].pair){pairs.add(pair(c));directed.add(c.leadId+'>'+c.partnerId)}
 }
 for(const [name,ids]of actors)assert.equal(ids.size,name==='peek'?2:5,name+' must not be tied to one character')
 assert.equal(pairs.size,4);assert.equal(directed.size,8,'each neighboring pairing can swap its two roles')
})

test('local history survives reopening and roster changes without starring a hidden pet or starving a newcomer',()=>{
 let pets=roster(5),m=new Mixer({random:random(45)}),last=draw(m,pets)
 for(let visit=0;visit<30;visit++){
  m=new Mixer({random:random(visit+100),history:JSON.parse(JSON.stringify(m.export()))})
  const c=draw(m,pets);assert.notEqual(c.name,last.name);assert.notEqual(c.leadId,last.leadId);last=c
 }
 pets=[pets[0],pets[2],pets[4],{id:'tip',x:360}];const next=Array.from({length:12},()=>draw(m,pets))
 assert(next.every(c=>pets.some(p=>p.id===c.leadId)));assert(next.some(c=>c.leadId==='tip'))
 for(const history of [null,{},'bad',{version:1},{version:2,stories:['gone','__proto__'],leads:[null,1,'gone'],recent:['gone'],sceneLeads:[null,['x',Infinity]],pairs:'bad'}]){
  const clean=new Mixer({random:random(1),history});assert(draw(clean,roster(1)))
 }
})

function stage(ids,width=350,seed=30){const s=new Stage(width,1,appearance(),{random:random(seed)});s.setRoster(ids);s.clip=null;s.pets.forEach((p,i)=>Object.assign(p,neutral,{id:p.id,x:ids.length===1?width*.5:22+i*(width-44)/(ids.length-1),alpha:1}));s.auto=false;return s}
test('randomized casting preserves exact poses at each handoff, finite motion, floor contact and authored story time',()=>{
 let frames=0
 for(const width of [290,339,353])for(let n=1;n<=5;n++)for(let rotation=0;rotation<shapes.length;rotation+=3){
  const s=stage(roster(n,rotation).map(p=>p.id),width,rotation+n),scale=width/353;s.setScale(scale)
  for(let story=0;story<18;story++){
   const before=structuredClone(s.pets),casting=s.mixer.pick(s.pets,LIBRARY);assert(s.start(casting.name,{casting,automatic:true}));s.tick(0)
   for(let i=0;i<n;i++)for(const k of ['x','lift','sx','sy','rot','openL','openR'])assert(Math.abs(s.pets[i][k]-before[i][k])<1e-8,k+' jumps at handoff')
   assert(Math.abs(s.duration-s.clip.prep-s.clip.plan.seconds/casting.rate)<1e-8)
   let previous=structuredClone(s.pets)
   while(s.clip){s.tick(1/60);for(const p of s.pets){for(const value of Object.values(p))if(typeof value==='number')assert(Number.isFinite(value));assert(p.lift>=-1e-6);assert(p.sy>.45&&p.sy<1.7);const old=previous.find(x=>x.id===p.id);assert(Math.hypot(p.x-old.x,p.lift-old.lift)<8,'unmotivated motion jump in '+casting.name)}previous=structuredClone(s.pets);frames++}
  }
 }
 assert(frames>500000)
})

test('all shape pairs preserve real contour support in either direction during a randomized bounce',()=>{
 for(let i=0;i<shapes.length;i++)for(let j=0;j<shapes.length;j++){
  if(i===j)continue;const s=stage([shapes[i],shapes[j]],320)
  const casting={name:'bounce',leadId:shapes[i],partnerId:shapes[j],direction:1,variant:0,rate:1.04};s.start('bounce',{casting,automatic:true})
  for(let t=2.45;t<3.6;t+=.13){s.seek(s.clip.prep+t/casting.rate);const [a,b]=s.pets,ma=s.measure(a),mb=s.measure(b);assert(Math.abs(a.x+ma.bottomX-b.x-mb.topX)<1e-7);assert(Math.abs(a.lift-b.lift-mb.height)<1e-7)}
 }
})

test('gentle activity keeps moving without taking a leading turn, and static mode does not consume scheduled stories',()=>{
 const s=stage(shapes.slice(0,5));s.auto=true;s.start('pass');const first=s.clip,history=s.behaviorHistory
 s.tick(.1,{calm:true});assert.equal(s.clip,first)
 while(s.clip)s.tick(1/60,{calm:true})
 for(let i=0;i<60&&!s.clip;i++)s.tick(1/60,{calm:true})
 assert.equal(s.clip?.plan.name,'quiet');assert.deepEqual(s.behaviorHistory.leads,history.leads);assert.deepEqual(s.behaviorHistory.recent,history.recent)
 const before=JSON.stringify(s.pets);for(let i=0;i<120;i++)s.tick(1/60,{calm:true});assert.notEqual(JSON.stringify(s.pets),before)
 const paused=JSON.stringify(s.behaviorHistory),time=s.time;for(let i=0;i<120;i++)s.tick(1/60,{reduced:true});assert.equal(s.time,time);assert.equal(JSON.stringify(s.behaviorHistory),paused)
})
