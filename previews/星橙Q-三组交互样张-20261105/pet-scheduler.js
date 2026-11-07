/* Independent story, lead and partner selection; no shape is assigned a fixed act. */
(function(G){
'use strict';
const pairKey=(a,b)=>[a,b].sort().join('|');
class Mixer{
 constructor({random=Math.random,history={}}={}){
  this.random=random;this.revision=0;this.load(history);
 }
 number(){const value=Number(this.random());return Number.isFinite(value)?Math.max(0,Math.min(.999999999,value)):.5;}
 shuffle(values){const out=values.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(this.number()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
 load(h){
  h=h&&h.version===2?h:{};
  const list=value=>Array.isArray(value)?[...new Set(value.filter(x=>typeof x==='string'&&x.length<80))].slice(0,32):[];
  const counts=value=>new Map((Array.isArray(value)?value:[]).filter(x=>Array.isArray(x)&&typeof x[0]==='string'&&x[0].length<180&&Number.isFinite(x[1])&&x[1]>=0).slice(0,180).map(([key,n])=>[key,Math.min(1000000,Math.floor(n))]));
  this.members=list(h.members);this.stories=list(h.stories);this.leads=list(h.leads);this.quiet=list(h.quiet);this.recent=list(h.recent).slice(0,2);
  this.lastLead=typeof h.lastLead==='string'?h.lastLead:null;this.lastQuiet=typeof h.lastQuiet==='string'?h.lastQuiet:null;
  this.lastPair=typeof h.lastPair==='string'?h.lastPair:null;this.sceneLeads=counts(h.sceneLeads);this.pairs=counts(h.pairs);
 }
 export(){return {version:2,members:this.members.slice(),stories:this.stories.slice(),leads:this.leads.slice(),quiet:this.quiet.slice(),recent:this.recent.slice(),lastLead:this.lastLead,lastQuiet:this.lastQuiet,lastPair:this.lastPair,sceneLeads:[...this.sceneLeads],pairs:[...this.pairs]};}
 roster(pets){
  const sorted=pets.filter(p=>!p.retiring).slice().sort((a,b)=>a.x-b.x),ids=sorted.map(p=>p.id);
  this.leads=this.leads.filter(id=>ids.includes(id));this.quiet=this.quiet.filter(id=>ids.includes(id));
  const added=ids.filter(id=>!this.members.includes(id));this.leads.push(...this.shuffle(added.filter(id=>!this.leads.includes(id))));this.quiet.push(...this.shuffle(added.filter(id=>!this.quiet.includes(id))));this.members=ids;
  if(!this.leads.length)this.leads=this.shuffle(ids);
  if(!this.quiet.length)this.quiet=this.shuffle(ids);
  return sorted;
 }
 choices(names,pets,library){
  const sorted=this.roster(pets),ids=sorted.map(p=>p.id),pool=this.leads.filter(id=>ids.length===1||id!==this.lastLead),leads=pool.length?pool:this.leads,out=[];
  for(const name of names)for(const id of leads){
   const a=sorted.find(p=>p.id===id),i=sorted.indexOf(a);
   // Leaving the platform belongs to an edge; all other acts accept every lead.
   if(name==='peek'&&i!==0&&i!==ids.length-1)continue;
   const neighbors=library[name].pair?[sorted[i-1],sorted[i+1]].filter(Boolean):[a];
   for(const b of neighbors.length?neighbors:[a]){
    const paired=!!library[name].pair,key=paired?pairKey(a.id,b.id):null;
    if(paired&&ids.length>1&&key===this.lastPair)continue;
    const sceneUse=this.sceneLeads.get(name+'|'+a.id)||0,pairUse=key?(this.pairs.get(key)||0):0;
    out.push({name,leadId:a.id,partnerId:b.id,direction:name==='peek'?(i===0?-1:1):(this.number()<.5?-1:1),score:sceneUse*8+pairUse*.8+Math.abs(a.x-b.x)/Math.max(1,sorted.length*60)+this.number()*2});
   }
  }
  return out;
 }
 pick(pets,library,forced){
  const options=Object.keys(library).filter(name=>!library[name].pair||pets.length>1);
  this.stories=this.stories.filter(name=>options.includes(name));this.recent=this.recent.filter(name=>options.includes(name));
  if(!this.stories.length)this.stories=this.shuffle(options);
  let names=forced?[forced]:this.stories.filter(name=>!this.recent.includes(name));
  let candidates=this.choices(names,pets,library);
  if(!candidates.length&&!forced){
   // A solo interlude breaks an unavoidable repeated neighbor pairing.
   names=options.filter(name=>!library[name].pair&&name!==this.recent[0]);candidates=this.choices(names,pets,library);
  }
  if(!candidates.length&&forced){
   // Manual QA may request the only available pair; the automatic path never does.
   const previous=this.lastPair;this.lastPair=null;candidates=this.choices(names,pets,library);this.lastPair=previous;
   if(!candidates.length){const previousLeads=this.leads;this.leads=this.shuffle(pets.map(p=>p.id));candidates=this.choices(names,pets,library);this.leads=previousLeads;}
  }
  if(!candidates.length)return null;
  candidates.sort((a,b)=>a.score-b.score);const chosen=candidates[0];
  return {...chosen,variant:this.number()<.5?0:1,rate:.94+this.number()*.12};
 }
 commit(choice,library){
  const {name,leadId,partnerId}=choice;this.stories=this.stories.filter(x=>x!==name);this.leads=this.leads.filter(x=>x!==leadId);
  this.recent=[name,...this.recent.filter(x=>x!==name)].slice(0,2);this.lastLead=leadId;
  const key=name+'|'+leadId;this.sceneLeads.set(key,(this.sceneLeads.get(key)||0)+1);
  this.lastPair=library[name].pair?pairKey(leadId,partnerId):null;
  if(this.lastPair)this.pairs.set(this.lastPair,(this.pairs.get(this.lastPair)||0)+1);
  this.revision++;
 }
 gentle(pets){
  const sorted=this.roster(pets);let ids=this.quiet.filter(id=>id!==this.lastQuiet);if(!ids.length)ids=this.quiet;
  const id=ids[Math.floor(this.number()*ids.length)];this.quiet=this.quiet.filter(x=>x!==id);this.lastQuiet=id;return sorted.find(p=>p.id===id)||sorted[0];
 }
 pause(calm=false){return calm?.6+this.number()*.35:1.6+this.number()*2.4;}
}
G.QPetScheduler={Mixer};
if(typeof module!=='undefined')module.exports=G.QPetScheduler;
})(globalThis);
