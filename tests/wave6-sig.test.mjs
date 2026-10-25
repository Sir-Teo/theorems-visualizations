import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';import * as H from '../content/sig/ch06.shared.js';
const F=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-sig-reference.json',import.meta.url)));
function near(a,b,where,{rtol=3e-11,atol=2e-13}={}) {assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=atol+rtol*Math.abs(b),where+': '+a+' vs '+b);}
function image(a,b,where,tolerance){a.forEach((x,j)=>near(x,b[j],where+'['+j+']',tolerance));}
for(const [family,rows]of Object.entries(F.families))test('SIG6 '+family+' agrees with independent high-precision references',()=>{for(const row of rows){const a=row.args,e=row.expect,k=family+JSON.stringify(a);switch(family){
 case 'si':near(H.si(a.x),e,k);break;
 case 'first':near(H.firstStep(a.t,a.tau),e,k,{atol:0});break;
 case 'firstFrequency':{const z=H.firstResponse(a.w,a.tau);image(z.h,e.h,k);near(z.delay,e.delay,k);break;}
 case 'truncation':{const z=H.truncatedResponse(a.w,a);image(z.h,e.h,k);near(z.signedGain,e.signedGain,k);break;}
 case 'paley':{const z=H.paleyModel(a);for(const [p,q]of Object.entries(e))near(z[p],q,k);break;}
 case 'packet':{const z=H.phasePacket(a.t,a);image(z.z,e.z,k);near(z.width,e.width,k);break;}
 case 'second':near(H.secondStep(a.t,a),e.step,k,{atol:1e-14});near(H.secondImpulse(a.t,a),e.impulse,k,{atol:1e-15});break;
 case 'secondFrequency':image(H.secondResponse(a.w,a).h,e.h,k);break;
 case 'gainPhase':{const z=H.gainPhase(a.w,a);near(z.phase,e.phase,k,{atol:Math.abs(e.phase)<1e-12?0:2e-13});near(z.exact,e.exact,k,{atol:0});break;}
 case 'bode':{const z=H.bode(a.w,a);for(const[p,q]of Object.entries(e))near(z[p],q,k,{atol:p==='phase'&&Math.abs(q)<1e-12?0:2e-13});break;}
 case 'minimumFrequency':{const z=H.minimumPhase(a.w,a);image(z.h,e.h,k);near(z.phase,e.phase,k);near(z.groupDelay,e.groupDelay,k);break;}
 case 'taperImpulse':near(H.taperImpulse(a.t,a),e,k);break;
 case 'minimumStep':near(H.minimumStep(a.t,a),e,k);break;
 case 'taperStep':near(H.taperStep(a.t,a),e,k);break;
 case 'rise':{const z=H.riseModel(a);for(const[p,q]of Object.entries(e))near(z[p],q,k);break;}
 default:throw Error(family);
}}});

test('SIG6 exact boundaries, positive unresolved dispersion and gain ambiguity remain distinct',()=>{
 for(const W of[.5,2,5])for(const delay of[.5,2,8]){const w=H.negativeTimeWitness(W,delay);assert.ok(w.t<0&&w.value!==0);near(H.idealImpulse(w.t,W,delay),w.value,'negative witness');}
 for(const taper of[Number.MIN_VALUE,1e-100,1e-14,.2,1])assert.equal(H.taperGain(2,{taper}),.5);
 assert.equal(H.phasePacket(0,{beta:0}).extraVariance.status,'zero');assert.equal(H.phasePacket(0,{beta:Number.MIN_VALUE}).extraVariance.status,'positive below binary64 range');assert.ok(H.firstResponse(Number.MIN_VALUE,.05).phaseUnderflow);
 assert.equal(H.secondModel({zeta:.7071067811865475}).resonant,true);near(H.secondModel({zeta:.7071067811865475,omega:1}).peakFrequency,1.3315491676371419e-8,'near-DC resonance',{atol:0});assert.equal(H.secondModel({zeta:Math.SQRT1_2}).resonant,false);
 assert.equal(H.secondModel({zeta:1-Number.EPSILON/2}).overshoot.status,'positive below binary64 range');assert.equal(H.secondModel({zeta:1}).overshoot.status,'zero');
 for(const ratio of[.05,.5,1,5])for(const w of[0,.2,1,10])near(H.riseModel().frequency(w),H.riseModel({family:'one pole plus all-pass',ratio}).frequency(w),'all-pass gain');assert.ok(H.riseModel({family:'one pole plus all-pass',ratio:.05}).product>5);
 assert.equal(H.paleyModel({family:'brick wall',R:.1}).value,0);assert.equal(H.paleyModel({family:'brick wall',R:.1}).admissible,false);
});
test('SIG6 model domains reject nonnumeric, nonfinite and unsupported physical inputs',()=>{
 for(const x of[NaN,Infinity,-Infinity,'1',null,[],{}])for(const fn of[()=>H.firstResponse(1,x),()=>H.idealGain(1,'low-pass',x),()=>H.paleyModel({alpha:x}),()=>H.phasePacket(1,{sigma:x}),()=>H.bode(1,{pole:x}),()=>H.secondStep(1,{zeta:x}),()=>H.minimumPhase(1,{zero:x}),()=>H.gainPhase(1,{zero:x}),()=>H.riseModel({bandwidth:x}),()=>H.taperStep(1,{taper:x})])assert.throws(fn,RangeError);
 for(const fn of[()=>H.idealGain(1,'other'),()=>H.paleyModel({family:'other'}),()=>H.bode(1,{withZero:1}),()=>H.minimumPhase(1,{reflected:1}),()=>H.gainPhase(1,{panels:1.5}),()=>H.riseModel({family:'other'}),()=>H.secondStep(1,{zeta:0}),()=>H.taperStep(1,{taper:-1})])assert.throws(fn,RangeError);
});
test('SIG6 retains thirteen frozen identities and every outside syllabus byte',async()=>{
 const main=(await import('../content/sig/ch06.js')).default,now=(await import('../content/sig/syllabus.js')).default,oldText=execFileSync('git',['show','b32ac9fc:content/sig/syllabus.js'],{encoding:'utf8'}),old=(await import('data:text/javascript;base64,'+Buffer.from(oldText).toString('base64'))).default,chapter=old.chapters.find(c=>c.n===6),current=now.chapters.find(c=>c.n===6);assert.equal(main.items.length,13);
 for(const row of chapter.items){const a=main.items.find(i=>i.num===row.num),b=current.items.find(i=>i.num===row.num);for(const k of['num','kind','name','deps','paper','introduces','see','verify'])assert.deepEqual(a[k],row[k]);assert.deepEqual(b.refs,a.refs);assert.equal(b.pic,a.caption);assert.equal(typeof a.viz,'function');assert.ok(a.scope);}
 assert.deepEqual(now.chapters.filter(c=>c.n!==6),old.chapters.filter(c=>c.n!==6));const actual=fs.readFileSync(new URL('../content/sig/syllabus.js',import.meta.url),'utf8'),start=oldText.indexOf('    {\n      n: 6,'),end=oldText.indexOf('    {\n      n: 7,',start);assert.ok(start>0&&end>start);assert.equal(actual.slice(0,start),oldText.slice(0,start));assert.ok(actual.endsWith(oldText.slice(end)));
});
