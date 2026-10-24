import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import vm from 'node:vm';
import { ROOT, loadAll } from '../scripts/lib.mjs';
import { projectIdeas, selectFrozenIdeas, renderStaticIdeas, canonicalBase, staticTex, digest } from '../scripts/static-ideas.mjs';
import { interactiveReadingLink } from '../assets/js/reading.js';
import { buildStaticIdeas, generatedDataDigest } from '../scripts/build-static-ideas.mjs';
const data = { items: [{ id:'abc-1.1',col:'abc',chapter:1,num:'1.1',kind:'Theorem',name:'<img src=x>',statement:'A bounded statement.',idea:'An explanation.',deps:['def-1.1'],verify:true }], collections:[{id:'abc',title:'Collection',source:{author:'Author',title:'Book'}}],chapters:new Map([['abc/1',{title:'Chapter'}]]),aliases:new Map([['def-1.2',{to:'abc-1.1'}]]) };
const ids=['abc-1.1'],aliases=[{id:'def-1.2',to:'abc-1.1'}];
const freeze=()=>({schemaVersion:1,acceptedCommit:'a'.repeat(40),ids,aliases,snapshotDigest:digest(projectIdeas(data,ids,aliases))});
test('accepted roster binds all displayed content and aliases; draft identities cannot leak into selection',()=>{
 const m=freeze();assert.equal(selectFrozenIdeas(data,m).selected.length,1);
 const changed=structuredClone(data);changed.items[0].idea='A changed explanation';assert.throws(()=>selectFrozenIdeas(changed,m),/changed/);
 const extra=structuredClone(data);extra.items.push({...extra.items[0],id:'abc-1.2'});assert.equal(selectFrozenIdeas(extra,m).selected.length,1);
 assert.throws(()=>projectIdeas(data,['abc-1.1','abc-1.1'],aliases),/roster/);
 assert.throws(()=>projectIdeas(data,ids,[{id:'def-1.2',to:'def-1.3'}]),/Alias/);
 const bad=structuredClone(data);bad.items=[];assert.throws(()=>selectFrozenIdeas(bad,m),/missing/);
});
test('static HTML has substantive text, scoped flags, safe strings and nonduplicating canonical routes',()=>{
 const r=renderStaticIdeas(projectIdeas(data,ids,aliases),{base:'https://example.org/project/'}),html=r.outputs.get('ideas/abc-1.1/index.html');
 assert.match(html,/A bounded statement/);assert.match(html,/An explanation/);assert.match(html,/legacy verification flag/);assert.ok(!html.includes('<img src=x>'));assert.match(html,/&lt;img/);
 assert.match(html,/https:\/\/example.org\/project\/ideas\/abc-1.1\//);
 const alias=r.outputs.get('ideas/def-1.2/index.html');assert.match(alias,/noindex,follow/);assert.match(alias,/data-reading-alias href="..\/abc-1.1\/"/);
 assert.ok(!r.outputs.get('sitemap.xml').includes('def-1.2'));assert.ok(!r.outputs.get('sitemap.xml').includes('def-1.1'));assert.equal(r.canonicalPaths.length,3);
 const preview=renderStaticIdeas(projectIdeas(data,ids,aliases));assert.ok(!preview.outputs.has('sitemap.xml'));assert.match(preview.outputs.get('ideas/index.html'),/noindex,follow/);assert.ok(!preview.outputs.get('ideas/index.html').includes('rel="canonical"'));
});
test('canonical bases cannot inject credentials, paths, queries or executable schemes',()=>{
 for(const s of ['javascript:alert(1)','https://a:b@example.org/','https://example.org/a','https://example.org/?x=1','https://example.org/#x','https://example.org/a%2fb/','https://example.org/a//b/'])assert.throws(()=>canonicalBase(s));
 assert.equal(canonicalBase('https://example.org/atlas/'),'https://example.org/atlas/');
});
test('interactive reading links preserve opaque saved-state bytes and reject arbitrary targets',()=>{
 const suffix='?s=a%2Bb%3D&embed=1&unknown=a?b&empty=&x=1&x=2';
 assert.equal(interactiveReadingLink('../../#/t/abc-1.1',suffix),'../../#/t/abc-1.1'+suffix);
 assert.throws(()=>interactiveReadingLink('https://evil.example/',suffix));assert.throws(()=>interactiveReadingLink('../../#/t/abc-1.1','s=x'));
});
test('degree-spacing normalization renders both original failed expressions without changing other TeX',async()=>{
 const module={exports:{}};vm.runInNewContext(await readFile(join(ROOT,'assets/vendor/katex-0.16.11/katex.min.js'),'utf8'),{module,exports:module.exports});
 for(const tex of ['1147\\,^\\circ','727\\,^\\circ'])assert.match(module.exports.renderToString(staticTex(tex),{throwOnError:true}),/<math/);
 for(const tex of ['x^2','1147^\\circ','\\frac{a}{b}'])assert.equal(staticTex(tex),tex);
});
test('builder refuses absent, existing and source-checkout output directories before writes',async()=>{
 await assert.rejects(buildStaticIdeas(),/explicit/);await assert.rejects(buildStaticIdeas({out:ROOT}),/outside/);await assert.rejects(buildStaticIdeas({out:'/tmp'}),/exists/);await assert.rejects(buildStaticIdeas({out:join(ROOT,'reading-output')}),/outside/);
});
test('real 8,321-item merged reading freeze matches the reconciled source',async()=>{
 const m=JSON.parse(await readFile(join(ROOT,'static-pages/accepted.json'),'utf8')),selected=selectFrozenIdeas(await loadAll(),m);
 assert.equal(selected.selected.length,8321);assert.equal(selected.aliases.length,76);assert.ok(!selected.selected.some(p=>p.item.id.startsWith('x-')));
});
test('copied data binding ignores only generation timestamps and rejects stale fields or extra files',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'atlas-static-data-'));
 try {
  await writeFile(join(dir,'index.json'),JSON.stringify({generated:'old',items:[{id:'abc-1.1',name:'Original'}]}));const original=await generatedDataDigest(dir);
  await writeFile(join(dir,'index.json'),JSON.stringify({generated:'new',items:[{id:'abc-1.1',name:'Original'}]}));assert.equal(await generatedDataDigest(dir),original);
  await writeFile(join(dir,'index.json'),JSON.stringify({generated:'new',items:[{id:'abc-1.1',name:'Stale'}]}));assert.notEqual(await generatedDataDigest(dir),original);
  await writeFile(join(dir,'index.json'),JSON.stringify({generated:'new',items:[{id:'abc-1.1',name:'Original'}]}));await writeFile(join(dir,'extra.json'),'{}');assert.notEqual(await generatedDataDigest(dir),original);
 } finally {await rm(dir,{recursive:true,force:true});}
});

test('collection navigation sorts chapter and idea numbers naturally',()=>{
 const d=structuredClone(data);d.items=[{...d.items[0],id:'abc-10.1',num:'10.1',chapter:10},{...d.items[0],id:'abc-2.10',num:'2.10',chapter:2},{...d.items[0],id:'abc-2.2',num:'2.2',chapter:2}];d.chapters=new Map([['abc/10',{title:'Ten'}],['abc/2',{title:'Two'}]]);
 const r=renderStaticIdeas(projectIdeas(d,d.items.map(i=>i.id),[])),html=r.outputs.get('ideas/collections/abc/index.html');
 assert.ok(html.indexOf('2. Two')<html.indexOf('10. Ten'));assert.ok(html.indexOf('abc-2.2/')<html.indexOf('abc-2.10/'));
});
