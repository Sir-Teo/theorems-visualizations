// Bounded authored semantic models. WCS observations have separate provenance.
import {WCS} from './ch06.data.js';
import {labXYZ,adapt,WC,D65,display,linearRGB,inGamut} from '../art/ch05.shared.js';
export {WCS};
export function bounded(x,a,b,name='parameter'){if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b)throw Error(`${name} outside [${a},${b}]`);return x;}
export function integer(x,a,b,name='integer'){bounded(x,a,b,name);if(!Number.isInteger(x))throw Error(name+' must be an integer');return x;}
export function boolean(x){if(typeof x!=='boolean')throw Error('Expected boolean');return x;}
export function option(x,values){if(!values.includes(x))throw Error('Unknown option');return x;}
export const sum=a=>a.reduce((s,x)=>s+x,0);
export const range=(n,a=0,b=1)=>Array.from({length:n},(_,i)=>i===n-1?b:a+(b-a)*i/(n-1));
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const NAMES=['Ada','Bo','Cy'];
export const RELATION=[0,1,0,0,0,1,1,0,0];
export const READS=Array.from({length:16},(_,i)=>+(Math.floor(i/4)===i%4));
export function validMatrix(a,n){return Array.isArray(a)&&a.length===n*n&&a.every(x=>x===0||x===1);}
function matrix(a,n){if(!validMatrix(a,n))throw Error('Invalid relation matrix');return a.slice();}

export function reference({left=0,right=1,beliefs=[true,false,true]}={}){
 integer(left,0,2);integer(right,0,2);if(!Array.isArray(beliefs)||beliefs.length!==3)throw Error('Belief ledger');beliefs.forEach(boolean);
 const expressions=['Morning Star','Evening Star','Odysseus'],senses=['dawn presentation','dusk presentation','fictional presentation'],referents=['Venus','Venus',null];
 const identity=referents[left]===null||referents[right]===null?null:referents[left]===referents[right];
 return{left,right,beliefs:beliefs.slice(),expressions,senses,referents,identity,sameSense:left===right,ordinary:[left,right].map(i=>referents[i]===null?null:true),indirect:[beliefs[left],beliefs[right]],substitutionPreservesReport:beliefs[left]===beliefs[right]};
}

export function composition({subject=0,object=1,negative=false,relation=RELATION,step=4}={}){
 integer(subject,0,2);integer(object,0,2);boolean(negative);integer(step,0,4);const table=matrix(relation,3),verb=x=>y=>!!table[3*y+x],predicate=verb(object),extension=NAMES.flatMap((_,i)=>predicate(i)?[i]:[]),positive=predicate(subject);
 return{subject,object,negative,step,relation:table,names:NAMES.slice(),objectMeaning:object,predicateValues:NAMES.map((_,i)=>predicate(i)),extension,positive,truth:negative?!positive:positive,application:[`object=${NAMES[object]}`,`greets(${NAMES[object]})`,`${NAMES[subject]} greets ${NAMES[object]}`,negative?'negate proposition':'retain proposition']};
}

