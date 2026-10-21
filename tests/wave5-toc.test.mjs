import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from '../content/toc/ch05.shared.js';

// Independent least fixed point of nonterminal span relations; no grammar conversion.
function recognizes(g,w){const charts=new Map(g.vars.map(x=>[x,new Set()]));let changed=true;
  while(changed){changed=false;for(const r of g.rules)for(let i=0;i<=w.length;i++){
    let ends=new Set([i]);for(const x of r.rhs){const next=new Set();for(const p of ends){if(charts.has(x)){for(let q=p;q<=w.length;q++)if(charts.get(x).has(p+','+q))next.add(q);}else if(w[p]===x)next.add(p+1);}ends=next;}
    for(const j of ends){const key=i+','+j;if(!charts.get(r.lhs).has(key)){charts.get(r.lhs).add(key);changed=true;}}
  }}return charts.get(g.start).has('0,'+w.length);
}
function words(alphabet,max){const out=[[]];for(let n=1;n<=max;n++)for(const a of out.filter(x=>x.length===n-1))for(const x of alphabet)out.push([...a,x]);return out;}
const examples=[
  'S -> a S b | eps',
  'S -> S S | a | eps',
  'S -> A B; A -> a A | eps; B -> b B | eps',
  'S -> A; A -> B | a; B -> A | b',
  'S -> A A B a; A -> a | eps; B -> b | eps',
  'S -> A B; A -> A; B -> b',
  'S -> S',
  'S -> eps',
  'S -> a A b A; A -> a A | b A | eps',
];
test('finite grammar syntax rejects malformed rules and undefined variables',()=>{
  assert.throws(()=>H.parseGrammar('a -> b'));
  assert.throws(()=>H.parseGrammar('S -> A'));
  assert.throws(()=>H.parseGrammar('S -> eps a'));
  assert.throws(()=>H.parseGrammar('S -> a |'));
  assert.throws(()=>H.parseGrammar('TOOLONG -> a'),/six characters/);
  assert.throws(()=>H.parseGrammar('S -> toolongtoken'),/eight/);
  assert.equal(H.parseGrammar('S -> a | a').rules.length,1);
  assert.deepEqual(H.tokenWord('',H.parseGrammar('S -> eps')),[]);
});

