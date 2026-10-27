import test,{after}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import{createHash}from'node:crypto';
import*as H from'../content/polsci/ch07.shared.js';import chapter from'../content/polsci/ch07.js';import syllabus from'../content/polsci/syllabus.js';
const Q=H.Q,fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-polsci-reference.json',import.meta.url))),stats={cases:0,comparisons:0,asymptoticValues:0,worstAsymptoticUlps:0};
const ulp=x=>x===0||Math.abs(x)<2**-1022?Number.MIN_VALUE:2**(Math.floor(Math.log2(Math.abs(x)))-52);
function compare(a,b,path){
 if(b===null||typeof b!=='object'){
  stats.comparisons++;if(typeof a==='bigint'){assert.equal(String(a),b,path);return;}
  if(path.includes('.asymptoticWithin.')){const error=Math.abs(a-b)/ulp(b);assert.ok(error<=4,path+' asymptotic display4ULP budget '+error);stats.asymptoticValues++;stats.worstAsymptoticUlps=Math.max(stats.worstAsymptoticUlps,error);return;}
  assert.ok(Object.is(a,b),path+': '+String(a)+' expected '+String(b));return;
 }
 assert.ok(a&&typeof a==='object',path);assert.equal(Array.isArray(a),Array.isArray(b),path+' array shape');assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort(),path+' complete keys');for(const[k,v]of Object.entries(b))compare(a[k],v,path+'.'+k);
}