export const WORLD=Array.from({length:8},(_,id)=>({id,present:true,red:!!(id&1),square:!!(id&2),large:!!(id&4)}));
export function validWorld(w){return Array.isArray(w)&&w.length===8&&w.every((x,i)=>x&&Object.keys(x).sort().join(',')==='id,large,present,red,square'&&x.id===i&&['present','red','square','large'].every(k=>typeof x[k]==='boolean'));}
export const QUANTIFIERS=['every','some','no','most','exactly three','union exactly three'];
function qTruth(q,a,both,bOnly){return q==='every'?both===a:q==='some'?both>0:q==='no'?both===0:q==='most'?2*both>a:q==='exactly three'?both===3:a+bOnly===3;}
export function quantifiers({aOnly=2,both=3,bOnly=2,outside=2,quantifier='most'}={}){
 [aOnly,both,bOnly,outside].forEach(x=>integer(x,0,12));option(quantifier,QUANTIFIERS);const a=aOnly+both,b=both+bOnly,truth=qTruth(quantifier,a,both,bOnly),restrictedTruth=qTruth(quantifier,a,both,0);
 return{aOnly,both,bOnly,outside,quantifier,a,b,union:a+bOnly,universe:a+bOnly+outside,truth,restrictedTruth,sameInThisModel:truth===restrictedTruth,conservativeDefinition:quantifier!=='union exactly three',witnesses:Array.from({length:both},(_,i)=>aOnly+i),counterexamples:Array.from({length:aOnly},(_,i)=>i)};
}
export function truthWorld({world=WORLD,quantifier='every',restrictor='red squares',predicate='large'}={}){
 if(!validWorld(world))throw Error('Invalid finite shape world');option(quantifier,QUANTIFIERS.slice(0,5));option(restrictor,['red squares','blue circles','all present objects']);option(predicate,['large','small']);
 const domain=world.filter(x=>x.present),A=domain.filter(x=>restrictor==='all present objects'||(restrictor==='red squares'?x.red&&x.square:!x.red&&!x.square)),B=domain.filter(x=>predicate==='large'?x.large:!x.large),both=A.filter(x=>B.some(y=>y.id===x.id)),misses=A.filter(x=>!B.some(y=>y.id===x.id)),truth=qTruth(quantifier,A.length,both.length,B.length-both.length);
 return{world:world.map(x=>({...x})),quantifier,restrictor,predicate,domain:domain.map(x=>x.id),A:A.map(x=>x.id),B:B.map(x=>x.id),intersection:both.map(x=>x.id),counterexamples:misses.map(x=>x.id),truth,vacuous:A.length===0&&quantifier==='every'};
}

export function scope({students=3,books=3,relation=READS,selectedStudent=0,selectedBook=0}={}){
 integer(students,0,4);integer(books,0,4);integer(selectedStudent,0,3);integer(selectedBook,0,3);const table=matrix(relation,4),rowWitnesses=Array.from({length:students},(_,i)=>Array.from({length:books},(_,j)=>j).filter(j=>table[4*i+j])),commonBooks=Array.from({length:books},(_,j)=>j).filter(j=>Array.from({length:students},(_,i)=>i).every(i=>table[4*i+j]));
 return{students,books,relation:table,selectedStudent,selectedBook,rowWitnesses,commonBooks,distributive:rowWitnesses.every(a=>a.length>0),shared:commonBooks.length>0,counterexampleStudents:rowWitnesses.flatMap((a,i)=>a.length?[]:[i]),edges:Array.from({length:students},(_,i)=>Array.from({length:books},(_,j)=>j).filter(j=>table[4*i+j]).map(j=>[i,j])).flat()};
}

export function presupposition({embedding='affirmation',past=true,now=false}={}){
 option(embedding,['affirmation','negation','question','filtered conditional']);boolean(past);boolean(now);
 const worlds=Array.from({length:4},(_,id)=>{const p=!!(id&2),n=!!(id&1),stopped=p?!n:null;let value=embedding==='filtered conditional'?!p||!n:stopped===null?null:embedding==='negation'?!stopped:embedding==='question'?(stopped?'yes alternative':'no alternative'):stopped;return{id,past:p,now:n,stopped,value,admitted:value===true||typeof value==='string'};});
 const admitted=worlds.filter(w=>w.admitted),selected=worlds.find(w=>w.past===past&&w.now===now);
 return{embedding,past,now,worlds,selected,admitted:admitted.map(w=>w.id),projectsPast:admitted.every(w=>w.past),entailsNotNow:admitted.every(w=>!w.now),isAssertion:embedding!=='question'};
}

