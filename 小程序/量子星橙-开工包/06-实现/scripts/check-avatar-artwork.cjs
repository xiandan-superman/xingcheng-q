'use strict'
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),{execFileSync}=require('node:child_process')
const {Resvg}=require('@resvg/resvg-js')
const root=path.resolve(__dirname,'..'),previews=path.resolve(root,'../../..','previews'),out=path.join(root,'output/avatar-acceptance')
fs.mkdirSync(out,{recursive:true})
const context=vm.createContext({})
for(const file of ['星橙Q-形状扩展-R2-20261105/shapes.js','星橙Q-形状家族-R3-20261105/family.js','星橙Q-固定配色-R4-20261105/palette.js','星橙Q-奶油白适配-R5-20261105/cream.js'])vm.runInContext(fs.readFileSync(path.join(previews,file),'utf8'),context)
const avatar=require('../miniapp/utils/avatar'),catalog=require('../miniapp/utils/avatar-catalog'),manifest=require('../config/avatar-system.json')
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'q-avatar-artwork-')),cases=[]
try{
 for(const shape of manifest.shapes)for(const color of catalog.colors)for(const size of color.id==='creme'?[24,32,96]:[96]){
  const key=[shape.id,color.id,size].join('-'),native=avatar.svg(shape.id,color.id),approved=context.QCreamStudy.paletteSVG(shape.studyID,color.id)
  // Supersample both paths consistently: curve vs sampled-polyline tessellation must not dominate edge comparisons.
  for(const [kind,source] of [['native',native],['approved',approved]])fs.writeFileSync(path.join(temp,key+'-'+kind+'.png'),new Resvg(source,{fitTo:{mode:'width',value:size*4},font:{loadSystemFonts:false}}).render().asPng())
  cases.push({key,shape:shape.id,color:color.id,size})
 }
 fs.writeFileSync(path.join(temp,'cases.json'),JSON.stringify({cases,shapes:catalog.shapes.map(s=>({id:s.id,name:s.name})),colors:catalog.colors.map(c=>({id:c.id,name:c.name}))}))
 const python=String.raw`
import json,sys
from pathlib import Path
from PIL import Image,ImageChops,ImageStat,ImageDraw,ImageFont
folder=Path(sys.argv[1]);out=Path(sys.argv[2]);data=json.loads((folder/'cases.json').read_text());results=[]
for case in data['cases']:
 size=(case['size'],case['size'])
 a=Image.open(folder/(case['key']+'-native.png')).convert('RGBA').resize(size,Image.Resampling.LANCZOS);b=Image.open(folder/(case['key']+'-approved.png')).convert('RGBA').resize(size,Image.Resampling.LANCZOS)
 # Compare visible pixels on real backgrounds. RGB values in transparent edge pixels are not visible differences.
 errors=[]
 for bg in ['#FFFDF4','#FFFFFF','#1C2026']:
  base=Image.new('RGBA',a.size,bg);aa=Image.alpha_composite(base,a).convert('RGB');bb=Image.alpha_composite(base,b).convert('RGB')
  diff=ImageChops.difference(aa,bb);errors.append((sum(ImageStat.Stat(diff).mean)/3,sum(max(p)>12 for p in diff.get_flattened_data())/(a.width*a.height)))
 mean=max(e[0] for e in errors);changed=max(e[1] for e in errors)
 results.append(dict(case,meanChannelError=mean,changedPixelFraction=changed,passed=mean<.4 and changed<.005))
font='/System/Library/Fonts/Supplemental/Arial Unicode.ttf'
f=lambda size:ImageFont.truetype(font,size)
sheet=Image.new('RGB',(1100,1380),'#F6F2EA');draw=ImageDraw.Draw(sheet)
draw.text((36,24),'星橙Q · 头像替换验收',font=f(30),fill='#27231F')
draw.text((36,70),'11种形状 × 13套配色｜使用小程序实际头像绘制结果',font=f(18),fill='#726555')
for i,shape in enumerate(data['shapes']):draw.text((145+i*84,110),shape['name'],font=f(16),fill='#49392B')
for row,color in enumerate(data['colors']):
 y=142+row*75;draw.text((32,y+20),color['name'],font=f(17),fill='#49392B')
 for col,shape in enumerate(data['shapes']):
  p=Image.open(folder/(shape['id']+'-'+color['id']+'-96-native.png')).convert('RGBA');p=p.resize((66,66),Image.Resampling.LANCZOS);sheet.paste(p,(136+col*84,y),p)
draw.text((36,1144),'奶油白A · 原尺寸辨识（24px / 32px）',font=f(20),fill='#49392B')
for col,shape in enumerate(data['shapes']):
 x=144+col*84
 draw.text((x,1192),shape['name'],font=f(16),fill='#49392B')
 for row,size in enumerate([24,32]):
  p=Image.open(folder/(shape['id']+'-creme-'+str(size)+'-native.png')).convert('RGBA').resize((size,size),Image.Resampling.LANCZOS);sheet.paste(p,(x+8,1230+row*54),p)
draw.text((32,1230),'24px',font=f(17),fill='#726555');draw.text((32,1284),'32px',font=f(17),fill='#726555')
sheet.save(out/'avatar-family-acceptance.png',optimize=True)
report={'cases':len(results),'failed':[r for r in results if not r['passed']],'maxMeanChannelError':max(r['meanChannelError'] for r in results),'maxChangedPixelFraction':max(r['changedPixelFraction'] for r in results),'tolerance':{'meanChannelError':.4,'changedPixelFraction':.005},'results':results}
(out/'artwork-comparison.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in report.items() if k not in ['results','failed']}|{'failedCount':len(report['failed'])},ensure_ascii=False))
sys.exit(bool(report['failed']))
`
 try { process.stdout.write(execFileSync('python3',['-c',python,temp,out],{encoding:'utf8',maxBuffer:1024*1024})) }
 catch(error) { if(error.stdout)process.stdout.write(error.stdout);if(error.stderr)process.stderr.write(error.stderr);process.exitCode=error.status||1 }
}finally{fs.rmSync(temp,{recursive:true,force:true})}
