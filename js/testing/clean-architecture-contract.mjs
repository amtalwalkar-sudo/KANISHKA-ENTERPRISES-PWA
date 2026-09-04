import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {join,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';

// Targeted architecture gate. It checks dependency direction and direct persistence access,
// not naming/style. A component named Wrapper/Adapter/Bridge is not rejected by name alone.
const root=fileURLToPath(new URL('../../',import.meta.url));
const sourceRoots=['src','js'];
const files=[];

async function walk(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    if(['node_modules','.git','dist'].includes(entry.name)) continue;
    const path=join(dir,entry.name);
    if(entry.isDirectory()) await walk(path);
    else if(['.js','.mjs','.vue'].includes(extname(entry.name))) files.push(path);
  }
}
for(const dir of sourceRoots) await walk(join(root,dir));

const rel=p=>relative(root,p).replaceAll('\\','/');
const layerOf=p=>{
  const r=rel(p);
  if(r.startsWith('src/')) return 'presentation';
  if(r.startsWith('js/domain/')) return 'domain';
  if(r.startsWith('js/application/')) return 'application';
  if(r.startsWith('js/infrastructure/')) return 'infrastructure';
  if(r.startsWith('js/repository/')) return 'repository';
  if(r.startsWith('js/services/')) return 'service';
  return 'other';
};

const forbidden={
  presentation:[
    /(?:from|import)\\s*["'][^"']*(?:\\/domain\\/|\\/repository\\/|\\/infrastructure\\/)/,
    /\\b(?:indexedDB|IDBDatabase|openDatabase|localStorage|sessionStorage)\\b/,
    /(?:from|import)\\s*["'][^"']*js\\/application\\/[^"']*(?:repository|persistence)[^"']*["']/i
  ],
  domain:[/(?:from|import)\\s*["'][^"']*(?:\\/application\\/|\\/infrastructure\\/|\\/repository\\/)[^"']*["']/],
  repository:[/(?:from|import)\\s*["'][^"']*src\\/[^"']*["']/],
  infrastructure:[/(?:from|import)\\s*["'][^"']*src\\/[^"']*["']/]
};

const violations=[];
for(const path of files){
  const layer=layerOf(path);
  const source=await readFile(path,'utf8');
  for(const pattern of forbidden[layer]||[]){
    if(pattern.test(source)) violations.push(`${rel(path)}: forbidden dependency/access pattern`);
  }
}

// Explicitly reject only bridge/adapter/wrapper constructs when they are used as dependency
// shortcuts in production source. Names alone are intentionally allowed to avoid false positives.
for(const path of files){
  const source=await readFile(path,'utf8');
  const shortcut=/import\\s+.*\\b(?:bridge|adapter|wrapper)\\b.*from\\s*["'][^"']+["']/i.test(source)
    || /\\b(?:bridge|adapter|wrapper)\\b\\s*[:=].*\\b(?:repository|persistence|domain|application)\\b/i.test(source);
  if(shortcut) violations.push(`${rel(path)}: bridge/adapter/wrapper used as an architectural shortcut`);
}

assert.deepEqual(violations,[],`CLEAN_ARCHITECTURE=FAIL\\n${violations.join('\\n')}`);
console.log(`CLEAN_ARCHITECTURE=PASS (${files.length} source files checked)`);
