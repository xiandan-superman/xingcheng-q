/* Local display preferences; reward conditions stay native. */
(function(G){
'use strict';
const V=G.QCompanionAppearance,MAX=5;
const unique=ids=>[...new Set((Array.isArray(ids)?ids:[]).map(V.normalize).filter(Boolean))];
class Collection{
 constructor({owned=['round','blob','tip'],selected,profile={}}={}){this.owned=unique(['round',...owned]);const avatarShape=V.normalize(profile.avatarShape)||'round',avatarColors=G.QCompanionAssets.avatar.normalizeColors({...profile,avatarShape});this.profile={avatarShape,avatarColor:avatarColors[avatarShape],avatarColors};this.selected=this.clean(selected===undefined?this.owned:selected);V.setProfile(this.profile);}
 clean(ids){return unique(['round',...unique(ids)]).filter(id=>this.owned.includes(id)).slice(0,MAX);}
 choose(ids){const wanted=unique(['round',...ids]);if(wanted.length>MAX)return {ok:false,message:'首页最多展示5只，请先取消一位伙伴。'};if(wanted.some(id=>!this.owned.includes(id)))return {ok:false,message:'获得这位伙伴后，就可以选择它。'};this.selected=this.clean(wanted);return {ok:true};}
 unlock(id){id=V.normalize(id);if(!id||this.owned.includes(id))return {added:false,display:false};this.owned.push(id);const display=this.selected.length<MAX;if(display)this.selected.push(id);return {added:true,display};}
 savedProfile(profile){const avatarShape=V.normalize(profile.avatarShape||this.profile.avatarShape)||'round';let avatarColors={...this.profile.avatarColors};if(profile.avatarColors)avatarColors=G.QCompanionAssets.avatar.normalizeColors({...this.profile,...profile,avatarShape,avatarColors:{...avatarColors,...profile.avatarColors}});if(V.catalog.colors.some(c=>c.id===profile.avatarColor)&&(!profile.avatarColors||!Object.prototype.hasOwnProperty.call(profile.avatarColors,avatarShape)))avatarColors[avatarShape]=profile.avatarColor;this.profile={avatarShape,avatarColor:avatarColors[avatarShape],avatarColors};V.setProfile(this.profile);}
 snapshot(){return {owned:[...this.owned],selected:[...this.selected],profile:{...this.profile,avatarColors:{...this.profile.avatarColors}},max:MAX};}
}
G.QHomeCompanions={Collection,MAX,unique};
})(globalThis);
