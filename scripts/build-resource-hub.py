"""Bundle unchanged miniapp mascot modules for the static experience hub."""
from pathlib import Path
import hashlib,json,re,shutil,sys
ROOT=Path(__file__).resolve().parent.parent
MINI=ROOT/'小程序/量子星橙-开工包/06-实现/miniapp'
PORTAL=ROOT/'portal';PORTAL.mkdir(exist_ok=True)
entries={'catalog':'utils/avatar-catalog.js','avatar':'utils/avatar.js','createAppearance':'components/home-companions/appearance.js','behavior':'components/home-companions/behavior.js'}
modules={}
def collect(key):
 if key in modules:return
 file=MINI/key;s=file.read_text();modules[key]=s
 for dep in re.findall(r"require\(['\"]([^'\"]+)['\"]\)",s):
  if not dep.startswith('.'):raise ValueError('External dependency: '+dep)
  import posixpath
  target=posixpath.normpath(posixpath.join(posixpath.dirname(key),dep))
  if not Path(target).suffix:target+='.js'
  collect(target)
for key in entries.values():collect(key)
script='/* Browser adapter; bundled modules below are unchanged miniapp sources. */\n(function(G){\nconst modules={\n'+',\n'.join(json.dumps(k)+':function(module,exports,require){\n'+v+'\n}' for k,v in modules.items())+'\n};\n'
script+='''const cache={};function load(id){if(cache[id])return cache[id].exports;const m={exports:{}};cache[id]=m;if(!modules[id])throw Error('Missing mascot module '+id);modules[id](m,m.exports,dep=>{const parts=id.split('/');parts.pop();for(const bit of dep.split('/')){if(bit==='..')parts.pop();else if(bit!=='.')parts.push(bit)}let key=parts.join('/');if(!/\\.[a-z]+$/.test(key))key+='.js';return load(key)});return m.exports;}
'''
script+='G.QHub={'+','.join(k+':load('+json.dumps(v)+')' for k,v in entries.items())+'};\n})(globalThis);\n'
(PORTAL/'runtime.js').write_text(script)
references=[]
for p in sorted((ROOT/'品牌资源/星橙Q/参考样张').glob('*.png')):
 references.append({'name':p.stem[3:],'path':str(p.relative_to(ROOT))})
(PORTAL/'catalogue.js').write_text('globalThis.QHubReferences='+json.dumps(references,ensure_ascii=False)+';\n')
(PORTAL/'runtime-sources.json').write_text(json.dumps({k:hashlib.sha256(v.encode()).hexdigest() for k,v in modules.items()},indent=2)+'\n')
print('Bundled',len(modules),'unchanged mascot modules')
if '--site' in sys.argv:
 out=ROOT/'_site'
 if out.exists():shutil.rmtree(out)
 out.mkdir()
 for rel in ['index.html','portal','品牌资源/星橙Q','previews/星橙Q-三组交互样张-20261105/ui-assets/display.ttf']:
  source=ROOT/rel;target=out/rel;target.parent.mkdir(parents=True,exist_ok=True)
  if source.is_dir():shutil.copytree(source,target,ignore=shutil.ignore_patterns('.DS_Store'))
  else:shutil.copy2(source,target)
 (out/'.nojekyll').touch()
 print('Static site ready:',out)
