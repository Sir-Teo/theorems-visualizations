// Freeze the actual graph/data/helper bytes served by each explicit correctness run.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {mapRetainedPrototype} from './map-retained-prototype.mjs';
export async function retainedFixture(){
 const files=new Map(),hashes={};
 for(const path of ['data/index.json','data/planned.json',...['graph','viz/core','map-scene-retained','map-webgl-scene','map-scene-model','map-scene-edges','map-scene-gl','map-scene-text','map-scene-painter','map-scene-decorations','map-scene-worker'].map(n=>'assets/js/'+n+'.js')]){
  const body=await readFile(new URL('../../'+path,import.meta.url));files.set(path,body);hashes[path]=createHash('sha256').update(body).digest('hex');
 }
 for(const path of ['map-retained-fixture','map-retained-prototype','map-scene-prototype'])hashes['scripts/lib/'+path+'.mjs']=createHash('sha256').update(await readFile(new URL('./'+path+'.mjs',import.meta.url))).digest('hex');
 const source=mapRetainedPrototype(files.get('assets/js/graph.js').toString());
 return{source,hashes,async route(page){for(const [path,body]of files)await page.route('**/'+path,r=>r.fulfill({body:path==='assets/js/graph.js'?source:body,contentType:path.endsWith('.json')?'application/json':'application/javascript'}));}};
}
