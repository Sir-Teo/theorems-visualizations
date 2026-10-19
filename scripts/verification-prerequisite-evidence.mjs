// Reconcile six reviewed prerequisite ledgers with live written edges and syllabi.
// This checks structural accounting; semantic/source review remains in peer reports.
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadAll,ROOT} from './lib.mjs';
const {items,planned,collections,problems}=await loadAll();
if(problems.some(p=>p.level==='error'))throw Error('Cannot reconcile incomplete content.');
const written=new Map(items.map(i=>[i.id,i])),all=new Map([...items,...planned].map(i=>[i.id,i]));
const fields=new Map(collections.map(c=>[c.id,c.field])),syllabi=new Map();
for(const c of collections){const file=join(ROOT,'content',c.id,'syllabus.js');if(!existsSync(file))continue;const s=(await import(pathToFileURL(file))).default;for(const ch of s.chapters||[])for(const i of ch.items||[])syllabi.set(`${c.id}-${i.num}`,i);}
const batches=[],issues=[],seen=new Set();
for(const name of ['probability','climate','energy','circuits','geology','macro']){
 const file=`docs/verification/cross-field-${name}.json`,bytes=readFileSync(join(ROOT,file)),ledger=JSON.parse(bytes),edges=ledger.additions||ledger.added_edges;
 if(!Array.isArray(edges))throw Error(`Missing edge list: ${file}`);
 for(const edge of edges){const from=edge.source||edge.from,to=edge.target||edge.to,key=`${from}>${to}`,source=written.get(from),target=written.get(to),syllabus=syllabi.get(from);
  if(seen.has(key))issues.push({edge:key,problem:'duplicate ledger edge'});seen.add(key);
  if(!source||!target)issues.push({edge:key,problem:'endpoint not written'});
  if(source&&target&&fields.get(source.col)===fields.get(target.col))issues.push({edge:key,problem:'same registered field'});
  if(!source?.deps?.includes(to))issues.push({edge:key,problem:'edge absent from written prerequisites'});
  if(!syllabus?.deps?.includes(to))issues.push({edge:key,problem:'edge absent from syllabus prerequisites'});
 }
 batches.push({name,file,sha256:createHash('sha256').update(bytes).digest('hex'),edges:edges.length});
}
const visiting=new Set(),done=new Set(),cycles=[];
function visit(id,path){if(visiting.has(id)){cycles.push([...path.slice(path.indexOf(id)),id]);return;}if(done.has(id))return;visiting.add(id);for(const d of all.get(id)?.deps||[])if(all.has(d))visit(d,[...path,id]);visiting.delete(id);done.add(id);}
for(const id of all.keys())visit(id,[]);
const result={schemaVersion:1,meaning:'Six author ledgers reconciled structurally against live written prerequisites, registered fields and syllabus mirrors. Different-field title matches alone do not establish semantic validity; reciprocal peer reports supply that review. Existing alternate graph paths do not invalidate a separately documented direct proof role.',batches,uniqueAddedEdges:seen.size,issues,graphNodes:all.size,cycles,passes:issues.length===0&&cycles.length===0};
const path=join(ROOT,'docs/verification/cross-field-integration.json'),json=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--write'))writeFileSync(path,json);
if(process.argv.includes('--check')&&readFileSync(path,'utf8')!==json)throw Error('Prerequisite integration evidence is stale.');
console.log(`${seen.size} unique reviewed edges; ${issues.length} ledger/mirror issues; ${cycles.length} cycles across ${all.size} written/planned nodes.`);
if(!result.passes){console.log(JSON.stringify(issues));process.exitCode=1;}
