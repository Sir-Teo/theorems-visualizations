import test from 'node:test';import assert from 'node:assert/strict';import * as L from '../content/ling/ch05.shared.js';
import {lingSyllabusAtWave5} from './wave6-ling-preservation.shared.mjs';
const treeCode=t=>t.sym+'('+t.kids.map(treeCode).join(',')+')';
// Independent complete top-down span enumeration for strict binary, epsilon-free grammars.
function referenceTrees(g,w,a=g.start,i=0,j=w.length){const out=[];for(const r of g.rules.filter(r=>r.lhs===a)){
 if(r.rhs.length===1){if(j===i+1&&w[i]===r.rhs[0])out.push({sym:a,kids:[{sym:w[i],kids:[]}]});}
 else for(let k=i+1;k<j;k++)for(const x of referenceTrees(g,w,r.rhs[0],i,k))for(const y of referenceTrees(g,w,r.rhs[1],k,j))out.push({sym:a,kids:[x,y]});
}return out;}
test('linguistic grammar and sentence editors state and enforce their finite token domains',()=>{
 const g=L.attachmentGrammar();assert.ok(g.terminals.includes('telescope'));assert.deepEqual(L.sentence('I SAW the telescope'),['i','saw','the','telescope']);assert.throws(()=>L.parseGrammar('S -> A'));assert.throws(()=>L.parseGrammar('S -> eps a'));assert.throws(()=>L.parseGrammar('S -> '));assert.throws(()=>L.parseGrammar('S -> wordsthatarefartoolong'));assert.throws(()=>L.sentence('2 + 3'));assert.deepEqual(L.sentence(''),[]);
});
test('packed forest counts and every unranked tree equal independent span enumeration',()=>{
 const grammars=[L.attachmentGrammar(),L.parseGrammar('S -> A A | a; A -> A A | a'),L.parseGrammar('S -> A B | B A; A -> a | b; B -> a | b')];
 const words=[[],['a'],['a','a'],['a','a','a'],['a','a','a','a'],['b','a'],L.sentence('I saw the man with the telescope'),L.sentence('I saw the dog in the park with a telescope')];
 for(const g of grammars)for(const w of words){const z=L.parseForest(g,w),ref=referenceTrees(g,w),actual=Array.from({length:Number(z.count)},(_,k)=>z.treeAt(BigInt(k)));assert.equal(z.count,BigInt(ref.length));assert.deepEqual(actual.map(treeCode).sort(),ref.map(treeCode).sort());assert.equal(new Set(actual.map(treeCode)).size,actual.length);for(const t of actual)assert.deepEqual(L.yieldWords(t),w);assert.throws(()=>z.treeAt(z.count));}
 const ambiguous=L.parseForest(L.attachmentGrammar(),L.sentence('I saw the man with the telescope'));assert.equal(ambiguous.count,2n);assert.notDeepEqual(L.headDependencies(ambiguous.treeAt(0)).heads,L.headDependencies(ambiguous.treeAt(1)).heads);
});
test('counted grammar refusal never silently converts a parse multiplicity',()=>{
 for(const s of ['S -> A; A -> a','S -> eps','S -> a S b | eps'])assert.throws(()=>L.parseForest(L.parseGrammar(s),[]),/binary category/);
});
test('tree spans are actual contiguous yields and laminarity rejects proper crossings',()=>{
 const z=L.parseForest(L.attachmentGrammar(),L.sentence('I saw the man with the telescope'));
 for(let k=0n;k<z.count;k++){const spans=L.constituents(z.treeAt(k));assert.equal(L.laminar(spans).valid,true);for(const s of spans)assert.ok(s.lo>=0&&s.hi<=z.tokens.length&&s.lo<s.hi);assert.ok(spans.some(s=>s.label==='S'&&s.lo===0&&s.hi===z.tokens.length));}
 assert.equal(L.laminar([{lo:0,hi:3},{lo:2,hi:5}]).valid,false);assert.equal(L.laminar([{lo:0,hi:2},{lo:2,hi:5}]).valid,true);assert.equal(L.laminar([{lo:-1,hi:2}]).valid,false);assert.deepEqual(L.replaceSpan(['the','dog','slept'],0,2,['it']),['it','slept']);assert.throws(()=>L.replaceSpan(['dog'],0,2,[]));
});
test('every small dependency tree agrees with independent rooted-path and crossing tests',()=>{
 let valid=0;
 for(let n=1;n<=5;n++)for(let code=0;code<(n+1)**n;code++){let q=code;const heads=Array.from({length:n},()=>{const h=q%(n+1)-1;q=Math.floor(q/(n+1));return h;}),roots=heads.flatMap((h,i)=>h<0?[i]:[]);
  const ref=roots.length===1&&heads.every((h,i)=>{const seen=new Set([i]);while(h>=0){if(seen.has(h))return false;seen.add(h);h=heads[h];}return true;});const z=L.dependencyAudit(heads);assert.equal(z.valid,ref,JSON.stringify(heads));if(!ref)continue;valid++;
  let crossing=false;const edges=heads.map((h,i)=>[Math.min(h,i),Math.max(h,i)]);for(const[a,b]of edges)for(const[c,d]of edges)if(a<c&&c<b&&b<d)crossing=true;assert.equal(z.projective,!crossing,JSON.stringify(heads));assert.equal(z.crossings.length===0,!crossing);
 }
 assert.equal(valid,1+2+9+64+625);
});
test('head conversion is a declared lossy map, not a unique inverse of phrase structure',()=>{
 const t=L.parseForest(L.attachmentGrammar(),L.sentence('I saw the dog')).treeAt();const wrapped={sym:'EXTRA',kids:[t]};assert.deepEqual(L.headDependencies(t).heads,L.headDependencies(wrapped).heads);assert.notDeepEqual(L.constituents(t),L.constituents(wrapped));assert.throws(()=>L.headDependencies({sym:'S',kids:[{sym:'ε',kids:[]}]}),/epsilon-free/);
});
test('centre and right embedding are real accepted words with actual predictive stacks',()=>{
 for(let d=0;d<=4;d++){const c=L.embedding('centre',d),r=L.embedding('right',d);assert.equal(c.status,'accepted');assert.equal(r.status,'accepted');assert.equal(c.tokens.length,3+4*d);assert.equal(r.tokens.length,c.tokens.length);assert.equal(c.conflicts.length,0);assert.equal(r.conflicts.length,0);assert.equal(c.peak,5+d);assert.equal(r.peak,d?5:4);assert.ok(c.frames.every(f=>f.stack.length<=c.peak));assert.ok(r.frames.every(f=>f.stack.length<=r.peak));}
});

