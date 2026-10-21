// New private closed fixture; the accepted current fixture and all source inputs stay intact.
import fs from'node:fs/promises';import path from'node:path';import{createHash}from'node:crypto';import{fileURLToPath,pathToFileURL}from'node:url';
export const sha=b=>createHash('sha256').update(b).digest('hex');
export const manifestSHA256='2e6d1aa8c6d113350f9a5db8e5a07f26470e1741cc259c9e1dbf0a4f780713fb';
const ownRoot=fileURLToPath(new URL('../../',import.meta.url)),require=(yes,why)=>{if(!yes)throw Error('curve current fixture: '+why);};
export async function curveCurrentFixture({sourceRoot=ownRoot}={}){
 const bytes=await fs.readFile(new URL('../../tests/map-curve-current-manifest.json',import.meta.url));require(sha(bytes)===manifestSHA256,'manifest hash');const curvePins=JSON.parse(bytes),checked=new Map();
 for(const[q,pin]of Object.entries(curvePins.sourceFiles)){const p=path.join(sourceRoot,q),st=await fs.lstat(p);require(st.isFile()&&!st.isSymbolicLink(),'regular source '+q);const b=await fs.readFile(p);require(b.length===pin.bytes&&sha(b)===pin.sha256,'source bytes '+q);checked.set(q,b);}
 const load=q=>import(pathToFileURL(path.join(sourceRoot,q)).href),{currentAtlasFixture}=await load('scripts/lib/map-current-atlas-fixture.mjs'),base=await currentAtlasFixture({sourceRoot}),{curveCurrentSources}=await load('scripts/lib/map-curve-current-sources.mjs');
 const transformed=curveCurrentSources(base),variants={};
 for(const v of ['original','chunk']){const served=new Map(base.variants[v]);for(const q of curvePins.browserFiles)served.set(q,checked.get(q));served.set('scripts/lib/map-paired-resource-observer.mjs',Buffer.from(transformed.observer));if(v==='chunk'){served.set('assets/js/map-scene-edges.js',Buffer.from(transformed.edges));served.set('assets/js/map-webgl-scene.js',Buffer.from(transformed.scene));}variants[v]=served;}
 const privateHashes=Object.fromEntries(Object.entries(variants).map(([v,m])=>[v,Object.fromEntries([...m].map(([q,b])=>[q,{bytes:b.length,sha256:sha(b)}]))]));
 const sourceTransforms=transformed.edits.map(e=>({...e,beforeSHA256:sha(e.before),afterSHA256:sha(e.after)}));
 return{...base,curvePins,curveSupport:checked,sourceTransforms,variants,servedHashes:structuredClone(privateHashes),resolve(v,url){require(Object.hasOwn(variants,v),'variant');require(typeof url==='string'&&url.startsWith('/')&&!url.includes('?')&&!url.includes('#'),'request path');const q=url==='/'?'index.html':url.slice(1);require(path.posix.normalize(q)===q&&variants[v].has(q),'unpinned path');const b=variants[v].get(q),pin=privateHashes[v][q];require(pin&&b.length===pin.bytes&&sha(b)===pin.sha256,'served bytes changed '+q);return Buffer.from(b);}};
}