test('frozen chapter identities and source flags agree with a complete chapter-only inventory',async()=>{
  const a=(await import('../content/toc/ch05.js')).default,b=(await import('../content/toc/ch05-b.js')).default,S=(await import('../content/toc/syllabus.js')).default;
  const rows=S.chapters.find(c=>c.n===5).items,items=[...a.items,...b.items];
  assert.deepEqual(items.map(i=>i.num),Array.from({length:16},(_,i)=>`5.${i+1}`));
  assert.deepEqual(S.chapters.map(c=>c.n),Array.from({length:14},(_,i)=>i+1));
  assert.deepEqual(S.chapters.find(c=>c.n===6).items.map(i=>i.num),Array.from({length:14},(_,i)=>`6.${i+1}`));
  for(const i of items){const r=rows.find(r=>r.num===i.num);assert.equal(i.kind,r.kind);assert.equal(i.name,r.name);assert.deepEqual(i.deps,r.deps);assert.deepEqual(i.refs,r.refs);assert.equal(typeof i.viz,'function');assert.ok(!i.deps.includes('toc-6.10'));}
  assert.equal(items[15].kind,'Paper');assert.equal(items[15].paper.year,1965);assert.equal(items[15].paper.doi,'10.1016/S0019-9958(65)90426-2');assert.deepEqual(items[15].introduces,['toc-5.15']);assert.equal(items[15].verify,true);assert.deepEqual(items[15].see,['toc-6.10']);
});
test('bounded language and every CNF conversion stage preserve span-oracle membership',()=>{
  for(const source of examples){const g=H.parseGrammar(source),c=H.cnf(g),L=H.boundedLanguage(g,4).strings.map(JSON.stringify);
    assert.ok(H.isCNF(c.g),source);assert.ok(!c.g.rules.some(r=>r.rhs.includes(c.g.start)));
    for(const w of words(['a','b'],4)){const ref=recognizes(g,w);assert.equal(L.includes(JSON.stringify(w)),ref,source+' '+w);for(const stage of c.stages)assert.equal(recognizes(stage.g,w),ref,stage.name+' '+source+' '+w);assert.equal(H.cyk(c.g,w).accepted,ref,source+' CYK '+w);}
  }
});
function leaves(t){return t.kids.length?t.kids.flatMap(leaves):t.sym==='ε'?[]:[t.sym];}
test('CYK split witnesses yield the actual accepted word, including empty start',()=>{
  for(const source of examples){const g=H.cnf(H.parseGrammar(source)).g;for(const w of words(['a','b'],4)){const z=H.cyk(g,w);if(z.accepted)assert.deepEqual(leaves(z.tree),w);else assert.ok(!z.tree);assert.equal(z.frames.length,w.length*(w.length+1)/2||1);}}
});
test('nullable FIRST and FOLLOW propagate through cycles and empty suffixes',()=>{
  const g=H.parseGrammar('S -> A B; A -> a | eps; B -> b | eps'),f=H.firstFollow(g);
  assert.deepEqual([...f.nullable].sort(),['A','B','S']);assert.deepEqual([...f.first.S].sort(),['a','b']);assert.deepEqual([...f.follow.A].sort(),['$','b']);assert.deepEqual([...f.follow.B],['$']);
  const z=H.firstFollow(H.parseGrammar('S -> A; A -> B | a; B -> A | b'));
  assert.deepEqual([...z.first.S].sort(),['a','b']);assert.equal(z.nullable.size,0);
});
test('predictive table parsing matches independent membership for a nullable grammar',()=>{
  const expanded=H.parseGrammar('S -> A A A A A A A A; A -> B B B B B B B B; B -> C C C C C C C C; C -> eps');
  assert.equal(recognizes(expanded,[]),true);const limited=H.llRun(expanded,[]);assert.equal(limited.status,'step limit');assert.equal(limited.accepted,false);assert.equal(limited.frames.length,500);assert.equal(H.llRun(expanded,[],600).accepted,true);
  const g=H.parseGrammar('S -> a S b | eps'),t=H.llTable(g);assert.equal(t.conflicts.length,0);
  for(const w of words(['a','b'],7))assert.equal(H.llRun(g,w).accepted,recognizes(g,w),String(w));
  assert.ok(H.llTable(H.parseGrammar('S -> a | a b')).conflicts.length);
  assert.equal(H.llRun(H.parseGrammar('S -> S a | a'),['a']).status,'conflict');
});
test('canonical LR1 tables and actual stack runs match a separate span oracle',()=>{
  const expanded=H.parseGrammar('S -> A A A A A A A A; A -> B B B B B B B B; B -> C C C C C C C C; C -> eps'),machine=H.lr1(expanded),limited=H.lrRun(machine,[]);assert.equal(machine.complete,true);assert.equal(limited.status,'step limit');assert.equal(limited.accepted,false);assert.equal(limited.frames.length,500);assert.equal(H.lrRun(machine,[],600).accepted,true);
  for(const source of ['S -> a S b | eps','S -> S + T | T; T -> n | ( S )','S -> A A; A -> a A | b','S -> A b | a; A -> eps']){
    const g=H.parseGrammar(source),m=H.lr1(g);assert.equal(m.complete,true);assert.equal(m.conflicts.length,0,source);
    for(const w of words(g.terminals,4)){const z=H.lrRun(m,w);assert.equal(z.accepted,recognizes(g,w),source+' '+w);if(z.accepted)assert.deepEqual(leaves(z.tree),w);}
    for(const e of m.transitions)assert.ok(m.states[e.from]&&m.states[e.to]);
  }
});
test('LR1 uses lookaheads rather than resolving ambiguous tables arbitrarily',()=>{
  const ambiguous=H.lr1(H.parseGrammar('E -> E + E | n'));assert.ok(ambiguous.conflicts.length);
  assert.equal(H.lrRun(ambiguous,['n','+','n','+','n']).status,'conflict');
  const m=H.lr1(H.parseGrammar('S -> A a | b A c | B c | b B a; A -> d; B -> d'));
  assert.equal(m.conflicts.length,0);for(const w of words(['a','b','c','d'],4))assert.equal(H.lrRun(m,w).accepted,recognizes(m.original,w));
  const partial=H.lr1(H.parseGrammar('S -> a S b | eps'),1);assert.equal(partial.complete,false);assert.equal(H.lrRun(partial,[]).status,'construction limit');
});
test('actual Greibach substitutions preserve bounded membership and expose construction limits',()=>{
  for(const source of [...examples,'S -> A A | a; A -> S S | b']){const g=H.parseGrammar(source),z=H.greibach(g);assert.equal(z.complete,true,source);for(const w of words(['a','b'],4))assert.equal(recognizes(z.g,w),recognizes(g,w),source+' '+w);assert.ok(z.g.rules.every(r=>!r.rhs.length?r.lhs===z.g.start:!z.g.vars.includes(r.rhs[0])&&r.rhs.slice(1).every(x=>z.g.vars.includes(x))));}
  assert.equal(H.greibach(H.parseGrammar('S -> S S | a'),1).complete,false);
});
test('cyclic and nullable generated grammars retain membership through both normal forms',()=>{
  let state=1234567,completed=0;const pick=n=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state%n;};
  for(let k=0;k<60;k++){
    const rules=[];for(const lhs of ['S','A','B'])for(let j=0;j<2;j++)rules.push({lhs,rhs:Array.from({length:pick(4)},()=>['S','A','B','a','b'][pick(5)])});
    const g=H.grammar('S',rules),c=H.cnf(g),z=H.greibach(g);assert.ok(H.isCNF(c.g));if(z.complete)completed++;
    for(const w of words(['a','b'],4)){const expected=recognizes(g,w);assert.equal(H.cyk(c.g,w).accepted,expected,JSON.stringify({rules,w}));if(z.complete)assert.equal(recognizes(z.g,w),expected,JSON.stringify({rules,w}));}
  }
  assert.ok(completed>=40,'enough complete normal-form constructions, rather than silent cap exclusions');
});
test('original-grammar witness trees and both derivation orders use actual productions',()=>{
  const validate=(t,g)=>{if(!t.kids.length)return;const rhs=t.kids.filter(x=>x.sym!=='ε').map(x=>x.sym);assert.ok(g.rules.some(r=>r.lhs===t.sym&&JSON.stringify(r.rhs)===JSON.stringify(rhs)));for(const c of t.kids)validate(c,g);};
  for(const source of examples){const g=H.parseGrammar(source);for(const w of words(['a','b'],4)){const tree=H.parseOne(g,w);assert.equal(!!tree,recognizes(g,w));if(!tree)continue;validate(tree,g);assert.deepEqual(leaves(tree),w);
    for(const side of ['leftmost','rightmost']){const z=H.derivation(tree,side);assert.deepEqual(z.frames.at(-1).symbols,w);for(let j=1;j<z.frames.length;j++){const before=z.frames[j-1].symbols,after=z.frames[j].symbols,index=side==='leftmost'?before.findIndex(x=>g.vars.includes(x)):before.findLastIndex(x=>g.vars.includes(x));assert.ok(g.rules.some(r=>r.lhs===before[index]&&JSON.stringify([...before.slice(0,index),...r.rhs,...before.slice(index+1)])===JSON.stringify(after)));}}
  }}
});
test('binary parse-tree gallery has Catalan counts and order-independent yields',()=>{
  for(let n=1;n<=6;n++){const trees=H.binaryParseTrees(n);assert.equal(trees.length,[1,1,2,5,14,42][n-1]);for(const t of trees){assert.deepEqual(leaves(t),Array(n).fill('a'));assert.deepEqual(H.derivation(t).frames.at(-1).symbols,H.derivation(t,'rightmost').frames.at(-1).symbols);}}
});
test('every bounded bracket word agrees with independent prefix and final-sum conditions',()=>{
  for(let n=0;n<=12;n++)for(let bits=0;bits<2**n;bits++){const text=Array.from({length:n},(_,j)=>bits>>j&1?'(':')').join('');let h=0,min=0;for(const c of text){h+=c==='('?1:-1;min=Math.min(min,h);}const z=H.bracketProfile(text);assert.equal(z.balanced,h===0&&min>=0);assert.equal(z.heights.at(-1),h);if(z.balanced)assert.equal(z.pairs.length,n/2);}
  assert.throws(()=>H.bracketProfile('(x)'));
});
test('expression ambiguity, precedence and associativity operate on actual ASTs',()=>{
  assert.deepEqual(H.expressionTrees('2 + 3 * 4').trees.map(x=>x.value).sort((a,b)=>a-b),[14,20]);
  assert.equal(H.expressionTrees('2 + 3 * 4',true).trees[0].value,14);
  assert.equal(H.expressionTrees('8 - 3 - 2',true,'left').trees[0].value,3);
  assert.equal(H.expressionTrees('8 - 3 - 2',true,'right').trees[0].value,7);
  assert.equal(H.expressionTrees('( 2 + 3 ) * 4').trees.length,1);
  for(const association of ['left','right'])assert.equal(H.expressionTrees('2 * 3 * 4',true,association).trees[0].kids[0].sym,'*','product association stays left under a sum-only control');
  for(const s of ['','0','12','2 +','(2+3','2 / 3','1 2','2)(3'])assert.throws(()=>H.expressionTrees(s),s);
});
test('renamed union concatenation and star match independent string decompositions',()=>{
  const a=H.parseGrammar('S -> a S b | eps'),b=H.parseGrammar('S -> a S | a');
  for(const op of ['union','concatenate','star']){const g=H.combine(a,b,op);assert.notEqual(g.start,a.start);for(const w of words(['a','b'],6)){
    let expected;if(op==='union')expected=recognizes(a,w)||recognizes(b,w);if(op==='concatenate')expected=Array.from({length:w.length+1},(_,i)=>recognizes(a,w.slice(0,i))&&recognizes(b,w.slice(i))).some(Boolean);
    if(op==='star'){const good=Array(w.length+1).fill(false);good[0]=true;for(let j=1;j<=w.length;j++)for(let i=0;i<j;i++)if(good[i]&&recognizes(a,w.slice(i,j)))good[j]=true;expected=good[w.length];}
    assert.equal(recognizes(g,w),expected,op+' '+w);
  }}
});
test('all two-state binary DFA tables and final sets agree with their actual right-linear grammar',()=>{
  for(let code=0;code<16;code++)for(let mask=0;mask<4;mask++){const transitions=[[code&1,code>>1&1],[code>>2&1,code>>3&1]],finals=[0,1].filter(q=>mask>>q&1),g=H.dfaGrammar(transitions,finals);for(const w of words(['a','b'],5)){let state=0;for(const x of w)state=transitions[state][x==='a'?0:1];const z=H.dfaRun(transitions,finals,w);assert.equal(z.state,state);assert.equal(z.accepted,finals.includes(state));assert.equal(recognizes(g,w),z.accepted);}}
});
test('dangling else has two actual ASTs and the matched grammar selects the nearest if',()=>{
  const source='if a then if b then s else t',z=H.danglingTrees(source),fixed=H.nearestElse(source);assert.equal(z.trees.length,2);assert.ok(fixed.tree);assert.equal(fixed.ast.sym,'if a');assert.equal(fixed.ast.kids.length,1);assert.equal(fixed.ast.kids[0].sym,'if b');assert.equal(fixed.ast.kids[0].kids.length,2);assert.equal(fixed.ast.kids[0].kids[1].sym,'t');assert.ok(z.trees.some(t=>JSON.stringify(t)===JSON.stringify(fixed.ast)));
  for(const s of ['s','if a then s','if a then s else t','if a then if b then s else t else s','if a then if b then if a then s else t']){const a=H.nearestElse(s);assert.ok(a.tree);assert.ok(a.trees.some(t=>JSON.stringify(t)===JSON.stringify(a.ast)));}
  for(const s of ['if a then','else s','if z then s','s else t'])assert.throws(()=>H.danglingTrees(s));
});
test('assignment lexer and generated LR table separate syntax from semantic checks',()=>{assert.throws(()=>H.programTokens('abcdefghij = 2'),/eight characters/);assert.throws(()=>H.programTokens('x = 123456789'),/eight characters/);
  const machine=H.lr1(H.programGrammar());assert.equal(machine.complete,true);assert.equal(machine.conflicts.length,0);
  for(const s of ['x=2+3*4','foo=(12+0)*3','x=(2+3)*(4+5)']){const z=H.programTokens(s);assert.ok(H.lrRun(machine,z.tokens).accepted,s);}
  for(const s of ['x=','x=2+','x=(2+3','x==2','x 2']){const z=H.programTokens(s);assert.equal(H.lrRun(machine,z.tokens).accepted,false,s);}
  assert.throws(()=>H.programTokens('x=2/3'));assert.throws(()=>H.programTokens('X=2'));
});