test('garden-path parser saves and restores actual alternatives; a bound never becomes rejection',()=>{
  const prefix='the horse raced past the barn'.split(' '),full=[...prefix,'fell'];
  for(const backtrack of[false,true])assert.equal(L.gardenRun(prefix,{backtrack}).status,'accepted');
  const greedy=L.gardenRun(full,{backtrack:false}),search=L.gardenRun(full);
  assert.equal(greedy.status,'rejected');assert.equal(search.status,'accepted');assert.ok(search.rewinds>0);
  assert.ok(search.frames.some((f,i)=>i&&f.action==='backtrack'&&f.at<search.frames[i-1].at));
  assert.equal(L.gardenRun(full,{maxSteps:1}).status,'limit');
  assert.equal(L.gardenRun(['the','barn','fell']).status,'accepted');assert.equal(L.gardenRun(['fell']).status,'rejected');
  for(const f of search.frames)assert.ok(f.at>=0&&f.at<=full.length);
});
test('case blocks use actual independent case totals and ordered dependency endpoints',()=>{
  for(let a=0;a<=4;a++)for(let b=0;b<=4;b++)for(let c=0;c<=4;c++)for(let d=0;d<=4;d++){
    const r=L.casePattern(a,b,c,d);assert.equal(r.matched,a===c&&b===d);assert.equal(r.letters.join(''),'a'.repeat(a)+'b'.repeat(b)+'c'.repeat(c)+'d'.repeat(d));
    assert.equal(r.words.length,a+2*b+c+d);for(const [left,right,kind]of r.edges)assert.deepEqual([r.letters[left],r.letters[right]],kind==='acc'?['a','c']:['b','d']);
    if(a===c&&b===d)assert.equal(r.edges.length,a+b);
    if(a+b===c+d&&a>=c&&b>=d)assert.ok(r.matched);
  }
  assert.equal(L.casePattern(1,0,1,0).crossings,0);assert.equal(L.casePattern(1,1,1,1).crossings,1);
});
test('X-bar template obeys its stated order and preserves head-complement sisterhood',()=>{
  for(const cat of['N','V','P','A'])for(const first of[false,true])for(const spec of[false,true])for(let n=0;n<=3;n++){
    const t=L.xbarTree(cat,first,spec,n);assert.equal(t.sym,cat+'P');assert.equal(t.kids.length,spec?2:1);let bar=t.kids.at(-1);
    for(let j=0;j<n;j++){assert.equal(bar.kids[0].sym,'AdjunctP');bar=bar.kids[1];}
    assert.deepEqual(bar.kids.map(x=>x.sym),first?[cat,'CompP']:['CompP',cat]);
  }
});
test('filler-gap operation follows an actual path and reports enclosing declared island domains',()=>{
  const leaf=sym=>({sym,kids:[]}),object={sym:'NP',kids:[leaf('what')]},vp={sym:'VP',kids:[leaf('read'),object]},tree={sym:'TP',kids:[leaf('they'),vp]};
  const r=L.extract(tree,[1,1]);assert.deepEqual(r.original,['they','read','what']);assert.deepEqual(r.surface,['what','they','read']);assert.equal(r.remainder.kids[1].kids[1].gap,true);assert.equal(r.blocked,false);
  const blocked=L.extract({...tree,island:'subject'},[1,1]);assert.equal(blocked.blocked,true);assert.deepEqual(blocked.boundaries,['subject']);assert.throws(()=>L.extract(tree,[2]));assert.throws(()=>L.extract(tree,[]));
});

