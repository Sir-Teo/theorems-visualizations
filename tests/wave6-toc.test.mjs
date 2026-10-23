import test from 'node:test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as H from '../content/toc/ch06.shared.js';
const words=(alphabet,n)=>{let layer=[[]],out=[[]];for(let k=1;k<=n;k++){layer=layer.flatMap(w=>alphabet.map(a=>[...w,a]));out.push(...layer);}return out;};
const set=a=>new Set(a.map(x=>JSON.stringify(x)));
const balanced=w=>{let n=0;for(const a of w){n+=a==='a'?1:-1;if(n<0)return false;}return n===0;};
const counts=w=>/^a*b*$/.test(w.join(''))&&w.filter(x=>x==='a').length===w.filter(x=>x==='b').length;
test('PDA execution witnesses actual transitions, with explicit search and execution limits',()=>{
  for(const [name,oracle] of [['counts',counts],['brackets',balanced],['palindrome',H.isEvenPalindrome]])for(const w of words(['a','b'],7)){
    const M=H.preset(name),r=H.explore(M,w);assert.equal(r.complete,true);assert.equal(r.accepted,oracle(w),name+JSON.stringify(w));
    for(let j=1;j<r.frames.length;j++){const a=r.frames[j-1],b=r.frames[j],t=M.rules[b.rule];assert.equal(a.q,t.from);assert.equal(a.stack[0],t.pop);assert.equal(b.q,t.to);assert.deepEqual(b.stack,[...t.push,...a.stack.slice(1)]);assert.equal(b.i,a.i+(t.read===null?0:1));if(t.read!==null)assert.equal(w[a.i],t.read);}
  }
  const loop=H.preset('loop');assert.match(H.explore(loop,['a'],{maxStack:5}).status,/inconclusive/);assert.match(H.deterministicRun(loop,['a'],{maxStack:5}).status,/inconclusive/);assert.equal(H.deterministicRun(loop,[],{maxStack:5}).accepted,true);
  const cycle=H.parsePDA('p eps Z -> p Z');assert.equal(H.explore(cycle,[]).status,'rejected: reachable graph exhausted');assert.match(H.deterministicRun(cycle,[]).status,/inconclusive/);
});
test('CFG→PDA→CFG preserves exact bounded languages, including nullable recursion and empty languages',()=>{
  for(const src of ['S -> a S b | eps','S -> S S | a','S -> A; A -> A | eps','S -> a S','S -> a A; A -> b S | eps','S -> A B | b; A -> a | eps; B -> b | eps']){
    const g=H.parseGrammar(src),P=H.grammarPDA(g),C=H.pdaGrammar(P),expected=H.boundedLanguage(g,5).strings;assert.deepEqual(set(H.boundedLanguage(C.g,5).strings),set(expected));
    for(const w of words(P.alphabet,4)){const run=H.explore(P,w,{maxNodes:500,maxStack:10}),truth=expected.some(x=>JSON.stringify(x)===JSON.stringify(w));if(run.complete)assert.equal(run.accepted,truth);if(truth)assert.equal(H.recognize(C.g,w).accepted,true);}
  }
  for(const name of ['counts','brackets','palindrome']){const M=H.preset(name),C=H.pdaGrammar(M),expected=words(M.alphabet,4).filter(name==='counts'?counts:name==='brackets'?balanced:H.isEvenPalindrome);assert.deepEqual(set(H.boundedLanguage(C.g,4).strings),set(expected));}
  assert.throws(()=>H.pdaGrammar(H.preset('palindrome'),{maxRules:5}),/budget/);
});
test('Product machine follows both coordinates, including epsilon transitions',()=>{
  const M=H.preset('palindrome');for(const table of [[[0,1],[1,0]],[[1,1],[0,0]],[[0,0],[1,1]]])for(const finals of [[],[0],[1],[0,1]]){
    const P=H.product(M,table,finals);for(const w of words(['a','b'],6)){let q=0;for(const a of w)q=table[q][M.alphabet.indexOf(a)];assert.equal(H.explore(P,w).accepted,H.isEvenPalindrome(w)&&finals.includes(q));}
    for(const t of P.rules.filter(t=>t.read===null))assert.equal(t.from.split('D')[1],t.to.split('D')[1]);
  }
});
test('Determinism checks epsilon/input conflicts at every state/top pair, not just one run',()=>{
  assert.equal(H.determinism(H.preset('palindrome')).deterministic,false);for(const n of Object.keys(H.PRESETS))assert.equal(H.determinism(H.preset(n)).deterministic,true);
  assert.equal(H.determinism(H.parsePDA('p a Z -> p Z; p a Z -> q Z')).deterministic,false);
  assert.equal(H.determinism(H.parsePDA('p eps Z -> p Z; p b Z -> q Z')).deterministic,false);
  assert.equal(H.determinism(H.parsePDA('p a Z -> p Z; p b Z -> q Z')).deterministic,true);
  assert.equal(H.parsePDA('p a Z -> p Z; p a Z -> p Z').rules.length,1);
});
test('Exact epsilon summaries distinguish pop, block and recursive divergence; final visits propagate',()=>{
  const M=H.parsePDA('p eps Z -> q A B; q eps A -> r; r eps B -> f; f eps Z -> f Z; q eps B -> q B B'),A=H.epsilonAnalysis(M);
  assert.deepEqual({...A.get('p','Z'),id:undefined},{q:'p',Z:'Z',id:undefined,kind:'pop',end:'f',visitsFinal:true});assert.equal(A.get('q','B').kind,'infinite');assert.equal(A.get('q','B').visitsFinal,false);assert.equal(A.get('f','Z').kind,'infinite');assert.equal(A.get('f','Z').visitsFinal,true);assert.equal(A.get('p','A').kind,'blocked');
  // Independently walk finite state/top graphs (no push longer than one) for all generated pairs.
  let seed=812;const rand=n=>{seed=(1664525*seed+1013904223)>>>0;return seed%n;};
  for(let k=0;k<80;k++){const rules=[];for(const q of ['p','q','f'])for(const Z of ['Z','A'])if(rand(4))rules.push({from:q,read:null,pop:Z,to:['p','q','f'][rand(3)],push:rand(3)?[['Z','A'][rand(2)]]:[]});const N=H.machine({states:['p','q','f'],alphabet:['a'],stack:['Z','A'],start:'p',initial:'Z',finals:['f'],rules}),R=H.epsilonAnalysis(N);
    for(const q0 of N.states)for(const Z0 of N.stack){let q=q0,Z=Z0,seen=new Set(),hit=q==='f',kind,end;for(;;){const id=q+Z;if(seen.has(id)){kind='infinite';break;}seen.add(id);const t=rules.find(r=>r.from===q&&r.pop===Z);if(!t){kind='blocked';break;}q=t.to;hit ||= q==='f';if(!t.push.length){kind='pop';end=q;break;}Z=t.push[0];}const got=R.get(q0,Z0);assert.equal(got.kind,kind);assert.equal(got.visitsFinal,hit);if(kind==='pop')assert.equal(got.end,end);}
  }
});
test('Normalization and visit-tracking complement agree with independent predicates, including naive-flip failures',()=>{
  for(const [name,oracle] of [['counts',counts],['brackets',balanced],['visit',w=>w.join('')==='a'],['loop',w=>!w.length]]){
    const M=H.preset(name),C=H.complementDPDA(M);assert.equal(H.determinism(C.normalized).deterministic,true);assert.equal(H.determinism(C.M).deterministic,true);
    for(const w of words(['a','b'],7)){const n=H.deterministicRun(C.normalized,w),c=H.deterministicRun(C.M,w);assert.equal(n.complete,true);assert.equal(c.complete,true);assert.equal(n.accepted,oracle(w));assert.equal(c.accepted,!oracle(w));assert.equal(n.frames.at(-1).i,w.length);assert.equal(c.frames.at(-1).i,w.length);}
  }
  const M=H.preset('visit'),flipped=H.machine({...M,finals:M.states.filter(q=>!M.finals.includes(q))});assert.equal(H.deterministicRun(M,['a']).accepted,true);assert.equal(H.deterministicRun(flipped,['a']).accepted,true);
  const partial=H.parsePDA('', 'p');assert.equal(H.deterministicRun(H.machine({...partial,finals:[]}),['a']).accepted,false);assert.equal(H.deterministicRun(H.complementDPDA(partial).M,['a']).accepted,true);
});
test('Every legal finite pumping decomposition in the chosen witnesses is defeated at power two',()=>{
  for(const kind of ['triple','copy','palindrome','ogden'])for(let p=1;p<=5;p++){const r=H.counterexample(kind,p);assert.equal(r.member(r.tokens),true);assert.ok(r.splits.length);for(const s of r.splits){assert.ok(s.window<=p&&s.pumpedMarks>0);const z=H.splitWord(r.tokens,s.a,s.b,s.c,s.d,2);assert.equal(r.member(z.pumped),false,kind+JSON.stringify({p,s}));}}
  for(let i=1;i<=6;i++)for(let j=1;j<=6;j++){const a=Array.from(`ab`.repeat(i)+`ba`.repeat(j)+`ab`.repeat(j)+`ba`.repeat(i));assert.equal(H.minPalindrome(a),i>j);assert.deepEqual(H.fourAlternating(a),[i,j,j,i]);}
  // Ogden witness language nevertheless satisfies the ordinary pumping conditions with p=1.
  const L=H.counterexample('ogden',2).member;for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)for(let l=0;l<4;l++){const w=Array.from('a'.repeat(i)+'b'.repeat(j)+'c'.repeat(k)+'d'.repeat(l));if(!w.length||!L(w))continue;for(let t=0;t<6;t++)assert.equal(L(H.splitWord(w,0,1,1,1,t).pumped),true);}
});
test('Actual CNF repeated-subtree decompositions pump to derivable words and satisfy marked bounds',()=>{
  for(const src of ['S -> S S | a','S -> a S b | eps','S -> a S | a']){const g=H.parseGrammar(src);for(const w of H.boundedLanguage(g,7).strings){if(!w.length)continue;for(const marks of [null,w.map((_,i)=>i%2===0),w.map(()=>true)]){const r=H.pumpingTree(g,w,marks);assert.equal(r.accepted,true);if(r.eligible)assert.ok(r.pairs.length);for(const s of r.pairs){assert.equal(r.nodes[s.upper].sym,r.nodes[s.lower].sym);assert.ok(s.window<=r.p&&s.pumpedMarks>0);for(const power of [0,1,2,3])assert.equal(H.recognize(g,H.splitWord(w,s.a,s.b,s.c,s.d,power).pumped).accepted,true);}}}}
});
test('Constructed bounded-index automata have the same count vectors, not generally the same words',()=>{
  for(const src of ['S -> a S b | eps','S -> A B; A -> a A | a; B -> b B | b','S -> S S | a | b','S -> A | eps; A -> A','S -> a S','S -> a | b','S -> eps']){const g=H.parseGrammar(src),r=H.parikhComparison(g,5);for(const row of r.vectors)assert.ok(row.grammar.length&&row.regular.length,src+JSON.stringify(row));for(const e of r.A.edges){const before=r.A.states[e.from],after=r.A.states[e.to],rule=g.rules[e.rule],expected=before.slice();expected[g.vars.indexOf(rule.lhs)]--;for(const x of rule.rhs)if(g.vars.includes(x))expected[g.vars.indexOf(x)]++;assert.deepEqual(after,expected);assert.deepEqual(e.label,rule.rhs.filter(x=>!g.vars.includes(x)));}for(const w of r.R.strings){const path=r.R.path(w);assert.equal(path[0].state,r.A.start);assert.equal(path.at(-1).state,r.A.final);assert.deepEqual(path.slice(1).flatMap(x=>r.A.edges[x.edge].label),w);}}
  const r=H.parikhComparison(H.parseGrammar('S -> a S b | eps'),4);assert.ok(r.G.some(w=>w.join('')==='aabb'));assert.ok(!r.R.strings.some(w=>w.join('')==='aabb'));assert.ok(r.R.strings.some(w=>w.join('')==='abab'));
});
test('Production brackets implement the Dyck constraint, both child types, regular filter and erasing map',()=>{
  for(const src of ['S -> a S b | eps','S -> S S | a','S -> A B; A -> a; B -> b','S -> a | b','S -> a S']){const g=H.parseGrammar(src);for(const w of words(g.terminals,4)){const E=H.bracketEncoding(g,w);if(!E.accepted)continue;const r=H.checkBrackets(E,E.brackets);assert.equal(r.accepted,true);assert.deepEqual(r.projection,w);for(let i=0;i<E.brackets.length;i++){const changed=[...E.brackets];changed.splice(i,1);assert.equal(H.checkBrackets(E,changed).accepted,false);}
      if(w.length){assert.equal(H.checkBrackets(E,[...E.brackets,...E.brackets]).accepted,false);const changed=E.brackets.map(t=>t[0]==='o'?'c'+t.slice(1):'o'+t.slice(1));assert.equal(H.checkBrackets(E,changed).balanced,false);}}
  }
  const E=H.bracketEncoding(H.parseGrammar('S -> A B; A -> a; B -> b'),['a','b']);const root=E.brackets[0],idx=+root.slice(1).split('.')[0],wrong=E.rules.findIndex(r=>r.lhs===E.rules[idx].rhs[0]&&r.rhs.length===1),changed=E.brackets.map(t=>{const m=t.match(/^([oc])(\d+)\.([12])$/);return E.rules[+m[2]].lhs===E.rules[idx].rhs[1]?`${m[1]}${wrong}.${m[3]}`:t;});const x=H.checkBrackets(E,changed);assert.equal(x.balanced,true);assert.equal(x.regular,false);assert.ok(x.violations.some(v=>v.reason.startsWith('P3')));
});
test('Editors reject malformed, oversized and undeclared inputs without truncation',()=>{
  for(const src of [42,'p a Z -> q lower','p c Z -> q Z','p a Z -> q A A A A'])assert.throws(()=>H.parsePDA(src));assert.throws(()=>H.parsePDA('','f','a a'));assert.throws(()=>H.inputTokens('a '.repeat(21),H.preset('counts')));assert.throws(()=>H.parseSmallGrammar('S -> a b c d e'));
  assert.throws(()=>H.product(H.preset('counts'),[[2,0],[0,0]],[0]));assert.throws(()=>H.complementDPDA(H.preset('palindrome')));assert.throws(()=>H.splitWord(['a'],0,1,0,1));
  const E=H.bracketEncoding(H.parseGrammar('S -> a'),['a']);for(const tokens of [['x'],['o999.1'],Array(101).fill('o0.1')])assert.throws(()=>H.checkBrackets(E,tokens));
});

