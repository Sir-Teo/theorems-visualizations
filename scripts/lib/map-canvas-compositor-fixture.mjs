// Freeze actual source/helper/data bytes for every isolated correctness process.
import {readFile}from'node:fs/promises';import{createHash}from'node:crypto';import{pathToFileURL}from'node:url';import{mapCanvasCompositorPrototype}from'./map-canvas-compositor-prototype.mjs';
export async function compositorFixture(){
 const root=process.env.MAP_COMPOSITOR_ROOT?pathToFileURL(process.env.MAP_COMPOSITOR_ROOT+'/'):new URL('../../',import.meta.url),files=new Map(),hashes={};
 const add=async(path,url)=>{const b=await readFile(url);files.set(path,b);hashes[path]=createHash('sha256').update(b).digest('hex');};
 for(const path of['data/index.json','data/planned.json','assets/js/graph.js'])await add(path,new URL(path,root));
 for(const name of['runtime','prototype','fixture'])await add(`scripts/lib/map-canvas-compositor-${name}.mjs`,new URL(`./map-canvas-compositor-${name}.mjs`,import.meta.url));
 await add('tests/map-canvas-compositor-native.mjs',new URL('../../tests/map-canvas-compositor-native.mjs',import.meta.url));
 const source=mapCanvasCompositorPrototype(files.get('assets/js/graph.js').toString());
 return{root,hashes,async route(page){for(const[path,body]of files)await page.route('**/'+path,r=>r.fulfill({body:path==='assets/js/graph.js'?source:body,contentType:path.endsWith('.json')?'application/json':'application/javascript'}));}};
}
