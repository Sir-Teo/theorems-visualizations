import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from '../content/pl/ch06.shared.js';
const T=H.parseType;

test('structural parser retains arrow association, field permutation and rejects malformed types',()=>{
 assert.equal(H.showType(T('(Nat -> Bool) -> {x:Nat, f:Bool -> Top}')),'(Nat -> Bool) -> {x:Nat, f:Bool -> Top}');
 assert.equal(H.typeKey(T('{y:Bool,x:Nat}')),H.typeKey(T('{x:Nat,y:Bool}')));
 assert.deepEqual(T('A -> B -> C'),H.arrow(H.base('A'),H.arrow(H.base('B'),H.base('C'))));
 for(const s of ['','{x:Nat,x:Bool}','Nat junk','{x:Nat,}','A => B','(Nat','{x:Nat','A[' ])assert.throws(()=>T(s));
 assert.throws(()=>T('('.repeat(30)+'Nat'+')'.repeat(30)));assert.throws(()=>T('A'.repeat(1601)));
});

test('finite declarative rule saturation independently matches syntax-directed subtyping',()=>{
 // A finite, explicitly listed subterm-closed universe. Start from axioms and
 // saturate transitivity, record width/depth/permutation and arrow premises.
 const types=[H.TOP,H.BOT,H.base('A'),H.base('B'),H.record([])];
 const atoms=types.slice(0,4);
 for(const a of atoms){types.push(H.record([['x',a]]),H.record([['y',a]]));for(const b of atoms){types.push(H.arrow(a,b),H.record([['x',a],['y',b]]));}}
 types.push(T('{y:A,x:B}'));
 const keys=types.map(H.typeKey),index=t=>keys.indexOf(H.typeKey(t)),N=types.length,R=Array.from({length:N},(_,i)=>Array.from({length:N},(_,j)=>i===j||types[i].tag==='bot'||types[j].tag==='top'));
 let changed=true,rounds=0;while(changed){changed=false;rounds++;for(let i=0;i<N;i++)for(let j=0;j<N;j++)if(!R[i][j]){
  const s=types[i],t=types[j];let yes=false;
  for(let k=0;k<N&&!yes;k++)yes=R[i][k]&&R[k][j];
  if(!yes&&s.tag==='arrow'&&t.tag==='arrow')yes=R[index(t.from)][index(s.from)]&&R[index(s.to)][index(t.to)];
  if(!yes&&s.tag==='record'&&t.tag==='record')yes=t.fields.every(([k,b])=>s.fields.some(([l,a])=>l===k&&R[index(a)][index(b)]));
  if(yes){R[i][j]=true;changed=true;}
 }}
 assert(rounds>1);for(let i=0;i<N;i++)for(let j=0;j<N;j++)assert.equal(H.subtype(types[i],types[j]),R[i][j],`${H.showType(types[i])} <: ${H.showType(types[j])}`);
});

test('joins and meets satisfy bounds and least/greatest properties in an independent candidate grid',()=>{
 const list=['Top','Bottom','Nat','Bool','{}','{x:Nat}','{y:Bool}','{x:Bool}','{x:Bottom}','{x:Top,y:Nat}','Nat -> Bool','Bool -> Nat','Bottom -> Top','Top -> Bottom','{x:Nat} -> {y:Bool}','{y:Bool} -> {x:Nat}'].map(T);
 for(const a of list)for(const b of list){const j=H.join(a,b),m=H.meet(a,b);assert(H.subtype(a,j)&&H.subtype(b,j));assert(H.subtype(m,a)&&H.subtype(m,b));assert.equal(H.typeKey(j),H.typeKey(H.join(b,a)));assert.equal(H.typeKey(m),H.typeKey(H.meet(b,a)));
  for(const c of list){if(H.subtype(a,c)&&H.subtype(b,c))assert(H.subtype(j,c));if(H.subtype(c,a)&&H.subtype(c,b))assert(H.subtype(c,m));}
 }
 // Disjoint labels must survive meet; the published fullsub reference's
 // allLabels membership condition incorrectly tries both source lookups.
 assert.equal(H.typeKey(H.meet(T('{x:Nat}'),T('{y:Bool}'))),H.typeKey(T('{x:Nat,y:Bool}')));
 assert.equal(H.showType(H.join(T('Nat -> Nat'),T('Bool -> Bool'))),'Bottom -> Top');
 assert.equal(H.showType(H.meet(T('Nat -> Nat'),T('Bool -> Bool'))),'Top -> Bottom');
 assert.equal(H.subtype(T('{x:Bottom}'),H.BOT),false);
});