export const DIALOGUES=[
 {question:'Did all four parcels arrive?',reply:'Some arrived.',maxim:'quantity',literal:'At least one arrived.',inference:'Perhaps fewer than four arrived.',alternative:'The speaker may not know whether all arrived.',assumption:'The speaker knows the total and would use the stronger reply if appropriate.'},
 {question:'How did the solo sound?',reply:'The stage was beautifully lit.',maxim:'relation',literal:'The stage lighting was attractive.',inference:'Perhaps the speaker is avoiding praise of the solo.',alternative:'The speaker may be changing the subject for another reason.',assumption:'The reply is intended to address the evaluation question.'},
 {question:'Was the waiting time short?',reply:'A blink of an eye — only three hours.',maxim:'quality',literal:'A blink and three hours are juxtaposed.',inference:'An ironic criticism of the long wait is available.',alternative:'A literal reading of the first phrase need not be intended.',assumption:'The conspicuous mismatch is deliberate and mutually recognizable.'},
 {question:'How did Ada perform?',reply:'Ada caused a succession of piano-like sounds.',maxim:'manner',literal:'Ada produced sounds associated with a piano.',inference:'Perhaps the performance was poor.',alternative:'The unusual wording could serve a different purpose.',assumption:'The cumbersome description was chosen instead of a normal neutral one.'},
 {question:'Where is the key?',reply:'In the kitchen drawer.',maxim:'quantity',literal:'The key is located in that drawer.',inference:'A direct answer can settle the stated search question.',alternative:'The speaker might be mistaken about its location.',assumption:'The speaker has adequate evidence and intends the location literally.'},
 {question:'Can I buy fuel nearby?',reply:'There is a garage around the corner.',maxim:'relation',literal:'A nearby garage exists.',inference:'Perhaps it is open and sells fuel.',alternative:'A nearby garage could be closed or sell no fuel.',assumption:'The location was supplied to help with this fuel request.'},
 {question:'Is the bridge open?',reply:'I checked the current notice: it is closed.',maxim:'quality',literal:'The reply reports a check and a closure.',inference:'The explicit evidence can support taking the report seriously.',alternative:'The notice may still be outdated or misread.',assumption:'The reported check was sincere and the notice is reliable.'},
 {question:'Which button starts it?',reply:'Press the green Start button once.',maxim:'manner',literal:'A single action on a specified control is described.',inference:'The orderly instruction can guide the requested action.',alternative:'The device could be faulty despite clear wording.',assumption:'The instruction matches this device and the questioner can identify the button.'}
];
export function dialogue({scenario=0,guess='quantity',cooperative=true}={}){
 integer(scenario,0,DIALOGUES.length-1);option(guess,['quantity','quality','relation','manner']);boolean(cooperative);const d=DIALOGUES[scenario];return{scenario,guess,cooperative,...d,annotationMatches:guess===d.maxim,displayedInference:cooperative?d.inference:'No conversational inference is imposed.',literalPossibilities:[true,true],suggestedPossibilities:cooperative?[true,false]:[true,true]};
}

export function scalar({n=6,alpha=4,allCost=0,priorSuccess=.5,continuation='plain'}={}){
 integer(n,2,8);bounded(alpha,0,8);bounded(allCost,0,4);bounded(priorSuccess,.05,.95);option(continuation,['plain','in fact all','but none']);
 const states=Array.from({length:n+1},(_,i)=>i),messages=['none','some','all'],truth=states.map(k=>[k===0,k>0,k===n]),supports=messages.map((_,j)=>truth.filter(row=>row[j]).length),literal=messages.map((_,j)=>states.map((_,k)=>truth[k][j]?1/supports[j]:0)),costs=[0,0,allCost];
 const speaker=states.map((_,k)=>{const utilities=messages.map((_,j)=>truth[k][j]?alpha*(Math.log(literal[j][k])-costs[j]):-Infinity),maximum=Math.max(...utilities),weights=utilities.map(x=>Math.exp(x-maximum)),total=sum(weights);return weights.map(x=>x/total);});
 const choose=(a,b)=>{let v=1;for(let i=1;i<=b;i++)v=v*(a-i+1)/i;return v;},prior=states.map(k=>choose(n,k)*priorSuccess**k*(1-priorSuccess)**(n-k)),literalSome=states.map(k=>k>0&& (continuation==='plain'||continuation==='in fact all'&&k===n||continuation==='but none'&&k===0)),weights=states.map(k=>literalSome[k]?prior[k]*speaker[k][1]:0),normalizer=sum(weights),posterior=normalizer===0?null:weights.map(x=>x/normalizer),literalSupport=literalSome.flatMap((v,k)=>v?[k]:[]);
 return{n,alpha,allCost,priorSuccess,continuation,states,messages,truth,supports,literal,costs,speaker,prior,posterior,normalizer,literalSupport,consistent:literalSupport.length>0,allStillPossible:posterior!==null&&posterior[n]>0};
}

