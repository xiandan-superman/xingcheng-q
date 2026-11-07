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

