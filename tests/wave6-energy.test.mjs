import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as H from '../content/energy/ch06.shared.js';
const {Q}=H;
const F=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-energy-reference.json',import.meta.url))).families;
const functions={storage:H.storageCycle,nernst:H.nernst,battery:H.battery,peukert:H.peukert,soc:H.stateOfCharge,cycleLife:H.cycleLife,hydro:H.pumpedHydro,air:H.compressedAir,flywheel:H.flywheel,capacitor:H.supercapacitor,hydrogen:H.hydrogen,ragone:a=>H.ragone(a.power,a.energy)};
let comparisons=0;const failures=[];
function check(ok,label,a,b){comparisons++;if(!ok)failures.push({label,actual:a,expected:b});}
function scalar(a,e,label){
 if(typeof a==='number'){
  const expected=typeof e.value==='string'?(e.value==='negative overflow'?-Infinity:Infinity):e.value;
  check(Math.abs(expected)<1e-290?Object.is(a,expected):Number.isFinite(a)&&Math.abs(a-expected)<=2e-12*Math.abs(expected),label,a,expected);return;
 }
 if(!a||typeof a.value!=='number'){check(false,label,a,e);return;}
 if(typeof e.value==='string')check(a.value===(e.value==='negative overflow'?-Infinity:Infinity),label,a.value,e.value);
 else check(Math.abs(e.value)<1e-290?Object.is(a.value,e.value):Number.isFinite(a.value)&&Math.abs(a.value-e.value)<=2e-12*Math.abs(e.value),label,a.value,e.value);
 check(a.sign===e.sign,label+' sign',a.sign,e.sign);
 if(e.sign){check(Number.isFinite(a.logMagnitude)&&Math.abs(a.logMagnitude-e.logMagnitude)<3e-9,label+' log',a.logMagnitude,e.logMagnitude);check(a.belowRange===(e.value===0),label+' below range',a.belowRange,e.value===0);check(a.aboveRange===(typeof e.value==='string'),label+' above range',a.aboveRange,typeof e.value==='string');}
 else check(a.value===0&&a.logMagnitude===-Infinity,label+' exact zero',a,e);
}
function compare(a,e,label){
 if(e===null||typeof e!=='object'){check(a===e,label,a,e);return;}
 if('value'in e&&'sign'in e){scalar(a,e,label);return;}
 if(Array.isArray(e)){check(Array.isArray(a)&&a.length===e.length,label+' length',a?.length,e.length);for(let j=0;j<e.length;j++){
  if(label.endsWith('.position'))check(Number.isFinite(a[j])&&Math.abs(a[j]-e[j].value)<=2e-12,label+'.'+j,a[j],e[j].value);
  else compare(a[j],e[j],label+'.'+j);
 }return;}
 for(const k of Object.keys(e))compare(a?.[k],e[k],label+'.'+k);
}
for(const [name,rows]of Object.entries(F))test(`${name}: ${rows.length} independently generated physical cases`,()=>{
 const start=failures.length;
 for(let j=0;j<rows.length;j++){const {args,expect}=rows[j];compare(functions[name](args),expect,name+'['+j+']');}
 assert.equal(failures.length-start,0,JSON.stringify(failures.slice(start,start+20),null,2));
});
test('exact algebraic energy, charge and power balances do not use a tolerance',()=>{
 const zero=q=>assert.equal(Q.sign(q),0);
 for(const name of ['storage','battery','hydro','capacitor','hydrogen'])for(const{args}of F[name])zero(functions[name](args).residual.exact);
 for(const{args}of F.soc){const q=H.stateOfCharge(args);zero(Q.sub(Q.add(q.remainingCharge.exact,q.withdrawnCharge.exact),Q.mul(100,args.initial??.5)));}
 for(const{args}of F.flywheel){const q=H.flywheel(args);zero(Q.sub(q.energy.exact,Q.div(Q.mul(q.inertia.exact,q.omegaSquared.exact),2)));zero(Q.sub(q.specificEnergy.exact,Q.div(q.stress.exact,Q.mul(2,args.density??7800))));}
});
test('algebraic reference quantities round exactly from original binary64 inputs',()=>{
 const walk=(a,e,label)=>{if(e===null||typeof e!=='object')return;if('value'in e){if(a&&typeof a==='object'&&typeof e.value==='number')assert.equal(a.value,e.value,label);return;}for(const k of Object.keys(e))walk(a[k],e[k],label+'.'+k);};
 for(const name of ['storage','battery','soc','hydro','capacitor','hydrogen','ragone'])for(const [j,{args,expect}]of F[name].entries())walk(functions[name](args),expect,name+'['+j+']');
 for(const [j,{args,expect}]of F.flywheel.entries()){const a=H.flywheel(args);for(const k of ['allowableStress','stress','stressMargin','omegaSquared','inertia','energy','specificEnergy','limitingSpecificEnergy','energyWh','specificWh'])assert.equal(a[k].value,expect[k].value,'flywheel['+j+'].'+k);}
});
test('physical limits distinguish zero from positive values below binary64 range',()=>{
 const tiny=Number.MIN_VALUE;
 const s=H.storageCycle({capacity:tiny,progress:tiny});assert.equal(s.stored.sign,1);assert.equal(s.stored.belowRange,true);
 const b=H.battery({fraction:tiny});assert.equal(b.heat.sign,1);assert.equal(b.heat.belowRange,true);assert.equal(H.battery({fraction:0}).efficiency,null);
 const c=H.supercapacitor({progress:tiny});assert.equal(c.extracted.sign,1);assert.equal(c.voltageDrop.sign,1);
 const f=H.flywheel({fraction:tiny,time:tiny});assert.equal(f.energy.sign,1);assert.equal(f.energy.belowRange,true);assert.equal(f.angle.sign,1);
 const h=H.hydrogen({input:tiny,electrolyser:tiny});assert.equal(h.producedMass.sign,1);assert.equal(h.output.sign,1);assert.equal(H.hydrogen({input:0}).actualRoundTrip,null);
 assert.equal(H.compressedAir({ratio:1}).workEfficiency,null);assert.equal(H.storageCycle({capacity:0,progress:2}).completedCycleRatio,null);
});
test('declared domains reject invalid restored values rather than manufacture a valid physical state',()=>{
 const invalid={storage:[{capacity:-1},{progress:2.0000000000000004},{etaCharge:.49}],nernst:[{fraction:0},{electrons:3},{activityRatio:0}],battery:[{resistance:0},{fraction:1.0000000000000002}],peukert:[{current:0},{exponent:.99},{preset:'unknown'}],soc:[{initial:-Number.MIN_VALUE},{hours:4.000000000000001},{operation:'unknown'}],cycleLife:[{depth:0},{exponent:0}],hydro:[{areaKm2:0},{flow:0},{operation:'unknown'}],air:[{ratio:.99},{gamma:.99},{thermal:'unknown'}],flywheel:[{radius:0},{fraction:1.0000000000000002}],capacitor:[{cutoff:1},{current:0}],hydrogen:[{electrolyser:-Number.MIN_VALUE},{retention:1.0000000000000002}],ragone:[{power:0,energy:10},{power:100,energy:0}]};
 for(const[name,rows]of Object.entries(invalid))for(const args of [...rows,{[name==='ragone'?'power':Object.keys(rows[0])[0]]:NaN}])assert.throws(()=>functions[name](args),name+' '+JSON.stringify(args));
});
test('all twelve frozen physical families retain their complete independent reference inventory',()=>{assert.equal(Object.keys(F).length,12);assert.equal(Object.values(F).reduce((n,rows)=>n+rows.length,0),1221);});

