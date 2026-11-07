'use strict'
// Isolated native acceptance project. Production avatar/page/component files are copied verbatim.
// Its service is local in-memory data and it has no CloudBase initialization or cloud transport.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto')
const root=path.resolve(__dirname,'..'),source=path.join(root,'miniapp'),out=path.join(root,'output/avatar-acceptance/simulator')
const {memoryCloud}=require('../tests/helpers/memory-cloud.cjs'),identity=require('../cloudfunctions/student/identity')
const catalog=require('../miniapp/utils/avatar-catalog')
const write=(name,content)=>{const p=path.join(out,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,Buffer.isBuffer(content)||typeof content==='string'?content:JSON.stringify(content,null,2)+'\n')}
async function main(){
 const previousFile=path.join(out,'production-source-hashes.json'),previous=fs.existsSync(previousFile)?JSON.parse(fs.readFileSync(previousFile,'utf8')):{}
 const copied={}
 function copy(name){
  if(name==='services/student.js')return // Local fixture service is supplied below, never the cloud transport.
  if(copied[name])return
  const file=path.join(source,name)
  if(fs.statSync(file).isDirectory()){for(const child of fs.readdirSync(file))if(child!=='.DS_Store')copy(name+'/'+child);return}
  const bytes=fs.readFileSync(file);write(name,bytes);copied[name]=crypto.createHash('sha256').update(bytes).digest('hex')
  if(name.endsWith('.js'))for(const match of bytes.toString().replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'').matchAll(/require\(['"](\.[^'"]+)['"]\)/g)){let target=path.posix.normalize(path.posix.join(path.posix.dirname(name),match[1]));if(!path.extname(target))target+='.js';copy(target)}
  if(name.endsWith('.json'))for(const target of Object.values((JSON.parse(bytes).usingComponents)||{})){
    if(!target.startsWith('/'))continue
    copy(target.slice(1).replace(/\/index$/,''))
  }
  if(name.endsWith('.wxss'))for(const match of bytes.toString().matchAll(/@import\s+["']([^"']+)["']/g))copy(path.posix.normalize(path.posix.join(path.posix.dirname(name),match[1])))
 }
 for(const name of ['account/wardrobe','components/personal-avatar','components/reward-dialog','components/xingcheng-q-scene','components/xingcheng-q-motion','utils/avatar.js','utils/nav-layout.js','app.wxss','styles/uv-kit.wxss','assets/fonts/local-font.js'])copy(name)
 for(const name of ['pages/today','pages/me','account/companions','custom-tab-bar','assets/icons','assets/xingcheng-q/static'])copy(name)
 for(const file of fs.readdirSync(path.join(source,'assets/xingcheng-q/formal')))if(file.endsWith('.png'))copy('assets/xingcheng-q/formal/'+file)
 const icon='assets/icons/ic-back.png';fs.mkdirSync(path.dirname(path.join(out,icon)),{recursive:true});fs.copyFileSync(path.join(source,icon),path.join(out,icon))
 const oldIDs=['cercle','galet','squircle','capsule','triangle','hexagone','nuage','goutte'],oldDate=new Date('2026-10-01T00:00:00Z')
 const db=memoryCloud({users:{local:{_id:'local',avatarShape:'cercle',avatarColor:'creme',loginDays:14,lastLoginDate:'2026-11-05',avatarGrants:Object.fromEntries(oldIDs.map(id=>[id,{unlockedAt:oldDate,seenAt:oldDate,reason:'existing'}]))}},config:{global:{}},attempts:Object.fromEntries(Array.from({length:60},(_,i)=>['a'+i,{userId:'local',questionId:'q'+i}]))})
 const features=require('../cloudfunctions/student/profile-features')({db,cloud:{},getDoc:async(c,id)=>(await c.doc(id).get()).data,runTransaction:fn=>db.runTransaction(fn),allUserRows:async()=>({data:Object.values(db.snapshot().attempts)}),now:()=>new Date('2026-11-05T03:00:00Z'),fail:(code,message)=>{throw Object.assign(Error(message),{code})},ok:data=>({data})})
 const fixture=(await features.growthGet({openid:'local'})).data
 write('services/fixture.js','module.exports = '+JSON.stringify(fixture)+'\n')
 const obsoleteFixture=path.join(out,'services/fixture.json');if(fs.existsSync(obsoleteFixture))fs.unlinkSync(obsoleteFixture)
 write('services/student.js',`const fixture=require('./fixture'),avatar=require('../utils/avatar'),calls=[]
module.exports={calls,growthGet:async()=>JSON.parse(JSON.stringify(fixture)),avatarSave:async value=>{calls.push({action:'avatarSave',...value});const shape=avatar.normalizeShape(value.shape),avatarColors={...avatar.normalizeColors(fixture.profile),...value.avatarColors,[shape]:value.color};fixture.profile={...fixture.profile,avatarShape:shape,avatarColor:value.color,avatarColors};return JSON.parse(JSON.stringify(fixture.profile))},rewardSeen:async shapes=>{calls.push({action:'rewardSeen',shapes});fixture.cards.forEach(c=>{if(shapes.includes(c.shape))c.isNew=false})},resetRewards(){fixture.cards.forEach(c=>{c.isNew=['tip','crescent','heart'].includes(c.shape)})}}
`)
 fs.appendFileSync(path.join(out,'services/student.js'),`
const clone=value=>JSON.parse(JSON.stringify(value))
const boot={user:{selectedSubjectIds:['mse']},subjects:[{id:'mse',name:'材料科学基础'}],subjectStatusBySubject:{mse:'ready'},needsDeepestBySubject:{mse:false},l1BySubject:{mse:[{id:'c3',order:3,name:'第三章',publishedCount:9,hasPublished:true,selectable:true}]},deepestL1OrderBySubject:{mse:3},deepestL1IdBySubject:{mse:'c3'}}
module.exports.bootstrap=module.exports.getVoyage=async()=>clone(boot)
module.exports.getWrongBadge=async()=>({hasWrong:false})
module.exports.profileGet=async()=>clone(fixture.profile)
module.exports.getMeBundle=async()=>({profile:{user:{...clone(fixture.profile),nickname:'本地验收',selectedSubjectIds:['mse'],reminderHm:'20:30'}},all:{total:60,correct:40,accuracy:67,durationMs:3600000,weakPoints:[]},week:{total:0,accuracy:0,trend:[]},checkins:{streak:7,total:18}})
module.exports.getTodayBundle=async()=>({daily:{state:'ready',question:{_id:'local-q',id:'local-q',type:'short',subjectId:'mse',stemPlain:'为什么相同成分的材料，性能仍会不同？从组织结构与加工过程出发，试着解释它们之间的联系。'}},calendar:{dates:[],streak:7,total:18,makeupBalance:2}})
module.exports.homeCompanionsSave=async shapes=>{fixture.profile.homeCompanionShapes=[...shapes];calls.push({action:'homeCompanionsSave',shapes});return {homeCompanionShapes:[...shapes]}}
module.exports.setHomeScenario=()=>{fixture.profile={...fixture.profile,avatarShape:'round',avatarColor:'bleu',avatarColors:{...avatar.normalizeColors(fixture.profile),round:'bleu',capsule:'creme',heart:'rose',cloud:'vert',crescent:'violet'},homeCompanionShapes:['round','capsule','heart','cloud','crescent']};fixture.cards.forEach(c=>{c.unlocked=true;c.shape=c.shape||c.key.replace('reward-','');c.isNew=false});return clone(fixture)}
`)
 write('app.js',"const font=require('./assets/fonts/local-font');App({globalData:{reduceMotion:false,statusBarHeight:47},onLaunch(){wx.loadFontFace({family:'ZCOOL KuaiLe Local',source:'url(\\\"'+font+'\\\")',global:true,scopes:['webview','native']});require('./services/answer-draft').bind('local-acceptance');this.avatarQA=require('./services/student');console.info('LOCAL AVATAR ACCEPTANCE: cloud transport disabled')}})\n")
 const nativeConfig=JSON.parse(fs.readFileSync(path.join(source,'app.json'),'utf8'))
 write('app.json',{pages:['pages/review/index','account/wardrobe/index','account/companions/index','pages/today/index','pages/practice/index','pages/wrong/index','pages/me/index'],window:{navigationStyle:'custom',backgroundColor:'#fffdf4'},tabBar:nativeConfig.tabBar,style:'v2',sitemapLocation:'sitemap.json'})
 for(const name of ['practice','wrong']){
  write('pages/'+name+'/index.js','Page({})\n');write('pages/'+name+'/index.json',{})
  write('pages/'+name+'/index.wxml','<view style="padding:140rpx 36rpx">本地验收 · 用于切回首页验证动画续播</view>')
 }
 write('sitemap.json',{rules:[{action:'disallow',page:'*'}]})
 const config=JSON.parse(fs.readFileSync(path.join(source,'project.config.json'),'utf8'))
 write('project.config.json',{appid:config.appid,projectname:'星橙Q头像本地验收',compileType:'miniprogram',miniprogramRoot:'./',libVersion:config.libVersion,setting:{es6:true,enhance:true,urlCheck:false}})
 write('pages/review/index.json',{usingComponents:{'personal-avatar':'/components/personal-avatar/index','reward-dialog':'/components/reward-dialog/index'}})
 write('pages/review/index.js',`const avatar=require('../../utils/avatar'),api=require('../../services/student')
Page({data:{shapes:${JSON.stringify(catalog.shapes.map(s=>({id:s.id,name:s.name})))},profile:{},showRewards:false,calls:[]},async onShow(){const profile=(await api.growthGet()).profile;this.setData({profile,calls:api.calls,shapes:this.data.shapes.map(s=>({...s,savedColor:avatar.colorFor(profile,s.id),colorName:avatar.colors.find(c=>c.id===avatar.colorFor(profile,s.id)).name}))})},wardrobe(){wx.navigateTo({url:'/account/wardrobe/index'})},rewards(){api.resetRewards();this.setData({showRewards:true})},updated(e){this.setData({profile:{...this.data.profile,avatarShape:e.detail.shape,avatarColor:e.detail.color,avatarColors:e.detail.avatarColors||this.data.profile.avatarColors}})}})
`)
 write('pages/review/index.wxml',`<view class="review"><view class="review-title">各形状独立配色 · 本地验收</view><view class="review-note">11种形状 / 13套配色 / 10档奖励</view><view class="review-current"><personal-avatar shape="{{profile.avatarShape}}" color="{{profile.avatarColor}}" size="128"/><view>当前个人头像</view></view><button class="btn btn-orange" id="open-wardrobe" bindtap="wardrobe">进入形象选择</button><button id="open-rewards" bindtap="rewards">查看新增奖励补发</button><view class="review-note">每个形状使用自己已保存的配色</view><view wx:for="{{shapes}}" wx:key="id" class="review-row"><text>{{item.name}}</text><personal-avatar shape="{{item.id}}" color="{{item.savedColor}}" size="64"/><text>{{item.colorName}}</text></view><reward-dialog id="acceptance-reward" enabled="{{showRewards}}" bind:avatarupdated="updated"/></view>`)
 write('pages/review/index.wxss','.review{padding:110rpx 36rpx 70rpx}.review-title{font-size:42rpx;font-weight:800}.review-note{font-size:23rpx;color:#746858;margin:20rpx 0}.review-current{display:flex;align-items:center;gap:24rpx}.review-row{display:flex;gap:32rpx;align-items:center;min-height:92rpx;border-bottom:1rpx solid #e7dfd1}.review-row>text{width:100rpx;font-size:25rpx}.review button{margin:18rpx 0;font-size:28rpx}')
 for(const name of Object.keys(previous))if(!copied[name]&&name!=='services/student.js'){const file=path.resolve(out,name);if(file.startsWith(out+path.sep)&&fs.existsSync(file)&&fs.statSync(file).isFile())fs.unlinkSync(file)}
 write('production-source-hashes.json',copied)
 fs.writeFileSync(path.join(out,'../migration-fixture.json'),JSON.stringify({rules:identity.DEFAULT_RULES,profile:fixture.profile,cards:fixture.cards,grants:db.snapshot().users.local.avatarGrants},null,2)+'\n')
 console.log('Isolated native project ready: 11 production avatars; 3 newly qualified rewards; no cloud service.')
}
main().catch(error=>{console.error(error);process.exitCode=1})
