import '../星橙Q-形状扩展-R2-20261105/shapes.js';import '../星橙Q-形状家族-R3-20261105/family.js';import './palette.js';
import fs from 'node:fs';import crypto from 'node:crypto';import {Resvg} from '@resvg/resvg-js';
const P=globalThis.QPaletteStudy,Q=P.core,dir=new URL('.',import.meta.url),write=(f,d)=>fs.writeFileSync(new URL(f,dir),d);
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
function txt(x,y,t,size=16,color='#382e29',anchor='start'){return `<text x="${x}" y="${y}" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="${size}" fill="${color}" text-anchor="${anchor}">${esc(t)}</text>`}
function pic(id,palette,x,y,w,h,opts={}){return P.svg(id,palette,{},opts).replace('<svg ',`<svg x="${x}" y="${y}" width="${w}" height="${h}" `)}
function sized(id,palette,cx,cy,max,opts={}){let b=Q.bounds(Q.shapes.find(s=>s.id===id)),box=max*360/Math.max(b.maxX-b.minX,b.maxY-b.minY);return pic(id,palette,cx-box/2,cy-box/2,box,box,opts)}
const start=(w,h)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#FAF8F4"/>`;
let b=start(1600,1250)+txt(60,76,'星橙Q · 固定配色鲜亮修正版',37)+txt(60,116,'以原始橙色的鲜亮程度为参照，减少掺白感。13套固定色，8套主推；双眼和四角星填色不变。',17,'#736057')+`<path d="M60 146H1540" stroke="#e9e1d9"/>`+txt(60,185,'8套主推配色',22);
P.palettes.filter(p=>p.group==='primary').forEach((p,i)=>{let row=Math.floor(i/4),col=i%4,cx=245+col*370,y=213+row*300;b+=pic('base',p.id,cx-120,y-20,240,240)+txt(cx,y+210,p.name,20,'#382e29','middle');b+=sized('e',p.id,cx-64,y+252,38)+sized('h',p.id,cx,y+252,48)+sized('f',p.id,cx+64,y+252,38)});
b+=`<path d="M60 828H1540" stroke="#e9e1d9"/>`+txt(60,871,'更多配色 · 原有五色保留',22)+txt(1540,871,'奶油白原样先看，下方另附细边适配对照',13,'#736057','end');
P.palettes.filter(p=>p.group==='more').forEach((p,i)=>{let x=210+i*294;b+=pic('base',p.id,x-100,889,200,200)+txt(x,1097,p.name,19,'#382e29','middle')+sized('j',p.id,x-34,1142,36)+sized('k',p.id,x+34,1142,48)});
b+=txt(60,1220,'色板组织已确认，具体色阶仍是本轮样张 · 标准品牌Q继续保持橙色 · 未接入小程序',13,'#736057')+'</svg>';
write('13套固定配色-鲜亮修正版.png',new Resvg(b,{font:{loadSystemFonts:true}}).render().asPng());
let c=start(1440,980)+txt(60,77,'浅色怎么保留米白眼睛与星芒？',34)+txt(60,118,'奶油白仍然保留。先比较原样与细边适配，填色、眼形、眼距、星位均不改变。',17,'#736057')+`<path d="M60 150H1380" stroke="#e9e1d9"/>`;
const cols=[{x:420,mode:'plain',name:'原样 · 不加细边',note:'柔和，但小尺寸下眼睛与星芒容易融在身体里。'},{x:1030,mode:'edge',name:'方案 B · 极细暖灰边',note:'保留米白填色，仅沿外缘加细边；仍需你确认。'}];
for(let v of cols){c+=pic('base','creme',v.x-170,177,340,340,{paleMode:v.mode})+txt(v.x,555,v.name,24,'#382e29','middle')+txt(v.x,588,v.note,15,'#736057','middle');let shapes=['base','h','f','k'];for(let i=0;i<4;i++){let x=v.x-180+i*120;c+=`<circle cx="${x}" cy="656" r="24" fill="#eee5db"/>`+sized(shapes[i],'creme',x,656,36,{paleMode:v.mode})+txt(x,707,['圆团','胶囊','卷月','云朵'][i],12,'#736057','middle');c+=sized(shapes[i],'creme',x,764,32,{paleMode:v.mode})+txt(x,810,'32px',11,'#736057','middle')}}
c+=`<path d="M60 866H1380" stroke="#e9e1d9"/>`+txt(60,907,'本页只提出浅色适配选择，不自动改成深色眼睛，也不改变已通过的轮廓。',15,'#736057')+txt(60,943,'尚未确定奶油白的最终适配方式；不影响原有颜色权益。',13,'#736057')+'</svg>';
write('奶油白-两种适配对照.png',new Resvg(c,{font:{loadSystemFonts:true}}).render().asPng());
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(new URL(p,dir))).digest('hex');
write('palette-register.json',JSON.stringify({version:P.VERSION,revisionReason:'用户指出上一稿偏浅，没有原始橙色靓丽；提高彩色主体饱和度并减少亮部掺白，品牌橙不变。旧色阶仅留在前后对照，已从当前样张替换。',brandVersion:'20261105.3',approvedShapeVersion:'20261105-shape-family.3',approval:{shapeQuote:'通过，因为还有配色可选，你需要确定一下，能用户几种固定配色，思考一下，和我沟通',approvedShapeIDs:Q.shapes.map(s=>s.id),paletteOrganizationQuote:'确定',paletteOrganization:'固定13套，其中8套主推、5套更多；11种形状通用；保留既有颜色使用权益',scope:'形状正面样张与配色组织已确认；具体13套新明暗色阶和浅色细边适配待看实样，不包含接入或发布'},shapeSources:{'../星橙Q-形状扩展-R2-20261105/shapes.js':sha('../星橙Q-形状扩展-R2-20261105/shapes.js'),'../星橙Q-形状家族-R3-20261105/family.js':sha('../星橙Q-形状家族-R3-20261105/family.js')},primaryIDs:P.primaryIDs,moreIDs:P.moreIDs,palettes:P.palettes,features:P.features,lightAdaptation:{status:'awaiting-user-choice',readability:'32px原样较弱，细边仅轻度改善，最终适配尚未解决或定稿',plain:'原样米白填色',edge:'只在奶油白眼星外沿增加极细暖灰边的候选样张，米白填色及几何不变'},legacy:'旧13个颜色ID一一保留；oldHex用于追溯而非自动替换真实记录。品牌橙仍沿用确认母版的五阶明暗。',restrictions:['不新增颜色奖励档位','不把143个形色组合当成新宠物名册','不改真实头像/收集记录','不改小程序或云端','不替换正式品牌母版','不上传部署发布']},null,2));

