import * as H from './ch06.shared.js';
const Q=H.Q,value=x=>typeof x==='number'?x:x.value;
const fmt=x=>(x===0?'0':Math.abs(x)<.001?x.toExponential(3):Number(x.toPrecision(5)).toString()).replace(/-/g,'−');
function decimal(str){const match=str.replace(/−/g,'-').match(/^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i),n=BigInt(match[2]+(match[3]||''))*(match[1]==='-'?-1n:1n),power=Number(match[4]||0)-(match[3]||'').length;return power>=0?Q.rational(n*10n**BigInt(power)):Q.rational(n,10n**BigInt(-power));}
export const amount=x=>{if(x===null)return'undefined';if(typeof x==='number')return'≈'+fmt(x);const str=fmt(x.value);return(Q.sign(Q.sub(x.exact,decimal(str)))?'≈':'')+str;};
const percent=x=>fmt(100*value(x))+'%';
const count=(n,singular,plural=singular+'s')=>n+' '+(n===1?singular:plural);
const text=(s,t,x,y,color='ink',o={})=>s.text(t,x,y,{size:11.5,color,...o});
const panel=(v,title,o={})=>v.stage({title,x:[0,10],y:[0,8],axes:false,height:350,minWidth:280,gutter:{l:18,r:18,t:26,b:24},...o});
const graph=(v,title,xlabel,ylabel,o={})=>panel(v,title,{axes:'box',xlabel,ylabel:'$\\text{'+ylabel+'}$',gutter:{l:54,r:24,t:36,b:49},...o});
const view=(s,x,y)=>{s.end();s.setView(x,y);s.begin();};
const slide=(v,label,a,b,x)=>v.slider(label,a,b,x,{step:'any',sig:6,fmt});
const integer=(v,label,a,b,x)=>v.slider(label,a,b,x,{int:true});
const dot=(s,x,y,color='gold',r=4,o={})=>s.dot(x,y,{color,r,...o});
const memo=fn=>{let key,result;return p=>{const next=JSON.stringify(p);if(next!==key){result=fn(p);key=next;}return result;};};
const params=cs=>Object.fromEntries(Object.entries(cs).map(([k,c])=>[k,c.value]));
function plot(s,series,xmax,ymax=1){
 xmax=Math.max(1,xmax);s.o.xticks=[0,Number.isInteger(xmax)&&xmax>=2?Math.floor(xmax/2):xmax/2,xmax].map(x=>[x,fmt(x)]);s.o.yticks=[0,ymax/2,ymax].map(y=>[y,fmt(y)]);view(s,[-.035*xmax,1.035*xmax],[-.06*ymax,1.06*ymax]);
 for(const a of series)s.path(a.points,{color:a.color,width:a.width||2.3,dash:a.dash||[]});
 const ends=series.filter(a=>a.points.length),groups=new Map();
 for(const a of ends){const key=JSON.stringify(a.points.at(-1));if(!groups.has(key))groups.set(key,[]);groups.get(key).push(a);}
 for(const group of groups.values())for(const[i,a]of group.entries()){
  const [x,y]=a.points.at(-1),r=series.length>3?3.5:group.length===3?[5.5,3.7,1.8][i]:group.length===2?[5,3.2][i]:3.5;
  dot(s,x,y,a.color,r,{hollow:true});
 }
}
function facts(s,rows){view(s,[0,10],[0,rows.length+1]);for(const[i,[label,val,color='blue']]of rows.entries()){const y=rows.length-i;text(s,label,.1,y+.14,'muted',{size:11});text(s,typeof val==='string'?val:amount(val),9.9,y-.28,color,{size:14,align:'right'});}}
function lineBoard(s,z){
 view(s,[0,10],[0,7]);const x=[1.15,4.1,6.45,8.8],base=1.15,scale=2.6;
 s.line(2.65,.7,2.65,6.4,{color:'grid',width:1,dash:[3,4]});
 const lengths=[z.standard,...z.lengths];for(let i=0;i<4;i++){
  const col=i===0?'blue':z.reveal&&i-1===z.correct?'teal':z.answer===i-1?'gold':'ink';s.line(x[i],base,x[i],base+scale*value(lengths[i]),{color:col,width:3.3});
  text(s,i===0?'Standard':['A','B','C'][i-1],x[i],.55,i===0?'blue':col,{align:'center',size:i?13:11});
  if(z.reveal){s.line(x[i]-.22,base,x[i]+.22,base,{color:col,width:1});s.line(x[i]-.22,base+scale*value(lengths[i]),x[i]+.22,base+scale*value(lengths[i]),{color:col,width:1});text(s,fmt(value(lengths[i])),x[i],base+scale*value(lengths[i])+.34,col,{align:'center',size:10.5});}
 }
 text(s,z.reveal?'Declared length units':'One common physical scale',5,6.65,'muted',{align:'center',size:10.5});
}
function majorityBoard(s,z){
 view(s,[0,10],[0,7]);if(!z.script.length){text(s,'No group answers',5,3.5,'muted',{align:'center',size:15});text(s,'The line geometry is unchanged',5,2.7,'muted',{align:'center',size:10.5});return;}
 for(const[i,answer]of z.script.entries()){
  const x=.25+3.3*(i%3),y=4.25-2.7*Math.floor(i/3),truthful=answer===z.correct,col=truthful?'teal':'orange';s.rect(x,y,x+2.85,y+1.9,{fill:col,fillAlpha:.09,color:col,alpha:.5,radius:9});
  text(s,'Speaker '+(i+1),x+1.42,y+1.47,'muted',{align:'center',size:10});text(s,['A','B','C'][answer],x+1.42,y+.65,col,{align:'center',size:23});
 }
 text(s,'Scripted answers · no people measured',5,.5,'muted',{align:'center',size:10.2});
}
export function lesson1(v){
 const order=v.select('physical matching line',['A','B','C'],'B'),group=v.select('group script',['unanimous wrong','truthful dissenter','no group'],'unanimous wrong'),answer=v.select('your local answer',['unanswered','A','B','C'],'unanswered'),reveal=v.toggle('Reveal physical measurements',false),A=panel(v,'A physical comparison · choose before revealing',{full:true,height:390}),B=panel(v,'Social information · a declared script',{height:300});let z;
 v.render(()=>{z=H.lineBoard({correct:['A','B','C'].indexOf(order.value),answer:answer.value==='unanswered'?null:['A','B','C'].indexOf(answer.value),majority:group.value,reveal:reveal.value});lineBoard(A,z);majorityBoard(B,z);});
 v.legend([['blue','standard'],['gold','your chosen comparison'],['orange','scripted wrong response'],['teal','truthful dissenter / revealed match']]);
 v.readout(()=> '**'+(z.answered?'Local answer: '+['A','B','C'][z.answer]+'.':'Choose a local answer, then reveal the measurements.')+'** '+(z.reveal?'The physical match is '+['A','B','C'][z.correct]+'. '+(z.answered?(z.matches?'Your local answer matches.':'Your local answer differs.'): ''):'Measurements are hidden.')+'\n\nAsch’s 1955 account reports 36.8% agreement with a wrong majority across critical-trial responses from 123 college young men. This original board and six-speaker script are an illustration; your choice is not a conformity diagnosis or a replicated experiment.');
}
function nodeLayout(kind,n=16){return Array.from({length:n},(_,i)=>kind==='star'&&i===0?[0,0]:[Math.cos(2*Math.PI*(kind==='star'?i-1:i)/(kind==='star'?n-1:n)+Math.PI/2),Math.sin(2*Math.PI*(kind==='star'?i-1:i)/(kind==='star'?n-1:n)+Math.PI/2)]);}
function trimmedArrow(s,a,b,color='gold',o={}){const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy),u=.10/d;s.arrow(a[0]+u*dx,a[1]+u*dy,b[0]-u*dx,b[1]-u*dy,{color,width:2.5,head:6,...o});}
function voterNetwork(s,z){
 view(s,[-1.34,1.34],[-1.53,1.40]);const ps=nodeLayout(z.graph.kind);for(const[i,j]of z.graph.edges)s.line(...ps[i],...ps[j],{color:'muted',width:1,alpha:.25});
 if(z.lastEvent){const e=z.lastEvent;trimmedArrow(s,ps[e.neighbor],ps[e.site],'gold');}
 for(const[i,p]of ps.entries()){if(z.lastEvent?.site===i)dot(s,...p,'gold',13,{hollow:true,width:2});dot(s,...p,z.state[i]?'teal':'purple',9,{alpha:.8});text(s,String(z.state[i]),...p,'ink',{align:'center',baseline:'middle',size:10});text(s,z.graph.kind==='star'&&i===0?'site 1':String(i+1),p[0]*1.20,z.graph.kind==='star'&&i===0?-.23:p[1]*1.20,'muted',{align:'center',baseline:'middle',size:8.5});}
 text(s,'Neighbor → active site',0,-1.43,'muted',{align:'center',size:10.5});
}
export function lesson2(v){
 const cs={kind:v.select('undirected graph',['star','cycle','torus'],'star'),initial:v.select('initial opinion pattern',['hub only','half','alternating','seeded'],'hub only'),seed:integer(v,'reproducible event seed',0,999,37)},attempt=integer(v,'selected attempted update',0,400,12),A=panel(v,'Copying direction · inspect the actual event',{equal:true,height:370}),B=graph(v,'One realized path · two different shares','attempted update','opinion-1 share',{height:370}),C=panel(v,'One-step law · expectation versus realization',{height:370});let z;const calculate=memo(H.voter);
 v.animate(t=>{const attempts=Math.min(400,attempt.value+Math.floor(8*t));z=calculate({...params(cs),attempts});voterNetwork(A,z);plot(B,[{points:z.history.map(r=>[r.attempt,r.plain.value]),color:'purple',dash:[5,4],width:3},{points:z.history.map(r=>[r.attempt,r.weighted.value]),color:'teal'}],attempts);facts(C,[['current ordinary share',z.plain,'purple'],['current degree-weighted share',z.weighted,'teal'],['expected ordinary next drift',z.expectedPlainDrift,'purple'],['expected weighted next drift',z.expectedWeightedDrift,'teal'],['attempts / actual changes',z.attempts+' / '+z.changes,'ink']]);},{period:50,once:true,autoplay:false,still:0});
 v.legend([['purple','opinion 0 / ordinary share, dashed',{dash:true}],['teal','opinion 1 / degree-weighted share'],['gold','neighbor-to-site copying event']]);
 v.readout(()=> '**Attempt '+z.attempts+': '+(z.absorbed?'consensus reached at attempt '+z.firstAbsorbed+'.':'this finite path is unresolved.')+'** '+(z.lastEvent?'Site '+(z.lastEvent.site+1)+' copied site '+(z.lastEvent.neighbor+1)+(z.lastEvent.changed?' and changed opinion.':' without changing opinion.'):'No update has been attempted.')+'\n\nCurrent degree-weighted share='+amount(z.weighted)+'; ordinary share='+amount(z.plain)+'. The zero-drift identity concerns expectation under the ideal node-update rule, not a constant value on this pseudorandom path. Play advances attempts; Restart returns to the selected attempt. On an irregular graph the ordinary share need not be its consensus probability.');
}
function confidenceNeighbors(s,z){
 const n=z.opinions.length;view(s,[-.1,1.1],[-1,n+1]);const x=z.opinions[z.selected].value,lo=Math.max(0,x-z.epsilon),hi=Math.min(1,x+z.epsilon);s.rect(lo,-.3,hi,n+.1,{fill:'blue',fillAlpha:.08,stroke:false});
 for(let i=0;i<n;i++){const y=n-i-.5,active=z.selectedNeighbors.includes(i),col=i===z.selected?'gold':active?'blue':'muted';s.line(0,y,1,y,{color:'grid',width:.6,alpha:.55});dot(s,z.opinions[i].value,y,col,i===z.selected?5:3.5,{hollow:i===z.selected});text(s,String(i+1),-.04,y,'muted',{align:'right',baseline:'middle',size:9});}
 s.line(lo,n+.25,hi,n+.25,{color:'blue',width:2});for(const tick of[0,.5,1])text(s,fmt(tick),tick,-.65,'muted',{align:'center',size:10});
}
export function lesson3(v){
 const cs={profile:v.select('original initial opinions',Object.keys(H.opinionProfiles),'three groups'),epsilon:slide(v,'confidence radius ε',0,1,.2),steps:integer(v,'synchronous round',0,24,8)},selected=integer(v,'agent request (capped by profile size)',1,12,5),A=graph(v,'Opinion paths · synchronous averaging','round','opinion',{height:370}),B=panel(v,'Who is inside the selected confidence window?',{height:370}),C=panel(v,'Finite-state checks · no assumed mean conservation',{height:370});let z;const calculate=memo(H.confidence);
 v.render(()=>{const p=params(cs);z=calculate({...p,selected:Math.min(selected.value,H.opinionProfiles[p.profile].length)-1});plot(A,[...z.opinions.keys()].filter(i=>i!==z.selected).concat(z.selected).map(i=>({points:z.history.map((row,t)=>[t,row[i].value]),color:i===z.selected?'gold':i%2?'teal':'blue',width:i===z.selected?3:1.4})),z.steps);confidenceNeighbors(B,z);facts(C,[['selected agent / current neighbors',(z.selected+1)+' / '+z.selectedNeighbors.length,'gold'],['initial population mean',z.meanInitial,'muted'],['current population mean',z.meanCurrent,'blue'],['selected next opinion',z.next[z.selected],'gold'],['adjacent permanent barriers',String(z.barriers.length),'purple'],['exactly fixed now',z.fixed?'yes':'no','ink']]);});
 v.legend([['blue','eligible confidence neighbors / trajectories'],['teal','additional trajectories'],['gold','selected agent'],['purple','separated adjacent gaps']]);
 v.readout(()=> '**Agent '+(z.selected+1)+' of '+z.opinions.length+' averages '+count(z.selectedNeighbors.length,'opinion')+', including itself.** Current opinion='+amount(z.opinions[z.selected])+'; next='+amount(z.next[z.selected])+'. '+(z.fixed?'This configuration is exactly fixed.':'The next round still changes this configuration.')+'\n\nOnly an adjacent ordered gap greater than ε certifies a permanent cut; '+count(z.barriers.length,'such cut')+(z.barriers.length===1?' is':' are')+' present now. Ordinary mean: initial '+amount(z.meanInitial)+', current '+amount(z.meanCurrent)+'. These original finite profiles do not imply a universal number of clusters or a universal critical ε.');
}
const traitColors=['blue','orange','purple','teal','gold','red','pink','muted'];
function cultureGrid(s,z){
 const side=z.graph.size;view(s,[-.3,side+.3],[-.4,side+.5]);const position=i=>[i%side,side-1-Math.floor(i/side)];
 for(const edge of z.links){const a=position(edge.i),b=position(edge.j),horizontal=a[1]===b[1],col=edge.active?'gold':edge.overlap===z.features?'teal':'muted';
  if(horizontal)s.line(a[0]+.89,a[1]+.5,b[0]+.11,b[1]+.5,{color:col,width:edge.active?2:1,alpha:edge.active?.8:.3});else s.line(a[0]+.5,a[1]+.11,b[0]+.5,b[1]+.89,{color:col,width:edge.active?2:1,alpha:edge.active?.8:.3});
 }
 for(const[i,culture]of z.cultures.entries()){
  const[x,y]=position(i);for(const[f,trait]of culture.entries())s.rect(x+.11+.78*f/z.features,y+.11,x+.11+.78*(f+1)/z.features,y+.89,{fill:traitColors[trait],fillAlpha:.7,stroke:false});
  s.rect(x+.10,y+.10,x+.90,y+.90,{color:'grid',width:.8});
  if(z.lastEvent&&(i===z.lastEvent.site||i===z.lastEvent.neighbor))s.rect(x+.035,y+.035,x+.965,y+.965,{color:i===z.lastEvent.site?'gold':'orange',width:2.3,radius:3});
 }
 text(s,z.frozen?'Every edge is blocked or identical':'Gold links still permit interaction',side/2,-.25,z.frozen?'teal':'muted',{align:'center',size:10.5});
}
function culturePair(s,z){
 view(s,[0,10],[0,8]);const event=z.lastEvent;if(!event){text(s,'No attempted event yet',5,4,'muted',{align:'center',size:13});text(s,'Use Play or select an event',5,3.2,'muted',{align:'center',size:11});return;}
 const before=[...z.cultures[event.site]],neighbor=z.cultures[event.neighbor];if(event.interacted)before[event.feature]=event.previous;
 for(const[row,traits]of [[0,before],[1,neighbor]]){const y=row?2.4:5.0;for(const[f,trait]of traits.entries()){
  const x=.25+9.5*f/z.features,w=9.5/z.features;s.rect(x,y,x+w-.12,y+1.25,{fill:traitColors[trait],fillAlpha:.16,color:traitColors[trait],width:1,radius:5});text(s,String(trait+1),x+(w-.12)/2,y+.62,traitColors[trait],{align:'center',baseline:'middle',size:18});
  if(row===1&&event.interacted&&f===event.feature)s.arrow(x+w/2,y+1.40,x+w/2,y+2.40,{color:'gold',width:2,head:5});
 }text(s,row?'Neighbor '+(event.neighbor+1):'Active site '+(event.site+1)+' · before',.25,y+1.63,row?'orange':'gold',{size:11});}
 text(s,event.overlap+' of '+count(z.features,'feature')+' shared before',5,1.05,'muted',{align:'center',size:11});
 text(s,event.interacted?'Feature '+(event.feature+1)+': '+(event.previous+1)+' → '+(event.copied+1):'This attempted event made no change',5,.30,event.interacted?'gold':'muted',{align:'center',size:11});
}
export function lesson4(v){
 const cs={features:integer(v,'features per culture F',1,5,4),traits:integer(v,'traits per feature q',1,8,5),seed:integer(v,'reproducible culture/event seed',0,999,37)},attempt=integer(v,'selected attempted event',0,1600,297),A=panel(v,'Cultures as trait strips · actual open-boundary grid',{equal:true,height:390}),B=panel(v,'The local pair · copy into the active site',{height:390}),C=graph(v,'Three counts · cultures and regions can differ','attempted event','count',{height:390});const calculate=memo(H.culture);let z;
 v.animate(t=>{const attempts=Math.min(1600,attempt.value+Math.floor(40*t));z=calculate({...params(cs),attempts});cultureGrid(A,z);culturePair(B,z);plot(C,[{points:z.history.map(r=>[r.attempt,r.regions]),color:'purple',dash:[5,4],width:3.2},{points:z.history.map(r=>[r.attempt,r.distinctCultures]),color:'blue'},{points:z.history.map(r=>[r.attempt,r.activeEdges]),color:'gold',width:1.8}],attempts,Math.max(1,...z.history.flatMap(r=>[r.regions,r.distinctCultures,r.activeEdges])));},{period:40,once:true,autoplay:false,still:0});
 v.legend([['gold','active links / active site / active-edge count'],['orange','selected neighbor'],['blue','distinct culture vectors'],['purple','spatial regions, dashed',{dash:true}],['teal','identical neighboring cultures']]);
 v.readout(()=> '**'+count(z.distinctCultures,'distinct culture')+'; '+count(z.regions,'spatial region')+'; '+count(z.activeEdges,'active edge')+'.** '+(z.frozen?'Every edge has zero or full overlap: exactly frozen.':'At least one actual edge still permits change.')+'\n\nAttempted events='+z.attempts+'; changes='+z.changes+'; mean adjacent similarity='+amount(z.meanSimilarity)+'. Trait-strip position identifies the feature; color identifies its categorical trait. The magnified pair reconstructs the selected active site just before this event. An unchanged attempt does not prove freezing. Play advances events; Restart returns to the selected event.');
}
function directedNetwork(v,s,opinions,edges,{initialEdges=[],ghost=false}={}){
 view(s,[-1.35,1.35],[-1.35,1.35]);const ps=nodeLayout('cycle',opinions.length),keys=new Set(edges.map(e=>e.join(',')));
 for(const[i,j]of initialEdges)if(ghost&&!keys.has([i,j].join(',')))s.line(...ps[i],...ps[j],{color:'red',alpha:.18,width:.8,dash:[3,5]});
 for(const[i,j]of edges){
  const a=ps[i],b=ps[j],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy),nx=-dy/d,ny=dx/d,offset=.027,points=Array.from({length:13},(_,k)=>{const t=.09/d+(1-.18/d)*k/12,bend=offset*Math.sin(Math.PI*t);return[a[0]+dx*t+nx*bend,a[1]+dy*t+ny*bend];});s.path(points,{color:'muted',alpha:.38,width:1});const p=points.at(-2),q=points.at(-1);s.arrow(...p,...q,{color:'muted',alpha:.5,width:1,head:3.4});
 }
 for(const[i,p]of ps.entries()){const opinion=value(opinions[i]),color=v.mix('blue','orange',opinion);dot(s,...p,color,10,{alpha:.78});text(s,String(i+1),...p,'ink',{size:9,align:'center',baseline:'middle'});}
 text(s,edges.length+' directed follow links',0,-1.24,'muted',{align:'center',size:10.5});
}
export function lesson5(v){
 const cs={epsilon:slide(v,'confidence radius ε',0,1,.6),unfollowThreshold:slide(v,'unfollow when new gap exceeds',0,1,.3),steps:integer(v,'synchronous round',0,24,8),seed:integer(v,'initial opinion seed',0,999,37),prune:v.toggle('enable post-update unfollowing',true)},ghost=v.toggle('show removed links as faint dashed guides',true),A=panel(v,'Fixed links · same initial opinions and edges',{equal:true,height:370}),B=panel(v,'Selected rule · learn first, then unfollow',{equal:true,height:370}),C=graph(v,'Edge removal changes future opportunities','round','directed follow links',{height:370});let z;const calculate=memo(H.echo);
 v.render(()=>{z=calculate(params(cs));directedNetwork(v,A,z.fixedEdges.opinions,z.fixedEdges.edges);directedNetwork(v,B,z.selected.opinions,z.selected.edges,{initialEdges:z.initial.edges,ghost:ghost.value});plot(C,[{points:z.fixedEdges.history.map(r=>[r.round,r.edges.length]),color:'muted',dash:[5,4],width:3},{points:z.selected.history.map(r=>[r.round,r.edges.length]),color:'purple'}],z.steps,z.initial.edges.length);});
 v.legend([['blue','opinion near 0'],['orange','opinion near 1'],['purple','retained links under selected rule'],['muted','fixed-edge comparison, dashed',{dash:true}],['red','removed links, dashed guides',{dash:true}]]);
 v.readout(()=> '**Round '+z.steps+': '+z.selected.edges.length+' of '+z.initial.edges.length+' directed follow links remain.** Opinion at node 1: fixed links '+amount(z.fixedEdges.opinions[0])+', selected rule '+amount(z.selected.opinions[0])+'. Arrows point from a node to an account it follows.\n\nBoth runs share every initial opinion and edge. Each round first averages eligible opinions, then optionally removes links using the new gaps; equality retains a link. This is an authored mechanism comparison. Cinelli 2021 measured proxy interaction networks and simulated diffusion; those results are not a randomized platform effect or direct observation of every viewer’s exposure.');
}
function people(s,z,mode){
 const wide=s.W>=650,columns=wide?6:4,dx=10/columns,height=wide?2.9:2,top=wide?4.1:5.55,dy=wide?3.45:2.4;view(s,[0,10],[0,8]);for(let i=0;i<12;i++){
  const x=.15+(i%columns)*dx,y=top-Math.floor(i/columns)*dy,w=dx-.3,col=z.publicDissent[i]?'blue':'muted',cy=y+height*.52;s.rect(x,y,x+w,y+height,{fill:col,fillAlpha:.035,color:'grid',width:1,radius:7});
  text(s,String(i+1),x+.20,y+height-.34,'muted',{size:wide?11:9});
  if(mode==='both'){dot(s,x+w*.32,cy,'orange',wide?10:6);dot(s,x+w*.70,cy,col,wide?10:6,{hollow:!z.publicDissent[i],width:1.6});}
  else{dot(s,x+w/2,cy,mode==='private'?'orange':col,wide?12:8,{hollow:mode==='public'&&!z.publicDissent[i],width:1.6});}
  text(s,mode==='private'?'opposed':mode==='public'?(z.publicDissent[i]?'speaks':'silent'):'τ '+z.thresholds[i],x+w/2,y+.38,mode==='private'?'orange':col,{align:'center',size:wide?12:10});
 }
 text(s,mode==='both'?'Within each card: private left · public right':mode==='private'?'Private opposition: all 12':'Only disclosed opposition is visible',5,.25,'muted',{align:'center',size:10.5});
}
function thresholds(s,z){
 s.o.xticks=[1,6,12];s.o.yticks=[0,6,12];view(s,[.3,12.7],[-.8,13]);s.line(1,z.publicCount,12,z.publicCount,{color:'blue',width:1.7,dash:[5,4]});
 for(let i=0;i<12;i++){const col=z.publicDissent[i]?'blue':z.eligible[i]?'gold':'muted';s.line(i+1,0,i+1,z.thresholds[i],{color:col,width:1.5,alpha:.55});dot(s,i+1,z.thresholds[i],col,4,{hollow:!z.publicDissent[i]});}
}
export function lesson6(v){
 const cs={threshold:integer(v,'central public-count threshold',0,12,4),seedCount:integer(v,'initial public dissenters',0,12,2),round:integer(v,'disclosure round',0,12,2),heterogeneous:v.toggle('vary thresholds across people',true)},mode=v.select('view of the same people',['both','private','public'],'both'),A=panel(v,'Private preferences and public declarations',{full:true,height:410}),B=graph(v,'Disclosure can grow while preferences stay fixed','round','people',{height:340}),C=graph(v,'Who can disclose next?','person','public-count threshold',{height:340});let z;const calculate=memo(H.disclosure);
 v.render(()=>{z=calculate(params(cs));people(A,z,mode.value);plot(B,[{points:z.history.map(r=>[r.round,12]),color:'orange',dash:[5,4],width:2},{points:z.history.flatMap((r,i)=>i?[[r.round,z.history[i-1].count],[r.round,r.count]]:[[0,r.count]]),color:'blue'}],z.round,12);thresholds(C,z);});
 v.legend([['orange','private opposition, held fixed',{dash:true}],['blue','public dissent / current public-count line'],['gold','silent but eligible next'],['muted','silent above the current threshold']]);
 v.readout(()=> '**Private opposition: 12 of 12. Public dissent: '+z.publicCount+' of 12.** Hidden opposition='+z.hiddenOpposition+'. '+(z.fixed?'This public state is fixed under the declared rule.':count(z.eligible.filter(Boolean).length,'more person','more people')+(z.eligible.filter(Boolean).length===1?' is':' are')+' eligible next round.')+'\n\nAll people privately oppose the norm in this authored scenario. They disclose irreversibly when the previous round’s public count reaches their threshold. This illustration does not update beliefs or estimate effects from the campus studies. The private view is information given to the reader; silence does not reveal it to the people in the scenario.');
}
function phaseLights(v,s,z){
 view(s,[0,10],[0,10]);for(const[i,theta]of z.phases.entries()){
  const x=1.25+2.5*(i%4),y=8.6-2.15*Math.floor(i/4),wrapped=Math.atan2(Math.sin(theta),Math.cos(theta)),pulse=Math.exp(-.5*(wrapped/.35)**2),color=v.mix('blue','gold',pulse);
  dot(s,x,y,'gold',21,{alpha:.08+.3*pulse});dot(s,x,y,color,12,{alpha:.45+.5*pulse});s.line(x,y,x+.30*Math.cos(theta),y+.30*Math.sin(theta),{color:'ink',width:1.2,alpha:.8});text(s,String(i+1),x,y-.65,'muted',{align:'center',size:9});
 }
 text(s,'A light peaks when its phase crosses 0',5,.42,'muted',{align:'center',size:10.2});
}
function phaseCircle(s,z){
 view(s,[-1.35,1.35],[-1.40,1.4]);s.circle(0,0,1,{color:'grid',width:1.4});s.line(-1.15,0,1.15,0,{color:'grid',width:.8});s.line(0,-1.15,0,1.15,{color:'grid',width:.8});
 for(const theta of z.phases){const x=Math.cos(theta),y=Math.sin(theta);s.line(0,0,x,y,{color:'blue',alpha:.21,width:1});dot(s,x,y,'blue',3.2,{alpha:.75});}
 s.arrow(0,0,z.resultant.cosine,z.resultant.sine,{color:'gold',width:3,head:7});dot(s,z.resultant.cosine,z.resultant.sine,'gold',4,{hollow:true});
 text(s,'R≈'+fmt(z.resultant.R),0,-1.28,'gold',{align:'center',size:13});text(s,'phase 0',1.10,.17,'muted',{align:'center',size:9.2});
}
export function lesson7(v){
 const cs={coupling:slide(v,'coupling K / radians per second',0,6,2),spread:slide(v,'natural-frequency half-spread / Hz',0,.5,.25),seed:integer(v,'reproducible initial-phase seed',0,999,37)},time=slide(v,'selected elapsed time / seconds',0,12,4),A=panel(v,'Phase lights · original finite oscillators',{height:380}),B=panel(v,'Unit vectors · their mean has length R',{equal:true,height:380}),C=graph(v,'Phase coherence is a computed quantity','elapsed seconds','phase coherence R',{height:380});let z;const calculate=memo(H.synchrony);
 v.animate(t=>{z=calculate({...params(cs),time:Math.min(12,time.value+t)});phaseLights(v,A,z);phaseCircle(B,z);plot(C,[{points:z.history.map(r=>[r.time,r.R]),color:'blue'}],12);dot(C,z.time,z.resultant.R,'gold',5,{hollow:true});},{period:12,once:true,autoplay:false,still:0});
 v.legend([['blue','individual phases / simulated coherence'],['gold','mean phase vector / light near phase 0 / chosen time']]);
 v.readout(()=> '**Time≈'+fmt(z.time)+' s; phase coherence R≈'+fmt(z.resultant.R)+'.** Coupling='+fmt(z.coupling)+' rad/s; '+(z.spread===0?'all natural frequencies are 1 Hz':'natural frequencies span '+fmt(1-z.spread)+'–'+fmt(1+z.spread)+' Hz')+'.\n\nMean unwrapped phase differs from its cancellation-law value by ≈'+fmt(z.meanResidual)+' rad. The 16-oscillator numerical trajectory is an authored illustration, not recorded applause or firefly observations. R measures current phase alignment; a high value at one time does not establish long-run frequency locking or a universal abrupt transition. Play advances from the selected time; Restart returns there.');
}
function protocolCounts(s){
 view(s,[0,10],[0,8]);const rows=[{label:'18 total judgments',count:18,color:'muted',y:5.7},{label:'12 critical judgments',count:12,color:'orange',y:3.05},{label:'6 remaining judgments',count:6,color:'blue',y:.55}];
 for(const row of rows){text(s,row.label,.25,row.y+1.45,row.color,{size:12});for(let i=0;i<row.count;i++){const x=.25+(i%9)*1.06,y=row.y-.46*Math.floor(i/9);s.rect(x,y,x+.72,y+.30,{fill:row.color,fillAlpha:.55,stroke:false,radius:2});}}
}
function evidenceCondition(s,z){
 view(s,[0,10],[0,8]);
 if(z.rate!==undefined||z.upperBound!==undefined){const endpoint=z.rate??z.upperBound,col=z.rate!==undefined?'orange':'blue';s.line(.5,3.6,9.5,3.6,{color:'grid',width:6});s.line(.5,3.6,.5+9*endpoint/100,3.6,{color:col,width:6});dot(s,.5+9*endpoint/100,3.6,col,6,{hollow:z.upperBound!==undefined,width:2});for(const x of[0,50,100])text(s,x+'%',.5+.09*x,2.85,'muted',{align:'center',size:10});text(s,z.rate!==undefined?fmt(z.rate)+'%':'<1%',5,5.5,col,{align:'center',size:32});text(s,'Reported response rate',5,6.75,'muted',{align:'center',size:12});}
 else{text(s,'One fourth as often',5,5.35,'teal',{align:'center',size:21});text(s,'Relative source wording',5,4.15,'muted',{align:'center',size:12});text(s,'No exact percentage inferred',5,3.3,'muted',{align:'center',size:11});}
 text(s,z.condition,5,1.45,'ink',{align:'center',size:12});text(s,z.rate!==undefined?'Reported precision retained':z.upperBound!==undefined?'Open endpoint: strictly below 1%':'Different from the wrong-dissenter condition',5,.55,'muted',{align:'center',size:10.2});
}
function denominators(s){
 view(s,[0,10],[0,8]);text(s,'Repeated responses',.25,7.0,'orange',{size:13});text(s,'36.8% of critical-trial judgments',.25,6.1,'ink',{size:11.3});text(s,'12 critical judgments per participant',.25,5.35,'muted',{size:10.6});s.line(.25,4.65,9.75,4.65,{color:'grid',width:1});text(s,'People',.25,3.85,'purple',{size:13});text(s,'About one quarter never yielded',.25,2.95,'ink',{size:11.2});text(s,'123 college young men in the account',.25,2.2,'muted',{size:10.5});text(s,'Different units · different precision',5,.7,'muted',{align:'center',size:11});
}
export function lesson8(v){
 const condition=v.select('separately reported condition',['unanimous majority','judging alone','majority of two','majority of three','truthful partner','extreme wrong dissenter'],'unanimous majority'),A=panel(v,'Protocol counts · no original chronology inferred',{height:350}),B=panel(v,'Reported conditions · retain the source’s precision',{height:350}),C=panel(v,'Responses and people have different denominators',{height:350});let z;
 v.render(()=>{z=H.aschEvidence({condition:condition.value});protocolCounts(A);evidenceCondition(B,z);denominators(C);});
 v.legend([['orange','critical trials / reported response rates'],['blue','remaining trials / alone-condition bound'],['purple','person-level summary'],['teal','truthful-partner relative wording']]);
 v.readout(()=> '**'+z.condition[0].toUpperCase()+z.condition.slice(1)+': '+(z.rate!==undefined?fmt(z.rate)+'%':z.upperBound!==undefined?'less than 1%':z.relative)+'.** Unit: '+z.denominator+'; '+z.precision+'.\n\nThe historical paper identity is Asch 1956; its original monograph body and figures are not claimed verified. These bounded details come from Asch’s distinct 1955 author article. The count marks show protocol totals, not a recovered trial sequence. Repeated judgments do not establish independent binomial trials, and rounded rates do not identify exact agreement counts.');
}