for(const family of Object.keys(fixture.families))test('POLSCI7 complete independent '+family+' objects',()=>{for(const row of fixture.cases.filter(r=>r.family===family)){compare(H[family](row.args),row.expected,family+' '+JSON.stringify(row.args));stats.cases++;}});
const fraction=x=>Q.exactText(x.exact),sum=xs=>xs.reduce((a,b)=>Q.add(a,b.exact),Q.ZERO);
test('POLSCI7 declared integer and dense-vector domains reject malformed inputs',()=>{
 for(const [family,args]of[['council',{weights:[1,,2]}],['penrose',{roots:[1,2,,4,5]}],['trade',{generators:[3,,48]}],['council',{weights:[-1,2]}],['council',{quota:.5}],['ordering',{index:24}],['ordering',{reveal:5}],['eec',{fourCountries:1}],['entrant',{newWeight:-1}],['penrose',{scheme:'invented'}],['legislature',{H:2}],['legislature',{vicePresident:1}],['legislature',{houseYes:436}],['vetoCouncil',{quota:4}],['vetoCouncil',{seed:1000}],['trade',{mode:'invented'}],['electoral',{quota:539}],['electoral',{scale:0}],['electoral',{belief:'observed voters'}],['portfolios',{seats:[1,2,3]}],['portfolios',{cabinetSize:0}]])assert.throws(()=>H[family](args),family+' '+JSON.stringify(args));
 const a=[1,2,3];delete a[1];Object.setPrototypeOf(a,Object.assign(Object.create(Array.prototype),{1:2}));assert.throws(()=>H.council({weights:a}),'inherited index is not source data');
});
test('POLSCI7 dummy weight, degeneracy and exact probability units are distinct',()=>{
 const z=H.council({weights:[2,1,0],quota:2,mask:1});assert.equal(fraction(z.ssi[0]),'1');assert.equal(fraction(z.normalized[0]),'1');assert.equal(fraction(z.absolute[0]),'1');assert.equal(fraction(z.weightShares[1]),'1/3');assert.equal(fraction(z.ssi[1]),'0');
 const bad=H.council({weights:[0,0],quota:1,mask:3});assert.equal(bad.valid,false);assert.deepEqual(bad.normalized,[null,null]);assert.equal(bad.selected.win,false);
 for(const row of fixture.cases.filter(c=>c.family==='council'&&c.expected.valid)){const g=H.council(row.args);assert.equal(Q.exactText(sum(g.ssi)),'1');assert.equal(Q.exactText(sum(g.normalized)),'1');}
});
test('POLSCI7 a balanced overlapping trade is a certificate, while a bounded search may be inconclusive',()=>{
 for(const mode of['bicameral','custom']){const z=H.trade({mode});assert.ok(z.trade);assert.equal(z.certificate,null);}
 const weighted=H.trade({mode:'weighted'});assert.equal(weighted.trade,null);assert.ok(weighted.certificate);assert.equal(weighted.certificate.weights.length,6);
});
test('POLSCI7 all24 orderings each have a single pivot and conserve the exact index',()=>{
 const tally=[0,0,0,0];for(let index=0;index<24;index++){const z=H.ordering({index});assert.equal(z.steps.filter(s=>s.pivot).length,1);tally[z.pivot]++;}assert.deepEqual(tally,H.ordering().ssiCounts.map(Number));
});
test('POLSCI7 Luxembourg is a dummy only under the pure historical weighted rule',()=>{
 const pure=H.eec(),four=H.eec({fourCountries:true});assert.equal(fraction(pure.ssi[5]),'0');assert.equal(fraction(four.ssi[5]),'1/60');assert.equal(fraction(four.absolute[5]),'1/32');
});
test('POLSCI7 square-root weights do not guarantee equal finite citizen power',()=>{
 const z=H.penrose();assert.equal(Q.exactText(sum(z.idealDelegateShares)),'1');assert.ok(Q.sign(Q.sub(z.citizenRange.max.exact,z.citizenRange.min.exact))>0);for(let i=0;i<5;i++)assert.equal(Q.sign(Q.sub(z.citizen[i].exact,Q.mul(z.within[i].exact,z.game.absolute[i].exact))),0);
});
test('POLSCI7 full-membership bill route includes override, tie break and absent-role semantics',()=>{
 const z=H.legislature();assert.ok(Math.abs(z.ssi[2].value-.16312036276443242)<1e-16);assert.equal(Q.exactText(sum(z.bodySSI)),'1');
 const absent=H.legislature({vicePresident:false});assert.equal(absent.ssi[3],null);assert.equal(absent.absolute[3],null);assert.equal(fraction(absent.bodySSI[3]),'0');
 const dummy=H.legislature({H:7,S:5,houseYes:4,senateYes:3});assert.equal(dummy.counts[3],1);assert.equal(fraction(dummy.ssi[3]),'0');
 const tied=H.legislature({senateYes:50,override:false});assert.equal(tied.routes.tieBreak,true);assert.equal(tied.routes.passes,true);assert.equal(H.legislature({senateYes:50,viceYes:false,override:false}).routes.passes,false);
 assert.equal(H.legislature({houseYes:290,senateYes:67,presidentYes:false}).routes.override,true);assert.equal(H.legislature({houseYes:289,senateYes:67,presidentYes:false}).routes.passes,false);
});
test('POLSCI7 Electoral College uses all51 actual allocations and explicitly hypothetical lower electorates',()=>{
 const facts=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-polsci-source-facts.json',import.meta.url))),z=H.electoral();assert.equal(z.rows.length,51);assert.equal(z.rows.reduce((a,r)=>a+r.weight,0),538);for(const row of z.rows)assert.equal(row.weight,facts.electoralVotesByName[row.name]);assert.equal(z.hypotheticalPopulationIsObserved,false);assert.equal(z.wholeJurisdictionBlocAssumption,true);
 const prior=H.electoral({belief:'common uniform lean'});for(const row of prior.rows)assert.equal(fraction(row.within),'1/'+row.hypotheticalPopulation);
});
test('POLSCI7 entry contexts obey exact duplication plus gains minus losses; zero-weight entry preserves shares',()=>{
 for(const row of fixture.cases.filter(c=>c.family==='entrant')){const z=H.entrant(row.args);for(let i=0;i<z.weights.length;i++)assert.equal(z.after.swings[i],2n*z.before.swings[i]+BigInt(z.changes[i].gained.length-z.changes[i].lost.length));}
 const zero=H.entrant({newWeight:0});for(const d of zero.deltas){assert.equal(d.absolute.sign,0);assert.equal(d.normalized.sign,0);assert.equal(d.ssi.sign,0);}
});
test('POLSCI7 cabinets conserve actual authored portfolios and do not fabricate empirical microdata',()=>{
 for(const row of fixture.cases.filter(c=>c.family==='portfolios')){const z=H.portfolios(row.args);assert.equal(z.observedCabinetMicrodata,false);assert.equal(z.counts.reduce((a,b)=>a+b),z.coalitionSeats?z.cabinetSize:0);for(let i=0;i<4;i++)if(!(z.mask&(1<<i)))assert.equal(z.portfolioShares[i],null);}
 const z=H.portfolios();assert.deepEqual(z.sourceSummary.map(x=>x.countryYears),[697,478,376]);
});
test('POLSCI7 returned mutations never alter private combinatorial caches or later replays',()=>{
 for(const family of['council','ordering','entrant','eec','penrose','legislature','vetoCouncil','trade','electoral','portfolios']){const original=H[family](),mutated=H[family]();const corrupt=x=>{if(!x||typeof x!=='object')return;for(const k of Object.keys(x)){if(typeof x[k]==='bigint')x[k]=999n;else if(typeof x[k]==='number')x[k]=999;else if(typeof x[k]==='boolean')x[k]=!x[k];else corrupt(x[k]);}};corrupt(mutated);assert.deepEqual(H[family](),original,family);}
});
test('POLSCI7 eleven complete lessons preserve frozen identities, ordered dependencies and flag property absence',()=>{
 const frozen=JSON.parse(fs.readFileSync(new URL('../docs/wave-6-plan.json',import.meta.url))).chapters.find(c=>c.collection==='polsci').items,outline=syllabus.chapters.find(c=>c.n===7).items;assert.equal(chapter.items.length,11);
 for(const[i,item]of chapter.items.entries()){for(const k of['num','kind','name','deps','paper','introduces','verify','see']){assert.deepEqual(item[k],frozen[i][k],item.num+' '+k);assert.equal(Object.hasOwn(item,k),Object.hasOwn(frozen[i],k),item.num+' '+k+' property');}for(const k of['num','kind','name','deps','refs'])assert.deepEqual(item[k],outline[i][k]);assert.equal(item.caption,outline[i].pic);for(const k of['statement','idea','scope','caption'])assert.ok(item[k].length>120,item.num+' '+k);assert.equal(typeof item.viz,'function');}
});
test('POLSCI7 complete old syllabus changes only researched chapter7 refs/pic',()=>{const before=JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-polsci-syllabus-before.json',import.meta.url))),strip=c=>c.n!==7?c:{...c,items:c.items.map(({refs,pic,...rest})=>rest)};assert.deepEqual({...syllabus,chapters:syllabus.chapters.map(strip)},{...before,chapters:before.chapters.map(strip)});});
test('POLSCI7 all579 preimages preserve578 exact raw files and the sole syllabus semantic exception',()=>{const pins=JSON.parse(fs.readFileSync(new URL('../docs/verification/wave6-polsci-preimages.json',import.meta.url))).rawPins;assert.equal(Object.keys(pins).length,579);let n=0;for(const[path,sha]of Object.entries(pins))if(path!=='content/polsci/syllabus.js'){assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../'+path,import.meta.url))).digest('hex'),sha,path);n++;}assert.equal(n,578);});
test('POLSCI7 all eleven real drawing consumers execute defaults, endpoints, modes and clock movement',()=>{
 for(const item of chapter.items){const controls=[],choices=[],toggles=[],draws=[],reads=[];let marks=0;
  const finite=xs=>{for(const x of xs)if(typeof x==='number')assert.ok(Number.isFinite(x),item.num+' finite geometry');};
  const api={stage:o=>({o,end(){},begin(){},setView(a,b){finite([...a,...b]);},path(ps){ps.forEach(finite);marks++;},rect(...xs){finite(xs.slice(0,4));marks++;},line(...xs){finite(xs.slice(0,4));marks++;},arrow(...xs){finite(xs.slice(0,4));marks++;},circle(...xs){finite(xs.slice(0,3));marks++;},hline(y){finite([y]);marks++;},dot(...xs){finite(xs.slice(0,2));marks++;},text(t,x,y){finite([x,y]);marks++;}}),slider(label,min,max,value){const c={label,min,max,value,el:{hidden:false}};controls.push(c);return c;},select(label,options,value){const c={label,options,value,el:{hidden:false}};choices.push(c);return c;},toggle(label,value){const c={label,value,el:{hidden:false}};toggles.push(c);return c;},render(fn){draws.push(fn);},animate(fn){draws.push(fn);},readout(fn){reads.push(fn);},legend(){},mix(){return'blue';}};
  item.viz(api);const run=t=>{draws.forEach(fn=>fn(t));reads.forEach(fn=>assert.doesNotMatch(fn(),/NaN|Infinity|\[object Object\]/,item.num+' finite readout'));};run(0);
  for(const c of controls){const saved=c.value;for(const value of[c.min,c.max]){c.value=value;run(0);}c.value=saved;}
  for(const c of choices){const saved=c.value;for(const value of c.options){c.value=value;run(0);}c.value=saved;}
  for(const c of toggles){const saved=c.value;c.value=!saved;run(0);c.value=saved;}
  run(.125);run(.25);assert.ok(marks>0,item.num+' actual drawn geometry');
 }
});
after(()=>{assert.equal(stats.cases,528);console.log('POLSCI7 complete independent reference statistics '+JSON.stringify(stats));});
