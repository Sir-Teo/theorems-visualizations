// PL6: declared finite structural types and executable witnesses.
// Source-reading receipts and model boundaries: docs/verification/wave6-pl.md.
export const SRC={sub:'https://softwarefoundations.cis.upenn.edu/plf-current/Sub.html',algorithm:'https://www.cis.upenn.edu/~bcpierce/tapl/checkers/rcdsubbot/core.ml',bounds:'https://www.cis.upenn.edu/~bcpierce/tapl/checkers/fullsub/core.ml',coercion:'https://www.cs.cmu.edu/afs/cs.cmu.edu/Web/People/fp/courses/15312-f04/handouts/14-subtyping.pdf',objects:'https://www.cs.cmu.edu/~fp/courses/15312-f02/handouts/19-objects.pdf',fj:'https://www.cis.upenn.edu/~bcpierce/papers/fj-toplas.pdf',arrays:'https://docs.oracle.com/javase/specs/jls/se21/html/jls-10.html#jls-10.5'};
export const TOP=Object.freeze({tag:'top'}),BOT=Object.freeze({tag:'bot'});
export const base=name=>({tag:'base',name}),arrow=(from,to)=>({tag:'arrow',from,to}),record=fields=>({tag:'record',fields});
const IDENT=/^[A-Za-z_][A-Za-z_0-9]*$/;
function limitedString(s,max,what){if(typeof s!=='string'||s.length>max)throw Error(`${what}: use at most ${max} characters`);return s;}
export function parseType(source){
 limitedString(source,1600,'Type');const toks=[];let pos=0;
 while(pos<source.length){if(/\s/.test(source[pos])){pos++;continue;}const m=source.slice(pos).match(/^(?:->|→|[{}():,]|[A-Za-z_][A-Za-z_0-9]*|⊤|⊥)/);if(!m)throw Error(`Unsupported type character at ${pos+1}`);toks.push(m[0]);pos+=m[0].length;}
 let i=0,nodes=0;const eat=t=>{if(toks[i++]!==t)throw Error(`Expected ${t}`);};
 function type(d=0){if(d>24||++nodes>160)throw Error('Type nesting/size limit');let t;const token=toks[i++];
  if(token==='('){t=type(d+1);eat(')');}
  else if(token==='{'){const fields=[],seen=new Set();if(toks[i]!=='}')for(;;){const k=toks[i++];if(!k||!IDENT.test(k)||seen.has(k))throw Error('Record labels must be distinct identifiers');seen.add(k);eat(':');fields.push([k,type(d+1)]);if(toks[i]!==',')break;i++;}eat('}');t=record(fields);}
  else if(token==='Top'||token==='⊤')t=TOP;
  else if(token==='Bottom'||token==='Bot'||token==='⊥')t=BOT;
  else if(token&&IDENT.test(token))t=base(token);
  else throw Error('Expected a type');
  if(toks[i]==='->'||toks[i]==='→'){i++;t=arrow(t,type(d+1));}return t;
 }
 const t=type();if(i!==toks.length)throw Error('Unexpected text after type');return t;
}
export function showType(t){switch(t.tag){case'top':return'Top';case'bot':return'Bottom';case'base':return t.name;case'record':return'{'+t.fields.map(([k,v])=>k+':'+showType(v)).join(', ')+'}';case'arrow':return(t.from.tag==='arrow'?'('+showType(t.from)+')':showType(t.from))+' -> '+showType(t.to);default:throw Error('Unknown type');}}
export function typeKey(t){if(t.tag==='record')return'{'+[...t.fields].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+':'+typeKey(v)).join(',')+'}';if(t.tag==='arrow')return'('+typeKey(t.from)+'->'+typeKey(t.to)+')';return showType(t);}
export function decide(S,T,{wrongDomain=false}={}){
 const nodes=[];let lookups=0;
 function go(s,t,parent=null,edge='root'){
  if(nodes.length>=4000)throw Error('Subtyping comparison limit');
  const n={id:nodes.length,parent,edge,s:showType(s),t:showType(t),rule:'',ok:false,children:[]};nodes.push(n);if(parent!==null)nodes[parent].children.push(n.id);
  if(s.tag==='bot'){n.rule='Bottom';n.ok=true;}
  else if(t.tag==='top'){n.rule='Top';n.ok=true;}
  else if(s.tag==='base'&&t.tag==='base'){n.rule=s.name===t.name?'Base reflexivity':'Different bases';n.ok=s.name===t.name;}
  else if(s.tag==='arrow'&&t.tag==='arrow'){n.rule=wrongDomain?'Unsafe covariant domain':'Arrow';const a=wrongDomain?go(s.from,t.from,n.id,'unsafe domain'):go(t.from,s.from,n.id,'domain reversed'),b=go(s.to,t.to,n.id,'result');n.ok=a&&b;}
  else if(s.tag==='record'&&t.tag==='record'){n.rule='Record';const source=new Map(s.fields);n.ok=true;for(const [k,ty]of t.fields){lookups++;if(!source.has(k)){const missing={id:nodes.length,parent:n.id,edge:k,s:'missing field',t:showType(ty),rule:'Missing '+k,ok:false,children:[]};n.children.push(missing.id);nodes.push(missing);n.ok=false;}else{const yes=go(source.get(k),ty,n.id,k);n.ok=yes&&n.ok;}}}
  else{n.rule='Different shapes';n.ok=false;}
  return n.ok;
 }
 const ok=go(S,T);return{ok,nodes,comparisons:nodes.length,lookups};
}
export const subtype=(s,t)=>decide(s,t).ok;
export function bound(S,T,kind='join'){
 if(!['join','meet'].includes(kind))throw Error('Choose join or meet');const trace=[];let calls=0;
 function go(s,t,k){if(++calls>5000)throw Error('Join/meet resource limit');const n={s:showType(s),t:showType(t),kind:k,rule:'',result:null};trace.push(n);const upper=k==='join';let out;
  if(subtype(s,t)){n.rule='Already comparable';out=upper?t:s;}
  else if(subtype(t,s)){n.rule='Already comparable';out=upper?s:t;}
  else if(s.tag==='record'&&t.tag==='record'){const A=new Map(s.fields),B=new Map(t.fields);const labels=upper?[...A.keys()].filter(x=>B.has(x)):[...new Set([...A.keys(),...B.keys()])];n.rule=upper?'Common labels, joined fields':'Union of labels, met shared fields';out=record(labels.map(k=>[k,A.has(k)&&B.has(k)?go(A.get(k),B.get(k),upper?'join':'meet'):(A.get(k)||B.get(k))]));}
  else if(s.tag==='arrow'&&t.tag==='arrow'){n.rule='Reverse domain bound';out=arrow(go(s.from,t.from,upper?'meet':'join'),go(s.to,t.to,k));}
  else{n.rule=upper?'Different shapes: Top':'Different shapes: Bottom';out=upper?TOP:BOT;}
  n.result=showType(out);return out;
 }
 const type=go(S,T,kind);return{type,trace,calls};
}
export const join=(s,t)=>bound(s,t,'join').type,meet=(s,t)=>bound(s,t,'meet').type;
export function selectedOrder(source,extra=[]){
 limitedString(source,6000,'Type list');const raw=source.split(';').map(s=>s.trim()).filter(Boolean);if(raw.length>24)throw Error('Use at most 24 selected types');const map=new Map();for(const t of [...raw.map(parseType),...extra,TOP,BOT]){const k=typeKey(t);if(!map.has(k))map.set(k,{type:t,aliases:[showType(t)]});else if(!map.get(k).aliases.includes(showType(t)))map.get(k).aliases.push(showType(t));}
 const nodes=[...map.values()].map((x,id)=>({...x,id,label:showType(x.type)})),relation=nodes.map(a=>nodes.map(b=>subtype(a.type,b.type))),edges=[];
 for(let i=0;i<nodes.length;i++)for(let j=0;j<nodes.length;j++)if(i!==j&&relation[i][j]&&!relation[j][i]&&!nodes.some((_,k)=>k!==i&&k!==j&&relation[i][k]&&relation[k][j]))edges.push([i,j]);
 const rank=new Map();function level(i){if(rank.has(i))return rank.get(i);const up=edges.filter(([a])=>a===i).map(([,b])=>b);const h=up.length?1+Math.max(...up.map(level)):0;rank.set(i,h);return h;}nodes.forEach(n=>n.level=level(n.id));return{nodes,relation,edges};
}
export function parseValue(source){limitedString(source,2400,'Value');let x;try{x=JSON.parse(source);}catch{throw Error('Value must be JSON: natural number, Boolean, string, null or record');}let count=0;
 function valid(v,d=0){if(++count>180||d>24)throw Error('Value nesting/size limit');if(v===null||typeof v==='boolean'||typeof v==='string')return;if(typeof v==='number'&&Number.isSafeInteger(v)&&v>=0)return;if(v&&typeof v==='object'&&!Array.isArray(v)){for(const [k,x]of Object.entries(v)){if(!IDENT.test(k))throw Error('Value field labels must be identifiers');valid(x,d+1);}return;}throw Error('Unsupported value: use exact nonnegative integers and immutable records');}
 valid(x);return x;
}
export function valueType(v){if(v===null)return base('Unit');if(typeof v==='boolean')return base('Bool');if(typeof v==='string')return base('String');if(typeof v==='number')return base('Nat');return record(Object.entries(v).map(([k,x])=>[k,valueType(x)]));}
export function project(v,path){const keys=path.trim()==='self'?[]:path.trim().replace(/^self\./,'').split('.');if(keys.some(k=>!IDENT.test(k)))throw Error('Projection: use self or dot-separated labels');let x=v;const trace=[];for(const key of keys){if(!x||typeof x!=='object'||Array.isArray(x)||!Object.hasOwn(x,key))return{ok:false,error:'Missing field '+key,trace};x=x[key];trace.push({field:key,value:structuredClone(x)});}return{ok:true,value:x,trace};}
export function projectType(t,path){const keys=path.trim()==='self'?[]:path.trim().replace(/^self\./,'').split('.');if(keys.some(k=>!IDENT.test(k)))throw Error('Projection: use self or dot-separated labels');let out=t;for(const k of keys){if(out.tag==='bot')continue;if(out.tag!=='record')throw Error('Projection expects a record');const f=out.fields.find(([x])=>x===k);if(!f)throw Error('Declared parameter type lacks field '+k);out=f[1];}return out;}
export function subsumption(valueSource,targetSource,path='self.x'){
 const value=parseValue(valueSource),source=valueType(value),target=parseType(targetSource),proof=decide(source,target);const expected=projectType(target,path);const result=proof.ok?project(value,path):null;
 return{value,source,target,proof,expected,result};
}
export function functionWitness(domainSource,resultSource,expectedDomainSource,expectedResultSource,path,valueSource,wrongDomain=false){
 const domain=parseType(domainSource),resultType=parseType(resultSource),expectedDomain=parseType(expectedDomainSource),expectedResult=parseType(expectedResultSource),bodyType=projectType(domain,path);
 if(!subtype(bodyType,resultType))throw Error('Function body does not have its declared result type');
 const source=arrow(domain,resultType),target=arrow(expectedDomain,expectedResult),proof=decide(source,target,{wrongDomain});const value=parseValue(valueSource),actual=valueType(value),callerOK=subtype(actual,expectedDomain),runtime=proof.ok&&callerOK?project(value,path):null;
 return{source,target,bodyType,proof,value,actual,callerOK,runtime};
}
const ANIMAL_PARENT={Kitten:'Cat',Cat:'Animal',Dog:'Animal',Animal:null};
export function animalSubtype(s,t){if(!Object.hasOwn(ANIMAL_PARENT,s)||!Object.hasOwn(ANIMAL_PARENT,t))throw Error('Choose Animal, Cat, Kitten or Dog');for(let x=s;x;x=ANIMAL_PARENT[x])if(x===t)return true;return false;}
export function arrayWitness({allocated='Cat',alias='Animal',insert='Dog',initial='Cat',index=0,length=3,policy='checked'}={}){
 if(!Number.isInteger(length)||length<1||length>8||!Number.isInteger(index)||index<0||index>=length)throw Error('Array bounds: length1–8 and a valid integer index');if(!['checked','unchecked','invariant'].includes(policy))throw Error('Unknown array policy');for(const c of [allocated,alias,initial,insert])animalSubtype(c,c);
 if(!animalSubtype(initial,allocated))throw Error('Initial value must fit the allocated array');const heap=Array(length).fill(initial),trace=[{event:'allocate',heap:[...heap],note:allocated+'[] at location0'}];
 const aliasOK=policy==='invariant'?allocated===alias:animalSubtype(allocated,alias);if(!aliasOK)return{trace,status:'static rejection',reason:'Array alias type rejected',heap,aliasOK};trace.push({event:'alias',heap:[...heap],note:alias+'[] also points to location0'});
 if(!animalSubtype(insert,alias))return{trace,status:'static rejection',reason:'Stored value fails the alias element type',heap,aliasOK};
 if(policy==='checked'&&!animalSubtype(insert,allocated)){trace.push({event:'store exception',heap:[...heap],note:'ArrayStoreException; cell unchanged'});return{trace,status:'ArrayStoreException',heap,aliasOK,storeSafe:true};}
 heap[index]=insert;trace.push({event:'write',heap:[...heap],note:`location0[${index}] = ${insert}`});const safe=animalSubtype(heap[index],allocated);trace.push({event:'read',heap:[...heap],note:`Read through ${allocated}[]: actual ${heap[index]}; ${safe?'type agrees':'type invariant violated'}`});return{trace,status:safe?'safe read':'unsafe read',heap,aliasOK,storeSafe:safe};
}
// Explicit coercion plans for the structural fragment. Top erases observations to Unit.
export function compileCoercion(S,T){
 if(!subtype(S,T))throw Error('No subtyping derivation for this conversion');
 if(T.tag==='top')return{op:'erase',from:S,to:T};
 if(S.tag==='bot')return{op:'absurd',from:S,to:T};
 if(S.tag==='base'&&T.tag==='base')return{op:'identity',from:S,to:T};
 if(S.tag==='record'&&T.tag==='record'){const M=new Map(S.fields);return{op:'record',from:S,to:T,fields:T.fields.map(([k,t])=>[k,compileCoercion(M.get(k),t)])};}
 if(S.tag==='arrow'&&T.tag==='arrow')return{op:'function',from:S,to:T,input:compileCoercion(T.from,S.from),output:compileCoercion(S.to,T.to)};
 throw Error('Unsupported conversion');
}
export function runCoercion(plan,value,trace=[]){
 trace.push(plan.op+' : '+showType(plan.from)+' <: '+showType(plan.to));
 if(plan.op==='erase')return null;if(plan.op==='absurd')throw Error('Bottom has no input value');if(plan.op==='identity')return value;
 if(plan.op==='record')return Object.fromEntries(plan.fields.map(([k,p])=>{if(!value||typeof value!=='object'||!Object.hasOwn(value,k))throw Error('Input value lacks '+k);return[k,runCoercion(p,value[k],trace)];}));
 if(plan.op==='function'){if(typeof value!=='function')throw Error('Function coercion needs an executable function');return arg=>runCoercion(plan.output,value(runCoercion(plan.input,arg,trace)),trace);}throw Error('Unknown coercion operation');
}
export function coercionWitness(valueSource,viaSource,targetSource){
 const value=parseValue(valueSource),S=valueType(value),U=parseType(viaSource),T=parseType(targetSource),direct=compileCoercion(S,T),first=compileCoercion(S,U),second=compileCoercion(U,T),directTrace=[],viaTrace=[];
 const a=runCoercion(direct,value,directTrace),mid=runCoercion(first,value,viaTrace),b=runCoercion(second,mid,viaTrace);return{S,U,T,direct,first,second,a,b,equal:JSON.stringify(a)===JSON.stringify(b),directTrace,viaTrace};
}
export function conditionalWitness(leftSource,rightSource,condition=true,path='self'){
 const left=parseValue(leftSource),right=parseValue(rightSource),S=valueType(left),T=valueType(right),computed=bound(S,T,'join'),selected=condition?left:right,observedType=projectType(computed.type,path),result=project(selected,path);
 return{S,T,...computed,condition,selected,observedType,result};
}
// Small declared object machine: method closures, two shared cells and dynamic self lookup.
export function objectWitness({initial=1,step=1,commands='inc; inc; get',binding='open',override='instrumented',fuel=300}={}){
 if(!Number.isSafeInteger(initial)||Math.abs(initial)>1000||!Number.isSafeInteger(step)||Math.abs(step)>1000||!Number.isInteger(fuel)||fuel<1||fuel>1000)throw Error('Use integer initial/step within ±1000 and fuel1–1000');
 if(!['open','closed'].includes(binding)||!['instrumented','double','recursive'].includes(override))throw Error('Unknown dispatch mode');
 limitedString(commands,1200,'Commands');const ops=commands.split(';').map(s=>s.trim()).filter(Boolean);if(ops.length>30)throw Error('Use at most30 commands');const parsed=ops.map(s=>{if(s==='inc'||s==='get'||s==='accesses')return[s];const m=s.match(/^set\s+(-?\d+)$/);if(!m||!Number.isSafeInteger(+m[1])||Math.abs(+m[1])>1000)throw Error('Commands: inc; get; accesses; set INTEGER within ±1000');return['set',+m[1]];});
 const store=[initial,0],stack=[],trace=[],results=[];let ticks=0;
 const baseEnv={self:binding==='open'?1:0,super:0,x:0,a:1},derivedEnv={self:1,super:0,x:0,a:1};
 const baseMethods={get:{env:baseEnv,args:[],body:['read','x']},set:{env:baseEnv,args:['i'],body:['write','x',['var','i']]},inc:{env:baseEnv,args:[],body:['call','self','set',['add',['call','self','get'],step]]}};
 const extra=override==='recursive'?['call','self','set',['var','i']]:['seq',['write','a',['add',['read','a'],1]],['call','super','set',override==='double'?['add',['var','i'],['var','i']]:['var','i']]];
 const objects=[baseMethods,{...baseMethods,set:{env:derivedEnv,args:['i'],body:extra},accesses:{env:derivedEnv,args:[],body:['read','a']}}];
 const emit=(event,note,value=null)=>trace.push({event,note,value,store:[...store],stack:stack.map(x=>({...x})),ticks});
 function tick(){if(++ticks>fuel)throw Error('Fuel exhausted: inconclusive');if(stack.length>60)throw Error('Call-depth limit: inconclusive');}
 function call(receiver,name,args,via){tick();const m=objects[receiver]?.[name];if(!m||m.args.length!==args.length)throw Error('Invalid method call');const env={...m.env,...Object.fromEntries(m.args.map((x,i)=>[x,args[i]]))};stack.push({receiver,name,via});emit('call',`${via} → object${receiver}.${name}`);const value=ev(m.body,env);emit('return',`object${receiver}.${name} returns`,value);stack.pop();return value;}
 function ev(e,env){tick();if(typeof e==='number')return e;const [op,...a]=e;if(op==='var')return env[a[0]];if(op==='read'){const v=store[env[a[0]]];emit('read',`cell${env[a[0]]} (${a[0]})`,v);return v;}if(op==='add'){const x=ev(a[0],env),y=ev(a[1],env),v=x+y;if(!Number.isSafeInteger(v))throw Error('Exact-integer limit: inconclusive');return v;}if(op==='write'){const v=ev(a[1],env);store[env[a[0]]]=v;emit('write',`cell${env[a[0]]} (${a[0]})`,v);return null;}if(op==='seq'){ev(a[0],env);return ev(a[1],env);}if(op==='call'){const args=a.slice(2).map(x=>ev(x,env));return call(env[a[0]],a[1],args,a[0]+'.'+a[1]);}throw Error('Unknown object expression');}
 emit('allocate','objects0/1 share cell0=x and cell1=accesses');
 try{for(const [name,...args]of parsed){const value=call(1,name,args,'client');results.push({name,args,value});}emit('done','Command sequence complete');return{status:'complete',trace,store,results,ticks};}
 catch(e){emit('limit',e.message);return{status:'inconclusive',error:e.message,trace,store,results,ticks};}
}