export function speechAct({kind='promise',future=true,control=true,intent=true,authority=true,procedure=true,meal=true}={}){
 option(kind,['promise','declaration','salt question']);[future,control,intent,authority,procedure,meal].forEach(boolean);
 const content=kind==='promise'?'The speaker brings the book.':kind==='declaration'?'The ship is named Aurora.':'The addressee can pass the salt.',utterance=kind==='promise'?'I promise to bring the book.':kind==='declaration'?'I name this ship Aurora.':'Can you pass the salt?',force=kind==='promise'?'commitment':kind==='declaration'?'institutional declaration':meal?'indirect request':'ability question';
 const effect=kind==='declaration'?authority&&procedure:kind==='promise'?future:false,sincere=kind==='promise'?intent:null,conditions=kind==='promise'?[['future content',future],['under speaker control',control],['sincere intention',intent]]:kind==='declaration'?[['recognized authority',authority],['appropriate procedure',procedure]]:[['meal/request context',meal]];
 const before=kind==='declaration'?'unnamed':kind==='promise'?'no entered commitment':'no asserted transfer';
 return{kind,future,control,intent,authority,procedure,meal,content,utterance,force,effect,sincere,conditions,status:kind==='declaration'?(effect?'declared name entered':'institutional misfire'):kind==='promise'?(!future?'content condition fails':!control?'promise attempted; control condition fails':!intent?'commitment entered; insincere promise':'commitment entered'):'context supports the displayed force',before,after:effect?(kind==='declaration'?'Aurora':'bring the book'):before};
}

export function deixis({speaker=0,time=4,worldShift=0,radius=.4}={}){
 integer(speaker,0,1);bounded(time,0,10);bounded(worldShift,-2,2);bounded(radius,.1,1);const position=(s,t)=>s===0?1+t/2:9-t/3,here=position(speaker,time),alternative=here+worldShift;
 return{speaker,time,worldShift,radius,names:['Ada','Bo'],here,alternative,tuple:[speaker,here,time],truth:Math.abs(worldShift)<=radius,trajectories:[0,1].map(s=>range(41,0,10).map(t=>[t,position(s,t)])),positions:[0,1].map(s=>position(s,time)),alternativePositions:[0,1].map(s=>position(s,time)+(s===speaker?worldShift:0))};
}

export const EXAMPLES=[{name:'robin',bird:true,features:[1,1,1,1]},{name:'sparrow',bird:true,features:[1,1,1,.7]},{name:'penguin',bird:true,features:[0,.5,0,0]},{name:'ostrich',bird:true,features:[0,0,0,0]},{name:'bat',bird:false,features:[1,1,1,0]}];
export function prototype({weights=[1,1,1,1],selected=0}={}){
 if(!Array.isArray(weights)||weights.length!==4)throw Error('Four weights required');weights.forEach(w=>bounded(w,0,1));integer(selected,0,4);const total=sum(weights),maximum=Math.max(...weights),relative=maximum===0?weights:weights.map(w=>w/maximum),normalizer=sum(relative),scores=EXAMPLES.map(x=>total===0?null:sum(x.features.map((f,i)=>relative[i]*f))/normalizer);
 return{weights:weights.slice(),selected,total,features:['flies','small body','perches','song-like call'],examples:EXAMPLES.map(x=>({...x,features:x.features.slice()})),scores,defined:total>0,selectedScore:scores[selected],categoryMembership:EXAMPLES[selected].bird};
}

export const WCS_PALETTE=WCS.chips.map(row=>{const xyz=adapt(labXYZ(row.slice(6),WC),WC,D65);return{rgb:display(xyz).map(Math.round),clipped:!inGamut(linearRGB(xyz))};});
export function colorFocus({language=1,term=null,chip=0}={}){
 integer(language,1,110);integer(chip,0,319);const entry=WCS.languages[language-1],focus=entry.terms.find(x=>x.code===term);if(!focus)throw Error('Term is not recorded for selected language');const counts=Array(320).fill(0);for(const[i,n]of focus.counts)counts[i]=n;
 return{language,term,chip,name:entry.name,country:entry.country,labels:focus.labels.slice(),consultants:focus.consultants,counts,fractions:counts.map(n=>n/focus.consultants),selectedCount:counts[chip],selectedFraction:counts[chip]/focus.consultants,selectedChip:WCS.chips[chip].slice(),selectedPreview:{...WCS_PALETTE[chip],rgb:WCS_PALETTE[chip].rgb.slice()},recordedChromaticTermCodes:entry.terms.length-1,totalFocalCellChoices:sum(counts)};
}
export function validFocus(x){return!!(x&&Object.keys(x).sort().join(',')==='language,term'&&Number.isInteger(x.language)&&x.language>=1&&x.language<=110&&WCS.languages[x.language-1].terms.some(t=>t.code===x.term));}

