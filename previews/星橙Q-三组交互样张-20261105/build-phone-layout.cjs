/* Read-only import of the current mini-program layout into the isolated phone. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=__dirname,app=path.resolve(dir,'../../小程序/量子星橙-开工包/06-实现/miniapp');
const sources=['styles/uv-kit.wxss','app.wxss','pages/today/index.wxss','custom-tab-bar/index.wxss'];
function dimensions(s){return s.replace(/(-?\d*\.?\d+)rpx\b/g,(_,n)=>`calc(var(--rpx) * ${n})`).replace(/env\(safe-area-inset-bottom\)/g,'var(--safe-bottom)').replace(/env\(safe-area-inset-top\)/g,'var(--status-height)').replace(/(-?\d*\.?\d+)vh\b/g,(_,n)=>`calc(var(--screen-height) * ${+n/100})`);}
function scope(css,insideKeyframes=false){
 css=css.replace(/\/\*[\s\S]*?\*\//g,'').replace(/@import[^;]+;/g,'');let out='',at=0;
 while(at<css.length){const open=css.indexOf('{',at);if(open<0)break;const selector=css.slice(at,open).trim();let depth=1,end=open+1;for(;end<css.length&&depth;end++){if(css[end]==='{')depth++;else if(css[end]==='}')depth--;}
 const body=css.slice(open+1,end-1);at=end;
 if(selector.startsWith('@')){out+=selector+'{'+(/@(?:media|supports)/.test(selector)?scope(body):dimensions(body))+'}\n';continue;}
 const selectors=selector.split(',').map(s=>{s=s.trim().replace(/(?<![\w.-])scroll-view(?![\w-])/g,'.mini-scroll').replace(/(?<![\w.-])view(?![\w-])/g,'div').replace(/(?<![\w.-])text(?![\w-])/g,'span').replace(/(?<![\w.-])image(?![\w-])/g,'img');return /^page(?=$|[: .#])/.test(s)?s.replace(/^page/,'.mini-screen'):'.mini-screen '+s;}).join(',');out+=selectors+'{'+dimensions(body)+'}\n';
 }return out;
}
const generated=sources.map(f=>'/* '+f+' */\n'+scope(fs.readFileSync(path.join(app,f),'utf8'))).join('\n');
const assets=path.join(dir,'ui-assets');fs.mkdirSync(assets,{recursive:true});
for(const name of ['logo-q.png','ic-clock.png','tab-today.png','tab-today-on.png','tab-practice.png','tab-practice-on.png','tab-wrong.png','tab-wrong-on.png','tab-me.png','tab-me-on.png'])fs.copyFileSync(path.join(app,'assets/icons',name),path.join(assets,name));
const fontJS=fs.readFileSync(path.join(app,'assets/fonts/local-font.js'),'utf8'),base64=fontJS.match(/data:font\/ttf;base64,([^']+)/)[1];fs.writeFileSync(path.join(assets,'display.ttf'),Buffer.from(base64,'base64'));
fs.writeFileSync(path.join(dir,'phone-native.css'),'@font-face{font-family:"ZCOOL KuaiLe Local";src:url("ui-assets/display.ttf") format("truetype");font-display:swap}\n'+generated);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.writeFileSync(path.join(dir,'phone-layout-sources.json'),JSON.stringify({status:'read-only source import',sources:Object.fromEntries(sources.concat(['assets/fonts/local-font.js']).map(f=>[f,hash(fs.readFileSync(path.join(app,f)))])),rpx:'device CSS width / 750',presets:[{width:390,height:844,status:47,safeBottom:34},{width:375,height:667,status:20,safeBottom:0},{width:320,height:740,status:24,safeBottom:24}]},null,2));
