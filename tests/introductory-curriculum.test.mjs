import test from 'node:test';import assert from 'node:assert/strict';
import {prepareCurriculum,validateCurriculum,renderCurriculum,buildCurriculum} from '../scripts/build-introductory-curriculum.mjs';
const p=await prepareCurriculum();
test('30 actual domain routes use 90 associations to 65 exact accepted identities without inventing lessons',()=>{
 assert.deepEqual(p.counts,{domains:30,associations:90,uniqueTargets:65,newLessons:0});
 const r=renderCurriculum(p.data,p.context);assert.equal(r.size,33);
 const catalog=JSON.parse(r.get('curriculum/catalog.json'));assert.equal(catalog.routes.length,30);
 for(const route of p.data.routes){const html=r.get('curriculum/'+route.domainId+'/index.html');assert.equal((html.match(/id="step-/g)||[]).length,3);assert.ok(html.includes('noindex,nofollow'));assert.ok(!html.includes('<script'));for(const s of route.stops)assert.ok(html.includes(s.targetId));}
});
test('changed target bytes, missing domains and relabeled prerequisites cannot inherit acceptance',()=>{
 for(const change of [d=>d.routes.pop(),d=>d.routes[0].domainId=d.routes[1].domainId,d=>d.routes[0].stops[0].targetSha256='0'.repeat(64),d=>d.routes[0].stops[0].targetId='unknown',d=>d.routes[0].stops[0].title='Changed',d=>d.routes[0].stops[0].declaredPrerequisites=['made-up'],d=>d.routes[0].stops[1]=d.routes[0].stops[0],d=>d.legacySnapshot='0'.repeat(64),d=>delete d.routes[0].representationAudit.language]){const d=structuredClone(p.data);change(d);assert.throws(()=>validateCurriculum(d,p.context));}
});
test('route prose is escaped and local curriculum cannot silently become a release',async()=>{
 const d=structuredClone(p.data);d.routes[0].title='<img src=x onerror=alert(1)>';const h=renderCurriculum(d,p.context).get('curriculum/D01/index.html');assert.ok(h.includes('&lt;img'));assert.ok(!h.includes('<img'));await assert.rejects(()=>buildCurriculum({mode:'release'}),/local previews/);
});