test('order graph quotients permutation and retains exact reachability through its cover edges',()=>{
 const g=H.selectedOrder('{x:Nat,y:Bool}; {y:Bool,x:Nat}; {x:Top}; Nat; {}');assert(g.nodes.some(n=>n.aliases.length===2));
 for(let i=0;i<g.nodes.length;i++)for(let j=0;j<g.nodes.length;j++){const seen=new Set([i]),todo=[i];while(todo.length){const u=todo.pop();for(const[a,b]of g.edges)if(a===u&&!seen.has(b)){seen.add(b);todo.push(b);}}assert.equal(seen.has(j),g.relation[i][j]);}
 assert(!H.subtype(H.TOP,T('{}')));assert(H.subtype(T('{}'),H.TOP));
});

test('subsumption executes actual projections and refuses absent static fields',()=>{
 const r=H.subsumption('{"x":3,"y":4,"color":"blue"}','{x:Nat,y:Nat}','self.x');assert(r.proof.ok);assert.equal(r.result.value,3);
 const bad=H.subsumption('{"x":3}','{x:Nat,y:Nat}','self.y');assert(!bad.proof.ok);assert.equal(bad.result,null);
 assert.throws(()=>H.subsumption('{"x":3}','{x:Nat}','self.color'));
 for(const v of ['-1','0.5','9007199254740992','[]','{"bad-label":2}'])assert.throws(()=>H.parseValue(v));
});

test('wrong arrow-domain covariance accepts an actual missing-field counterexample',()=>{
 const args=['{x:Nat,y:Nat}','Nat','{x:Nat}','Nat','self.y','{"x":3}'];const safe=H.functionWitness(...args);assert(!safe.proof.ok);assert.equal(safe.runtime,null);
 const wrong=H.functionWitness(...args,true);assert(wrong.proof.ok&&wrong.callerOK);assert.equal(wrong.runtime.ok,false);assert.match(wrong.runtime.error,/y/);
 const broad=H.functionWitness('{x:Nat}','Nat','{x:Nat,y:Nat}','Top','self.x','{"x":3,"y":4}');assert(broad.proof.ok&&broad.callerOK);assert.equal(broad.runtime.value,3);
});

test('array aliases share one store and checked failure leaves it intact',()=>{
 for(const initial of ['Cat','Kitten'])for(let index=0;index<3;index++){
  const checked=H.arrayWitness({initial,index});assert.equal(checked.status,'ArrayStoreException');assert.deepEqual(checked.heap,Array(3).fill(initial));
  const unsafe=H.arrayWitness({initial,index,policy:'unchecked'});assert.equal(unsafe.status,'unsafe read');assert.equal(unsafe.heap[index],'Dog');assert.equal(unsafe.storeSafe,false);
 }
 assert.equal(H.arrayWitness({policy:'invariant'}).status,'static rejection');assert.equal(H.arrayWitness({insert:'Kitten'}).status,'safe read');
 assert.throws(()=>H.animalSubtype('toString','toString'));assert.throws(()=>H.arrayWitness({index:3}));
});

