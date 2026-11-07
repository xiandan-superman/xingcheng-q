import '../星橙Q-形状扩展-R2-20261105/shapes.js';
import fs from 'node:fs';import crypto from 'node:crypto';
const approvedBefore=Object.fromEntries(['base','d','e','f'].map(id=>[id,JSON.stringify(ShapeStudyR2.geometry(id))]));
await import('./family.js');
const Q=globalThis.ShapeFamily,checks=[];function check(name,ok,detail){checks.push({name,ok,...detail?{detail}:{}});if(!ok)throw Error(name+': '+JSON.stringify(detail))}
function inside(p,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes}return yes}
check('基础与三种接受造型的中性定义未改',Object.entries(approvedBefore).every(([id,data])=>data===JSON.stringify(Q.geometry(id))));
check('七种新增方向与两项重复方向计数正确',Q.addedIDs.length===7&&Q.shapes.length===11&&new Set(Q.shapes.map(s=>s.id)).size===11);
let ext={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity};
for(let s of Q.shapes){for(let flex of [-22,0,22]){let g=Q.geometry(s.id,{flex});check(s.id+' 弯折'+flex+' 五官与星芒完整落在体内',[...g.eyes.flat(),...g.star].every(p=>inside(p,g.body)));check(s.id+' 弯折'+flex+' 坐标有限',[...g.body,...g.eyes.flat(),...g.star].flat().every(Number.isFinite))}
for(let mode of ['bounce','knead','wobble']){for(let i=0;i<=100;i++){let p=Q.motion(i/20,mode),g=Q.geometry(s.id,p),a=(p.rot||0)*Math.PI/180,c=Math.cos(a),sn=Math.sin(a),sx=p.sx||1,sy=p.sy||1,ty=(p.dy||0)+g.bounds.maxY*(1-sy);for(let [x,y]of g.body){let xx=x*sx*c-y*sy*sn,yy=x*sx*sn+y*sy*c+ty;ext.minX=Math.min(ext.minX,xx);ext.maxX=Math.max(ext.maxX,xx);ext.minY=Math.min(ext.minY,yy);ext.maxY=Math.max(ext.maxY,yy)}}}
}
check('动画全程不会被展示画幅裁切',ext.minX>=-215&&ext.maxX<=215&&ext.minY>=-270&&ext.maxY<=220,ext);
check('卷月负形未被球形包络填满',!inside([50,0],Q.geometry('f').body)&&inside([-80,0],Q.geometry('f').body));
check('爱心顶部缺口保留',!inside([0,-100],Q.geometry('m').body)&&inside([0,0],Q.geometry('m').body));
const register=JSON.parse(fs.readFileSync(new URL('family-register.json',import.meta.url)));const master=fs.readFileSync(new URL('../../品牌资源/星橙Q/标准母版/星橙Q-标准正面母版.svg',import.meta.url));check('候选登记仍指向当前母版',register.masterSha256===crypto.createHash('sha256').update(master).digest('hex'));
const record={version:Q.VERSION,checks,scope:'形态完整性、负形与画幅检查，非正式审美批准或小程序真机验收',browser:[]};fs.writeFileSync(new URL('verification.json',import.meta.url),JSON.stringify(record,null,2));console.log(JSON.stringify({pass:true,checks:checks.length,extent:ext}));
