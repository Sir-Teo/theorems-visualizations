// Exact finite constructions. Search/display budgets never establish language-wide claims.
import {grammar,parseGrammar,tokenWord,boundedLanguage,cnf,cyk,isCNF} from './ch05.shared.js';
export {grammar,parseGrammar,tokenWord,boundedLanguage,cnf,cyk};
export const word = a => a.length ? a.join(' ') : 'ε';
const key = (...x) => JSON.stringify(x);
const unique = a => [...new Set(a)];
export function machine({states,alphabet,stack,start,initial,finals=[],rules,accept='final'}) {
  if(!['final','empty'].includes(accept)||!states.includes(start)||!stack.includes(initial))throw Error('Invalid machine declarations.');
  if(finals.some(q=>!states.includes(q))||[states,alphabet,stack].some(a=>!a.length||new Set(a).size!==a.length))throw Error('Finite alphabets/states must be nonempty and distinct.');
  for(const r of rules)if(!states.includes(r.from)||!states.includes(r.to)||!stack.includes(r.pop)||!r.push.every(x=>stack.includes(x))||r.read!==null&&!alphabet.includes(r.read))throw Error('A transition uses an undeclared symbol or state.');
  const out={states:[...states],alphabet:[...alphabet],stack:[...stack],start,initial,finals:[...finals],accept,rules:[]};
  out.rules=[...new Map(rules.map(r=>[key(r.from,r.read,r.pop,r.to,r.push),{...r,push:[...r.push]}])).values()];return out;
}
export function parsePDA(src,finalText='f',alphabetText='a b') {
  if(typeof src!=='string'||src.length>1600||typeof finalText!=='string'||typeof alphabetText!=='string')throw Error('Use text transition, final-state and alphabet fields.');
  const split=s=>s.trim()?s.trim().split(/\s+/):[],alphabet=split(alphabetText),finals=split(finalText),rules=[];
  if(!alphabet.length||alphabet.length>4||alphabet.some(s=>!/^[a-z0-9]{1,4}$/.test(s)||s==='eps'))throw Error('Use 1–4 distinct lowercase terminal tokens; eps is reserved for an empty move.');
  for(const line of src.split(/[;\n]+/).map(x=>x.trim()).filter(Boolean)){
    const m=line.match(/^([a-z][a-z0-9]{0,5})\s+(eps|[a-z0-9]{1,4})\s+([A-Z][A-Z0-9]{0,5})\s*->\s*([a-z][a-z0-9]{0,5})(?:\s+(.*))?$/);
    if(!m)throw Error('Rule syntax: p a Z -> q A Z; eps reads no input; omitted push pops the top.');
    const push=split(m[5]||'');if(push.length>3||push.some(x=>!/^[A-Z][A-Z0-9]{0,5}$/.test(x)))throw Error('Push at most three uppercase stack symbols.');
    rules.push({from:m[1],read:m[2]==='eps'?null:m[2],pop:m[3],to:m[4],push});
  }
  if(finals.some(q=>!/^[a-z][a-z0-9]{0,5}$/.test(q)))throw Error('Final states use lowercase names.');
  const states=unique(['p',...finals,...rules.flatMap(r=>[r.from,r.to])]),stack=unique(['Z',...rules.flatMap(r=>[r.pop,...r.push])]);
  if(states.length>6||stack.length>6||rules.length>32)throw Error('Editor limits: six states, six stack symbols, 32 rules.');
  return machine({states,alphabet,stack,start:'p',initial:'Z',finals,rules});
}
export const ruleText = r => `${r.from} ${r.read??'eps'} ${r.pop} -> ${r.to}${r.push.length?' '+r.push.join(' '):''}`;
export const PRESETS = {
  counts:{rules:'p a Z -> u A Z; u a A -> u A A; u b A -> q; q b A -> q; q eps Z -> f Z',finals:'p f',alphabet:'a b'},
  brackets:{rules:'p a Z -> q A Z; q a A -> q A A; q b A -> r; r eps A -> q A; r eps Z -> p Z',finals:'p',alphabet:'a b'},
  visit:{rules:'p a Z -> f Z; f eps Z -> r Z; r b Z -> r Z',finals:'f',alphabet:'a b'},
  loop:{rules:'p eps Z -> q Z Z; q eps Z -> p Z',finals:'q',alphabet:'a b'},
};
export function preset(name){const x=PRESETS[name];if(x)return parsePDA(x.rules,x.finals,x.alphabet);if(name!=='palindrome')throw Error('Unknown machine example.');const rules=[];for(const X of ['Z','A','B']){rules.push({from:'p',read:'a',pop:X,to:'p',push:['A',X]},{from:'p',read:'b',pop:X,to:'p',push:['B',X]},{from:'p',read:null,pop:X,to:'q',push:[X]});}rules.push({from:'q',read:'a',pop:'A',to:'q',push:[]},{from:'q',read:'b',pop:'B',to:'q',push:[]},{from:'q',read:null,pop:'Z',to:'f',push:['Z']});return machine({states:['p','q','f'],alphabet:['a','b'],stack:['Z','A','B'],start:'p',initial:'Z',finals:['f'],rules});}
export function determinism(M){const conflicts=[];for(const q of M.states)for(const Z of M.stack){const a=M.rules.filter(r=>r.from===q&&r.pop===Z),eps=a.filter(r=>r.read===null);if(eps.length>1||eps.length&&a.some(r=>r.read!==null))conflicts.push({q,Z,reason:'epsilon choice',rules:a});for(const c of M.alphabet){const t=a.filter(r=>r.read===c);if(t.length>1)conflicts.push({q,Z,reason:'multiple '+c+' moves',rules:t});}}return{deterministic:!conflicts.length,conflicts};}
export function inputTokens(src,M,max=20){return tokenWord(src,{terminals:M.alphabet},max);}
const accepting=(M,c,n)=>c.i===n&&(M.accept==='empty'?c.stack.length===0:M.finals.includes(c.q));
function moves(M,c,input){if(!c.stack.length)return[];return M.rules.flatMap((r,j)=>r.from===c.q&&r.pop===c.stack[0]&&(r.read===null||c.i<input.length&&r.read===input[c.i])?[{q:r.to,i:c.i+(r.read===null?0:1),stack:[...r.push,...c.stack.slice(1)],rule:j}]:[]);}
export function explore(M,input,{maxNodes=1800,maxDepth=100,maxStack=40}={}){
  const nodes=[{q:M.start,i:0,stack:[M.initial],parent:-1,rule:-1,depth:0}],seen=new Set([key(M.start,0,[M.initial])]),levels=[1];let head=0,found=-1,cuts=0,merged=0;
  while(head<nodes.length){const k=head++,c=nodes[k];if(accepting(M,c,input.length)){found=k;break;}for(const t of moves(M,c,input)){const id=key(t.q,t.i,t.stack);if(seen.has(id)){merged++;continue;}if(nodes.length>=maxNodes||c.depth>=maxDepth||t.stack.length>maxStack){cuts++;continue;}seen.add(id);nodes.push({...t,parent:k,depth:c.depth+1});levels[c.depth+1]=(levels[c.depth+1]||0)+1;}}
  const frames=[];let at=found>=0?found:nodes.length-1;while(at>=0){const c=nodes[at];frames.push({...c,line:c.rule<0?1:2,node:at});at=c.parent;}frames.reverse();return{M,input,nodes,frames,levels,cuts,merged,accepted:found>=0,status:found>=0?'accepted':cuts?'inconclusive: search budget':'rejected: reachable graph exhausted',complete:found>=0||!cuts};
}
export function deterministicRun(M,input,{maxActions=3000,maxStack=400}={}){
  if(!determinism(M).deterministic)throw Error('This operation requires a deterministic machine.');
  let c={q:M.start,i:0,stack:[M.initial],rule:-1},accepted=false,status='',halt='',frames=[],seen=new Set();
  for(let t=0;t<=maxActions;t++){
    accepted ||= accepting(M,c,input.length);frames.push({...c,stack:[...c.stack],line:c.rule<0?1:2,accepted});const id=key(c.q,c.i,c.stack);
    if(seen.has(id)){halt='repeated configuration';status=accepted?'accepted':'inconclusive: epsilon cycle';break;}seen.add(id);
    const next=moves(M,c,input);if(!next.length){halt=c.i===input.length?'input complete, no epsilon move':'stuck before input end';status=accepted?'accepted':'rejected';break;}
    if(t===maxActions||next[0].stack.length>maxStack){halt='execution budget';status=accepted?'accepted':'inconclusive: execution budget';break;}c=next[0];
  }
  return{M,input,frames,accepted,status,halt,complete:status==='accepted'||status==='rejected'};
}
export function grammarPDA(g){return machine({states:['p'],alphabet:g.terminals.length?g.terminals:['a'],stack:unique([...g.vars,...g.terminals]),start:'p',initial:g.start,accept:'empty',rules:[...g.rules.map(r=>({from:'p',read:null,pop:r.lhs,to:'p',push:r.rhs})),...g.terminals.map(a=>({from:'p',read:a,pop:a,to:'p',push:[]}))]});}
export function emptyAcceptance(M){
  if(M.accept==='empty')return M;const q=i=>'N'+i,Z='BOTTOM',old=q=>`O${M.states.indexOf(q)}`,sym=x=>'X'+M.stack.indexOf(x),states=[q(0),q(1),...M.states.map(old)],stack=[Z,...M.stack.map(sym)],rules=M.rules.map(r=>({...r,from:old(r.from),to:old(r.to),pop:sym(r.pop),push:r.push.map(sym)}));
  rules.push({from:q(0),read:null,pop:Z,to:old(M.start),push:[sym(M.initial),Z]});for(const f of M.finals)for(const X of stack)rules.push({from:old(f),read:null,pop:X,to:q(1),push:[]});for(const X of stack)rules.push({from:q(1),read:null,pop:X,to:q(1),push:[]});return machine({states,alphabet:M.alphabet,stack,start:q(0),initial:Z,rules,accept:'empty'});
}
export function pdaGrammar(M,{maxRules=3000}={}){
  M=emptyAcceptance(M);const vars=['START'],rules=[],variable=(q,Z,r)=>`V${M.states.indexOf(q)}_${M.stack.indexOf(Z)}_${M.states.indexOf(r)}`,sources=[];
  for(const q of M.states)for(const Z of M.stack)for(const r of M.states)vars.push(variable(q,Z,r));
  const add=(lhs,rhs,transition,ends)=>{if(rules.length>=maxRules)throw Error('Grammar construction exceeds the displayed rule budget.');rules.push({lhs,rhs});sources.push({transition,ends});};
  for(const r of M.states)add('START',[variable(M.start,M.initial,r)],-1,[r]);
  M.rules.forEach((t,j)=>{const prefix=t.read===null?[]:[t.read];if(!t.push.length){add(variable(t.from,t.pop,t.to),prefix,j,[t.to]);return;}
    const visit=(state,i,rhs,ends)=>{if(i===t.push.length){add(variable(t.from,t.pop,state),[...prefix,...rhs],j,ends);return;}for(const next of M.states)visit(next,i+1,[...rhs,variable(state,t.push[i],next)],[...ends,next]);};visit(t.to,0,[],[t.to]);
  });return{M,g:grammar('START',rules,vars),sources,variable};
}
export function parseSmallGrammar(src,{maxVars=4,maxRules=10,maxRhs=4,maxTerminals=3}={}){const g=parseGrammar(src);if(g.vars.length>maxVars||g.rules.length>maxRules||g.rules.some(r=>r.rhs.length>maxRhs)||g.terminals.length>maxTerminals)throw Error(`This scene allows ${maxVars} variables, ${maxRules} alternatives, ${maxRhs} symbols per right side and ${maxTerminals} terminals.`);return g;}
export function recognize(g,tokens,maxRules=600){const C=cnf(g).g;if(C.rules.length>maxRules)throw Error('Converted grammar exceeds the scene rule budget.');return{g:C,...cyk(C,tokens)};}
export function product(M,table,finals){
  if(!Array.isArray(table)||!table.length||table.length>4||table.some(r=>!Array.isArray(r)||r.length!==M.alphabet.length||r.some(x=>!Number.isInteger(x)||x<0||x>=table.length))||!Array.isArray(finals)||finals.some(x=>!Number.isInteger(x)||x<0||x>=table.length))throw Error('DFA rows must give one valid state index per alphabet token; final states must be valid indices.');
  if(M.accept!=='final')throw Error('The product scene uses final-state acceptance.');const Q=table.length,name=(q,r)=>`Q${M.states.indexOf(q)}D${r}`,states=M.states.flatMap(q=>table.map((_,r)=>name(q,r))),rules=M.rules.flatMap(t=>table.map((_,r)=>({...t,from:name(t.from,r),to:name(t.to,t.read===null?r:table[r][M.alphabet.indexOf(t.read)])})));return machine({...M,states,start:name(M.start,0),finals:M.finals.flatMap(q=>finals.map(r=>name(q,r))),rules});
}
export function epsilonAnalysis(M){
  if(!determinism(M).deterministic)throw Error('Epsilon analysis requires determinism.');const pairs=M.states.flatMap(q=>M.stack.map(Z=>({q,Z,id:key(q,Z)}))),result=new Map(),visited=new Map(pairs.map(p=>[p.id,M.finals.includes(p.q)])),eps=new Map(M.rules.filter(r=>r.read===null).map(r=>[key(r.from,r.pop),r])),frames=[];let changed=true;
  while(changed){changed=false;for(const p of pairs){if(result.has(p.id))continue;const t=eps.get(p.id);if(!t){result.set(p.id,{kind:'blocked'});changed=true;continue;}let q=t.to,answer=null;for(const X of t.push){const z=result.get(key(q,X));if(!z){answer={kind:'unresolved'};break;}if(z.kind==='blocked'){answer={kind:'blocked'};break;}q=z.end;}if(answer?.kind==='unresolved')continue;result.set(p.id,answer||{kind:'pop',end:q});changed=true;}frames.push({line:1,known:result.size,total:pairs.length});}
  changed=true;while(changed){changed=false;for(const p of pairs){if(visited.get(p.id))continue;const t=eps.get(p.id);if(!t)continue;let q=t.to,hit=M.finals.includes(q);for(const X of t.push){hit ||= visited.get(key(q,X));const z=result.get(key(q,X));if(z?.kind!=='pop')break;q=z.end;}if(hit){visited.set(p.id,true);changed=true;}}}
  const rows=pairs.map(p=>({...p,...(result.get(p.id)||{kind:'infinite'}),visitsFinal:visited.get(p.id)}));return{rows,frames,get:(q,Z)=>rows.find(x=>x.q===q&&x.Z===Z)};
}
export function scanningDPDA(M){
  if(M.accept!=='final')throw Error('Complement construction uses final-state acceptance.');const analysis=epsilonAnalysis(M),old=q=>'O'+M.states.indexOf(q),sym=x=>'X'+M.stack.indexOf(x),bottom='BOTTOM',states=['INIT','DEAD','VISIT',...M.states.map(old)],stack=[bottom,...M.stack.map(sym)],rules=[{from:'INIT',read:null,pop:bottom,to:old(M.start),push:[sym(M.initial),bottom]}];
  for(const q of M.states)for(const Z of M.stack){const a=analysis.get(q,Z),eps=M.rules.find(r=>r.from===q&&r.pop===Z&&r.read===null);if(a.kind==='infinite'){rules.push({from:old(q),read:null,pop:sym(Z),to:a.visitsFinal?'VISIT':'DEAD',push:[sym(Z)]});continue;}if(eps){rules.push({...eps,from:old(q),to:old(eps.to),pop:sym(Z),push:eps.push.map(sym)});continue;}for(const c of M.alphabet){const r=M.rules.find(r=>r.from===q&&r.pop===Z&&r.read===c);rules.push(r?{...r,from:old(q),to:old(r.to),pop:sym(Z),push:r.push.map(sym)}:{from:old(q),read:c,pop:sym(Z),to:'DEAD',push:[sym(Z)]});}}
  for(const q of M.states)for(const c of M.alphabet)rules.push({from:old(q),read:c,pop:bottom,to:'DEAD',push:[bottom]});for(const X of stack){rules.push({from:'VISIT',read:null,pop:X,to:'DEAD',push:[X]});for(const c of M.alphabet)rules.push({from:'DEAD',read:c,pop:X,to:'DEAD',push:[X]});}
  return{analysis,M:machine({states,alphabet:M.alphabet,stack,start:'INIT',initial:bottom,finals:['VISIT',...M.finals.map(old)],rules})};
}
export function complementDPDA(M){
  const normalized=scanningDPDA(M),N=normalized.M,W=(q,b)=>`W${N.states.indexOf(q)}_${+b}`,C=(q,b)=>`C${N.states.indexOf(q)}_${+b}`,states=[],finals=[],rules=[];
  for(const q of N.states)for(const b of [false,true]){states.push(W(q,b),C(q,b));if(!b)finals.push(C(q,b));for(const X of N.stack){const eps=N.rules.find(r=>r.from===q&&r.pop===X&&r.read===null);if(eps)rules.push({...eps,from:W(q,b),to:W(eps.to,b||N.finals.includes(eps.to))});else rules.push({from:W(q,b),read:null,pop:X,to:C(q,b),push:[X]});for(const t of N.rules.filter(r=>r.from===q&&r.pop===X&&r.read!==null))rules.push({...t,from:C(q,b),to:W(t.to,N.finals.includes(t.to))});}}
  return{...normalized,original:M,normalized:N,M:machine({states,alphabet:N.alphabet,stack:N.stack,start:W(N.start,N.finals.includes(N.start)),initial:N.initial,finals,rules})};
}

