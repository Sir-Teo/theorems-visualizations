// Reproducible structural wave-gate evidence. Does not certify source or human review.
// --write saves the census; --check detects drift; --strict also gates all criteria.
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {loadAll,loadBridges,validate,ROOT} from './lib.mjs';
const {items,planned,collections,problems,aliases}=await loadAll();
const {bridges,problems:bridgeProblems}=await loadBridges();
const byId=new Map([...items,...planned].map(it=>[it.id,it]));
const written=new Set(items.map(it=>it.id));
const field=new Map(collections.map(c=>[c.id,c.field]));
const resolve=id=>aliases.get(id)?.to||id;
const unknown=[];
for(const it of items)for(const raw of it.deps||[]){const id=resolve(raw);if(!byId.has(id))unknown.push({from:it.id,to:id});}
const missingViz=items.filter(it=>it.kind!=='Definition'&&typeof it.viz!=='function').map(it=>it.id);
const crossField=collections.filter(c=>c.field!=='math').map(c=>{
 const count=(source,includePlannedTargets,differentField)=>{
  const edges=new Set();
  for(const it of source.filter(it=>it.col===c.id))for(const raw of it.deps||[]){
   const target=byId.get(resolve(raw));
   if(target&&target.col!==it.col&&(includePlannedTargets||written.has(target.id))&&(!differentField||field.get(target.col)!==c.field))edges.add(`${it.id}>${target.id}`);
  }
  return edges.size;
 };
 return{collection:c.id,field:c.field,writtenItems:items.filter(it=>it.col===c.id).length,
  betweenFields:{writtenToWritten:count(items,false,true),writtenToAll:count(items,true,true),allToAll:count([...items,...planned],true,true)},
  betweenCollections:{writtenToWritten:count(items,false,false),writtenToAll:count(items,true,false),allToAll:count([...items,...planned],true,false)}};
});
const bridgeAudit=bridges.map(b=>({slug:b.slug,steps:b.steps.map(s=>{const id=resolve(s.id),target=byId.get(id);return{id,name:target?.name||null,written:written.has(id)};})}));
const invalidBridgeSteps=bridgeAudit.flatMap(b=>b.steps.filter(s=>!s.name).map(s=>({bridge:b.slug,id:s.id})));
const staticProblems=[...problems,...bridgeProblems,...validate(items,planned,collections)];
const shortfalls=crossField.filter(c=>c.writtenItems&&c.betweenFields.writtenToWritten<25);
const result={schemaVersion:1,meaning:'Structural evidence only; runtime, full-source, screenshot and human checks have separate evidence.',
 writtenItems:items.length,plannedItems:planned.length,visualizations:items.filter(it=>typeof it.viz==='function').length,
 gates:{zeroStaticErrors:!staticProblems.some(p=>p.level==='error'),zeroUnknownWrittenDependencies:unknown.length===0,
  allNonDefinitionItemsHaveViz:missingViz.length===0,allBridgeTargetsExist:invalidBridgeSteps.length===0,
  crossFieldMinimum25:shortfalls.length===0},
 crossFieldDefinition:'Distinct directed prerequisite edges whose source and target collection belong to different fields. Gate uses written sources and written targets; broader scopes and cross-collection counts are reported separately, without counting see-links.',
 staticErrors:staticProblems.filter(p=>p.level==='error'),staticWarnings:staticProblems.filter(p=>p.level==='warn'),unknownDependencies:unknown,missingViz,
 crossField,crossFieldShortfalls:shortfalls.map(c=>c.collection),bridges:bridgeAudit,invalidBridgeSteps};
const path=join(ROOT,'docs/verification/structural-gates.json'),json=JSON.stringify(result,null,2)+'\n';
if(process.argv.includes('--write'))writeFileSync(path,json);
if(process.argv.includes('--check')&&readFileSync(path,'utf8')!==json)throw Error('Structural census differs from current content; regenerate after reviewing changes.');
console.log(`${items.length} written, ${planned.length} planned, ${result.visualizations} visualizations; ${unknown.length} unknown deps, ${missingViz.length} missing viz, ${invalidBridgeSteps.length} missing bridge targets.`);
console.log(`${shortfalls.length} written non-math collections below 25 cross-field edges (see the three explicitly reported scopes).`);
if(process.argv.includes('--strict')&&Object.values(result.gates).some(v=>!v))process.exitCode=1;