test('explicit coercion plans agree through intermediate records and wrap function arguments',()=>{
 const r=H.coercionWitness('{"x":3,"y":4,"extra":true}','{y:Nat,x:Top}','{x:Top}');assert(r.equal);assert.deepEqual(r.a,{x:null});assert(r.viaTrace.length>r.directTrace.length);
 assert.throws(()=>H.coercionWitness('{"x":3}','Top','{x:Nat}'));
 const s=T('{x:Top} -> {x:Nat,y:Bool}'),t=T('{x:Nat,z:Bool} -> {x:Top}'),plan=H.compileCoercion(s,t),calls=[];
 const fn=H.runCoercion(plan,x=>{calls.push(x);return{x:7,y:true};});assert.deepEqual(fn({x:4,z:false}),{x:null});assert.deepEqual(calls,[{x:null}]);
 assert.throws(()=>H.runCoercion(H.compileCoercion(H.BOT,T('Nat')),0));
});

test('conditional joins type either branch without revealing fields absent from its joined type',()=>{
 for(const condition of [true,false]){const r=H.conditionalWitness('{"x":3,"color":"red"}','{"x":8,"extra":true}',condition,'self.x');assert.equal(H.showType(r.type),'{x:Nat}');assert.equal(r.result.value,condition?3:8);}
 assert.throws(()=>H.conditionalWitness('{"x":3}','{"y":8}',true,'self.x'));
});

test('object method closures distinguish open self from a closed superclass self',()=>{
 const open=H.objectWitness({commands:'inc; inc; accesses; get'}),closed=H.objectWitness({commands:'inc; inc; accesses; get',binding:'closed'});
 assert.equal(open.status,'complete');assert.deepEqual(open.store,[3,2]);assert.deepEqual(closed.store,[3,0]);assert(open.trace.some(t=>t.event==='call'&&t.note==='self.set → object1.set'));assert(closed.trace.some(t=>t.event==='call'&&t.note==='self.set → object0.set'));
 const doubled=H.objectWitness({override:'double',commands:'inc; get'});assert.deepEqual(doubled.store,[4,1]);
 const cutoff=H.objectWitness({override:'recursive',commands:'inc',fuel:60});assert.equal(cutoff.status,'inconclusive');assert.match(cutoff.error,/Fuel|depth/);assert.equal(cutoff.results.length,0);
 assert.throws(()=>H.objectWitness({commands:'run anything'}));assert.throws(()=>H.objectWitness({initial:.5}));
});