export function splitWord(tokens,a,b,c,d,power=2){
  if(![a,b,c,d,power].every(Number.isInteger)||a<0||a>b||b>c||c>d||d>tokens.length||power<0||power>8)throw Error('Use ordered token boundaries and a pump power from 0 to 8.');
  const parts=[tokens.slice(0,a),tokens.slice(a,b),tokens.slice(b,c),tokens.slice(c,d),tokens.slice(d)],pumped=[...parts[0],...Array.from({length:power},()=>parts[1]).flat(),...parts[2],...Array.from({length:power},()=>parts[3]).flat(),...parts[4]];return{parts,pumped,a,b,c,d,power};
}
export function decompositions(tokens,p,marks=null){
  const n=tokens.length,prefix=[0];for(let i=0;i<n;i++)prefix.push(prefix[i]+(marks?+marks[i]:1));const count=(a,b)=>prefix[b]-prefix[a],out=[];
  for(let a=0;a<=n;a++)for(let d=a;d<=n;d++){if(count(a,d)>p)break;for(let b=a;b<=d;b++)for(let c=b;c<=d;c++)if(count(a,b)+count(c,d)>0)out.push({a,b,c,d,window:count(a,d),pumpedMarks:count(a,b)+count(c,d)});}
  return out;
}
function runs(a){const out=[];for(const x of a){if(out.at(-1)?.symbol===x)out.at(-1).count++;else out.push({symbol:x,count:1});}return out;}
const equalCounts=(a,symbols)=>{const r=runs(a);return !a.length||r.length===symbols.length&&r.every((x,i)=>x.symbol===symbols[i]&&x.count===r[0].count);};
export const isEvenPalindrome=a=>a.length%2===0&&a.every((x,i)=>x===a[a.length-1-i]);
export const isCopy=a=>a.length%2===0&&a.slice(0,a.length/2).every((x,i)=>x===a[i+a.length/2]);
export function minPalindrome(a){return a.length>0&&isEvenPalindrome(a)&&!Array.from({length:a.length/2-1},(_,i)=>2*(i+1)).some(n=>isEvenPalindrome(a.slice(0,n)));}
export function fourAlternating(a){const s=a.join(''),m=s.match(/^((?:ab)+)((?:ba)+)((?:ab)+)((?:ba)+)$/);return m?m.slice(1).map(x=>x.length/2):null;}
export function counterexample(kind,p){
  if(!Number.isInteger(p)||p<1||p>8)throw Error('Use a candidate pumping bound from 1 to 8.');const repeat=(a,n)=>Array.from({length:n},()=>a).flat();let tokens,marks=null,member;
  if(kind==='triple'){tokens=repeat(['a'],p).concat(repeat(['b'],p),repeat(['c'],p));member=a=>equalCounts(a,['a','b','c']);}
  else if(kind==='copy'){tokens=repeat(['a'],p).concat(repeat(['b'],p),repeat(['a'],p),repeat(['b'],p));member=a=>{const r=runs(a);return r.length===4&&r.map(x=>x.symbol).join('')==='abab'&&r[0].count===r[2].count&&r[1].count===r[3].count;};}
  else if(kind==='palindrome'){tokens=repeat(['a','b'],p+1).concat(repeat(['b','a'],p),repeat(['a','b'],p),repeat(['b','a'],p+1));member=a=>{const r=fourAlternating(a);return !!r&&r[0]===r[3]&&r[1]===r[2]&&r[0]>r[1];};}
  else if(kind==='ogden'){tokens=['a',...repeat(['b'],p),...repeat(['c'],p),...repeat(['d'],p)];marks=tokens.map(x=>x!=='a');member=a=>{const s=a.join('');if(!/^a*b*c*d*$/.test(s))return false;const count=x=>a.filter(y=>y===x).length;return count('a')===0||count('b')===count('c')&&count('c')===count('d');};}
  else throw Error('Unknown pumping example.');
  const splits=decompositions(tokens,p,marks);return{kind,p,tokens,marks,member,splits};
}
export function pumpingTree(g,tokens,marks=null){
  const parsed=recognize(g,tokens),nodes=[];let pos=0;
  const visit=(t,path=[],parent=null)=>{const node={sym:t.sym,path,parent,start:pos,end:0,id:nodes.length,kids:[]};nodes.push(node);if(!t.kids.length){if(t.sym!=='ε')pos++;}else node.kids=t.kids.map((c,i)=>visit(c,[...path,i],node.id));node.end=pos;return node;};
  const tree=parsed.tree?visit(parsed.tree):null,N=parsed.g.vars.length,p=2**(N+(marks?1:0)),prefix=[0];for(let i=0;i<tokens.length;i++)prefix.push(prefix[i]+(marks?+marks[i]:1));const count=(a,b)=>prefix[b]-prefix[a],pairs=[];
  for(const lower of nodes){let k=lower.parent;while(k!==null){const upper=nodes[k];if(upper.sym===lower.sym&&parsed.g.vars.includes(upper.sym)){const a=upper.start,b=lower.start,c=lower.end,d=upper.end;if(count(a,d)<=p&&count(a,b)+count(c,d)>0)pairs.push({upper:upper.id,lower:lower.id,a,b,c,d,window:count(a,d),pumpedMarks:count(a,b)+count(c,d)});}k=upper.parent;}}
  return{...parsed,tokens,tree,nodes,p,N,marks,pairs,eligible:count(0,tokens.length)>=p};
}
export function parikhAutomaton(g,{maxStates=200}={}){
  const n=g.vars.length,m=Math.max(0,...g.rules.map(r=>r.rhs.filter(x=>g.vars.includes(x)).length-1)),bound=n*m+1,states=[],index=new Map();
  const enumerate=(a,left)=>{if(a.length===n){if(states.length>=maxStates)throw Error('Parikh automaton exceeds the 200-state scene budget.');index.set(key(a),states.length);states.push(a);return;}for(let k=0;k<=left;k++)enumerate([...a,k],left-k);};enumerate([],bound);
  const edges=[];states.forEach((s,from)=>g.rules.forEach((r,rule)=>{const j=g.vars.indexOf(r.lhs);if(!s[j])return;const next=[...s];next[j]--;const label=[];for(const x of r.rhs){const k=g.vars.indexOf(x);if(k<0)label.push(x);else next[k]++;}if(next.reduce((a,b)=>a+b,0)>bound)return;edges.push({from,to:index.get(key(next)),label,rule});}));const start=Array(n).fill(0);start[g.vars.indexOf(g.start)]=1;return{g,n,m,bound,states,edges,start:index.get(key(start)),final:index.get(key(Array(n).fill(0)))};
}
export function automatonWords(A,maxLength,{maxNodes=60000}={}){
  const nodes=[{state:A.start,word:[],parent:-1,edge:-1}],seen=new Set([key(A.start,[])]),words=new Map(),outgoing=A.states.map((_,q)=>A.edges.map((e,i)=>({...e,id:i})).filter(e=>e.from===q));
  for(let head=0;head<nodes.length;head++){const u=nodes[head];if(u.state===A.final&&!words.has(key(u.word)))words.set(key(u.word),head);for(const e of outgoing[u.state]){const w=[...u.word,...e.label],id=key(e.to,w);if(w.length>maxLength||seen.has(id))continue;if(nodes.length>=maxNodes)throw Error('Finite regular-language enumeration exceeds the scene budget.');seen.add(id);nodes.push({state:e.to,word:w,parent:head,edge:e.id});}}
  const strings=[...words.keys()].map(s=>JSON.parse(s)[0]);return{strings,nodes,path:w=>{let i=words.get(key(w));const path=[];while(i!==undefined&&i>=0){path.push(nodes[i]);i=nodes[i].parent;}return path.reverse();}};
}
export const counts=(tokens,alphabet)=>alphabet.map(x=>tokens.filter(y=>y===x).length);
export function parikhComparison(g,maxLength=5){
  if(g.terminals.length>2||g.vars.length>4)throw Error('The lattice scene allows at most two terminals and four variables.');
  const A=parikhAutomaton(g),G=boundedLanguage(g,maxLength).strings,R=automatonWords(A,maxLength),alphabet=unique([...g.terminals,'a','b']).slice(0,2),vectors=new Map();
  for(const [source,strings] of [['grammar',G],['regular',R.strings]])for(const w of strings){const v=counts(w,alphabet),id=key(v);if(!vectors.has(id))vectors.set(id,{v,grammar:[],regular:[]});vectors.get(id)[source].push(w);}
  return{g,A,G,R,alphabet,maxLength,vectors:[...vectors.values()].sort((a,b)=>a.v[0]-b.v[0]||a.v[1]-b.v[1])};
}
const bracketKey=(rule,side,open)=>`${open?'o':'c'}${rule}.${side}`;
export function bracketEncoding(g,tokens){
  const P=recognize(g,tokens),rules=P.g.rules.filter(r=>r.rhs.length),brackets=[];
  const encode=t=>{const rhs=t.kids.map(x=>x.sym),r=rules.findIndex(r=>r.lhs===t.sym&&key(r.rhs)===key(rhs));if(r<0)throw Error('Parse-tree production is missing.');const terminal=rhs.length===1;return[bracketKey(r,1,true),...(terminal?[]:encode(t.kids[0])),bracketKey(r,1,false),bracketKey(r,2,true),...(terminal?[]:encode(t.kids[1])),bracketKey(r,2,false)];};
  if(P.accepted&&tokens.length)brackets.push(...encode(P.tree));return{...P,rules,brackets,epsilon:P.g.rules.some(r=>r.lhs===P.g.start&&!r.rhs.length)};
}
export function checkBrackets(G,brackets){
  if(brackets.length>100)throw Error('Use at most 100 bracket tokens.');
  const parse=s=>{const m=typeof s==='string'&&s.match(/^([oc])(\d+)\.([12])$/);if(!m||+m[2]>=G.rules.length)throw Error('Bracket tokens use oRULE.SIDE or cRULE.SIDE with an existing nonempty rule and side 1 or 2.');return{open:m[1]==='o',rule:+m[2],side:+m[3],token:s};},tokens=brackets.map(parse),stack=[],frames=[],violations=[],projection=[];let balanced=true;
  const fail=(at,reason)=>violations.push({at,reason});
  if(!tokens.length){return{tokens,frames:[{at:-1,depth:0,stack:[],line:1}],balanced:true,regular:G.epsilon,accepted:G.epsilon,projection:[],violations:G.epsilon?[]:[{at:-1,reason:'epsilon is not in this grammar'}]};}
  const first=tokens[0];if(!first.open||first.side!==1||G.rules[first.rule].lhs!==G.g.start)fail(0,'P5: first bracket must open a start-variable production, side 1');
  tokens.forEach((t,i)=>{const rule=G.rules[t.rule],next=tokens[i+1];if(t.open){stack.push({rule:t.rule,side:t.side});if(rule.rhs.length===1&&t.side===1)projection.push(rule.rhs[0]);}else{const top=stack.pop();if(!top||top.rule!==t.rule||top.side!==t.side)balanced=false;}
    if(!t.open&&t.side===1&&(!next||!next.open||next.side!==2||next.rule!==t.rule))fail(i,'P1: close side 1 must be followed by open side 2 of the same production');
    if(!t.open&&t.side===2&&next?.open)fail(i,'P2: a completed side 2 cannot be followed by a new opening');
    if(t.open&&next&&rule.rhs.length===2&&(!next.open||next.side!==1||G.rules[next.rule].lhs!==rule.rhs[t.side-1]))fail(i,'P3: opening must enter the correct child variable');
    if(t.open&&next&&rule.rhs.length===1&&(next.open||next.side!==t.side||next.rule!==t.rule))fail(i,'P4: a terminal production has an empty bracket interior');
    frames.push({at:i,depth:stack.length,stack:stack.map(x=>({...x})),balanced,line:t.open?2:3,projection:[...projection]});
  });balanced &&= stack.length===0;return{tokens,frames,balanced,regular:!violations.length,accepted:balanced&&!violations.length,projection,violations};
}