test('WALS snapshot totals and conditional counts come from distinct actual coded samples',async()=>{
 const{typologyRows}=await import('../content/ling/ch05.data.js'),z=L.typologySummary(typologyRows);
 assert.deepEqual(z.orders,[564,488,95,25,11,4,189]);assert.deepEqual(z.pairs,[472,14,42,456,158]);assert.equal(z.orderTotal,1376);assert.equal(z.pairTotal,1142);assert.equal(z.postGivenOV,472/486);assert.equal(z.preGivenVO,456/498);
 assert.equal(new Set(typologyRows.map(r=>r[0])).size,typologyRows.length);for(const r of typologyRows){assert.ok(Number.isFinite(r[2])&&r[2]>=-180&&r[2]<=360&&Math.abs(L.mapLongitude(r[2]))<=180);assert.ok(Number.isFinite(r[3])&&Math.abs(r[3])<=90);}
 const areas=[...new Set(typologyRows.map(r=>r[4]))];assert.equal(areas.reduce((n,a)=>n+L.typologySummary(typologyRows,a).orderTotal,0),1376);assert.equal(areas.reduce((n,a)=>n+L.typologySummary(typologyRows,a).pairTotal,0),1142);assert.equal(L.typologySummary(typologyRows,'absent').preGivenVO,null);
});
test('bigram probability is the product of fitted conditional counts, including boundaries',()=>{
 const m=L.bigramModel([['dogs','sleep'],['cats','sleep'],['dogs','run']]);assert.equal(m.probability(['dogs','sleep']).p,1/3);assert.equal(m.probability(['cats','sleep']).p,1/3);assert.equal(m.probability(['dogs','run']).p,1/3);assert.equal(m.probability(['cats','run']).p,0);assert.equal(m.probability([]).p,0);
 for(const row of m.rows.values()){const total=[...row.values()].reduce((a,b)=>a+b,0);assert.equal([...row.values()].reduce((a,b)=>a+b/total,0),1);}
});

test('syntax chapter preserves all frozen identities, Paper links and every other chapter',async()=>{
 const{default:a}=await import('../content/ling/ch05.js'),{default:b}=await import('../content/ling/ch05-b.js'),{default:s}=await import('../content/ling/syllabus.js'),{createHash}=await import('node:crypto'),items=[...a.items,...b.items],plan=s.chapters.find(c=>c.n===5);
 assert.deepEqual(items.map(i=>[i.num,i.kind,i.name]),plan.items.map(i=>[i.num,i.kind,i.name]));assert.deepEqual(items.map(i=>i.num),Array.from({length:16},(_,j)=>'5.'+(j+1)));assert.deepEqual(items.map(i=>i.kind),['Concept','Method','Concept','Phenomenon','Concept','Phenomenon','Phenomenon','Concept','Theorem','Concept','Concept','Concept','Concept','Concept','Algorithm','Paper']);
 for(const i of items){const p=plan.items.find(x=>x.num===i.num);for(const k of['deps','refs','introduces','paper','verify','see'])assert.deepEqual(i[k],p[k],i.num+' '+k);assert.equal(typeof i.viz,'function');}
 assert.deepEqual(items[15].paper,{authors:'Noam Chomsky',year:1957,title:'Syntactic Structures',venue:'’s-Gravenhage: Mouton, 1957',doi:'10.1515/9783112316009'});assert.deepEqual(items[15].introduces,['ling-5.3','ling-5.12']);assert.equal(items[15].verify,true);
 assert.deepEqual(items.flatMap(i=>i.deps).filter(x=>/^toc-(6|7|8)\./.test(x)),[]);
 assert.equal(createHash('sha256').update(JSON.stringify(lingSyllabusAtWave5(s).chapters.filter(c=>c.n!==5))).digest('hex'),'f34d0eb13d94d9da25f1363271a9dab321c9ea04dd4941903da88a2f86229851');
});

test('packed forest retains exact counts and ranks beyond binary64 integer precision',()=>{
 const vars=['S','A','B','C'],rules=vars.flatMap(lhs=>[{lhs,rhs:['a']},...vars.flatMap(a=>vars.map(b=>({lhs,rhs:[a,b]})))]),g=L.makeGrammar('S',rules),n=12,f=L.parseForest(g,Array(n).fill('a'));
 let central=1n;for(let j=1;j<=n-1;j++)central=central*BigInt(n-1+j)/BigInt(j);const catalan=central/BigInt(n),expected=catalan*16n**BigInt(n-1);
 assert.equal(f.count,expected);assert.ok(expected>BigInt(Number.MAX_SAFE_INTEGER));for(const rank of[0n,1n,expected/2n,expected-2n,expected-1n])assert.deepEqual(L.yieldWords(f.treeAt(rank)),Array(n).fill('a'));
 assert.notEqual(treeCode(f.treeAt(expected-1n)),treeCode(f.treeAt(expected-2n)));assert.throws(()=>f.treeAt(expected));
});
