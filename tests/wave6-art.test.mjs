import {authorPinBytes} from './wave6-author-pins.shared.mjs';
import test,{after}from'node:test';
import assert from'node:assert/strict';
import fs from'node:fs';
import{createHash}from'node:crypto';
import*as H from'../content/art/ch06.shared.js';
import chapter from'../content/art/ch06.js';
import syllabus from'../content/art/syllabus.js';

const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-art-reference.json',import.meta.url)));
const stats={cases:0,comparisons:0,numericalValues:0,exactValues:0,maxNormalizedError:0,worst:null};
function compare(actual,expected,path,family){
 if(expected===null||typeof expected!=='object'){
  stats.comparisons++;
  const exact=typeof expected!=='number'||/\.(rgb|rgbDifference|deltaRGB)\.\d+$/.test(path)||/\.(n|radius|position|selected|density|period|width|nearestGreen)$/.test(path)||(family==='assimilation'&&/\.(red|lines)\./.test(path))||(family==='equiluminance'&&/\.(proxy|reference)\./.test(path));
  if(exact){assert.deepEqual(actual,expected,path);stats.exactValues++;return;}
  assert.equal(typeof actual,'number',path);assert.ok(Number.isFinite(actual),path);
  let delta=Math.abs(actual-expected);if(path.endsWith('.h'))delta=Math.min(delta,Math.abs(delta-360));
  const budget=2e-11+3e-11*Math.abs(expected),error=delta/budget;stats.numericalValues++;
  if(error>stats.maxNormalizedError){stats.maxNormalizedError=error;stats.worst={path,actual,expected,absoluteError:delta,budget};}
  assert.ok(error<=1,`${path}: ${actual} expected ${expected}, error ${delta}, budget ${budget}`);return;
 }
 assert.ok(actual&&typeof actual==='object',path);assert.equal(Array.isArray(actual),Array.isArray(expected),path);assert.deepEqual(Object.keys(actual).sort(),Object.keys(expected).sort(),path+' complete keys');for(const[key,value]of Object.entries(expected))compare(actual[key],value,path+'.'+key,family);
}
for(const family of Object.keys(fixture.families))test('ART6 complete independent '+family+' objects',()=>{for(const row of fixture.cases.filter(r=>r.family===family)){const actual=family==='sceneSample'?H.sceneSample(row.args.x,row.args.y):H[family](row.args);compare(actual,row.expected,family+' '+JSON.stringify(row.args),family);stats.cases++;}});
after(()=>console.log('ART6_REFERENCE_STATS '+JSON.stringify(stats)));
const sha=x=>createHash('sha256').update(x).digest('hex');
test('ART6 complete independent corpus retains all1627cases in15families',()=>{const bytes=fs.readFileSync(new URL('./fixtures/wave6-art-reference.json',import.meta.url));assert.equal(bytes.length,4612994);assert.equal(sha(bytes),'071fd9001b97482642fded38e5b6c5fe0bf46f910a7e007ba959fb5b8cc501b9');assert.equal(fixture.cases.length,1627);assert.equal(Object.keys(fixture.families).length,15);for(const[f,n]of Object.entries(fixture.families))assert.equal(fixture.cases.filter(r=>r.family===f).length,n);});
test('ART6 preserves every frozen field, property absence and the whole old syllabus except6refs/pic',()=>{
 const before=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-art-syllabus-before.json',import.meta.url))),current=structuredClone(syllabus),old=before.chapters.find(c=>c.n===6),now=current.chapters.find(c=>c.n===6);
 assert.equal(chapter.items.length,14);assert.deepEqual(chapter.items.map(i=>i.num),old.items.map(i=>i.num));
 for(const item of now.items){const prior=old.items.find(i=>i.num===item.num),body=chapter.items.find(i=>i.num===item.num);for(const key of new Set([...Object.keys(prior).filter(k=>!['refs','pic'].includes(k)),'verify','paper','introduces','see'])){assert.equal(Object.hasOwn(body,key),Object.hasOwn(prior,key),item.num+' '+key+' presence');assert.deepEqual(body[key],prior[key],item.num+' '+key);}assert.deepEqual(item.refs,body.refs);assert.equal(item.pic,body.caption);for(const key of['statement','idea','scope','caption'])assert.ok(body[key].length>60,key);assert.equal(typeof body.viz,'function');item.refs=structuredClone(prior.refs);item.pic=prior.pic;}
 assert.deepEqual(current,before);assert.equal(chapter.items[13].paper.year,1839);assert.deepEqual(chapter.items[13].introduces,['art-6.3']);
});
test('ART6 retains all836previous protected raw files and the complete prior ART test',()=>{const p=JSON.parse(fs.readFileSync(new URL('../docs/verification/wave6-art-preimages.json',import.meta.url)));assert.equal(Object.keys(p.rawPins).length,837);let count=0;for(const[path,hash]of Object.entries(p.rawPins))if(path!=='content/art/syllabus.js'){assert.equal(sha(authorPinBytes(new URL('../'+path,import.meta.url),hash)),hash,path);count++;}assert.equal(count,836);assert.equal(sha(fs.readFileSync(new URL('./wave5-art.test.mjs',import.meta.url))),p.rawPins['tests/wave5-art.test.mjs']);});
test('ART6 finite filters conserve their declared constant and zero-gain limits',()=>{
 for(const w of[0,.75,1,1.5]){const z=H.centreSurround({stimulus:'uniform',strength:w});assert.ok(Math.abs(H.sum(z.center)-1)<1e-14);assert.ok(Math.abs(H.sum(z.surround)-1)<1e-14);assert.ok(Math.abs(z.dc-(1-w))<1e-14);for(const value of z.response)assert.ok(Math.abs(value-.45*(1-w))<1e-14);}
 for(const profile of['ramp','steps']){const z=H.mach({strength:0,profile});assert.deepEqual(z.enhanced,z.input);}
});
test('ART6 stimulus identity and reversible diagonal worlds are distinct certificates',()=>{
 for(const target of[0,128,255]){const z=H.contrast({target,grounds:'chromatic',hue:120});assert.deepEqual(z.targets[0],z.targets[1]);assert.equal(z.deltaE,0);}
 for(const warmth of[-1,0,1]){const z=H.constancy({warmth,degree:1});for(let i=0;i<z.reference.length;i++)for(let c=0;c<3;c++)assert.ok(Math.abs(z.corrected[i][c]-z.reference[i][c])<1e-15);}
 for(const row of fixture.cases.filter(r=>r.family==='vonKries'))assert.ok(H.vonKries(row.args).roundtrip<4e-15);
});
test('ART6 uniform illumination cancels from maximum ratios but a spatial gradient need not',()=>{
 for(const context of['varied','compressed']){const baseline=H.retinex({warmth:0,context});for(const warmth of[-1,1]){const z=H.retinex({warmth,context});for(let i=0;i<12;i++)for(let c=0;c<3;c++)assert.ok(Math.abs(z.normalized[i][c]-baseline.normalized[i][c])<1e-14);for(let c=0;c<3;c++)assert.ok(Math.abs(z.chain[c]-z.direct[c])<1e-14);}}
 assert.notDeepEqual(H.retinex({gradient:.7}).normalized,H.retinex({gradient:0}).normalized);assert.deepEqual(H.retinex({context:'varied'}).raw[0],H.retinex({context:'compressed'}).raw[0]);
});
test('ART6 intensity and neutral mixture keep their different invariants and undefined hue',()=>{
 for(const hue of[0,60,120,230,300]){const z=H.hueChanges({hue,whiteMix:1});assert.equal(z.polar.h,null);for(const q of z.intensity)for(let c=0;c<2;c++)assert.ok(Math.abs(q.xy[c]-H.xy(z.baseXYZ)[c])<1e-14);for(const q of z.purity)assert.ok(Math.abs(q.xyz[1]-z.xyz[1])<1e-14);}
 for(const row of fixture.cases.filter(r=>r.family==='brightness')){const z=H.brightness(row.args);assert.equal(z.preview.clipped,false);assert.ok(Math.abs(z.xyz[1]-row.args.Y)<1e-15);assert.ok(Math.abs(z.equalXYZ[1]-row.args.Y)<1e-15);}
});
test('ART6 checker identity depends on its actual shadow and nearest green minimises encoded Y',()=>{
 const on=H.checker(),off=H.checker({shadow:false});assert.deepEqual(on.deltaRGB,[0,0,0]);assert.equal(on.same,true);assert.equal(off.same,false);assert.notDeepEqual(off.A.rgb,off.B.rgb);
 for(let red=64;red<=255;red++){const z=H.equiluminance({red}),best=Math.abs(H.rgbXYZ([0,z.nearestGreen,0])[1]-z.Ys[0]);for(let green=0;green<=255;green++)assert.ok(Math.abs(H.rgbXYZ([0,green,0])[1]-z.Ys[0])>=best-1e-16);}
});
