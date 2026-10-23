// A compact concrete syntax for the non-generic Featherweight Java calculus.
// Constructors are generated canonically from inherited + declared field order.
const identifier=/^[A-Za-z_][A-Za-z_0-9]*$/;
const own=(o,k)=>Object.hasOwn(o,k);
function name(x,what){if(typeof x!=='string'||!identifier.test(x))throw Error(what+' must be an identifier');return x;}
function dense(a,what,max=20){if(!Array.isArray(a)||a.length>max||Array.from({length:a.length},(_,i)=>i).some(i=>!own(a,i)))throw Error(what+' must be a dense array of at most '+max+' entries');return a;}
function object(x,keys,what){if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!keys.includes(k)))throw Error('Invalid '+what+' object');return x;}
export function parseFJ(src){
 if(typeof src!=='string'||src.length>3200)throw Error('Expression limit3200 characters');const tokens=src.match(/\(|\)|[^\s()]+/g)||[];let i=0,count=0;
 function read(d=0){if(d>45||++count>500)throw Error('Expression nesting/size limit');const t=tokens[i++];if(t===undefined)throw Error('Expected expression');if(t==='('){const a=[];while(tokens[i]!==')'){if(i>=tokens.length)throw Error('Missing )');a.push(read(d+1));}i++;return a;}name(t,'Expression token');return t;}
 const term=read();if(i!==tokens.length)throw Error('Extra expression');validateTerm(term);return term;
}
function validateTerm(t){const stack=[[t,0]];let n=0;while(stack.length){const [e,d]=stack.pop();if(++n>6000||d>80)throw Error('Term size/depth limit: inconclusive');if(typeof e==='string'){name(e,'Variable');continue;}dense(e,'Term',100);const [op,a,b,...rest]=e;if(op==='new'){if(e.length<2)throw Error('new needs a class');name(a,'Class');for(const x of e.slice(2))stack.push([x,d+1]);}else if(op==='get'){if(e.length!==3)throw Error('get needs an expression and field');name(b,'Field');stack.push([a,d+1]);}else if(op==='call'){if(e.length<3)throw Error('call needs a receiver and method');name(b,'Method');stack.push([a,d+1]);for(const x of rest)stack.push([x,d+1]);}else if(op==='cast'){if(e.length!==3)throw Error('cast needs a class and expression');name(a,'Cast class');stack.push([b,d+1]);}else throw Error('Use new, get, call or cast');}return n;}
export function showFJ(t){validateTerm(t);function show(e){return typeof e==='string'?e:'('+e.map(x=>typeof x==='string'?x:show(x)).join(' ')+')';}return show(t);}
function pairs(raw,what){const names=new Set();return dense(raw,what).map(pair=>{if(!Array.isArray(pair)||pair.length!==2)throw Error(what+' entries are [name,type]');const [n,t]=pair;name(n,what+' name');name(t,what+' type');if(names.has(n))throw Error('Duplicate '+what+' name '+n);names.add(n);return[n,t];});}
export function parseClassTable(source){
 if(typeof source!=='string'||source.length>14000)throw Error('Class table limit14000 characters');let raw;try{raw=JSON.parse(source);}catch{throw Error('Class table must be a JSON array');}
 const table=new Map();for(const x of dense(raw,'Class table',12)){object(x,['name','extends','fields','methods'],'class');const C=name(x.name,'Class'),D=name(x.extends,'Superclass');if(C==='Object'||table.has(C))throw Error('Object is built in; class names must be distinct');
  const fields=pairs(x.fields,'Field'),seen=new Set(),methods=dense(x.methods,'Methods',12).map(m=>{object(m,['name','params','returns','body'],'method');const n=name(m.name,'Method');if(seen.has(n))throw Error('Duplicate method '+n);seen.add(n);const params=pairs(m.params,'Parameter');if(params.some(([p])=>p==='this'))throw Error('this cannot be a parameter');return{name:n,params,returns:name(m.returns,'Result class'),body:parseFJ(m.body)};});table.set(C,{name:C,extends:D,fields,methods});
 }
 const known=C=>C==='Object'||table.has(C);for(const C of table.values()){if(!known(C.extends))throw Error('Unknown superclass '+C.extends);for(const [,t]of [...C.fields,...C.methods.flatMap(m=>m.params)])if(!known(t))throw Error('Unknown declared class '+t);for(const m of C.methods)if(!known(m.returns))throw Error('Unknown result class '+m.returns);const seen=new Set();for(let c=C.name;c!=='Object';c=table.get(c)?.extends){if(!table.has(c))throw Error('Unknown superclass '+c);if(seen.has(c))throw Error('Inheritance cycle');seen.add(c);}}
 for(const C of table.keys()){const all=fieldsOf(table,C);if(new Set(all.map(([n])=>n)).size!==all.length)throw Error('A subclass cannot shadow an inherited field');}
 return table;
}
export function classSubtype(table,S,T){if(S!=='Object'&&!table.has(S)||T!=='Object'&&!table.has(T))throw Error('Unknown class');for(let C=S;;C=table.get(C).extends){if(C===T)return true;if(C==='Object')return false;}}
export function fieldsOf(table,C){if(C==='Object')return[];const def=table.get(C);if(!def)throw Error('Unknown class '+C);return[...fieldsOf(table,def.extends),...def.fields];}
export function methodOf(table,C,m){for(let c=C;c!=='Object';c=table.get(c)?.extends){const def=table.get(c);if(!def)throw Error('Unknown class '+c);const method=def.methods.find(x=>x.name===m);if(method)return{...method,owner:c};}return null;}
export function typeFJ(table,term,env=new Map(),{allowStupid=true}={}){
 validateTerm(term);const warnings=[],derivation=[];const known=C=>{if(C!=='Object'&&!table.has(C))throw Error('Unknown class '+C);};
 function infer(t){let type,rule;if(typeof t==='string'){if(!env.has(t))throw Error('Unbound variable '+t);type=env.get(t);rule='T-Var';}
  else if(t[0]==='new'){const C=t[1];known(C);const fields=fieldsOf(table,C),args=t.slice(2);if(args.length!==fields.length)throw Error('Constructor '+C+' needs '+fields.length+' fields');args.forEach((a,i)=>{if(!classSubtype(table,infer(a),fields[i][1]))throw Error('Constructor field '+fields[i][0]+' type mismatch');});type=C;rule='T-New';}
  else if(t[0]==='get'){const C=infer(t[1]),field=fieldsOf(table,C).find(([k])=>k===t[2]);if(!field)throw Error('Unknown field '+t[2]+' on '+C);type=field[1];rule='T-Field';}
  else if(t[0]==='call'){const C=infer(t[1]),m=methodOf(table,C,t[2]),args=t.slice(3);if(!m)throw Error('Unknown method '+t[2]+' on '+C);if(args.length!==m.params.length)throw Error('Method arity mismatch');args.forEach((a,i)=>{if(!classSubtype(table,infer(a),m.params[i][1]))throw Error('Method argument '+m.params[i][0]+' type mismatch');});type=m.returns;rule='T-Invk';}
  else if(t[0]==='cast'){const C=t[1];known(C);const D=infer(t[2]);if(classSubtype(table,D,C))rule='T-UCast';else if(classSubtype(table,C,D))rule='T-DCast';else{if(!allowStupid)throw Error('Unrelated source cast '+D+' to '+C);rule='T-SCast';warnings.push('Unrelated (stupid) cast '+D+' to '+C);}type=C;}
  else throw Error('Unknown expression');derivation.push({term:showFJ(t),type,rule});return type;
 }
 const type=infer(term);return{type,warnings,derivation};
}
export function checkClassTable(table,{allowStupid=true}={}){
 const proofs=[];for(const C of table.values())for(const m of C.methods){const parent=methodOf(table,C.extends,m.name);if(parent&&(parent.returns!==m.returns||JSON.stringify(parent.params.map(([,t])=>t))!==JSON.stringify(m.params.map(([,t])=>t))))throw Error('Override '+C.name+'.'+m.name+' must preserve the exact method type');
  const env=new Map([['this',C.name],...m.params]),p=typeFJ(table,m.body,env,{allowStupid});if(!classSubtype(table,p.type,m.returns))throw Error('Method '+C.name+'.'+m.name+' body is not a subtype of its result');proofs.push({class:C.name,method:m.name,declared:m.returns,...p});
 }return proofs;
}
export function isFJValue(t){return Array.isArray(t)&&t[0]==='new'&&t.slice(2).every(isFJValue);}
function substitute(term,env){if(typeof term==='string')return env.has(term)?env.get(term):term;switch(term[0]){case'new':return['new',term[1],...term.slice(2).map(t=>substitute(t,env))];case'get':return['get',substitute(term[1],env),term[2]];case'call':return['call',substitute(term[1],env),term[2],...term.slice(3).map(t=>substitute(t,env))];case'cast':return['cast',term[1],substitute(term[2],env)];default:throw Error('Unknown term');}}
export function stepFJ(table,term){
 validateTerm(term);function go(t,path=[]){if(typeof t==='string')throw Error('Open term cannot run');const copy=[...t],op=t[0];
  if(op==='new'){for(let i=2;i<t.length;i++)if(!isFJValue(t[i])){const r=go(t[i],[...path,i]);copy[i]=r.term;return{...r,term:copy};}return null;}
  if(op==='get'||op==='call'){if(!isFJValue(t[1])){const r=go(t[1],[...path,1]);if(!r)throw Error('Receiver cannot reduce');copy[1]=r.term;return{...r,term:copy};}
   if(op==='get'){const fs=fieldsOf(table,t[1][1]),i=fs.findIndex(([f])=>f===t[2]);if(i<0)throw Error('Missing runtime field');return{term:t[1][i+2],rule:'R-Field',path,detail:`${t[1][1]}.${t[2]} is constructor field ${i}`};}
   for(let i=3;i<t.length;i++)if(!isFJValue(t[i])){const r=go(t[i],[...path,i]);copy[i]=r.term;return{...r,term:copy};}
   const m=methodOf(table,t[1][1],t[2]);if(!m)throw Error('Missing runtime method');const env=new Map([['this',t[1]],...m.params.map(([n],i)=>[n,t[i+3]])]);return{term:substitute(m.body,env),rule:'R-Invk',path,detail:`dynamic lookup ${t[1][1]}.${t[2]} → ${m.owner}.${m.name}; substitute this and ${m.params.length} arguments`};
  }
  if(op==='cast'){if(!isFJValue(t[2])){const r=go(t[2],[...path,2]);copy[2]=r.term;return{...r,term:copy};}if(classSubtype(table,t[2][1],t[1]))return{term:t[2],rule:'R-Cast',path,detail:`runtime ${t[2][1]} <: ${t[1]}`};const error=Error(`Cast failed: runtime ${t[2][1]} is not a subtype of ${t[1]}`);error.cast={actual:t[2][1],target:t[1],path};throw error;}
  throw Error('No reduction rule');
 }return go(term);
}
export function runFJ(classSource,termSource,{fuel=80,allowStupid=true}={}){
 if(!Number.isInteger(fuel)||fuel<0||fuel>300)throw Error('Use integer fuel0–300');let table,term,initial,classes;const trace=[];try{table=parseClassTable(classSource);classes=checkClassTable(table,{allowStupid});term=parseFJ(termSource);initial=typeFJ(table,term,new Map(),{allowStupid});}catch(e){return{status:'rejected',error:e.message,trace,steps:0};}
 let steps=0,previousType=initial.type;const seen=new Map();trace.push({term:showFJ(term),type:initial.type,rule:'Initial',warnings:initial.warnings,preserved:true,detail:'All classes and the closed expression checked'});
 try{for(;;){if(isFJValue(term))return{status:'value',value:term,initial,classes,trace,steps};const key=JSON.stringify(term);if(seen.has(key))return{status:'cycle',cycleStart:seen.get(key),initial,classes,trace,steps};seen.set(key,steps);if(steps>=fuel)return{status:'inconclusive',error:'Fuel exhausted',initial,classes,trace,steps};const r=stepFJ(table,term);if(!r)throw Error('Unexpected nonvalue normal form');validateTerm(r.term);const typed=typeFJ(table,r.term),preserved=classSubtype(table,typed.type,previousType);if(!preserved)throw Error('Type preservation audit failed');term=r.term;steps++;previousType=typed.type;trace.push({term:showFJ(term),type:typed.type,rule:r.rule,warnings:typed.warnings,preserved,detail:r.detail,path:r.path});}}
 catch(e){return{status:e.cast?'cast failure':'inconclusive',error:e.message,cast:e.cast,initial,classes,trace,steps};}
}
export const FJ_CLASSES=JSON.stringify([
 {name:'A',extends:'Object',fields:[],methods:[]},
 {name:'B',extends:'Object',fields:[],methods:[]},
 {name:'Pair',extends:'Object',fields:[['fst','Object'],['snd','Object']],methods:[{name:'setfst',params:[['x','Object']],returns:'Pair',body:'(new Pair x (get this snd))'},{name:'choose',params:[],returns:'Object',body:'(get this fst)'}]},
 {name:'SecondPair',extends:'Pair',fields:[],methods:[{name:'choose',params:[],returns:'Object',body:'(get this snd)'}]}
],null,2);
export const FJ_EXAMPLES={update:'(call (new Pair (new A) (new B)) setfst (new B))',dispatch:'(call (cast Pair (new SecondPair (new A) (new B))) choose)',projection:'(get (cast Pair (get (new Pair (new Pair (new A) (new B)) (new A)) fst)) snd)',failure:'(cast A (cast Object (new B)))'};
