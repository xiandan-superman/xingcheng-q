/* Read accepted native avatar modules without writing back to their sources. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const native=path.resolve(__dirname,'../../小程序/量子星橙-开工包/06-实现/miniapp/utils');
const files=['avatar-catalog.js','avatar.js','avatar-colors.js'],hashes=Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(native,f))).digest('hex')]));
const catalog=require(path.join(native,'avatar-catalog.js')),source=fs.readFileSync(path.join(native,'avatar.js'),'utf8');
if(catalog.shapes.length!==11||catalog.colors.length!==13)throw Error('Accepted avatar catalog is incomplete');
const colorSource=fs.readFileSync(path.join(native,'avatar-colors.js'),'utf8');
const output='/* Generated from accepted native avatar modules. Run sync-companion-assets.cjs. */\n(function(G){\nconst catalog='+JSON.stringify(catalog)+';\nconst coloration={exports:{}};\n(function(module){\n'+colorSource+'\n})(coloration);\nconst module={exports:{}};\n(function(module,require){\n'+source+'\n})(module,id=>{if(id==="./avatar-catalog")return catalog;if(id==="./avatar-colors")return coloration.exports;throw Error("Unexpected avatar dependency");});\nG.QCompanionAssets={catalog,avatar:module.exports,sourceHashes:'+JSON.stringify(hashes)+'};\n})(globalThis);\n';
const target=path.join(__dirname,'companion-assets.js');
if(process.argv.includes('--check')){if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==output)throw Error('Preview avatar source is stale');}else fs.writeFileSync(target,output);
console.log('Accepted native artwork synchronized: 11 shapes, 13 palettes, cream A.');