test('twelve complete lessons preserve frozen identities, ordered dependencies and outside-chapter syllabus bytes',async()=>{
 const {default:chapter}=await import('../content/energy/ch06.js'),{default:syllabus}=await import('../content/energy/syllabus.js'),crypto=await import('node:crypto');
 const frozen=JSON.parse(fs.readFileSync(new URL('../docs/wave-6-plan.json',import.meta.url))).chapters.find(c=>c.collection==='energy'&&c.chapter===6),row=syllabus.chapters.find(c=>c.n===6);
 assert.equal(chapter.items.length,12);assert.equal(row.items.length,12);
 for(const[j,item]of chapter.items.entries()){
  for(const key of ['num','kind','name','deps','paper','introduces','see','verify']){assert.deepEqual(item[key],frozen.items[j][key],item.num+' '+key);assert.deepEqual(row.items[j][key],frozen.items[j][key],item.num+' catalogue '+key);}
  assert.equal(typeof item.viz,'function');for(const k of ['statement','idea','caption','scope'])assert.ok(typeof item[k]==='string'&&item[k].length>100,item.num+' complete '+k);
  assert.deepEqual(row.items[j].refs,item.refs);assert.equal(row.items[j].pic,item.caption);assert.equal(row.items[j].scope,item.scope);
 }
 const hash=x=>crypto.createHash('sha256').update(x).digest('hex');assert.equal(hash(JSON.stringify({...syllabus,chapters:syllabus.chapters.filter(c=>c.n!==6)})),'535e0c1155db4832ded34518ecc7b4b2a1b417621ef9df8b21b36289aaadbd59');
 const source=fs.readFileSync(new URL('../content/energy/syllabus.js',import.meta.url),'utf8'),a=source.indexOf('    {\n      "n": 6,'),next=source.indexOf('    {\n      n: 7,',a),b=source.lastIndexOf('    //',next);assert.ok(a>0&&b>a);
 assert.equal(hash(source.slice(0,a)),'46bb4240557b125d10c408c1721f79bca904a49c7dcbc63e28e72f5f9cae16cb');assert.equal(hash(source.slice(b)),'5a1d0c6bb37460a7b3d2cedcfe3b16c0b58a7bdd8c8f47ac586525835be30877');
});
