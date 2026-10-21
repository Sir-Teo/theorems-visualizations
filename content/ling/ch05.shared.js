// Finite, explicitly declared syntax models; membership in these grammars is not an English judgement.
import {grammar as makeGrammar, llRun, firstFollow} from '../toc/ch05.shared.js';
export {makeGrammar};
const variable=s=>/^[A-Z][A-Za-z0-9_]*$/.test(s);
export const yieldWords=t=>t.kids.length?t.kids.flatMap(yieldWords):t.sym==='ε'?[]:[t.sym];
export function parseGrammar(src){
  if(typeof src!=='string'||src.length>1800)throw Error('Use at most 1800 grammar characters.');
  const rules=[];
  for(const line of src.split(/[;\n]+/).map(s=>s.trim()).filter(Boolean)){
    const m=line.match(/^([A-Z][A-Za-z0-9_]*)\s*(?:->|→)\s*(.+)$/);if(!m)throw Error('Use Category -> space separated symbols; separate rules with semicolons.');
    for(const alternative of m[2].split('|')){const rhs=alternative.trim().split(/\s+/);if(rhs.length===1&&['eps','ε'].includes(rhs[0]))rhs.length=0;
      if(rhs.length>8||rhs.some(s=>s==='eps'||!variable(s)&&!/^([\p{Ll}][\p{Ll}'-]*|[.,?!])$/u.test(s)))throw Error('Use lowercase word tokens or . , ? !; categories start with capitals, and eps stands alone.');rules.push({lhs:m[1],rhs});}
  }
  if(!rules.length)throw Error('Enter at least one production.');
  const g=makeGrammar(rules[0].lhs,rules),defined=new Set(rules.map(r=>r.lhs));
  if(g.vars.some(s=>!defined.has(s)))throw Error('Every category needs a defining production.');
  if(g.vars.length>12||g.rules.length>40||g.vars.some(s=>s.length>8)||g.terminals.some(s=>s.length>16))throw Error('This editor allows 12 categories, 40 alternatives, category names through eight characters and word tokens through 16.');
  return g;
}
export function sentence(src,max=12){
  if(typeof src!=='string'||src.length>240)throw Error('Use at most 240 sentence characters.');
  const tokens=src.normalize('NFC').toLowerCase().trim().split(/\s+/).filter(Boolean);
  if(tokens.length>max||tokens.some(s=>!/^([\p{Ll}][\p{Ll}'-]*|[.,?!])$/u.test(s)||s.length>16))throw Error(`Use at most ${max} lowercase-normalized word tokens; separate punctuation with spaces.`);
  return tokens;
}
export const attachmentGrammar=()=>parseGrammar('S -> NP VP; NP -> Det N | NP PP | i; VP -> V NP | VP PP; PP -> P NP; Det -> the | a; N -> man | dog | telescope | park; V -> saw; P -> with | in');

// Packed nonempty CNF forest. BigInt counts avoid confusing a rounded count with an exact one.
export function parseForest(g,tokens){
  if(tokens.length>12)throw Error('This packed forest allows at most 12 tokens.');
  if(g.rules.some(r=>!(r.rhs.length===1&&!g.vars.includes(r.rhs[0])||r.rhs.length===2&&r.rhs.every(x=>g.vars.includes(x)))))throw Error('The counted forest requires binary category rules or one-word lexical rules; no unit or empty rules.');
  const n=tokens.length,cells=new Map(),frames=[],key=(a,i,j)=>a+'\x1f'+i+'\x1f'+j;
  const get=(a,i,j)=>cells.get(key(a,i,j));let checks=0;
  const add=(a,i,j,choice,count)=>{const k=key(a,i,j);if(!cells.has(k))cells.set(k,{sym:a,i,j,count:0n,choices:[]});const c=cells.get(k);c.count+=count;c.choices.push({...choice,count});};
  for(let len=1;len<=n;len++)for(let i=0;i+len<=n;i++){const j=i+len;
    g.rules.forEach((r,rule)=>{if(len===1){checks++;if(r.rhs.length===1&&r.rhs[0]===tokens[i])add(r.lhs,i,j,{rule,word:tokens[i]},1n);}
      else if(r.rhs.length===2)for(let k=i+1;k<j;k++){checks++;const left=get(r.rhs[0],i,k),right=get(r.rhs[1],k,j);if(left&&right)add(r.lhs,i,j,{rule,split:k,left:key(r.rhs[0],i,k),right:key(r.rhs[1],k,j)},left.count*right.count);}});
    frames.push({i,j,counts:g.vars.filter(a=>get(a,i,j)).map(a=>[a,get(a,i,j).count.toString()]),checks});
  }
  const count=get(g.start,0,n)?.count??0n;
  const expand=(cell,rank)=>{for(const c of cell.choices){if(rank>=c.count){rank-=c.count;continue;}if(c.word!==undefined)return{sym:cell.sym,rule:c.rule,kids:[{sym:c.word,kids:[]}]};const left=cells.get(c.left),right=cells.get(c.right);return{sym:cell.sym,rule:c.rule,kids:[expand(left,rank/right.count),expand(right,rank%right.count)]};}throw Error('Parse rank outside this cell.');};
  return{g,tokens,cells,frames,count,checks,get,treeAt(rank=0n){rank=BigInt(rank);if(rank<0n||rank>=count)throw Error('Select an existing parse rank.');return expand(get(g.start,0,n),rank);}};
}
export function annotateSpans(tree){let at=0;const walk=t=>{const lo=at,kids=t.kids.map(walk);if(!t.kids.length&&t.sym!=='ε')at++;return{...t,kids,lo,hi:at};};return walk(tree);}
export function constituents(tree){const out=[];const visit=t=>{if(t.kids.length){out.push({label:t.sym,lo:t.lo,hi:t.hi});t.kids.forEach(visit);}};visit(annotateSpans(tree));return out;}
export function laminar(spans){if(spans.some(s=>!Number.isInteger(s.lo)||!Number.isInteger(s.hi)||s.lo<0||s.lo>=s.hi))return{valid:false,conflicts:[],reason:'Choose nonempty in-range word spans.'};const conflicts=[];for(let i=0;i<spans.length;i++)for(let j=i+1;j<spans.length;j++){const a=spans[i],b=spans[j];if(a.lo<b.lo&&b.lo<a.hi&&a.hi<b.hi||b.lo<a.lo&&a.lo<b.hi&&b.hi<a.hi)conflicts.push([i,j]);}return{valid:conflicts.length===0,conflicts};}
export function replaceSpan(tokens,lo,hi,replacement){if(!Number.isInteger(lo)||!Number.isInteger(hi)||lo<0||lo>=hi||hi>tokens.length)throw Error('Choose a nonempty half-open word span.');return[...tokens.slice(0,lo),...replacement,...tokens.slice(hi)];}

export function dependencyAudit(heads){
  const n=heads.length;if(!n||heads.some((h,i)=>!Number.isInteger(h)||h< -1||h>=n||h===i))return{valid:false,reason:'Each token needs a distinct in-range head or the artificial root.'};
  const roots=heads.flatMap((h,i)=>h===-1?[i]:[]);if(roots.length!==1)return{valid:false,reason:'Exactly one token must attach to the artificial root.'};
  const ancestors=heads.map((_,i)=>{const seen=new Set();let q=i;while(q!==-1&&!seen.has(q)){seen.add(q);q=heads[q];}return{seen,cycle:q!==-1};});
  if(ancestors.some(a=>a.cycle))return{valid:false,reason:'A head cycle prevents a rooted dependency tree.'};
  const nonprojective=[];heads.forEach((h,d)=>{if(h<0)return;for(let j=Math.min(h,d)+1;j<Math.max(h,d);j++)if(!ancestors[j].seen.has(h)){nonprojective.push({head:h,dependent:d,intervening:j});break;}});
  // Include the root edge, with the artificial root to the left of the sentence.
  const arcs=heads.map((h,d)=>({head:h,dependent:d,lo:Math.min(h,d),hi:Math.max(h,d)})),crossings=[];
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const a=arcs[i],b=arcs[j];if(a.lo<b.lo&&b.lo<a.hi&&a.hi<b.hi||b.lo<a.lo&&a.lo<b.hi&&b.hi<a.hi)crossings.push([i,j]);}
  return{valid:true,root:roots[0],arcs,crossings,nonprojective,projective:nonprojective.length===0};
}
export function headDependencies(tree){const tokens=yieldWords(tree),heads=Array(tokens.length).fill(null);let at=0;
  const hasEmpty=t=>t.sym==='ε'||t.kids.some(hasEmpty);if(!tokens.length||hasEmpty(tree))throw Error('This head conversion requires a nonempty epsilon-free tree.');
  const choose=(t,kids)=>{const target=t.sym==='S'?'VP':t.sym==='NP'?'N':t.sym==='VP'?'V':t.sym==='PP'?'P':null;let k=target?t.kids.findIndex(c=>c.sym===target):-1;if(k<0&&t.sym==='NP')k=t.kids.findIndex(c=>c.sym==='NP');if(k<0&&t.sym==='VP')k=t.kids.findIndex(c=>c.sym==='VP');return k<0?0:k;};
  const walk=t=>{if(!t.kids.length)return at++;const child=t.kids.map(walk),k=choose(t,child),head=child[k];child.forEach((d,j)=>{if(j!==k)heads[d]=head;});return head;};heads[walk(tree)]=-1;return{tokens,heads,...dependencyAudit(heads)};
}

export function embedding(kind,depth){
  if(!Number.isInteger(depth)||depth<0||depth>4)throw Error('Use embedding depth 0–4.');
  const nouns=['cat','dog','rat','fox','owl'],verbs=['chased','bit','saw','helped'],lex=[{lhs:'D',rhs:['the']},...nouns.map(n=>({lhs:'N',rhs:[n]})),...verbs.map(w=>({lhs:'TV',rhs:[w]})),{lhs:'IV',rhs:['slept']}];let rules,tokens;
  if(kind==='centre'){rules=[{lhs:'S',rhs:['NP','IV']},{lhs:'NP',rhs:['D','N','R']},{lhs:'R',rhs:['that','NP','TV']},{lhs:'R',rhs:[]},...lex];tokens=['the',nouns[0]];for(let j=1;j<=depth;j++)tokens.push('that','the',nouns[j]);tokens.push(...verbs.slice(0,depth).toReversed(),'slept');}
  else if(kind==='right'){rules=[{lhs:'S',rhs:['D','N','P']},{lhs:'P',rhs:['TV','D','N','Q']},{lhs:'P',rhs:['IV']},{lhs:'Q',rhs:['that','P']},{lhs:'Q',rhs:[]},...lex];tokens=['the',nouns[0]];for(let j=0;j<depth;j++)tokens.push(verbs[j],'the',nouns[j+1],'that');tokens.push('slept');}
  else throw Error('Choose centre or right embedding.');
  const g=makeGrammar('S',rules),run=llRun(g,tokens);return{g,tokens,...run,peak:Math.max(...run.frames.map(f=>f.stack.length))};
}

// A declared nondeterministic top-down parser: saved alternatives are real parser configurations.
export const gardenGrammar=()=>parseGrammar('S -> NP VP; NP -> D N | D N RR; RR -> PV PP; VP -> MV PP | IV; PP -> P NP; D -> the; N -> horse | barn; PV -> raced; MV -> raced; P -> past; IV -> fell');
export function gardenRun(tokens,{backtrack=true,maxSteps=800}={}){
  if(tokens.length>12||!Number.isInteger(maxSteps)||maxSteps<1||maxSteps>2000)throw Error('Use at most 12 words and a step bound 1–2000.');
  const g=gardenGrammar(),facts=firstFollow(g),pending=[],frames=[];let stack=[g.start],at=0,steps=0,rewinds=0,peak=1;
  const record=(action,extra={})=>{peak=Math.max(peak,stack.length);frames.push({action,stack:[...stack],at,pending:pending.length,...extra});};
  record('start');
  while(steps<maxSteps){
    if(!stack.length&&at===tokens.length){record('accept');return{g,tokens,frames,status:'accepted',steps,rewinds,peak};}
    steps++;
    const top=stack[0],choices=g.rules.flatMap((r,rule)=>r.lhs===top&&facts.sequence(r.rhs).set.has(tokens[at])?[{r,rule}]:[]);
    if(g.vars.includes(top)&&choices.length){
      const tail=stack.slice(1);
      if(backtrack)for(let j=choices.length-1;j>=1;j--)pending.push({stack:[...choices[j].r.rhs,...tail],at,rule:choices[j].rule});
      stack=[...choices[0].r.rhs,...tail];record('expand',{rule:choices[0].rule});
    }else if(top===tokens[at]&&top!==undefined){stack.shift();at++;record('match',{word:top});}
    else if(backtrack&&pending.length){const saved=pending.pop();stack=saved.stack;at=saved.at;rewinds++;record('backtrack',{rule:saved.rule});}
    else{record('reject');return{g,tokens,frames,status:'rejected',steps,rewinds,peak};}
  }
  record('step limit');return{g,tokens,frames,status:'limit',steps,rewinds,peak};
}

export function casePattern(a,b,c,d){
  const counts=[a,b,c,d];if(counts.some(x=>!Number.isInteger(x)||x<0||x>6))throw Error('Use block sizes 0–6.');
  const blocks=counts.map((n,j)=>Array(n).fill(['a','b','c','d'][j])),letters=blocks.flat(),words=blocks.flatMap((xs,j)=>xs.flatMap(()=>[['d’chind'],['em','Hans'],['laa'],['hälfe']][j]));
  const edges=[];for(let j=0;j<Math.min(a,c);j++)edges.push([j,a+b+j,'acc']);for(let j=0;j<Math.min(b,d);j++)edges.push([a+j,a+b+c+j,'dat']);
  let crossings=0;for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){const [l,r]=edges[i],[u,v]=edges[j];if(l<u&&u<r&&r<v||u<l&&l<v&&v<r)crossings++;}
  return{counts,letters,words,edges,crossings,matched:a===c&&b===d,equalTotal:a+b===c+d,accDeficit:c-a,datDeficit:d-b};
}
export function xbarTree(category='V',headFirst=true,withSpecifier=true,adjuncts=0){
  if(!['N','V','P','A'].includes(category)||!Number.isInteger(adjuncts)||adjuncts<0||adjuncts>3)throw Error('Use N, V, P or A and 0–3 adjunct layers.');
  const leaf=sym=>({sym,kids:[]}),head=leaf(category),comp=leaf('CompP');let bar={sym:category+'′',kids:headFirst?[head,comp]:[comp,head]};
  for(let j=0;j<adjuncts;j++)bar={sym:category+'′',kids:[leaf('AdjunctP'),bar]};
  return{sym:category+'P',kids:withSpecifier?[leaf('SpecP'),bar]:[bar]};
}
// Filler-gap annotations are operations on the selected tree, with declared island domains.
export function extract(tree,path){
  if(!Array.isArray(path)||!path.length||path.some(i=>!Number.isInteger(i)||i<0))throw Error('Select a non-root subtree path.');
  let target=tree;const boundaries=[];
  for(const i of path){if(target.island)boundaries.push(target.island);if(i>=target.kids.length)throw Error('Path is outside this tree.');target=target.kids[i];}
  const replace=(t,depth)=>depth===path.length?{sym:'gap',kids:[],gap:true}:{...t,kids:t.kids.map((c,i)=>i===path[depth]?replace(c,depth+1):c)};
  const remainder=replace(tree,0),filler={...target,filler:true};
  return{filler,remainder,tree:{sym:'CP',kids:[filler,remainder]},boundaries,blocked:boundaries.length>0,original:yieldWords(tree),surface:yieldWords(filler).concat(yieldWords(remainder).filter(w=>w!=='gap'))};
}

export function typologySummary(rows,macroarea='all'){
  const selected=rows.filter(r=>macroarea==='all'||r[4]===macroarea),orders=Array(7).fill(0),pairs=Array(5).fill(0);
  for(const r of selected){if(r[5]!==null)orders[r[5]-1]++;if(r[6]!==null)pairs[r[6]-1]++;}
  const ov=pairs[0]+pairs[1],vo=pairs[2]+pairs[3];
  return{selected,orders,pairs,orderTotal:orders.reduce((a,b)=>a+b,0),pairTotal:pairs.reduce((a,b)=>a+b,0),ov,vo,postGivenOV:ov?pairs[0]/ov:null,preGivenVO:vo?pairs[3]/vo:null};
}
// A fitted word bigram model, with explicit start/end tokens and no smoothing or hidden fallback.
export function bigramModel(sentences){
  const rows=new Map();for(const tokens of sentences){const all=['START',...tokens,'END'];for(let j=1;j<all.length;j++){const a=all[j-1],b=all[j];if(!rows.has(a))rows.set(a,new Map());const row=rows.get(a);row.set(b,(row.get(b)??0)+1);}}
  return{rows,probability(tokens){let p=1;const trace=[],all=['START',...tokens,'END'];for(let j=1;j<all.length;j++){const row=rows.get(all[j-1]),total=row?[...row.values()].reduce((a,b)=>a+b,0):0,count=row?.get(all[j])??0,q=total?count/total:0;p*=q;trace.push({from:all[j-1],to:all[j],count,total,q});}return{p,trace};}};
}
// WALS GeoJSON wraps western longitudes into 0–360; retain source rows and normalize only for display.
export function mapLongitude(longitude){return longitude>180?longitude-360:longitude;}
