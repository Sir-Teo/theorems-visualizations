import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {endpoint,projectRecord,recordKey,captureRecord,validateCatalog,searchCatalog,sha} from '../program/federation.mjs';
import {validateStudy,studyDigest,assessStudy,prerequisiteClosure,ledgerBalances,practiceExport} from '../program/learning.mjs';
import {renderStudy} from '../program/render.mjs';
import {prepareProgram,renderProgram} from '../scripts/build-local-program.mjs';
const p=await prepareProgram();
test('all domains have curated accepted extensions and explicit prerequisite diagnostics',()=>{
  assert.equal(p.routes.length,30);assert.equal(p.studies.length,4);assert.equal(p.counts.languageEditions,8);
  for(const r of p.routes){assert.ok(r.closure.ordered.length>=2);assert.ok(r.targets.every(t=>r.closure.ordered.includes(t.id)));assert.ok(r.limits.length>20);}
});
test('prerequisite traversal exposes absent prerequisites and cycles instead of asserting completeness',()=>{
  const nodes=new Map([['a',{prerequisites:['b','missing']}],['b',{prerequisites:['c']}],['c',{prerequisites:['b']}]]);
  const c=prerequisiteClosure(['a'],id=>nodes.get(id));assert.deepEqual(c.missing,['missing']);assert.deepEqual(c.cycles,[['b','c','b']]);assert.equal(c.complete,false);
  const d=prerequisiteClosure(['a'],id=>({a:{prerequisites:['b']},b:{prerequisites:[]}}[id]));assert.deepEqual(d.ordered,['b','a']);assert.equal(d.complete,true);
});
test('study choices share stable meanings across English and Spanish, reject malformed input and escape content',()=>{
  for(const s of p.studies){for(const t of s.tasks){assert.equal(assessStudy(s,t.id,t.answer).state,'matches');assert.equal(assessStudy(s,t.id,'unknown').state,'unanswered');for(const c of t.choices.filter(x=>x.id!==t.answer))assert.equal(assessStudy(s,t.id,c.id).state,'reconsider');}
    for(const lang of s.languages){const html=renderStudy(s,lang,p.research.sources);assert.ok(html.includes(`<html lang="${lang}">`));assert.ok(html.includes('hreflang="en"')&&html.includes('hreflang="es"'));assert.ok(html.includes('lang="en"'));assert.equal((html.match(/<fieldset>/g)||[]).length,3);}
  }
  const s=structuredClone(p.studies[0]);s.tasks[0].choices[0].es='';assert.throws(()=>validateStudy(s,p.research.sources.map(x=>x.id)),/choices/);
  s.tasks[0].choices[0].es='A';s.title.en='<img src=x onerror=alert(1)>';assert.ok(!renderStudy(s,'en',p.research.sources).includes('<img'));assert.ok(renderStudy(s,'en',p.research.sources).includes('&lt;img'));
});
test('new disciplines do not borrow a pilot identity and stale author checks fail',()=>{
  const s=structuredClone(p.studies[0]);assert.equal(s.pilotId,undefined);s.seriesId='another-real-series';s.status='accepted-local';s.authorVerification={kind:'author-check',scope:'local-only',contentDigest:studyDigest(s)};assert.doesNotThrow(()=>validateStudy(s,p.research.sources.map(x=>x.id)));s.scope.en+=' Changed';assert.throws(()=>validateStudy(s,p.research.sources.map(x=>x.id)),/Stale/);
});
test('fictional accounting ledger conserves the equation while complete omissions escape a balancing check',()=>{
  const e=(account,side,amount)=>({account,side,amount});
  const events=[{entries:[e('cash','debit',900),e('capital','credit',900)]},{entries:[e('equipment','debit',240),e('cash','credit',240)]},{entries:[e('cash','debit',150),e('loan','credit',150)]}];
  const b=ledgerBalances(events);assert.deepEqual(b,{cash:810,equipment:240,capital:900,loan:150,assets:1050,liabilities:150,equity:900,debits:1290,credits:1290,balanced:true});
  const omitted=ledgerBalances(events.slice(0,2));assert.equal(omitted.balanced,true);assert.equal(omitted.cash,660);assert.notEqual(omitted.assets,b.assets);
  events[2].entries[1].amount=149;assert.equal(ledgerBalances(events).balanced,false);events[2].entries[1].amount=NaN;assert.throws(()=>ledgerBalances(events),/Invalid/);
  const s=p.studies.find(x=>x.id==='s-accounting-records');for(const lang of s.languages)for(const n of ['900','240','150','810','1050'])assert.ok(s.body[lang].join(' ').includes(n));
});
test('provider identities, absent fields and work/edition levels never merge through equal titles',()=>{
  const raw={key:'/books/OL1M',type:{key:'/type/edition'},title:'Same title',revision:1};
  const a=projectRecord('openlibrary','/books/OL1M',raw);assert.deepEqual(a.subjects,{state:'absent',values:null});raw.subjects=[];assert.deepEqual(projectRecord('openlibrary','/books/OL1M',raw).subjects,{state:'present',values:[]});
  assert.throws(()=>projectRecord('openlibrary','/works/OL1W',raw),/mismatch/);assert.notEqual(recordKey('openlibrary','same'),recordKey('crossref','same'));assert.equal(recordKey('crossref','10.1234/ABC'),recordKey('crossref','10.1234/abc'));
  for(const id of ['/works/../../private','https://internal/','/authors/OL1A'])assert.throws(()=>endpoint('openlibrary',id));
  assert.equal(validateCatalog(p.catalog).providers,2);assert.equal(searchCatalog(p.catalog,'Walden').length,3);assert.equal(searchCatalog(p.catalog,'2013','openlibrary').length,0);
  const changed=structuredClone(p.catalog);changed.records[0].record.title='changed';assert.throws(()=>validateCatalog(changed),/Changed/);
});
test('Crossref publication and index events remain distinct; abstracts and licence claims are excluded',()=>{
  const m={DOI:'10.1234/Test',title:['Title'],type:'journal-article',published:{'date-parts':[[2013,1]]},indexed:{'date-parts':[[2026,10,23]]},abstract:'DO NOT COPY',license:[{URL:'https://example.org'}]};
  const r=projectRecord('crossref','10.1234/test',{status:'ok',message:m});assert.deepEqual(r.dates.published['date-parts'],[[2013,1]]);assert.equal(r.workRead,false);assert.equal(r.abstract,undefined);assert.equal(r.license,undefined);
});
test('one-record capture stops at denials, malformed bodies and size limits without retries',async()=>{
  let calls=0;const deny=async()=>{calls++;return new Response('denied',{status:403});};await assert.rejects(()=>captureRecord('openlibrary','/books/OL1M',{fetcher:deny}),/403/);assert.equal(calls,1);
  await assert.rejects(()=>captureRecord('openlibrary','/books/OL1M',{fetcher:async()=>new Response('challenge',{headers:{'content-type':'text/html'}})}),/expected JSON/);
  const raw={key:'/books/OL1M',type:{key:'/type/edition'},title:'Test',revision:1};const fetcher=async(url,opts)=>{assert.equal(opts.redirect,'error');return new Response(JSON.stringify(raw),{headers:{'content-type':'application/json'}});};
  await assert.rejects(()=>captureRecord('openlibrary','/books/OL1M',{fetcher,maxBytes:10}),/too large/);
  const result=await captureRecord('openlibrary','/books/OL1M',{fetcher,now:()=>new Date('2026-10-23T12:00:00Z')});assert.equal(result.capture.readOn,'2026-10-23');assert.equal(result.projectionSha256,sha(JSON.stringify(result.record)));
});
test('practice exports distinguish observation from interpretation without invented certification',()=>{
  const e=practiceExport({activity:'paper-weave',observation:'Two crossings differed',interpretation:'I may have repeated the row',nextAttempt:'Reverse the second row'});assert.equal(e.kind,'self-recorded-practice');assert.equal(e.passed,undefined);assert.throws(()=>practiceExport({...e,activity:'clinical-procedure'}));
});
test('rendered local surfaces expose static tasks, scoped sources and no remote runtime',async()=>{
  const outputs=await renderProgram(p);assert.equal([...outputs.keys()].filter(x=>x.startsWith('depth/')).length,31);assert.equal([...outputs.keys()].filter(x=>x.startsWith('studies/')&&x.endsWith('.html')).length>=13,true);
  for(const [path,html]of outputs)if(path.endsWith('.html')){assert.ok(html.includes('noindex,nofollow'));assert.ok(!/<script[^>]+src="https?:/.test(html));}
  assert.ok(outputs.get('practice/index.html').includes('disabled data-enable'));
  const ui=await readFile(new URL('../program/ui.mjs',import.meta.url),'utf8');assert.ok(!/localStorage|sessionStorage|fetch\(|sendBeacon|XMLHttpRequest/.test(ui));
});

test('retained study pages use frozen runtimes and reject edits under an existing identity',async()=>{
  const {archiveOutputs}=await import('../program/archive.mjs');const {ROOT}=await import('../scripts/lib.mjs');const a=await archiveOutputs(ROOT,p.studies);
  assert.equal(a.manifest.editions.length,8);assert.equal([...a.outputs.keys()].filter(x=>x.endsWith('.html')).length,16);
  for(const [path,html]of a.outputs)if(path.endsWith('.html'))assert.match(html,/assets\/program\/[a-f0-9]{64}\/ui\.mjs/);
  const changed=structuredClone(p.studies);changed[0].title.en+=' changed';await assert.rejects(()=>archiveOutputs(ROOT,changed),/new revision/);
  const unknown=structuredClone(p.studies);unknown[0].id='s-unretained';await assert.rejects(()=>archiveOutputs(ROOT,unknown),/retained edition/);
});
