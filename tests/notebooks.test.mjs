import {test} from 'node:test';
import assert from 'node:assert/strict';
import {STORE,JOURNAL,MAX_FILE,keyFor,identityFor,readSaved,importNotes,backupText,rawRecoveryText,listNotes,prepareCopy,recoveryEntries,commitCopy,readJournal,undoCopy} from '../assets/js/notebook-model.js';
import {loadEditionArchive,deliveryBinding} from '../scripts/build-exploration-editions.mjs';
import {renderEditions,DELIVERY_CODE} from '../scripts/exploration-editions.mjs';
const id='x-history-0001',old='0.1.1',revision='0.1.2',token='11111111-1111-4111-8111-111111111111';
const target={id,revision,state:'preview',defaults:{v:'1',task:'first'}};
const saved=(r,notes,state={v:'1',task:'old'})=>JSON.stringify({revision:r,state,notes});
class Storage {
  constructor(){this.map=new Map();this.writes=[];this.hook=null;}
  get length(){return this.map.size;} key(i){return [...this.map.keys()][i]??null;}
  getItem(k){return this.map.get(k)??null;}
  setItem(k,v){this.hook?.('set',k,v);this.map.set(k,String(v));this.writes.push(k);}
  removeItem(k){this.hook?.('remove',k);this.map.delete(k);this.writes.push(k);}
}
function fixture({before=saved(revision,'Destination',{v:'1',task:'destination'})}={}) {
  const storage=new Storage(),source={id,revision:old,raw:saved(old,'Original'),key:keyFor(id,old),label:'This browser'};
  storage.map.set(source.key,source.raw);if(before!==null)storage.map.set(keyFor(id,revision),before);storage.map.set('atlas.progress','KEEP');
  const plan=prepareCopy(storage,source,target,'Migrated');return {storage,source,plan};
}
test('inventory and explicit copies preserve source bytes, existing selections, extra fields and unrelated progress',()=>{
  const before=JSON.stringify({revision,state:{v:'1',task:'destination'},notes:'Destination',extra:{keep:true}}),{storage,source,plan}=fixture({before});
  assert.equal(storage.writes.length,0);assert.equal(listNotes(storage).length,2);assert.equal(identityFor('atlas.progress'),null);assert.equal(identityFor(STORE+id+'.01.1.2'),null);
  const journal=commitCopy(storage,plan,token);assert.equal(journal,JOURNAL+token);assert.equal(storage.writes[0],journal);
  assert.equal(storage.getItem(source.key),source.raw);assert.equal(storage.getItem('atlas.progress'),'KEEP');
  assert.deepEqual(readSaved(storage.getItem(plan.targetKey),revision),{revision,state:{v:'1',task:'destination'},notes:'Migrated',extra:{keep:true}});
  assert.deepEqual(readJournal(storage.getItem(journal)),plan);
});
test('new destinations use that edition’s defaults; undo restores exact previous bytes or absence',()=>{
  for(const before of [null,saved(revision,'Keep old spaces')]) {
    const {storage,source,plan}=fixture({before}),journal=commitCopy(storage,plan,token),raw=storage.getItem(journal);
    if(before===null)assert.deepEqual(readSaved(plan.after,revision).state,target.defaults);
    undoCopy(storage,journal,raw);assert.equal(storage.getItem(plan.targetKey),before);assert.equal(storage.getItem(source.key),source.raw);assert.equal(storage.getItem(journal),raw);
    assert.throws(()=>undoCopy(storage,journal,raw),/Undo refused/);
  }
});
test('same-edition restore from an imported backup works without interpreting imported selections',()=>{
  const {storage}=fixture(),raw=saved(revision,'External notes',{v:'1',task:'imported-selection'}),source=importNotes(backupText([{id,revision,raw,label:'Other origin'}]))[0];
  const plan=prepareCopy(storage,source,target,'External notes');commitCopy(storage,plan,token);
  assert.equal(readSaved(storage.getItem(plan.targetKey),revision).state.task,'destination');
});
test('current, earlier and unrestored exports round-trip including malformed bytes and duplicate identities',()=>{
  const current={schemaVersion:1,explorationId:id,revision,notes:'Text <script> & 私',selections:{v:'1'},unrestoredSavedData:'{broken'};
  const rows=importNotes(JSON.stringify(current));assert.equal(rows.length,2);assert.equal(rows[1].raw,'{broken');assert.equal(readSaved(rows[1].raw,revision),null);
  assert.deepEqual(importNotes(backupText(rows)),rows);
  const earlier=importNotes(JSON.stringify({schemaVersion:1,explorationId:id,earlier:[{revision:old,savedData:'bad raw'}]}));assert.equal(earlier[0].raw,'bad raw');
  const {plan}=fixture();assert.equal(importNotes(backupText(recoveryEntries(plan))).length,3);
});
test('unknown schemas, malformed files, unsafe identity, prototype keys, excessive complexity and oversize imports fail without writes',()=>{
  for(const text of ['{broken','[]','null','{"schemaVersion":2}',JSON.stringify({schemaVersion:1,kind:'atlas-note-backup',entries:[]}),
    JSON.stringify({schemaVersion:1,explorationId:'../escape',revision,notes:'x',selections:{}}),
    '{"schemaVersion":1,"__proto__":{"polluted":true}}',JSON.stringify({schemaVersion:1,explorationId:id,revision,notes:'x',selections:[]}),
    ' '.repeat(MAX_FILE+1),JSON.stringify({schemaVersion:1,notes:'私'.repeat(MAX_FILE/2)})]) assert.throws(()=>importNotes(text));
  assert.equal({}.polluted,undefined);assert.throws(()=>keyFor(id,'1.0'));assert.throws(()=>importNotes(JSON.stringify({schemaVersion:1,deep:JSON.parse('['.repeat(26)+'0'+']'.repeat(26))})));
});
test('oversized and unreadable raw recovery preserves lone UTF-16 surrogates across Blob encoding',async()=>{
  for(const raw of ['{broken \uD800','x'.repeat(200001)+'\uD800\uDC00\uD800']) {
    const envelope=rawRecoveryText(raw,{id,revision});
    assert.equal(JSON.parse(await new Blob([envelope]).text()).raw,raw);
    assert.throws(()=>importNotes(envelope));
  }
});
test('copy rejects changed identities, unavailable destinations, source-as-target, malformed target and long drafts',()=>{
  const {storage,source}=fixture();
  assert.throws(()=>prepareCopy(storage,source,{...target,id:'x-literature-0001'},'x'),/same exploration/);
  assert.throws(()=>prepareCopy(storage,source,{...target,state:'withdrawn'},'x'),/available/);
  assert.throws(()=>prepareCopy(storage,source,{...target,revision:old},'x'),/source stays/);
  assert.throws(()=>prepareCopy(storage,source,target,'x'.repeat(1501)),/1,500/);
  for(const raw of ['bad',saved('0.0.1','wrong'),JSON.stringify({revision,state:[],notes:'x'})]) {storage.map.set(keyFor(id,revision),raw);assert.throws(()=>prepareCopy(storage,source,target,'x'),/unreadable/);assert.equal(storage.getItem(keyFor(id,revision)),raw);}
  assert.equal(storage.writes.length,0);
});
test('stale source or destination previews are refused before any journal or target write',()=>{
  for(const change of ['source','target']) {
    const {storage,source,plan}=fixture();storage.map.set(change==='source'?source.key:plan.targetKey,'changed');
    assert.throws(()=>commitCopy(storage,plan,token),/changed/);assert.equal(storage.writes.length,0);
  }
});
test('blocked or full storage never triggers an unbacked destination write; partial failure leaves recovery',()=>{
  for(const failAt of ['journal','target']) {
    const {storage,plan}=fixture();storage.hook=(_,k)=>{if(failAt==='journal'||k===plan.targetKey)throw new Error('QuotaExceeded');};
    assert.throws(()=>commitCopy(storage,plan,token),/Quota/);assert.equal(storage.getItem(plan.targetKey),plan.before);
    assert.equal(storage.getItem(JOURNAL+token)!==null,failAt==='target');
  }
  const {storage,plan}=fixture();storage.setItem=()=>{};assert.throws(()=>commitCopy(storage,plan,token),/backup could not/);assert.equal(storage.getItem(plan.targetKey),plan.before);
});
test('a write between backup and commit is detected without replacing it; postwrite conflicts retain recovery',()=>{
  const {storage,plan}=fixture();storage.hook=(_,k)=>{if(k.startsWith(JOURNAL))storage.map.set(plan.targetKey,'concurrent value');};
  assert.throws(()=>commitCopy(storage,plan,token),/changed after backup/);assert.equal(storage.getItem(plan.targetKey),'concurrent value');assert.ok(storage.getItem(JOURNAL+token));
  const f=fixture(),set=f.storage.setItem.bind(f.storage);f.storage.setItem=(k,v)=>{set(k,v);if(k===f.plan.targetKey)f.storage.map.set(k,'postwrite edit');};
  assert.throws(()=>commitCopy(f.storage,f.plan,token),/during copy/);assert.equal(f.storage.getItem(f.plan.targetKey),'postwrite edit');assert.ok(f.storage.getItem(JOURNAL+token));
});
test('undo refuses later edits or changed journals and preserves recovery after failed restoration',()=>{
  const {storage,plan}=fixture(),journal=commitCopy(storage,plan,token),raw=storage.getItem(journal);
  storage.map.set(plan.targetKey,saved(revision,'Newer'));assert.throws(()=>undoCopy(storage,journal,raw),/Undo refused/);
  assert.equal(readSaved(storage.getItem(plan.targetKey),revision).notes,'Newer');
  storage.map.set(plan.targetKey,plan.after);storage.map.set(journal,'changed');assert.throws(()=>undoCopy(storage,journal,raw),/record changed/);
  storage.map.set(journal,raw);storage.hook=()=>{throw new Error('blocked');};assert.throws(()=>undoCopy(storage,journal,raw),/blocked/);assert.equal(storage.getItem(journal),raw);assert.equal(storage.getItem(plan.targetKey),plan.after);
});
test('forged recovery targets and hidden selection changes cannot be applied',()=>{
  const {storage,plan}=fixture();for(const mutate of [p=>p.targetKey='atlas.progress',p=>p.source.id='x-literature-0001',p=>p.after=saved(revision,'x',{forged:true})]){
    const changed=structuredClone(plan);mutate(changed);assert.throws(()=>commitCopy(storage,changed,token));
  }
  assert.equal(storage.writes.length,0);assert.equal(storage.getItem('atlas.progress'),'KEEP');
});
test('withdrawn editions have recoverable identity-only notebook metadata, no write targets or former payloads',async()=>{
  const archive=await loadEditionArchive(),source=archive.bundles.get(id+'@'+revision),result=renderEditions([{...source,state:'withdrawn',reason:'Synthetic fixture only'}],archive.runtimes,{mode:'release',base:'https://example.org/project/'});
  const page=result.outputs.get('explore/notebooks/index.html'),meta=JSON.parse(page.match(/id="notebook-editions" type="application\/json">([^]*?)<\/script>/)[1]);
  assert.deepEqual(meta,[{id,revision,state:'withdrawn'}]);assert.equal(result.runtimes,0);assert.equal(result.canonicalPaths.length,0);
  for(const text of result.outputs.values()){assert.ok(!text.includes(source.bundle.record.title));for(const passage of source.bundle.record.passages)assert.ok(!text.includes(passage.text));}
  assert.ok(result.outputs.get(`explore/${id}/versions/${revision}/index.html`).includes('explore/notebooks/'));
  assert.ok(!page.includes('rel="canonical"'));
});
test('delivery approvals bind every new renderer and browser dependency; empty real releases stay empty',async()=>{
  const binding=await deliveryBinding();for(const p of ['scripts/notebook-pages.mjs','assets/js/notebook-model.js','assets/js/notebook-view.js','assets/css/notebooks.css']){assert.ok(DELIVERY_CODE.includes(p));assert.ok(binding.files[p]);}
  const archive=await loadEditionArchive(),empty=renderEditions([],archive.runtimes,{mode:'release',base:'https://example.org/project/'});assert.equal(empty.outputs.size,2);assert.equal(empty.currentCount,0);
});