import * as F from '../content/pl/ch06.fj.shared.js';
const classes=()=>JSON.parse(F.FJ_CLASSES),encode=JSON.stringify;
test('FJ executes field projection, functional update and dynamic dispatch through an upcast',()=>{
 const values={update:'(new Pair (new B) (new B))',dispatch:'(new B)',projection:'(new B)'};
 for(const [key,value]of Object.entries(values)){const r=F.runFJ(F.FJ_CLASSES,F.FJ_EXAMPLES[key]);assert.equal(r.status,'value',r.error);assert.equal(F.showFJ(r.value),value);assert(r.trace.every(t=>t.preserved));assert(r.classes.length===3);}
 const r=F.runFJ(F.FJ_CLASSES,F.FJ_EXAMPLES.dispatch);assert(r.trace.some(t=>t.detail.includes('SecondPair.choose → SecondPair.choose')));assert.equal(r.initial.type,'Object');assert.equal(r.trace.at(-1).type,'B');
});
test('FJ source-safe cast chain reaches a permitted intermediate stupid cast and a checked failure',()=>{
 const r=F.runFJ(F.FJ_CLASSES,F.FJ_EXAMPLES.failure,{allowStupid:false});assert.equal(r.status,'cast failure');assert.equal(r.initial.type,'A');assert.equal(r.initial.warnings.length,0);assert.equal(r.steps,1);assert(r.trace.at(-1).warnings.some(x=>x.includes('B to A')));assert.deepEqual(r.cast,{actual:'B',target:'A',path:[]});
 assert.equal(F.runFJ(F.FJ_CLASSES,'(cast A (new B))',{allowStupid:false}).status,'rejected');
 assert.equal(F.runFJ(F.FJ_CLASSES,'(cast Object (new A))').status,'value');
});
test('FJ checks all classes, inherited field order and exact historical override types',()=>{
 const mutate=fn=>{const cs=classes();fn(cs);return F.runFJ(encode(cs),'(new A)');};
 for(const change of [c=>c[0].extends='Missing',c=>{c[0].extends='B';c[1].extends='A';},c=>c[3].fields.push(['fst','A']),c=>c[3].methods[0].returns='B',c=>c[3].methods[0].params.push(['x','Object']),c=>c[1].methods.push({name:'unused',params:[],returns:'A',body:'(new B)'}),c=>c[1].methods.push({name:'bad',params:[['this','A']],returns:'A',body:'this'})])assert.equal(mutate(change).status,'rejected');
 const cs=classes();cs[3].fields.push(['last','A']);const t=F.parseClassTable(encode(cs));assert.deepEqual(F.fieldsOf(t,'SecondPair'),[['fst','Object'],['snd','Object'],['last','A']]);const r=F.runFJ(encode(cs),'(get (new SecondPair (new A) (new B) (new A)) last)');assert.equal(r.status,'value');assert.equal(F.showFJ(r.value),'(new A)');
 assert.equal(F.runFJ(F.FJ_CLASSES,'(new Pair (new A))').status,'rejected');assert.equal(F.runFJ(F.FJ_CLASSES,'(call (new A) choose)').status,'rejected');
});
test('FJ substitutions follow parameters and this through nested evaluation contexts',()=>{
 const cs=classes();cs[0].methods=[{name:'pair',params:[['first','Object'],['second','Object']],returns:'Pair',body:'(new Pair first second)'}];
 const r=F.runFJ(encode(cs),'(get (call (new A) pair (cast Object (new B)) (new A)) fst)');assert.equal(r.status,'value');assert.equal(F.showFJ(r.value),'(new B)');assert.deepEqual(r.trace[1].path,[1,3]);assert(r.trace.some(t=>t.rule==='R-Invk'));assert(r.trace.every(t=>t.preserved));
});
test('FJ distinguishes a complete-state cycle, growth and zero fuel',()=>{
 const cs=classes();cs[0].methods=[{name:'loop',params:[],returns:'Object',body:'(call this loop)'},{name:'grow',params:[],returns:'Object',body:'(new Pair (call this grow) this)'}];
 const cycle=F.runFJ(encode(cs),'(call (new A) loop)');assert.equal(cycle.status,'cycle');assert.equal(cycle.steps,1);assert.equal(cycle.cycleStart,0);
 const growing=F.runFJ(encode(cs),'(call (new A) grow)',{fuel:5});assert.equal(growing.status,'inconclusive');assert.equal(growing.steps,5);assert.match(growing.error,/Fuel/);
 assert.equal(F.runFJ(F.FJ_CLASSES,F.FJ_EXAMPLES.update,{fuel:0}).status,'inconclusive');assert.equal(F.runFJ(F.FJ_CLASSES,'(new A)',{fuel:0}).status,'value');assert.throws(()=>F.runFJ(F.FJ_CLASSES,'(new A)',{fuel:-1}));
});
test('FJ parsing rejects malformed syntax and class schema before execution',()=>{
 for(const term of ['','(new A) (new B)','(get (new A))','(cast A)','(call (new A))','(unknown A)','(new A','42','constructor'])assert.equal(F.runFJ(F.FJ_CLASSES,term).status,'rejected',term);
 for(const src of ['{}','null','[null]','[{"name":"A","extends":"Object","fields":[],"methods":[],"extra":1}]'])assert.equal(F.runFJ(src,'(new Object)').status,'rejected');
 assert.throws(()=>F.parseFJ('('.repeat(50)+'new A'+')'.repeat(50)));assert.throws(()=>F.showFJ(['new','A',,...[]]));
});
test('named immutable interfaces distinguish equal shapes from declared ancestry',()=>{
 const r=H.nominalWitness(H.NAMED_INTERFACES);assert(!r.nominal&&r.structural);assert.deepEqual(r.path,['Coordinate']);
 const pixel=H.nominalWitness(H.NAMED_INTERFACES,'Pixel','Point');assert(pixel.nominal&&pixel.structural);assert.deepEqual(pixel.path,['Pixel','Point']);
 const reverse=H.nominalWitness(H.NAMED_INTERFACES,'Point','Pixel');assert(!reverse.nominal&&!reverse.structural);
 const cs=JSON.parse(H.NAMED_INTERFACES);cs[1].shape='{x:Bool}';assert.throws(()=>H.nominalWitness(encode(cs),'Pixel','Point'),/structural/);
 cs[1].shape='{x:Nat,y:Nat,color:String}';cs[0].parent='Pixel';assert.throws(()=>H.nominalWitness(encode(cs)),/cycle/);assert.throws(()=>H.nominalWitness(H.NAMED_INTERFACES,'unknown','Point'));
});

