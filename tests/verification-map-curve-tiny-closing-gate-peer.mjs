// Source-extracted controller-gate model only. No controller import/browser/native/server.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const [stage,out]=process.argv.slice(2);assert.ok(stage&&out);assert.ok(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});
const file=path.resolve(stage,'tests/map-curve-edge-tiny.mjs'),source=fs.readFileSync(file,'utf8');
const anchor='   }finally{await page.close();}\n  }\n';assert.equal(source.split(anchor).length,2,'exact final awaited close/outer loop seam');
const begin=source.indexOf(anchor)+anchor.length,end=source.indexOf('save(true);',begin)+'save(true);'.length;
const body=source.slice(begin,end);fs.writeFileSync(path.join(out,'extracted.json'),JSON.stringify({sourceSHA256:createHash('sha256').update(source).digest('hex'),body},null,2));assert.ok(body.includes('assert.deepEqual(errors,[]'));assert.ok(body.includes('requests.every'));assert.ok(body.endsWith('save(true);'));
const gate=new Function('assert','errors','requests','save',body),rows=[];
const persist=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({nativeEvidence:false,scope:'actual extracted final gate after modeled awaited page close; not entire controller/native',sourceSHA256:createHash('sha256').update(source).digest('hex'),gate:body,rows},null,2));
for(const kind of ['quiet','late-pageerror','late-unknown-request','both-late']){
 const errors=[],requests=[{known:true,path:'/curve-edge-fixture.html'}];let complete=false;
 const page={async close(){await Promise.resolve();if(kind==='late-pageerror'||kind==='both-late')errors.push({message:'modeled late pageerror during awaited close'});if(kind==='late-unknown-request'||kind==='both-late')requests.push({known:false,path:'/unexpected-local-source.js'});}};
 await page.close();const row={kind,errors:structuredClone(errors),requests:structuredClone(requests)};rows.push(row);persist();
 try{gate(assert,errors,requests,value=>{complete=value;});}catch(error){row.rejection={name:error.name,message:error.message};}
 row.complete=complete;persist();assert.equal(complete,kind==='quiet');assert.equal(!!row.rejection,kind!=='quiet');row.pass=true;persist();
}
console.log(JSON.stringify({pass:true,cases:rows.length,nativeEvidence:false,out}));
