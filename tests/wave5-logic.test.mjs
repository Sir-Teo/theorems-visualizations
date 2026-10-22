import test from'node:test';import assert from'node:assert/strict';import{spawnSync}from'node:child_process';import fs from'node:fs';
import*as H from'../content/logic/ch07.shared.js';import*as M from'../content/logic/ch07.models.shared.js';import*as A from'../content/logic/ch07.automata.shared.js';
function python(code,data){const z=spawnSync('python3',['-c',code],{input:JSON.stringify(data,(_,v)=>typeof v==='bigint'?v.toString():v),encoding:'utf8',maxBuffer:20*1024*1024});assert.equal(z.status,0,z.stderr);return JSON.parse(z.stdout);}
const presets=[...Object.values(M.TM_PRESETS),[[0,'0',1,'1','L']],[[0,'▷',1,'0','L'],[0,'_',0,'_','L'],[1,'0',1,'0','N']]];
test('finite successor obstruction is exhaustive; infinite operations satisfy sampled Q instances',()=>{for(let n=1;n<=5;n++)for(let k=0;k<n**n;k++){let c=k;const next=Array.from({length:n},()=>{const z=c%n;c=Math.floor(c/n);return z;});for(const cap of[false,true]){const q=H.finiteQ(next,{cap});assert.equal(q.checks[0].holds,new Set(next).size===n);assert.equal(q.checks[1].holds,!next.includes(0));assert.ok(!q.allQ);assert.ok(!q.checks[0].holds||!q.checks[1].holds);}}const V=[0n,1n,2n,5n,H.INF],S=x=>H.extended('succ',x),add=(x,y)=>H.extended('add',x,y),mul=(x,y)=>H.extended('mul',x,y);for(const x of V)for(const y of V){assert.ok(S(x)!==S(y)||x===y);assert.notEqual(S(x),0n);assert.equal(add(x,S(y)),S(add(x,y)));assert.equal(mul(x,S(y)),add(mul(x,y),x));assert.equal(add(x,0n),x);assert.equal(mul(x,0n),0n);}assert.notEqual(0n,S(0n));assert.equal(H.INF,S(H.INF));});
test('declared parser, shadowing and capture-avoiding substitution',()=>{for(const text of['((exists y. (x=y)) & y=0)','((exists y. (x=y)) & x=0)','exists y. x=y','forall x. (x+1=S(x))','!(Prov(x))','forall x. exists y. (x<y & y!=0)']){const a=H.parse(text);assert.deepEqual(H.parse(H.show(a)),a);}const a=H.parse('exists y. (x=y & forall x. x=y)'),log=[],b=H.substitute(a,'x',H.variable('y'),log);assert.deepEqual(log,[{from:'y',to:'z0'}]);assert.deepEqual(H.free(b),['y']);assert.equal(H.show(b),'(exists z0. (((y=z0)&(forall x. ((x=z0))))))');assert.equal(H.parse('x*y=0',{linear:true}).a.op,'mul');for(const x of['','x=', 'forall . x=0','x=0 garbage','$bad$'])assert.throws(()=>H.parse(x));});
test('prime-word exact codes/decodes checked by independent Python factorization',()=>{const words=['','S(0)=S(0)',...M.ALPHABET,...M.ALPHABET.flatMap(a=>M.ALPHABET.map(b=>a+' '+b))],cases=words.map(w=>M.primeWord(w));const out=python(String.raw`
import json,sys,math
D=json.load(sys.stdin);P=[];i=2
while len(P)<24:
 if all(i%d for d in range(2,math.isqrt(i)+1)):P.append(i)
 i+=1
out=[]
for d in D:
 n=int(d['code']);v=[]
 for p in P:
  if n==1:break
  e=0
  while n%p==0:n//=p;e+=1
  v.append(e)
 out.append(v)
print(json.dumps(out))
`,cases.map(z=>({code:z.code})));cases.forEach((z,i)=>{assert.deepEqual(out[i],z.tokens.map(t=>M.ALPHABET.indexOf(t)+1));assert.deepEqual(M.decodePrime(z.code).tokens,z.tokens);});for(const n of[0n,-1n,10n,2n**18n])assert.throws(()=>M.decodePrime(n));assert.equal(M.primeWord('x +').formula,false);assert.equal(M.primeWord('x=0').formula,true);});
test('ground normalization certificates agree with independent Python arithmetic on every generated line',()=>{const C=[];for(const term of['x+1','x*x+1','S(x)*S(x)','(x+2)*(x+1)','x*0+S(0)'])for(let x=0;x<=6;x++)C.push(M.groundCertificate(term,x));const lines=C.flatMap(z=>z.trace);const values=python(String.raw`
import json,sys,ast
D=json.load(sys.stdin)
def ev(t):
 if isinstance(t,ast.Constant) and isinstance(t.value,int):return t.value
 if isinstance(t,ast.Call) and isinstance(t.func,ast.Name) and t.func.id=='S':return ev(t.args[0])+1
 if isinstance(t,ast.BinOp):
  a,b=ev(t.left),ev(t.right)
  if isinstance(t.op,ast.Add):return a+b
  if isinstance(t.op,ast.Mult):return a*b
 raise ValueError(ast.dump(t))
print(json.dumps([str(ev(ast.parse(x,mode='eval').body))for x in D]))
`,lines.map(r=>r.lhs));lines.forEach((r,i)=>assert.equal(r.rhs,values[i],r.lhs));assert.throws(()=>M.groundCertificate('x*x*x',6),/budget/);assert.throws(()=>M.groundCertificate('y+1',1),/Only x/);});
test('CRT trace agrees with independent modular arithmetic, including all zero/one-entry endpoints',()=>{const sets=[[0],[50],[0,0,0],[0,1,4,9],...Array.from({length:40},(_,j)=>Array.from({length:1+j%10},(_,i)=>(i*i+7*j)%51))],Z=sets.map(x=>H.betaEncode(x));const O=python(String.raw`
import json,sys,math
D=json.load(sys.stdin);out=[]
for z in D:
 b,c=int(z['b']),int(z['c']);m=[1+(i+1)*c for i in range(len(z['values']))]
 assert all(math.gcd(a,b)==1 for i,a in enumerate(m)for b in m[:i])
 out.append([str(b%n)for n in m])
print(json.dumps(out))
`,Z.map((z,i)=>({...z,values:sets[i]})));Z.forEach((z,i)=>{assert.deepEqual(z.decoded.map(String),O[i]);assert.deepEqual(z.decoded.map(Number),sets[i]);assert.ok(z.checked);z.trace.forEach(r=>{for(let k=0;k<=r.i;k++)assert.equal(r.b%z.moduli[k],BigInt(sets[i][k]));});});for(const x of[Array(2),[0,,1],[],[51]])assert.throws(()=>H.betaEncode(x));});
test('actual diagonal code equals an independently constructed sentinel/base257 result',()=>{const q=H.diagonal('!Prov(x)'),out=python(String.raw`
import json
T='(exists y0. ((Diag(x,y0)&!(Prov(y0)))))'
def code(s):
 n=1
 for b in s.encode('utf-8'):n=257*n+b+1
 return n
k=code(T);G='(exists y0. ((Diag('+str(k)+',y0)&!(Prov(y0)))))'
print(json.dumps({'theta':T,'k':str(k),'G':G,'g':str(code(G))}))
`,{});assert.equal(q.thetaText,out.theta);assert.equal(q.k.toString(),out.k);assert.equal(q.sentenceText,out.G);assert.equal(q.g.toString(),out.g);assert.ok(q.checked);for(const p of['((exists y. (x=y)) & x=0)','x=0','exists y0. x=y0','forall x. x=x','exists y. (x=y & forall x. x=x)']){const z=H.diagonal(p);assert.ok(z.checked);assert.deepEqual(H.free(z.sentence),[]);}assert.throws(()=>H.diagonal('x=y'),/only x/);assert.throws(()=>H.wordDecode(257n),/digit0/);});
test('truth-grid constraints and finite Rosser implications include exact endpoints',()=>{for(const negated of[true,false])for(const diagonal of[true,false])for(const schema of[true,false]){const z=M.truthConstraints(negated,{diagonal,schema});assert.equal(z.filter(r=>r.ok).length,diagonal&&schema?(negated?0:2):diagonal||schema?2:4);}for(let mask=0;mask<3**6;mask++){let m=mask;const ledger=[];for(let i=0;i<6;i++){const z=m%3;m=Math.floor(m/3);if(z)ledger.push([i,z===1?'R':'not R']);}const q=M.rosserLedger(JSON.stringify(ledger),5);assert.equal(q.finite,!ledger.some(([p,t])=>t==='R'&&!ledger.some(([j,u])=>u==='not R'&&j<=p)));}assert.throws(()=>M.rosserLedger('[[1,"R"],[1,"not R"]]',3),/unique/);});
test('HBL proof skeletons close exactly with their licenses; local assumptions cannot use theorem necessitation',()=>{for(const target of['0=1','forall x. x=x','exists y. y=0'])for(const kind of['second','lob']){const z=M.modalDerivation(kind,target);assert.ok(z.ok);for(const missing of['D1','D2','D3','diagonal',...(kind==='lob'?['reflection']:[])]){const q=M.modalDerivation(kind,target,{D1:true,D2:true,D3:true,diagonal:true,reflection:true,[missing]:false});assert.equal(q.ok,false);assert.equal(q.conclusion.ok,false);}}assert.equal(M.propositionalConsequence([M.atom('p')],M.box(M.atom('p'))).ok,false);assert.equal(M.propositionalConsequence([M.imp(M.atom('p'),M.atom('q')),M.atom('p')],M.atom('q')).ok,true);assert.throws(()=>M.modalDerivation('lob','x=0'),/closed/);});
test('actual TM executions match a separately implemented Python dictionary machine',()=>{let seed=7;const r=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;},cases=presets.map(rows=>({rows,input:'0',budget:40}));for(let j=0;j<60;j++){const rows=[];for(let q=0;q<4;q++)for(const s of M.TM_ALPHABET)if(r()<.7)rows.push([q,s,Math.floor(4*r()),M.TM_ALPHABET[Math.floor(4*r())],['L','N','R'][Math.floor(3*r())]]);cases.push({rows,input:j%2?'001':'',budget:j%3?30:0});}const O=python(String.raw`
import json,sys
D=json.load(sys.stdin);out=[]
for z in D:
 table={(r[0],r[1]):r for r in z['rows']};cells={0:'▷'};cells.update({i+1:s for i,s in enumerate(z['input'])});q=0;h=1;seen={};trace=[];status='inconclusive';cycle=None
 for t in range(z['budget']+1):
  pairs=sorted((p,s)for p,s in cells.items()if s!='_');read=cells.get(h,'_');rule=table.get((q,read));key=(q,h,tuple(pairs));trace.append([t,q,h,read,pairs,rule])
  if rule is None:status='halted';break
  if key in seen:status='certified cycle';cycle={'start':seen[key],'end':t,'period':t-seen[key]};break
  seen[key]=t
  if t==z['budget']:break
  cells[h]=rule[3];q=rule[2];h=max(0,h+{'L':-1,'N':0,'R':1}[rule[4]])
 out.append({'trace':trace,'status':status,'cycle':cycle})
print(json.dumps(out))
`,cases);cases.forEach((z,i)=>{const q=M.machine(JSON.stringify(z.rows),z.input,z.budget);assert.equal(q.status,O[i].status);assert.deepEqual(q.cycle,O[i].cycle);assert.deepEqual(q.trace.map(f=>[f.step,f.state,f.head,f.read,f.cells,f.rule]),O[i].trace);assert.equal(q.tau,M.machine(JSON.stringify(z.rows),z.input,0).tau);});assert.equal(M.machine(JSON.stringify(M.TM_PRESETS.drift),'',20).status,'inconclusive');assert.equal(M.machine(JSON.stringify(M.TM_PRESETS.cycle),'',20).status,'certified cycle');});
const sig=Object.fromEntries(['Q0','Q1','Q2','Q3','S0','S1','S2','S3'].map(n=>[n,2]));
function finiteInstances(a,env,run,positions,times){const tv=t=>Number(H.termValue(t,env));switch(a.op){case'bool':return a.value;case'lt':return tv(a.a)<tv(a.b);case'eq':return tv(a.a)===tv(a.b);case'and':return finiteInstances(a.a,env,run,positions,times)&&finiteInstances(a.b,env,run,positions,times);case'or':return finiteInstances(a.a,env,run,positions,times)||finiteInstances(a.b,env,run,positions,times);case'imp':return!finiteInstances(a.a,env,run,positions,times)||finiteInstances(a.b,env,run,positions,times);case'all':case'ex':{const V=a.name==='y'?times:positions,fn=x=>finiteInstances(a.a,{...env,[a.name]:BigInt(x)},run,positions,times);return a.op==='all'?V.every(fn):V.some(fn);}case'rel':{const[x,t]=a.args.map(tv),f=run.trace[t];if(!f)return false;return a.name[0]==='Q'?f.state===Number(a.name.slice(1))&&f.head===x:(new Map(f.cells).get(x)||'_')===M.TM_ALPHABET[Number(a.name.slice(1))];}default:throw Error(a.op);}}
test('generated FO clauses actually hold on bounded canonical-run instances; wrong left-frame exclusion fails',()=>{for(const rows of presets){const q=M.machine(JSON.stringify(rows),'0',12),positions=Array.from({length:16},(_,i)=>i),times=Array.from({length:Math.max(0,q.trace.length-1)},(_,i)=>i);for(const[name,f]of q.clauses.filter(([n])=>n.includes(':'))){const a=H.parse(f,{predicates:sig});assert.ok(finiteInstances(a,{},q,positions,times),name);}const goal=H.parse(q.goal,{predicates:sig});assert.equal(finiteInstances(goal,{},q,positions,q.trace.map(f=>f.step)),q.status==='halted');}const q=M.machine(JSON.stringify([[0,'0',1,'1','L']]),'0',2),text=q.clauses.find(([n])=>n.includes(':left'))[1],bad=text.replaceAll('z<S(x) | S(x)<z','z<x | x<z');assert.equal(finiteInstances(H.parse(bad,{predicates:sig}),{},q,[0,1,2],[0]),false);assert.ok(text.includes('S2(S(x),S(y))'));assert.ok(text.includes('z<S(x) | S(x)<z'));});
test('atom DFAs agree with independent exact integer inequalities/equalities/congruences and zero padding',()=>{for(let a=-3;a<=3;a++)for(let b=-2;b<=2;b++)for(const op of['<=','<','=','!=']){const text=`${a}*x+${b}*y${op}2`,z=A.compilePresburger(text);for(let x=0;x<=7;x++)for(let y=0;y<=5;y++){const lhs=a*x+b*y,expected=op==='<='?lhs<=2:op==='<'?lhs<2:op==='='?lhs===2:lhs!==2;assert.equal(A.runAutomaton(z.automaton,{x,y}).accept,expected,text);assert.equal(A.runAutomaton(z.automaton,{x,y},3).accept,expected,text);}}for(let m=1;m<=8;m++){const z=A.compilePresburger(`Cong(3*x-2*y,1,${m})`);for(let x=0;x<15;x++)for(let y=0;y<7;y++)assert.equal(A.runAutomaton(z.automaton,{x,y}).accept,((3*x-2*y-1)%m+m)%m===0);}});
test('quantifier projection handles longer witnesses, empty zero encodings, shadowing and complete Boolean products',()=>{const cases=[['exists y. y=8192',true],['exists y. y=x+8192',true],['forall x. exists y. x<y',true],['forall x. exists y. 2*y=x',false],['forall x. forall y. x+y=y+x',true],['exists y. 0*y=1',false],['exists x. (x=2 & exists x. x=3)',true],['forall y. y<=x',false]];for(const[f,want]of cases){const z=A.compilePresburger(f,{stateLimit:1024});for(const pad of[0,1,8])assert.equal(A.runAutomaton(z.automaton,{x:0},pad).accept,want,f);}const z=A.compilePresburger('exists y. 2*y=x');for(let x=0;x<80;x++)assert.equal(A.runAutomaton(z.automaton,{x}).accept,x%2===0);const huge=(1n<<1000n)+1n;assert.equal(A.runAutomaton(z.automaton,{x:huge}).accept,false);assert.equal(A.runAutomaton(z.automaton,{x:huge+1n},7).accept,true);assert.throws(()=>A.compilePresburger('x*y=0'),/nonconstant|constant/);assert.throws(()=>A.compilePresburger('x=8',{stateLimit:1}),A.ResourceLimit);assert.throws(()=>A.compilePresburger('x=20000'),A.ResourceLimit);assert.throws(()=>A.compilePresburger('Cong(x,0,0)'),/positive/);});
test('guarded nested quantifiers match an independent Python exhaustive exact oracle with justified bounds',()=>{const formulas=[];for(let k=0;k<10;k++){formulas.push(`exists y. (y<=4 & Cong(2*y+x,${k},3))`);formulas.push(`forall y. (y<=4 -> exists z. (z<=5 & 2*z+y<=x+${k}))`);formulas.push(`!(exists y. (y<=5 & x=3*y+${k}))`);}const cases=formulas.map(f=>({ast:H.parse(f,{linear:true,predicates:{Cong:3}}),answers:Array.from({length:24},(_,x)=>A.runAutomaton(A.compilePresburger(f,{stateLimit:1024}).automaton,{x}).accept)}));const out=python(String.raw`
import json,sys
D=json.load(sys.stdin)
def ev(a,e):
 o=a['op']
 if o=='num':return int(a['n'])
 if o=='var':return e[a['name']]
 if o=='succ':return ev(a['a'],e)+1
 if o=='minus':return-ev(a['a'],e)
 if o in ['all','ex']:
  # Every quantifier in these generated formulas has an explicit guard <=5.
  V=[ev(a['a'],dict(e,**{a['name']:n}))for n in range(8)]
  return all(V)if o=='all'else any(V)
 if o=='not':return not ev(a['a'],e)
 if o=='rel':
  x,y,m=[ev(t,e)for t in a['args']];return(x-y)%m==0
 x,y=ev(a['a'],e),ev(a['b'],e)
 return {'add':lambda:x+y,'sub':lambda:x-y,'mul':lambda:x*y,'eq':lambda:x==y,'neq':lambda:x!=y,'lt':lambda:x<y,'le':lambda:x<=y,'and':lambda:x and y,'or':lambda:x or y,'imp':lambda:not x or y,'iff':lambda:x==y}[o]()
print(json.dumps([[bool(ev(z['ast'],{'x':x}))for x in range(24)]for z in D]))
`,cases);cases.forEach((z,i)=>assert.deepEqual(z.answers,out[i],formulas[i]));});
test('all13 frozen identities, full reciprocal Paper metadata, honest written dependencies and original-source flag',async()=>{const P=(await import('../content/logic/ch07.js')).default,Q=(await import('../content/logic/ch07-b.js')).default,S=(await import('../content/logic/syllabus.js')).default,items=P.items.concat(Q.items),frozen=JSON.parse(fs.readFileSync(new URL('../docs/wave-five-plan.json',import.meta.url))).chapters.find(c=>c.collection==='logic'&&c.chapter===7),key=i=>[i.num,i.kind,i.name],chapter=S.chapters.find(c=>c.n===7);assert.deepEqual(items.map(key),frozen.items.map(key));assert.deepEqual(chapter.items.map(key),frozen.items.map(key));for(const x of[items.at(-1),chapter.items.at(-1)]){assert.deepEqual(x.paper,{authors:'Kurt Gödel',year:1931,title:'Über formal unentscheidbare Sätze der Principia Mathematica und verwandter Systeme I',venue:'Monatshefte für Mathematik und Physik 38: 173–198',doi:'10.1007/BF01700692'});assert.deepEqual(x.introduces,['logic-7.2','logic-7.7','logic-7.10']);assert.equal(x.verify,true);}for(const i of items){assert.equal(typeof i.viz,'function');assert.ok(i.scope.length>80&&i.idea.length>100);assert.ok(!i.deps.some(x=>['logic-6.4','logic-6.7','toc-8.4','toc-9.7'].includes(x)));}assert.match(items[0].statement,/S\(z\)\+x/);assert.match(items.at(-1).scope,/unverified|unresolved/);});