test('all fourteen frozen identities and syllabus fields agree, with written proof inputs', async () => {
  const plan = JSON.parse(fs.readFileSync(new URL('../docs/wave-6-plan.json', import.meta.url))), frozen = plan.chapters.find(c => (c.col || c.collection) === 'toc').items;
  const parts = await Promise.all(['', '-b'].map(p => import(`../content/toc/ch06${p}.js`))), items = parts.flatMap(p => p.default.items), syllabus = (await import('../content/toc/syllabus.js')).default.chapters.find(c => c.n === 6).items;
  assert.equal(items.length, 14); assert.equal(frozen.length, 14);
  for (const [j, item] of items.entries()) {
    assert.equal('toc-' + item.num, frozen[j].id);
    for (const key of ['name', 'kind', 'verify', 'paper', 'introduces']) { assert.deepEqual(item[key], frozen[j][key]); assert.deepEqual(item[key], syllabus[j][key]); }
    for (const key of ['deps', 'refs']) assert.deepEqual(item[key], syllabus[j][key]);
    assert.equal(item.caption, syllabus[j].pic); for (const key of ['statement', 'idea', 'caption']) assert.ok(item[key].length > 100); assert.equal(typeof item.viz, 'function');
  }
  for (const id of new Set(items.flatMap(i => i.deps).filter(id => !id.startsWith('toc-6.')))) {
    const [col, num] = id.split('-'), chapter = num.split('.')[0].padStart(2, '0'), dir = new URL('../content/' + col + '/', import.meta.url); let found = false;
    for (const file of fs.readdirSync(dir).filter(f => new RegExp('^ch' + chapter + '(?:-[a-z0-9]+)?\\.js$').test(f))) if ((await import(new URL(file, dir))).default.items.some(i => i.num === num)) found = true;
    assert.ok(found, id + ' is written');
  }
});
