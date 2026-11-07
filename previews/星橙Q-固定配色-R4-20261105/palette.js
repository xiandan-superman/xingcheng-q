(function(G){
'use strict';
const core=G.ShapeFamily;if(!core)throw Error('Missing accepted shape family');
const palettes=[
{id:'xingcheng',name:'星橙橙',group:'primary',oldHex:'#ff6a1a',ramp:['#FFB65C','#FF9B36','#FF8027','#EF6B25','#DC5A24'],shade:'#BF4A1B',note:'沿用已确认的品牌橙色明暗，不以旧头像的纯色替代母版。'},
{id:'rouge',name:'珊瑚红',group:'primary',oldHex:'#e8483f',ramp:['#FF8476','#FF6156','#F33E3C','#D92F33','#B8242D'],shade:'#A82029',previousRamp:['#FFA18D','#F37F70','#E86459','#D54B43','#B73C38'],previousShade:'#A53A32'},
{id:'ambre',name:'琥珀黄',group:'primary',oldHex:'#f0b429',ramp:['#FFE06A','#FFD03A','#F5B615','#D99A0E','#B98110'],shade:'#9D6B0C',previousRamp:['#F6D77B','#EBC154','#D9A737','#C38D28','#A77622'],previousShade:'#96641E'},
{id:'vert',name:'薄荷绿',group:'primary',oldHex:'#3ecf8e',ramp:['#6CE1A4','#3BD58B','#18BF72','#0EA161','#0A8550'],shade:'#086E43',previousRamp:['#A2E0BC','#79CDA3','#57B58B','#3A9976','#2C7E61'],previousShade:'#24694F'},
{id:'bleu',name:'天空蓝',group:'primary',oldHex:'#3b93f0',ramp:['#6DBBFF','#369FFF','#1686F5','#0D6ED8','#0D58B0'],shade:'#0B498E',previousRamp:['#9BC8F1','#76B1E7','#5496D4','#377BB8','#2B629A'],previousShade:'#24517E'},
{id:'violet',name:'紫罗兰',group:'primary',oldHex:'#8b5cf6',ramp:['#B28AFF','#9B68FF','#8646EF','#7134D2','#5E29AE'],shade:'#4D2191',previousRamp:['#C3ADEB','#AA8DDE','#9472CD','#7D5BB7','#654795'],previousShade:'#523979'},
{id:'rose',name:'玫瑰粉',group:'primary',oldHex:'#e152b0',ramp:['#FF8CCF','#F968BF','#EB42A8','#CE2D8D','#AD2375'],shade:'#8D1C60',previousRamp:['#F1B2D1','#E692BE','#D872A9','#BF598F','#A54879'],previousShade:'#8B3965'},
{id:'brun',name:'栗棕',group:'primary',oldHex:'#8b5e3c',ramp:['#D9955E','#C47D43','#AB622F','#8F4D24','#733B1B'],shade:'#5E2E15',previousRamp:['#C99D7B','#B58564','#9D6B4D','#85563D','#6E4432'],previousShade:'#593425'},
{id:'encre',name:'墨黑',group:'more',oldHex:'#0a0a0c',ramp:['#514D5D','#3C374B','#292539','#1D1A2D','#151223'],shade:'#0F0D19',previousRamp:['#66616A','#504D57','#3A3943','#2A2932','#1C1C24'],previousShade:'#14141B'},
{id:'orange',name:'暖橙',group:'more',oldHex:'#f08a24',ramp:['#FFC25A','#FFAB2E','#F69313','#DB7A0D','#BB640D'],shade:'#9D520A',previousRamp:['#FFD08C','#F2B66B','#E39A4B','#CA7F37','#AD652A'],previousShade:'#965223'},
{id:'turquoise',name:'青绿',group:'more',oldHex:'#2fbfa0',ramp:['#58DCC9','#25CEB3','#0FB799','#099A82','#087D6C'],shade:'#066657',previousRamp:['#9DD9CF','#74C6B8','#51AD9D','#359185','#28786F'],previousShade:'#206259'},
{id:'gris',name:'雾灰',group:'more',oldHex:'#a3a3a3',ramp:['#C2BEB7','#A9A297','#90887C','#797165','#625B51'],shade:'#514A41',previousRamp:['#C8C5C0','#B1ADA6','#9C978F','#878178','#706A61'],previousShade:'#5D574F'},
{id:'creme',name:'奶油白',group:'more',oldHex:'#f1efe9',ramp:['#FFFCF5','#F7F0E5','#E9E0D3','#D5C8B6','#BDAA91'],shade:'#A58F71',pale:true,note:'浅色适配另列对照：米白眼星填色保持不变，细边仅为待确认方案。'}
];
const originalRamp=['#FFB65C','#FF9B36','#FF8027','#EF6B25','#DC5A24'];
const features={eyes:'#FFF8EE',star:'#FFF3CE',paleEdge:'#958068',paleStroke:3.6};
function get(id){const p=palettes.find(p=>p.id===id);if(!p)throw Error('Unknown fixed palette: '+id);return p}
function svg(shapeID,colorID='xingcheng',pose={},options={}){
 const p=get(colorID);let s=core.svg(shapeID,pose);
 if(colorID!=='xingcheng'){
  // Only replace body paint tokens; all accepted body and feature paths stay frozen.
  originalRamp.forEach((old,i)=>{s=s.replaceAll(old,p.ramp[i])});
  s=s.replaceAll('#C44D1D',p.shade).replaceAll('#BF4A1B',p.shade);
 }
 const edge=p.pale&&(options.paleMode||'plain')==='edge'&&!pose.silhouette;
 if(edge){
  const attributes=`stroke="${features.paleEdge}" stroke-width="${features.paleStroke}" stroke-linejoin="round" paint-order="stroke fill"`;
  s=s.replace('<g fill="#FFF8EE">',`<g fill="#FFF8EE" ${attributes}>`);
  s=s.replace('<path fill="#FFF3CE" d=',`<path fill="#FFF3CE" ${attributes} d=`);
 }
 return s.replace('候选样张',p.name+'配色样张');
}
function sized(shapeID,colorID,max,pose={},options={}){const b=core.bounds(core.shapes.find(s=>s.id===shapeID)),box=max*360/Math.max(b.maxX-b.minX,b.maxY-b.minY);return svg(shapeID,colorID,pose,options).replace('<svg ',`<svg style="width:${box}px;height:${box}px" `)}
G.QPaletteStudy={VERSION:'20261105-fixed-palette.2',core,palettes,features,get,svg,sized,primaryIDs:palettes.filter(p=>p.group==='primary').map(p=>p.id),moreIDs:palettes.filter(p=>p.group==='more').map(p=>p.id)};
})(globalThis);