export const CORPUS='Cats chase mice. Dogs chase cats. Cats eat fish. Dogs eat meat. Birds eat seeds. Birds chase bugs. Mice eat seeds.';
export function distribution({text=CORPUS,window=2,target=0,other=1,xContext=0,yContext=1}={}){
 if(typeof text!=='string'||text.length>1800)throw Error('Text limit:1800characters');integer(window,1,4);[target,other,xContext,yContext].forEach(x=>integer(x,0,15));
 const sentences=text.toLowerCase().replace(/’/g,"'").split(/[.!?\n]+/).map(s=>s.match(/[a-z]+(?:'[a-z]+)*/g)||[]).filter(s=>s.length),tokens=sentences.flat();if(tokens.length>100)throw Error('Token limit:100');const vocabulary=[...new Set(tokens)].sort();if(vocabulary.length>16)throw Error('Vocabulary limit:16');const N=vocabulary.length,indices=new Map(vocabulary.map((w,i)=>[w,i])),counts=Array.from({length:N},()=>Array(N).fill(0));
 for(const sentence of sentences)for(let i=0;i<sentence.length;i++)for(let j=Math.max(0,i-window);j<=Math.min(sentence.length-1,i+window);j++)if(i!==j)counts[indices.get(sentence[i])][indices.get(sentence[j])]++;
 const norms=counts.map(row=>Math.hypot(...row)),cosines=counts.map((a,i)=>counts.map((b,j)=>norms[i]===0||norms[j]===0?null:sum(a.map((x,k)=>x*b[k]))/(norms[i]*norms[j]))),selected=target<N?target:null,comparison=other<N?other:null,projection=xContext<N&&yContext<N?counts.map(row=>[row[xContext],row[yContext]]):null;
 return{text,window,target,other,xContext,yContext,sentences,tokens,vocabulary,counts,norms,cosines,selected,comparison,projection,similarity:selected===null||comparison===null?null:cosines[selected][comparison],totalDirectedPairs:sum(counts.map(sum)),empty:N===0};
}

export const logistic=(height,center,scale)=>1/(1+Math.exp(-(height-center)/scale));
export function vagueness({height=178,center=180,width=8,logisticScale=3}={}){
 bounded(height,140,210);bounded(center,150,190);bounded(width,0,20);bounded(logisticScale,1,12);const evaluate=h=>{const d=h-center,status=d>=width?'supertrue':d< -width?'superfalse':'gap',fraction=width===0?+(d>=0):clamp((d/width+1)/2);return{height:h,status,fraction,logistic:logistic(h,center,logisticScale)};},selected=evaluate(height);
 return{height,center,width,logisticScale,lower:center-width,upper:center+width,numericallyCollapsed:width>0&&center-width===center+width,selected,curve:range(141,140,210).map(evaluate),thresholds:range(9,-1,1).map(t=>center+t*width)};
}

export function signValue({system='English contrast',removeNeighbor=false,addContrast=false,anchor=50,selected=50}={}){
 option(system,['English contrast','French example']);boolean(removeNeighbor);boolean(addContrast);bounded(anchor,30,70);integer(selected,0,100);const labels=system==='English contrast'?[{word:'sheep',anchor:20},{word:'mutton',anchor:80}]:[{word:'mouton',anchor:50}],baseline=labels.map(x=>({...x}));if(removeNeighbor&&labels.length>1)labels.pop();if(addContrast)labels.push({word:'new term',anchor});
 const assign=(terms,x)=>terms.reduce((best,t,i)=>Math.abs(t.anchor-x)<Math.abs(terms[best].anchor-x)?i:best,0),assignment=range(101,0,100).map(x=>assign(labels,x)),before=range(101,0,100).map(x=>assign(baseline,x)),counts=labels.map((_,i)=>assignment.filter(j=>j===i).length);
 return{system,removeNeighbor,addContrast,anchor,selected,labels,baseline,assignment,before,counts,chosen:assignment[selected],changedPositions:assignment.filter((j,i)=>labels[j].word!==baseline[before[i]].word).length,tieRule:'Earlier listed label wins an exact distance tie.'};
}