// Prior preview paint is retained only for this comparison, never as an extra selectable palette.
function before(id,palette,x,y,w,h){const p=P.get(palette);let s=pic(id,palette,x,y,w,h);if(p.previousRamp){p.ramp.forEach((c,i)=>s=s.replaceAll(c,p.previousRamp[i]));s=s.replaceAll(p.shade,p.previousShade)}return s}
let compare=start(1520,1110)+txt(60,76,'向原始橙色的鲜亮程度对齐',35)+txt(60,117,'左：上一稿 / 右：鲜亮修正稿。减少掺白感、提高彩色主体饱和度，保留柔和体积。',17,'#736057')+`<path d="M60 150H1460" stroke="#e9e1d9"/>`;
P.palettes.filter(p=>p.group==='primary').forEach((p,i)=>{let row=Math.floor(i/4),col=i%4,x=80+col*365,y=185+row*420;compare+=txt(x+160,y+30,p.name,23,'#382e29','middle')+before('base',p.id,x-3,y+58,170,180)+pic('base',p.id,x+164,y+58,170,180)+txt(x+82,y+263,'上一稿',12,'#736057','middle')+txt(x+249,y+263,p.id==='xingcheng'?'原始橙色不变':'修正稿',12,'#736057','middle')+sized('e',p.id,x+68,y+324,42)+sized('h',p.id,x+160,y+324,48)+sized('f',p.id,x+252,y+324,42)});
compare+=`<path d="M60 1020H1460" stroke="#e9e1d9"/>`+txt(60,1058,'形状、米白双眼和左上四角星保持原样；品牌橙完全沿用已确认版本。',14,'#736057')+txt(60,1088,'具体修正色阶仍是待你看效果的样张，未接入小程序。',12,'#736057')+'</svg>';
write('主推八色-修正前后对照.png',new Resvg(compare,{font:{loadSystemFonts:true}}).render().asPng());