test('independent immutable-object evaluator agrees with FJ reductions on generated closed terms',()=>{
 // Host objects with keyed fields and direct method implementations form a
 // big-step oracle, independent of the FJ substitution/context reducer.
 const subtype=(actual,target)=>target==='Object'||actual===target||actual==='SecondPair'&&target==='Pair';
 function evalTerm(t){const [op,a,b,...rest]=t;if(op==='new'){const args=t.slice(2).map(evalTerm);return{class:a,fields:a==='Pair'||a==='SecondPair'?{fst:args[0],snd:args[1]}:{}};}
  if(op==='cast'){const v=evalTerm(b);if(!subtype(v.class,a))throw 'cast';return v;}
  const receiver=evalTerm(a);if(op==='get')return receiver.fields[b];const args=rest.map(evalTerm);
  if(b==='choose')return receiver.fields[receiver.class==='SecondPair'?'snd':'fst'];
  if(b==='setfst')return{class:'Pair',fields:{fst:args[0],snd:receiver.fields.snd}};
  throw Error('Oracle grammar');
 }
 const print=v=>'(new '+v.class+(Object.keys(v.fields).length?' '+print(v.fields.fst)+' '+print(v.fields.snd):'')+')';
 const bases=[['new','A'],['new','B'],['new','Object']],pairs=[];
 for(const c of ['Pair','SecondPair'])for(const a of bases)for(const b of bases)pairs.push(['new',c,a,b]);
 const seeds=[...bases,...pairs],terms=[...seeds];for(const p of pairs){terms.push(['get',p,'fst'],['get',p,'snd'],['call',p,'choose']);for(const x of seeds)terms.push(['call',p,'setfst',x]);}
 for(const x of seeds)for(const c of ['Object','A','B','Pair','SecondPair']){terms.push(['cast',c,x],['cast',c,['cast','Object',x]]);if(c==='Pair'||c==='SecondPair')terms.push(['get',['cast',c,x],'snd'],['call',['cast',c,x],'choose']);}
 let success=0,failed=0;for(const t of terms){let expected,cast=false;try{expected=print(evalTerm(t));}catch(e){assert.equal(e,'cast');cast=true;}
  const r=F.runFJ(F.FJ_CLASSES,F.showFJ(t));if(cast){assert.equal(r.status,'cast failure',F.showFJ(t));failed++;}else{assert.equal(r.status,'value',r.error);assert.equal(F.showFJ(r.value),expected);success++;}assert(r.trace.every(x=>x.preserved));
 }
 assert.equal(terms.length,747);assert(success>0&&failed>0);
});
