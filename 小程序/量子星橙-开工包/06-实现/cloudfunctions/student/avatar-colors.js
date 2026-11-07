'use strict'
// Shared color contract. Build copies this factory into native and function packages.
module.exports = function createAvatarColors(catalog) {
  const shapes=catalog.shapes.map(s=>s.id),colors=catalog.colors.map(c=>c.id)
  const aliases=catalog.legacyShapeAliases,own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k)
  const object=value=>value&&typeof value==='object'&&!Array.isArray(value)
  const shape=id=>typeof id==='string'?(shapes.includes(id)?id:own(aliases,id)?aliases[id]:''):''
  const validColor=value=>colors.includes(value)
  function normalize(profile={}) {
    const stored=object(profile.avatarColors)?profile.avatarColors:{},result={},explicit=new Set()
    for(const id of shapes){result[id]='xingcheng';if(own(stored,id)&&validColor(stored[id])){result[id]=stored[id];explicit.add(id)}}
    for(const [old,id] of Object.entries(aliases))if(!explicit.has(id)&&own(stored,old)&&validColor(stored[old])){result[id]=stored[old];explicit.add(id)}
    // Legacy accounts only ever saved their current avatar's color.
    const current=shape(profile.avatarShape)||catalog.defaultShape
    if(!explicit.has(current)&&validColor(profile.avatarColor))result[current]=profile.avatarColor
    return result
  }
  function colorFor(profile,id) { const canonical=shape(id);return canonical?normalize(profile)[canonical]:'xingcheng' }
  function parsePatch(value) {
    if(value===undefined)return {}
    if(!object(value))return null
    const result={}
    for(const [key,color] of Object.entries(value)){
      const id=shape(key)
      if(!id||!validColor(color)||(own(result,id)&&result[id]!==color))return null
      result[id]=color
    }
    return result
  }
  return {normalize,colorFor,parsePatch,validColor}
}
