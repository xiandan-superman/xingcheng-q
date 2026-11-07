(function(G){
'use strict';
const P=G.QPaletteStudy;if(!P)throw Error('Missing accepted vivid palette');const Q=P.core;
const selection={id:'ink-gold',status:'user-confirmed',quote:'A',date:'2026-11-05',scope:'奶油白A视觉适配确认；不授权运行接入或发布'};
const profiles=[
 {id:'ink-gold',label:'A · 墨黑眼 / 暖棕星',short:'墨黑眼＋暖棕星',eyes:'#27231F',star:'#5B280A',role:'accepted',note:'已确认方案：墨黑双眼，暖棕星芒。'},
 {id:'cocoa',label:'B · 深可可眼 / 深可可星',short:'深可可眼＋深可可星',eyes:'#4E3324',star:'#4E3324',role:'unselected-reference',note:'未采用，仅保留为方案对照。'},
 {id:'previous',label:'原样参照 · 米白五官',short:'原样参照',eyes:'#FFF8EE',star:'#FFF3CE',role:'reference',note:'仅用于比较上轮小尺寸辨识问题。'}
];
function profile(id){const p=profiles.find(p=>p.id===id);if(!p)throw Error('Unknown cream adaptation: '+id);return p}
function svg(shapeID,variant=selection.id,pose={}){const p=profile(variant);let s=P.svg(shapeID,'creme',pose,{paleMode:'plain'});if(!pose.silhouette){s=s.replaceAll('fill="#FFF8EE"',`fill="${p.eyes}"`).replaceAll('fill="#FFF3CE"',`fill="${p.star}"`)}return s.replace('奶油白配色样张','奶油白 '+p.short+'样张')}
function sized(shapeID,variant,max,pose={}){const b=Q.bounds(Q.shapes.find(s=>s.id===shapeID)),box=max*360/Math.max(b.maxX-b.minX,b.maxY-b.minY);return svg(shapeID,variant,pose).replace('<svg ',`<svg style="width:${box}px;height:${box}px" `)}
function paletteSVG(shapeID,colorID,variant=selection.id,pose={}){return colorID==='creme'?svg(shapeID,variant,pose):P.svg(shapeID,colorID,pose)}
G.QCreamStudy={VERSION:'20261105-cream-study.1',P,Q,selection,profiles,profile,svg,sized,paletteSVG};
})(globalThis);
