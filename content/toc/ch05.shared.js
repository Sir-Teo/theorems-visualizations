// Chapter-local finite grammar algorithms. Limits belong to the caller, not the theorem.
const variable=s=>/^[A-Z][A-Za-z0-9_]*$/.test(s);
const key=r=>JSON.stringify([r.lhs,r.rhs]);
export const word=a=>a.length?a.join(' '):'ε';
export function grammar(start,rules,vars=[]){
  rules=[...new Map(rules.map(r=>[key(r),{lhs:r.lhs,rhs:[...r.rhs]}])).values()];
  const variables=[...new Set([start,...vars,...rules.flatMap(r=>[r.lhs,...r.rhs.filter(variable)])])];
  return{start,rules,vars:variables,terminals:[...new Set(rules.flatMap(r=>r.rhs).filter(x=>!variables.includes(x)))]};
}
export function parseGrammar(src){
  if(typeof src!=='string'||src.length>900)throw Error('Use at most 900 grammar characters.');
  const rules=[],lines=src.split(/[;\n]+/).map(x=>x.trim()).filter(Boolean);
  if(!lines.length)throw Error('Enter a rule, such as S -> a S b | eps.');
  for(const line of lines){
    const m=line.match(/^([A-Z][A-Za-z0-9_]*)\s*(?:->|→)\s*(.+)$/);
    if(!m)throw Error('Rules use uppercase variables, ->, space-separated symbols and ; between rules.');
    for(const part of m[2].split('|')){
      const rhs=part.trim().split(/\s+/);if(rhs.length===1&&['eps','ε'].includes(rhs[0]))rhs.length=0;
      if(rhs.some(x=>!/^([A-Za-z0-9_]+|[()+*\-=/])$/.test(x)||x==='eps')||rhs.length>8)throw Error('Use at most eight simple symbols per alternative; eps stands alone.');
      rules.push({lhs:m[1],rhs});
    }
  }
  const g=grammar(rules[0].lhs,rules),defined=new Set(rules.map(r=>r.lhs));
  if(g.vars.some(x=>!defined.has(x)))throw Error('Every uppercase variable needs a defining rule.');
  if(g.vars.some(x=>x.length>6)||g.terminals.some(x=>x.length>8))throw Error('Editor variable names allow six characters; terminal tokens allow eight.');
  if(g.vars.length>8||g.rules.length>24||g.terminals.length>8)throw Error('This editor allows eight variables, 24 alternatives and eight terminal symbols.');
  return g;
}
export function tokenWord(src,g,max=20){
  if(typeof src!=='string'||src.length>160)throw Error('The input word is too long for this experiment.');
  const a=src.trim()?src.trim().split(/\s+/):[];
  if(a.length>max)throw Error(`Use at most ${max} space-separated tokens.`);
  if(a.some(x=>!g.terminals.includes(x)))throw Error('Each word token must be a terminal of this grammar.');
  return a;
}
export function nullable(g){
  const out=new Set();let changed=true;
  while(changed){changed=false;for(const r of g.rules)if(!out.has(r.lhs)&&r.rhs.every(x=>out.has(x))){out.add(r.lhs);changed=true;}}
  return out;
}
export function boundedLanguage(g,n){
  const sets=Object.fromEntries(g.vars.map(x=>[x,new Set()])),encode=a=>a.join('\x1f');let changed=true,rounds=0;
  while(changed){changed=false;rounds++;for(const r of g.rules){let a=new Set(['']);for(const x of r.rhs){const options=sets[x]??new Set([x]),b=new Set();for(const u of a)for(const v of options){const q=u?u.split('\x1f'):[],t=v?v.split('\x1f'):[];if(q.length+t.length<=n)b.add(encode([...q,...t]));}a=b;}for(const s of a)if(!sets[r.lhs].has(s)){sets[r.lhs].add(s);changed=true;}}}
  const strings=[...sets[g.start]].map(s=>s?s.split('\x1f'):[]).sort((a,b)=>a.length-b.length||word(a).localeCompare(word(b)));
  return{strings,rounds,byVariable:sets};
}
export function firstFollow(g){
  const N=nullable(g),first=Object.fromEntries(g.vars.map(x=>[x,new Set()])),follow=Object.fromEntries(g.vars.map(x=>[x,new Set()]));
  const sequence=a=>{const set=new Set();let empty=true;for(const x of a){for(const t of first[x]??[x])set.add(t);if(!N.has(x)){empty=false;break;}}return{set,empty};};
  let changed=true;while(changed){changed=false;for(const r of g.rules)for(const x of sequence(r.rhs).set)if(!first[r.lhs].has(x)){first[r.lhs].add(x);changed=true;}}
  follow[g.start].add('$');changed=true;
  while(changed){changed=false;for(const r of g.rules)r.rhs.forEach((x,j)=>{if(!follow[x])return;const z=sequence(r.rhs.slice(j+1)),a=[...z.set,...(z.empty?follow[r.lhs]:[])];for(const t of a)if(!follow[x].has(t)){follow[x].add(t);changed=true;}});}
  return{nullable:N,first,follow,sequence};
}
function fresh(used,prefix){let i=0;while(used.has(prefix+i))i++;const x=prefix+i;used.add(x);return x;}
export function cnf(g){
  const used=new Set(g.vars),start=fresh(used,'START'),stages=[];
  let rules=[{lhs:start,rhs:[g.start]},...g.rules];
  const save=name=>{const G=grammar(start,rules,[...used]);stages.push({name,g:G});rules=G.rules;};
  save('fresh start');
  rules=rules.flatMap(r=>{if(r.rhs.length<=2)return[r];const out=[];let lhs=r.lhs;for(let j=0;j<r.rhs.length-2;j++){const next=fresh(used,'BIN');out.push({lhs,rhs:[r.rhs[j],next]});lhs=next;}out.push({lhs,rhs:r.rhs.slice(-2)});return out;});save('binarize long rules');
  const N=nullable(stages.at(-1).g),expanded=[];
  for(const r of rules){for(let bits=0;bits<2**r.rhs.length;bits++){if(r.rhs.some((x,j)=>(bits>>j&1)&&!N.has(x)))continue;const rhs=r.rhs.filter((_,j)=>!(bits>>j&1));if(rhs.length||r.lhs===start&&N.has(start))expanded.push({lhs:r.lhs,rhs});}}
  rules=expanded;save('remove epsilon except fresh start');
  const unit=Object.fromEntries([...used].map(x=>[x,new Set([x])]));let changed=true;
  while(changed){changed=false;for(const r of rules)if(r.rhs.length===1&&used.has(r.rhs[0]))for(const t of unit[r.rhs[0]])if(!unit[r.lhs].has(t)){unit[r.lhs].add(t);changed=true;}}
  const nonunit=rules.filter(r=>!(r.rhs.length===1&&used.has(r.rhs[0])));
  rules=[...used].flatMap(lhs=>nonunit.filter(r=>unit[lhs].has(r.lhs)).map(r=>({lhs,rhs:r.rhs})));save('close unit paths');
  const terminalVars=new Map(),extra=[];rules=rules.map(r=>({lhs:r.lhs,rhs:r.rhs.map(x=>{if(r.rhs.length<2||used.has(x))return x;if(!terminalVars.has(x)){const a=fresh(used,'TERM');terminalVars.set(x,a);extra.push({lhs:a,rhs:[x]});}return terminalVars.get(x);})}));rules.push(...extra);save('protect paired terminals');
  return{g:stages.at(-1).g,stages,nullable:[...N]};
}
export function isCNF(g){return!g.rules.some(r=>r.rhs.includes(g.start))&&g.rules.every(r=>r.rhs.length===0?r.lhs===g.start:r.rhs.length===1?!g.vars.includes(r.rhs[0]):r.rhs.length===2&&r.rhs.every(x=>g.vars.includes(x)));}
export function cyk(g,tokens){
  if(!isCNF(g))throw Error('CYK requires the declared Chomsky normal form.');
  const n=tokens.length,table=Array.from({length:n+1},()=>Array.from({length:n+1},()=>new Set())),witness=new Map(),frames=[];let checks=0;
  for(let len=1;len<=n;len++)for(let i=0;i+len<=n;i++){const j=i+len;
    if(len===1)for(const r of g.rules){checks++;if(r.rhs.length===1&&r.rhs[0]===tokens[i]){table[i][j].add(r.lhs);witness.set(`${i},${j},${r.lhs}`,{sym:r.lhs,kids:[{sym:tokens[i],kids:[]}]});}}
    else for(let k=i+1;k<j;k++)for(const r of g.rules){if(r.rhs.length!==2)continue;checks++;if(table[i][k].has(r.rhs[0])&&table[k][j].has(r.rhs[1])){table[i][j].add(r.lhs);const key=`${i},${j},${r.lhs}`;if(!witness.has(key))witness.set(key,{sym:r.lhs,kids:[witness.get(`${i},${k},${r.rhs[0]}`),witness.get(`${k},${j},${r.rhs[1]}`)]});}}
    frames.push({i,j,len,variables:[...table[i][j]].sort(),checks});
  }
  const empty=g.rules.some(r=>r.lhs===g.start&&!r.rhs.length),accepted=n?table[0][n].has(g.start):empty;
  if(!n)frames.push({i:0,j:0,len:0,variables:empty?[g.start]:[],checks:0});
  return{table,frames,accepted,checks,witness,tree:n?witness.get(`0,${n},${g.start}`):empty?{sym:g.start,kids:[{sym:'ε',kids:[]}]}:null};
}
export function llTable(g){
  const facts=firstFollow(g),table=new Map();
  g.rules.forEach((r,j)=>{const z=facts.sequence(r.rhs),tokens=new Set([...z.set,...(z.empty?facts.follow[r.lhs]:[])]);for(const t of tokens){const k=r.lhs+'\x1f'+t;if(!table.has(k))table.set(k,[]);table.get(k).push(j);}});
  return{...facts,table,conflicts:[...table].filter(([,a])=>a.length>1)};
}
export function llRun(g,input,max=500){
  const T=llTable(g),stack=['$',g.start],tokens=[...input,'$'],frames=[];let i=0,status='step limit';
  for(let t=0;t<max;t++){
    const top=stack.at(-1),look=tokens[i],rules=T.table.get(top+'\x1f'+look)??[];
    let action;if(top==='$'&&look==='$'){action='accept';status='accepted';}
    else if(!g.vars.includes(top)){if(top===look){action='match '+look;stack.pop();i++;}else{action='syntax error: expected '+top;status='syntax error';}}
    else if(rules.length===1){const r=g.rules[rules[0]];action=r.lhs+' → '+word(r.rhs);stack.pop();stack.push(...r.rhs.toReversed());}
    else{action=rules.length?'conflict: '+rules.map(j=>j+1).join(', '):'syntax error: empty table cell';status=rules.length?'conflict':'syntax error';}
    frames.push({stack:[...stack],remaining:tokens.slice(i),look,action,consumed:i});if(status!=='step limit')break;
  }
  return{...T,frames,status,accepted:status==='accepted'};
}
export function lr1(g,limit=160){
  const used=new Set(g.vars),aug=fresh(used,'AUG'),G=grammar(aug,[{lhs:aug,rhs:[g.start]},...g.rules],[...used]),facts=firstFollow(G),byLhs=new Map(G.vars.map(x=>[x,G.rules.map((r,j)=>r.lhs===x?j:-1).filter(j=>j>=0)]));
  const itemKey=a=>`${a.rule}/${a.dot}/${a.look}`,canonical=a=>a.map(itemKey).sort().join(';');
  const closure=initial=>{const a=new Map(initial.map(x=>[itemKey(x),x]));let changed=true;while(changed){changed=false;for(const it of[...a.values()]){const r=G.rules[it.rule],next=r.rhs[it.dot];if(!byLhs.has(next))continue;for(const la of facts.sequence([...r.rhs.slice(it.dot+1),it.look]).set)for(const j of byLhs.get(next)){const z={rule:j,dot:0,look:la},k=itemKey(z);if(!a.has(k)){a.set(k,z);changed=true;}}}}return[...a.values()].sort((a,b)=>itemKey(a).localeCompare(itemKey(b)));};
  const states=[closure([{rule:0,dot:0,look:'$'}])],seen=new Map([[canonical(states[0]),0]]),transitions=[],action=new Map(),go=new Map();let complete=true;
  outer:for(let i=0;i<states.length;i++){
    const symbols=[...new Set(states[i].map(it=>G.rules[it.rule].rhs[it.dot]).filter(Boolean))].sort();
    for(const x of symbols){const next=closure(states[i].filter(it=>G.rules[it.rule].rhs[it.dot]===x).map(it=>({...it,dot:it.dot+1}))),k=canonical(next);let j=seen.get(k);
      if(j===undefined){if(states.length>=limit){complete=false;break outer;}j=states.length;states.push(next);seen.set(k,j);}transitions.push({from:i,symbol:x,to:j});
    }
  }
  const add=(state,token,a)=>{const k=state+'\x1f'+token;if(!action.has(k))action.set(k,[]);const z=action.get(k);if(!z.some(b=>b.kind===a.kind&&b.to===a.to&&b.rule===a.rule))z.push(a);};
  if(complete){for(const e of transitions){if(G.vars.includes(e.symbol))go.set(e.from+'\x1f'+e.symbol,e.to);else add(e.from,e.symbol,{kind:'shift',to:e.to});}
    states.forEach((s,i)=>{for(const it of s)if(it.dot===G.rules[it.rule].rhs.length)add(i,it.look,it.rule===0?{kind:'accept'}:{kind:'reduce',rule:it.rule});});}
  return{g:G,original:g,states,transitions,action,go,complete,conflicts:[...action].filter(([,a])=>a.length>1)};
}
export function lrRun(machine,input,max=500){
  if(!machine.complete)return{frames:[{states:[0],symbols:[],remaining:input,action:'construction limit reached'}],status:'construction limit',accepted:false};
  const states=[0],symbols=[],nodes=[],tokens=[...input,'$'],frames=[];let i=0,status='step limit';
  for(let t=0;t<max;t++){
    const acts=machine.action.get(states.at(-1)+'\x1f'+tokens[i])??[];let action;
    if(acts.length!==1){status=acts.length?'conflict':'syntax error';action=status;}
    else{const a=acts[0];if(a.kind==='accept'){status='accepted';action='accept';}
      else if(a.kind==='shift'){action='shift '+tokens[i]+' to '+a.to;symbols.push(tokens[i]);nodes.push({sym:tokens[i],kids:[]});states.push(a.to);i++;}
      else{const r=machine.g.rules[a.rule],n=r.rhs.length,kids=n?nodes.splice(-n):[{sym:'ε',kids:[]}];if(n){symbols.splice(-n);states.splice(-n);}const to=machine.go.get(states.at(-1)+'\x1f'+r.lhs);if(to===undefined)throw Error('Missing goto for a valid reduction.');symbols.push(r.lhs);nodes.push({sym:r.lhs,kids});states.push(to);action='reduce '+r.lhs+' → '+word(r.rhs);}}
    frames.push({states:[...states],symbols:[...symbols],remaining:tokens.slice(i),action,consumed:i});if(status!=='step limit')break;
  }
  return{frames,status,accepted:status==='accepted',tree:status==='accepted'?nodes[0]:null};
}
export function greibach(input,ruleLimit=800){
  const C=cnf(input).g,used=new Set(C.vars),original=[...C.vars],aux=[],stages=[],empty=C.rules.some(r=>!r.rhs.length);
  let rules=C.rules.filter(r=>r.rhs.length),complete=true;
  const save=name=>{const g=grammar(C.start,rules,[...used]);rules=g.rules;stages.push({name,g});if(rules.length>ruleLimit)complete=false;};
  const replaceHead=(lhs,head)=>{const choices=rules.filter(r=>r.lhs===head),out=[];for(const r of rules){for(const q of r.lhs===lhs&&r.rhs[0]===head?choices.map(q=>({lhs,rhs:[...q.rhs,...r.rhs.slice(1)]})):[r]){out.push(q);if(out.length>ruleLimit){complete=false;return;}}}rules=out;};
  save('CNF without epsilon');
  for(let i=0;i<original.length&&complete;i++){
    const A=original[i];for(let j=0;j<i&&complete;j++)replaceHead(A,original[j]);
    const recursive=rules.filter(r=>r.lhs===A&&r.rhs[0]===A),base=rules.filter(r=>r.lhs===A&&r.rhs[0]!==A);
    if(recursive.length){rules=rules.filter(r=>r.lhs!==A);if(base.length){const R=fresh(used,'REC');aux.push(R);for(const r of base)rules.push(r,{lhs:A,rhs:[...r.rhs,R]});for(const r of recursive){const tail=r.rhs.slice(1);if(!tail.length)continue;rules.push({lhs:R,rhs:tail},{lhs:R,rhs:[...tail,R]});}}}
    save('order and remove left recursion at '+A);
  }
  const finish=A=>{let rounds=0;while(complete&&rules.some(r=>r.lhs===A&&used.has(r.rhs[0]))){const heads=[...new Set(rules.filter(r=>r.lhs===A&&used.has(r.rhs[0])).map(r=>r.rhs[0]))];for(const h of heads)replaceHead(A,h);if(++rounds>original.length+aux.length+1||rules.length>ruleLimit){complete=false;break;}}save('expand terminal heads at '+A);};
  for(const A of original.toReversed())if(complete)finish(A);
  for(const A of aux)if(complete)finish(A);
  if(empty)rules.push({lhs:C.start,rhs:[]});save('restore fresh-start empty word');
  const g=grammar(C.start,rules,[...used]);
  complete&&=g.rules.every(r=>!r.rhs.length?r.lhs===g.start:!g.vars.includes(r.rhs[0])&&r.rhs.slice(1).every(x=>g.vars.includes(x)));
  return{g,stages,complete,empty};
}
export function parseOne(g,input){
  const table=new Map(),get=(a,i,j)=>table.get(a+'\x1f'+i+'\x1f'+j);let changed=true;
  while(changed){changed=false;for(const r of g.rules)for(let i=0;i<=input.length;i++){
    let paths=new Map([[i,[]]]);for(const x of r.rhs){const next=new Map();for(const [p,kids]of paths){if(g.vars.includes(x)){for(let q=p;q<=input.length;q++){const t=get(x,p,q);if(t&&!next.has(q))next.set(q,[...kids,t]);}}else if(input[p]===x&&!next.has(p+1))next.set(p+1,[...kids,{sym:x,kids:[]}]);}paths=next;}
    for(const [j,kids]of paths){const k=r.lhs+'\x1f'+i+'\x1f'+j;if(!table.has(k)){table.set(k,{sym:r.lhs,kids:kids.length?kids:[{sym:'ε',kids:[]}]});changed=true;}}
  }}return get(g.start,0,input.length)??null;
}
export function derivation(tree,side='leftmost'){
  let next=0;const copy=t=>({sym:t.sym,id:next++,kids:t.kids.map(copy)}),root=copy(tree),frontier=[root],expanded=[],frames=[{symbols:[root.sym],expanded:[]}];
  while(frontier.some(x=>x.kids.length)){const indices=frontier.map((x,j)=>x.kids.length?j:-1).filter(j=>j>=0),i=side==='rightmost'?indices.at(-1):indices[0],node=frontier[i];expanded.push(node.id);frontier.splice(i,1,...node.kids.filter(x=>x.sym!=='ε'));frames.push({symbols:frontier.map(x=>x.sym),expanded:[...expanded],rule:node.sym+' → '+word(node.kids.filter(x=>x.sym!=='ε').map(x=>x.sym)),node:node.id});}
  return{tree:root,frames};
}
export function binaryParseTrees(n){if(n===1)return[{sym:'S',kids:[{sym:'a',kids:[]}]}];const out=[];for(let k=1;k<n;k++)for(const a of binaryParseTrees(k))for(const b of binaryParseTrees(n-k))out.push({sym:'S',kids:[a,b]});return out;}
export function bracketProfile(src){
  if(src.length>24||/[^()]/.test(src))throw Error('Use at most 24 left/right parentheses.');
  const heights=[0],stack=[],pairs=[];let firstNegative=null;
  for(let j=0;j<src.length;j++){const h=heights.at(-1)+(src[j]==='('?1:-1);heights.push(h);if(h<0&&firstNegative===null)firstNegative=j;if(src[j]==='(')stack.push(j);else if(stack.length)pairs.push([stack.pop(),j]);}
  return{heights,pairs,unmatchedOpen:stack,firstNegative,balanced:firstNegative===null&&heights.at(-1)===0};
}
export function expressionTrees(src,layered=false,association='left'){
  const tokens=src.match(/[1-9]|[()+*\-]/g)??[];
  if(tokens.join('')!==src.replace(/\s/g,'')||tokens.length>15||!tokens.length)throw Error('Use numbers 1–9 and +, − (typed -), *, parentheses; at most 15 tokens.');
  if(tokens.filter(x=>/[1-9]/.test(x)).length>6)throw Error('Use at most six number tokens.');
  const memo=new Map(),solve=(lo,hi)=>{const k=lo+','+hi;if(memo.has(k))return memo.get(k);const out=[];memo.set(k,out);if(hi-lo===1&&/^[1-9]$/.test(tokens[lo])){out.push({sym:tokens[lo],kids:[],value:+tokens[lo]});return out;}
    let depth=0,ops=[],outer=true;for(let j=lo;j<hi;j++){if(tokens[j]==='(')depth++;else if(tokens[j]===')')depth--;else if(depth===0&&['+','-','*'].includes(tokens[j]))ops.push(j);if(depth<0)return out;if(j<hi-1&&depth===0)outer=false;}
    if(depth!==0)return out;if(tokens[lo]==='('&&tokens[hi-1]===')'&&outer){out.push(...solve(lo+1,hi-1));return out;}
    if(layered&&ops.length){const precedence=j=>tokens[j]==='*'?2:1,min=Math.min(...ops.map(precedence));ops=ops.filter(j=>precedence(j)===min);ops=[association==='right'&&min===1?ops[0]:ops.at(-1)];}
    for(const j of ops)for(const a of solve(lo,j))for(const b of solve(j+1,hi)){const op=tokens[j],value=op==='+'?a.value+b.value:op==='-'?a.value-b.value:a.value*b.value;out.push({sym:op,kids:[a,b],value});}return out;};
  const trees=solve(0,tokens.length);if(!trees.length)throw Error('No expression parse: check operand/operator order and parentheses.');return{tokens,trees};
}
export function renameGrammar(g,prefix){const names=new Map(g.vars.map(x=>[x,prefix+x]));return grammar(names.get(g.start),g.rules.map(r=>({lhs:names.get(r.lhs),rhs:r.rhs.map(x=>names.get(x)??x)})),g.vars.map(x=>names.get(x)));}
export function combine(a,b,operation){
  const A=renameGrammar(a,'LEFT_'),B=renameGrammar(b,'RIGHT_'),used=new Set([...A.vars,...B.vars]),start=fresh(used,'JOIN'),base=operation==='star'?A.rules:[...A.rules,...B.rules],rules=operation==='union'?[{lhs:start,rhs:[A.start]},{lhs:start,rhs:[B.start]}]:operation==='concatenate'?[{lhs:start,rhs:[A.start,B.start]}]:[{lhs:start,rhs:[]},{lhs:start,rhs:[A.start,start]}];
  return grammar(start,[...rules,...base],[...used]);
}
export function dfaGrammar(transitions,finals){return grammar('Q0',[...transitions.flatMap((row,i)=>row.map((q,j)=>({lhs:'Q'+i,rhs:[['a','b'][j],'Q'+q]}))),...finals.map(q=>({lhs:'Q'+q,rhs:[]}))],['Q0','Q1']);}
export function dfaRun(transitions,finals,tokens){
  let state=0;const frames=[{state,prefix:[],remaining:[...tokens],action:'start at Q0'}];
  tokens.forEach((x,j)=>{state=transitions[state][x==='a'?0:1];frames.push({state,prefix:tokens.slice(0,j+1),remaining:tokens.slice(j+1),action:'read '+x+' and enter Q'+state});});
  const accepted=finals.includes(state);frames.push({state,prefix:[...tokens],remaining:[],action:accepted?'use the accepting epsilon rule':'no accepting epsilon rule',finished:true});
  return{frames,state,accepted,g:dfaGrammar(transitions,finals)};
}
export function danglingTrees(src){
  const tokens=src.trim()?src.trim().split(/\s+/):[];
  if(tokens.length>21||tokens.some(x=>!['if','then','else','a','b','s','t'].includes(x)))throw Error('Use at most 21 tokens from if, a, b, then, else, s, t.');
  const memo=new Map(),parse=(lo,hi)=>{const key=lo+','+hi;if(memo.has(key))return memo.get(key);const out=[];memo.set(key,out);
    if(hi-lo===1&&['s','t'].includes(tokens[lo]))out.push({sym:tokens[lo],kids:[]});
    if(tokens[lo]==='if'&&['a','b'].includes(tokens[lo+1])&&tokens[lo+2]==='then'){
      for(const child of parse(lo+3,hi))out.push({sym:'if '+tokens[lo+1],kids:[child]});
      for(let j=lo+4;j<hi-1;j++)if(tokens[j]==='else')for(const a of parse(lo+3,j))for(const b of parse(j+1,hi))out.push({sym:'if '+tokens[lo+1],kids:[a,b]});
    }return out;};
  const trees=parse(0,tokens.length);if(!trees.length)throw Error('No statement parse: check if/condition/then/statement/else order.');return{tokens,trees};
}
export const matchedGrammar=()=>parseGrammar('S -> M | U; M -> if e then M else M | s; U -> if e then S | if e then M else U');
export function nearestElse(src){const z=danglingTrees(src),tokens=z.tokens.map(x=>['a','b'].includes(x)?'e':x==='t'?'s':x),g=matchedGrammar(),tree=parseOne(g,tokens);let i=0;const attach=t=>({sym:t.kids.length?t.sym:z.tokens[i++],kids:t.kids.map(attach)}),strip=t=>{if(!t.kids.length)return t;if(t.kids[0].sym==='if')return{sym:'if '+t.kids[1].sym,kids:[strip(t.kids[3]),...(t.kids.length===6?[strip(t.kids[5])]:[])]};return strip(t.kids[0]);};return{...z,g,tree,tokens,ast:tree?strip(attach(tree)):null};}
export const programGrammar=()=>parseGrammar('P -> id = E; E -> E + T | T; T -> T * F | F; F -> num | ( E )');
export function programTokens(src){
  if(typeof src!=='string'||src.length>100)throw Error('Use at most 100 characters of assignment syntax.');
  const lexemes=src.match(/[a-z]+|[0-9]+|[=+*()]/g)??[];
  if(lexemes.join('')!==src.replace(/\s/g,''))throw Error('Unsupported lexical character; use lowercase identifiers, integers and = + * ( ).');
  if(lexemes.length>16)throw Error('Use at most 16 lexical tokens.');
  if(lexemes.some(x=>x.length>8))throw Error('Identifier and integer lexemes allow at most eight characters.');
  return{lexemes,tokens:lexemes.map(x=>/^[a-z]+$/.test(x)?'id':/^\d+$/.test(x)?'num':x)};
}
