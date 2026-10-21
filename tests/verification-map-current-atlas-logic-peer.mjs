// Independent fixture/resolver/catalog and real-catalog guard review. No browser.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const [root,out]=process.argv.slice(2);assert.ok(root&&out);await fs.mkdir(out,{recursive:true});assert.deepEqual(await fs.readdir(out),[]);
const sha=b=>createHash('sha256').update(b).digest('hex');
const {currentAtlasFixture}=await import(pathToFileURL(path.join(root,'scripts/lib/map-current-atlas-fixture.mjs')));
const f=await currentAtlasFixture(),data=JSON.parse(await fs.readFile('/tmp/atlas-continuation/checkpoint12/data/index.json')),planned=JSON.parse(await fs.readFile('/tmp/atlas-continuation/checkpoint12/data/planned.json'));
const nodes=data.items.concat(data.collections.flatMap(c=>(planned.cols[c.id]||[]).map(t=>({id:c.id+'-'+t[0],deps:t[4]})))),byId=new Map(nodes.map(n=>[n.id,n]));
const deps=n=>n.deps.concat(n.pdeps||[]),edges=[];for(const n of nodes)for(const d of deps(n))if(byId.has(d))edges.push([d,n.id]);
const child=new Map(nodes.map(n=>[n.id,[]]));for(const[a,b]of edges)child.get(a).push(b);
function reach(next){const seen=new Set(),queue=['ladr-2.30'];for(let i=0;i<queue.length;i++)for(const id of next(queue[i]))if(byId.has(id)&&!seen.has(id)){seen.add(id);queue.push(id);}return seen;}
const anc=reach(id=>deps(byId.get(id))),desc=reach(id=>child.get(id)),pdeps=data.items.reduce((s,n)=>s+(n.pdeps||[]).filter(id=>byId.has(id)).length,0);
assert.equal(nodes.length,13574);assert.equal(edges.length,23955);assert.equal(pdeps,540);assert.equal(anc.size,10);assert.equal(desc.size,3442);assert.equal(byId.get('ladr-2.30').desc,1163);
assert.equal(sha(JSON.stringify(edges)),'4cef46000f0ee8e1599ab50ce9aa949b0db37ba606322844ce67c1873a129b85');assert.equal(sha(JSON.stringify([...desc].sort())),'efdbcc2017574190445a6d514c8c255075c9806d6c84f98956600a8d3f7ea8b0');
assert.deepEqual([...f.closure.anc].sort(),[...anc].sort());assert.deepEqual([...f.closure.desc].sort(),[...desc].sort());
let resolved=0;for(const variant of ['original','chunk'])for(const[q,b]of f.variants[variant]){const got=f.resolve(variant,'/'+q);assert.deepEqual(got,b);assert.notEqual(got,b);resolved++;}
const copy=f.resolve('original','/');copy[0]^=1;assert.notDeepEqual(copy,f.resolve('original','/'));
const saved=f.variants.original.get('index.html'),bad=Buffer.from('forged');f.servedHashes.original['index.html']={bytes:bad.length,sha256:sha(bad)};f.variants.original.set('index.html',bad);assert.throws(()=>f.resolve('original','/'),/served bytes changed/);f.variants.original.set('index.html',saved);
f.variants.original.set('injected',bad);assert.throws(()=>f.resolve('original','/injected'),/served bytes changed/);
for(const p of ['/assets//js/app.js','/assets/js/../js/app.js','/data/index.json#x','/data/index.json?x','/%2e%2e/index.html','//index.html','/index.html/','relative'])assert.throws(()=>f.resolve('original',p));
const supportImports=[];for(const[q,b]of f.support)for(const m of b.toString().split('\n').filter(line=>line.startsWith('import')).join('\n').matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)){const spec=m[1];if(spec.startsWith('node:'))continue;if(!spec.startsWith('.'))continue;const target=path.posix.normalize(path.posix.join(path.posix.dirname(q),spec));assert.ok(f.support.has(target),'support import not pinned '+target);supportImports.push([q,target]);}
const faults={
 'field-value':"model.G.map.fields[0].x0++;",
 'row-value':"model.G.map.rows[0].label+='changed';",
 'field-identity':"model.G.map.fields[0]={...model.G.map.fields[0]};",
 'row-array-identity':"model.G.map.rows=[...model.G.map.rows];",
 'ancestor-content':"model.scene.map.closures.get('ladr-2.30').anc.add('bogus');",
 'ancestor-order':"{const a=model.scene.map.closures.get('ladr-2.30').anc;const first=a.values().next().value;a.delete(first);a.add(first);}",
 'callback-row-identity':"globalThis.__pairedCallbacks.events[0]=structuredClone(globalThis.__pairedCallbacks.events[0]);",
 'network-row-identity':"globalThis.__pairedCallbacks.network[0]=structuredClone(globalThis.__pairedCallbacks.network[0]);",
 'range-content':"model.scene.models.values().next().value.ranges[0].segments++;"
};
let modelSource=await fs.readFile(path.join(root,'tests/map-current-atlas-model.mjs'),'utf8');
modelSource=modelSource.replace("from '../scripts/lib/map-current-atlas-fixture.mjs'",'from '+JSON.stringify(pathToFileURL(path.join(root,'scripts/lib/map-current-atlas-fixture.mjs')).href)).replace("root=new URL('../',import.meta.url)",'root=new URL('+JSON.stringify(pathToFileURL(root+'/').href)+')');
modelSource=modelSource.replace("['none','desc-mutation','closure-content','closure-replacement','extra-metadata','callback-prefix','network-prefix','owner-replacement']",JSON.stringify(['none',...Object.keys(faults)]));
modelSource=modelSource.replace("if(fault==='desc-mutation')",Object.entries(faults).map(([key,code])=>'if(fault==='+JSON.stringify(key)+'){'+code+'}').join('')+"if(fault==='desc-mutation')");
modelSource=modelSource.replace("assert.match(r.failure,expected[r.fault]",'assert.match(r.failure,/selected shard invariant/');
const probe=path.join(out,'independent-model.mjs');await fs.writeFile(probe,modelSource);const model=spawnSync(process.execPath,[...process.execArgv,probe],{env:{...process.env,MAP_CURRENT_MODEL_OUTPUT:path.join(out,'model')},encoding:'utf8'});await fs.writeFile(path.join(out,'model-process.json'),JSON.stringify({status:model.status,stdout:model.stdout,stderr:model.stderr},null,2));
const cli=[];for(const script of ['source','tiny','model','prepare']){const r=spawnSync(process.execPath,[...process.execArgv,path.join(root,'tests/map-current-atlas-'+script+'.mjs'),'--root-authorized-exact-state'],{encoding:'utf8'});cli.push({script,status:r.status,stdout:r.stdout,stderr:r.stderr});}
await fs.writeFile(path.join(out,'independent.json'),JSON.stringify({sourceOnly:true,browserExecuted:false,catalog:{nodes:nodes.length,edges:edges.length,pdeps,anc:anc.size,desc:desc.size,edgeSHA256:sha(JSON.stringify(edges))},resolved,supportImports,guardFaults:Object.keys(faults),cli},null,2)+'\n');
assert.equal(model.status,0,model.stderr);for(const r of cli){assert.notEqual(r.status,0);assert.match(r.stderr,/no execution flags accepted/);}console.log('PASS independent catalog/resolver/ten real-catalog guard cases and four execution-flag rejections; no browser');