// Names in this declared interface model are nominal identities, not type
// aliases inside shapes. Every declared parent edge must be structurally safe.
export const NAMED_INTERFACES=JSON.stringify([
 {name:'Point',parent:null,shape:'{x:Nat,y:Nat}'},
 {name:'Pixel',parent:'Point',shape:'{x:Nat,y:Nat,color:String}'},
 {name:'Coordinate',parent:null,shape:'{y:Nat,x:Nat}'},
 {name:'Tagged',parent:null,shape:'{x:Nat,y:Nat,color:String}'}
],null,2);
export function nominalWitness(source,from='Coordinate',to='Point'){
 limitedString(source,6000,'Named interfaces');let raw;try{raw=JSON.parse(source);}catch{throw Error('Named interfaces must be a JSON array');}
 if(!Array.isArray(raw)||raw.length<1||raw.length>16)throw Error('Use 1–16 named interfaces');const defs=new Map();
 for(const x of raw){if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!['name','parent','shape'].includes(k))||typeof x.name!=='string'||!IDENT.test(x.name)||defs.has(x.name)||!(x.parent===null||typeof x.parent==='string'&&IDENT.test(x.parent)))throw Error('Use distinct interface names, a parent name or null, and a record shape');const shape=parseType(x.shape);if(shape.tag!=='record')throw Error('Each interface shape must be an immutable record');defs.set(x.name,{...x,type:shape});}
 for(const d of defs.values()){if(d.parent!==null&&!defs.has(d.parent))throw Error('Unknown nominal parent '+d.parent);const seen=new Set();for(let x=d.name;x!==null;x=defs.get(x).parent){if(seen.has(x))throw Error('Nominal inheritance cycle');seen.add(x);if(!defs.has(x))throw Error('Unknown nominal parent '+x);}if(d.parent!==null&&!subtype(d.type,defs.get(d.parent).type))throw Error('Declared parent edge must satisfy structural subtyping: '+d.name+' <: '+d.parent);}
 if(!defs.has(from)||!defs.has(to))throw Error('Choose known interface names');const path=[];let nominal=false;for(let x=from;x!==null;x=defs.get(x).parent){path.push(x);if(x===to){nominal=true;break;}}
 const proof=decide(defs.get(from).type,defs.get(to).type);return{nodes:[...defs.values()],edges:[...defs.values()].filter(x=>x.parent!==null).map(x=>[x.name,x.parent]),path,nominal,structural:proof.ok,proof,from,to};
}
