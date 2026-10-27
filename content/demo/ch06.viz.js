import*as H from'./ch06.shared.js';
const fmt=x=>x===null?'undefined':(x===0?'0':Math.abs(x)<.001?x.toExponential(3):Number(x.toPrecision(5)).toString()).replace(/-/g,'−');
const tick=x=>(x===0?'0':Math.abs(x)<.001?x.toExponential(1):Number(x.toPrecision(3)).toString()).replace(/-/g,'−');
const pct=x=>x===null?'undefined':fmt(100*x)+'%';
const text=(s,t,x,y,color='ink',o={})=>s.text(String(t),x,y,{size:11.5,color,...o});
const dot=(s,x,y,color='gold',r=4,o={})=>s.dot(x,y,{color,r,...o});
const panel=(v,title,o={})=>v.stage({title,x:[0,10],y:[0,8],axes:false,height:370,minWidth:280,gutter:{l:18,r:18,t:28,b:25},...o});
const graph=(v,title,xlabel,ylabel,o={})=>panel(v,title,{axes:'box',xlabel,ylabel,gutter:{l:58,r:25,t:36,b:50},...o});
const view=(s,x=[0,10],y=[0,8])=>{s.end();s.setView(x,y);s.begin();};
const integer=(v,label,a,b,x)=>v.slider(label,a,b,x,{int:true});
const memo=fn=>{let key,result;return args=>{const next=JSON.stringify(args);if(next!==key){result=fn(args);key=next;}return result;};};
const sum=xs=>xs.reduce((a,b)=>a+b,0);
function sourceControls(v,{country='JPN',year=2023,fertility=false,hazard=false}={}){
 const c=v.select('period schedule',H.countries.map(c=>({value:c.country,label:c.name})),country),y=v.select('schedule year',H.years.map(y=>String(y)),String(year)),f=fertility?integer(v,'fertility (% of source)',0,300,100):null,h=hazard?integer(v,'mortality hazard (% of source)',25,250,100):null;
 return()=>({country:c.value,year:Number(y.value),...(f?{fertility:f.value}:{}),...(h?{hazard:h.value}:{})});
}
const nice=x=>{if(!(x>0))return 1;const p=10**Math.floor(Math.log10(x));return Math.ceil(x/p*2)/2*p;};
function chart(s,series,{x=null,y=null,zero=true}={}){
 const points=series.flatMap(a=>a.points).filter(p=>p&&p.every(Number.isFinite));
 const axes=s._demoChartAxes??=s.o.axes;s.o.axes=points.length?axes:false;
 if(!points.length){view(s);text(s,'No defined values in this state',5,4,'muted',{align:'center',size:13});return;}
 let xmin=x?.[0]??Math.min(...points.map(p=>p[0])),xmax=x?.[1]??Math.max(...points.map(p=>p[0])),ymin=y?.[0]??Math.min(...points.map(p=>p[1])),ymax=y?.[1]??Math.max(...points.map(p=>p[1]));
 if(zero&&!y){ymin=Math.min(0,ymin);ymax=Math.max(0,ymax);}const dx=xmax-xmin||1,dy=ymax-ymin||1;
 const ticks=(lo,hi)=>{if(hi===lo)return[[lo,tick(lo)]];const raw=(hi-lo)/4||1,p=10**Math.floor(Math.log10(raw)),step=[1,2,2.5,5,10].find(x=>x>=raw/p)*p,values=[];for(let j=Math.ceil(lo/step);j<=Math.floor(hi/step);j++)values.push(j*step);return(values.length>=2?values:[lo,hi]).map(x=>[x,tick(x)]);};s.o.xticks=ticks(xmin,xmax);s.o.yticks=ticks(ymin,ymax);view(s,[xmin-.035*dx,xmax+.035*dx],[ymin-.065*dy,ymax+.065*dy]);
 for(const a of series)s.path(a.points,{color:a.color,width:a.width??2.25,dash:a.dash??[]});
}
function facts(s,rows){view(s,[0,10],[0,rows.length+1]);for(const[i,[label,value,color='blue']]of rows.entries()){const y=rows.length-i;text(s,label,.1,y+.16,'muted',{size:11});text(s,value,9.9,y-.3,color,{align:'right',size:14});}}
function rowBars(s,rows,{maximum=null,unit='share',digits=pct}={}){
 const maximumValue=maximum??nice(Math.max(0,...rows.flatMap(r=>r.values))),n=rows.length,above=s.W<500&&rows.some(row=>row.label.length>10);view(s,above?[-.04*maximumValue,1.06*maximumValue]:[-.38*maximumValue,1.16*maximumValue],[-1.2,n+.95]);
 for(const x of[0,maximumValue/2,maximumValue]){s.line(x,-.2,x,n-.15,{color:'grid',width:1});text(s,digits(x),x,n+.3,'muted',{align:'center',size:10});}
 for(const[i,row]of rows.entries()){const y=n-i-.7;
  if(above){text(s,row.label,.02*maximumValue,y+.44,'muted',{size:11});text(s,row.values.map(x=>x===null?'undefined':digits(x)).join(' / '),.98*maximumValue,y+.44,row.colors?.[0]??'ink',{align:'right',size:11});}
  else{text(s,row.label,-.055*maximumValue,y,'muted',{align:'right',baseline:'middle',size:11});if(row.values.every(x=>x===null))text(s,'undefined',.98*maximumValue,y,'muted',{align:'right',baseline:'middle',size:11});}
  for(let j=row.values.length-1;j>=0;j--){const x=row.values[j];if(x===null)continue;const color=row.colors?.[j]??['blue','purple','teal','orange'][j],top=above?.08:.25,bottom=above?-.22:-.25;s.rect(0,y+bottom+j*.09,x,y+top+j*.09,j?{color,width:1.8,fill:color,fillAlpha:.025}:{fill:color,fillAlpha:.58,stroke:false});}
 }
 text(s,unit,maximumValue/2,-.8,'muted',{align:'center',size:10.5});
}
function ageGroups(s,actual,target){
 if(actual===null){view(s);text(s,'The population is empty',5,4.8,'muted',{align:'center',size:16});text(s,'Age shares are undefined',5,3.5,'muted',{align:'center',size:12});return;}
 const labels=Array.from({length:21},(_,i)=>i===20?'100+':5*i+'–'+(5*i+4));rowBars(s,labels.map((label,i)=>({label,values:[actual?.[i]??null,...(target?[target[i]]:[])]})).reverse(),{unit:'Share of females · 100+ is an open group'});
}
export function lesson1(v){
 const inputs=sourceControls(v,{fertility:true}),initial=v.select('starting age profile',['young','old','uniform','older-only','empty'],'young'),step=integer(v,'selected annual census',0,300,100),overlay=v.toggle('Show the same-law stable target',true);
 const A=panel(v,'A cohort projection and its stable age shares',{full:true,height:590}),B=graph(v,'Size changes while age shares settle','Years after initial census','$\\log(N/N_0)$',{height:420}),C=panel(v,'Lifetime daughters by maternal age',{height:420}),calculate=memo(H.projection);let z;
 v.animate(t=>{
  z=calculate({...inputs(),initial:initial.value,steps:Math.min(300,step.value+Math.floor(2*t))});overlay.el.hidden=!z.selectedGroups||!z.targetGroups;ageGroups(A,z.selectedGroups,overlay.value?z.targetGroups:null);
  const N0=z.history[0].total,points=N0?z.history.filter(r=>r.total>0).map(r=>[r.step,Math.log(r.total/N0)]):[];chart(B,[{points,color:'blue'}],{x:[0,300]});if(z.selected.total>0&&N0)dot(B,z.steps,Math.log(z.selected.total/N0));
  rowBars(C,Array.from({length:9},(_,i)=>({label:(10+5*i)+'–'+(14+5*i),values:[sum(z.netMaternityBins.slice(10+5*i,15+5*i))],colors:['teal']})),{unit:'Daughters per female birth',digits:fmt});
  v.legend([...(z.selectedGroups?[['blue','projected population']]:[]),...(z.selectedGroups&&overlay.value&&z.targetGroups?[['purple','same-law stable target']]:[]),['teal','net maternity contribution'],...(z.selected.total>0?[['gold','selected census']]:[])]);
 },{period:151,once:true,autoplay:false,still:0});
 v.readout(()=> '**Census '+z.steps+': '+fmt(z.selected.total)+' females.** '+(z.selected.shares===null?'The population is empty, so age shares and growth ratios are undefined.':!z.futureReproductionPossible?'This initial population has no future reproductive contribution under the chosen law. The reproductive convergence hypothesis does not apply.':'Distance from the stable age shares: '+fmt(z.selected.distance)+'. The fixed-law intrinsic growth is approximately '+pct(z.discrete.r)+' per year.')+'\n\nInputs are retained WPP 2024 period schedules with a stated interpolation. The annual pulse-census target belongs to this projection law; the next lesson solves the separate continuous-age equation. The oldest group retains its explicit geometric survival tail.');
}
export function lesson7(v){
 const shape=integer(v,'Erlang shape',3,8,6),mean=integer(v,'mean maternity age (years)',20,40,30),reproduction=integer(v,'net reproduction (% of replacement)',25,400,150),time=integer(v,'selected year',0,300,30),mode=v.select('birth stream view',['growth-corrected births','log births'],'growth-corrected births');
 const A=graph(v,'Renewal produces its own waves','Time (years)','Growth-corrected births',{full:true,height:400}),B=graph(v,'Poles of the explicit renewal solution','Real part (per year)','Imaginary part (per year)',{height:380}),C=graph(v,'Births from forcing and renewal','Time (years)','Growth-corrected births',{height:380}),calculate=memo(H.renewal);let z;
 v.animate(t=>{
  z=calculate({shape:shape.value,mean:mean.value,reproduction:reproduction.value,time:Math.min(300,time.value+Math.floor(2*t))});const log=mode.value==='log births',horizon=Math.min(300,Math.max(90,z.time+5)),visible=z.history.filter(r=>r.time<=horizon);A.o.ylabel=log?'$\\log(B/B_0)$':'Growth-corrected births';
  chart(A,[{points:visible.map(r=>[r.time,log?Math.log(r.births):r.corrected]),color:'blue'},{points:[[0,log?-Math.log(z.shape):z.correctedLimit],[horizon,log?z.r*horizon-Math.log(z.shape):z.correctedLimit]],color:'purple',dash:[5,4],width:1.5}],{x:[0,horizon]});dot(A,z.time,log?Math.log(z.selected.births):z.selected.corrected);
  const xmin=Math.min(...z.roots.map(r=>r.real),0),xmax=Math.max(...z.roots.map(r=>r.real),0),imag=Math.max(...z.roots.map(r=>Math.abs(r.imag)),.01);
  chart(B,[{points:[[xmin,0],[xmax,0]],color:'grid',width:1},{points:[[0,-imag],[0,imag]],color:'grid',width:1}],{x:[xmin-.02,xmax+.02],y:[-1.1*imag,1.1*imag]});
  for(const root of z.roots)dot(B,root.real,root.imag,root.dominant?'purple':'blue',root.dominant?5.5:4,{hollow:true});
  chart(C,[{points:visible.map(r=>[r.time,r.corrected]),color:'blue',width:3.6,dash:[6,5]},{points:visible.map(r=>[r.time,r.forcing]),color:'teal',dash:[5,3]},{points:visible.map(r=>[r.time,r.renewed]),color:'orange',width:1.9}],{x:[0,horizon]});dot(C,z.time,z.selected.corrected);
  v.legend([['blue',log?'log birth stream':'corrected birth stream'],['purple','dominant root / leading asymptote'],['teal','specified forcing'],['orange','renewal contribution'],['gold','selected year']]);
 },{period:151,once:true,autoplay:false,still:0});
 v.readout(()=> '**Dominant growth r ≈ '+pct(z.r)+' per year.** At year '+z.time+', corrected births are '+fmt(z.selected.corrected)+'; their limiting level is 1/'+z.shape+'. The forcing contribution is '+fmt(z.selected.forcing)+' and renewal contributes '+fmt(z.selected.renewed)+'.\n\nThe phase-system modes have a strict real-part gap. The forcing G is a specified model input. The time view includes the selected year and at least 90 years.');
}
function ageProfiles(s,series){
 const good=series.filter(row=>row.points);if(!good.length){view(s);text(s,'No finite normalized age profile',5,4,'muted',{align:'center',size:13});return;}
 const maximum=nice(Math.max(...good.flatMap(row=>row.points.map(p=>100*p[1])))),ageMax=Math.max(...good.flatMap(row=>row.points.map(p=>p[0])));view(s,[-.28*maximum,1.09*maximum],[-.14*ageMax,1.13*ageMax]);
 for(const a of Array.from({length:Math.floor(ageMax/20)+1},(_,i)=>20*i)){s.line(0,a,maximum,a,{color:'grid',width:1});text(s,a,-.055*maximum,a,'muted',{align:'right',baseline:'middle',size:10.5});}
 for(const x of[0,maximum/2,maximum]){s.line(x,0,x,ageMax,{color:'grid',width:1});text(s,tick(x),x,-5,'muted',{align:'center',size:10.5});}
 for(const row of good){const points=row.points.map(([age,density])=>[100*density,age]);if(good.length===1)s.poly([[0,0],...points,[0,ageMax]],{fill:row.color,fillAlpha:.10,stroke:false});s.path(points,{color:row.color,width:row.width??2.3,dash:row.dash??[]});}
 text(s,'Share per year of age (%)',maximum/2,-.11*ageMax,'muted',{align:'center',size:10.5});text(s,'Age (years)',0,1.09*ageMax,'muted',{size:10.5});
}
function signedBars(s,rows,unit){
 const good=rows.filter(r=>r.value!==null&&Number.isFinite(r.value));if(!good.length){view(s);text(s,'Comparison is undefined',5,4,'muted',{align:'center',size:13});return;}
 let lo=Math.min(0,...good.map(r=>r.value)),hi=Math.max(0,...good.map(r=>r.value)),dx=hi-lo;if(!dx){lo=-1;hi=1;dx=2;}view(s,[lo-.22*dx,hi+.15*dx],[-1,good.length+1.2]);
 for(const x of[lo,(lo+hi)/2,hi]){s.line(x,-.1,x,good.length-.05,{color:'grid',width:1});text(s,tick(x),x,good.length+.65,'muted',{align:'center',size:10});}s.line(0,-.1,0,good.length-.05,{color:'muted',alpha:.7,width:1});
 for(const[i,row]of good.entries()){const y=good.length-i-.55;text(s,row.label,lo,y+.33,'muted',{size:11});s.rect(Math.min(0,row.value),y-.16,Math.max(0,row.value),y+.09,{fill:row.color,fillAlpha:.58,stroke:false});dot(s,row.value,y-.035,row.color,3.2,{hollow:true});text(s,fmt(row.value),hi+.10*dx,y+.33,row.color,{align:'right',size:11});}
 text(s,unit,(lo+hi)/2,-.65,'muted',{align:'center',size:10.2});
}
function factorCards(s,rows){
 view(s);const narrow=s.W<550;
 for(const[i,[label,value,color]]of rows.entries()){
  const x=narrow?.2:(i%2)*5+.2,y=narrow?6.4-i*1.8:4.6-Math.floor(i/2)*3.4,w=narrow?9.6:4.6,h=narrow?1.45:2.6;
  s.rect(x,y,x+w,y+h,{fill:color,fillAlpha:.055,color:'grid',radius:7});text(s,label,x+.22,y+h-.38,'muted',{size:10.5});text(s,value,x+w-.22,y+.4,color,{align:'right',size:18});
 }
}
export function lesson2(v){
 const inputs=sourceControls(v,{fertility:true}),trial=integer(v,'trial growth (per 1,000/year)',-100,100,0),A=graph(v,'One weighted daughter defines the intrinsic rate','Annual growth (%)','Log discounted reproduction',{full:true,height:400}),B=panel(v,'The maternal-age contributions',{height:420}),C=panel(v,'One model, distinct source references',{height:420}),calculate=memo(H.lotka);let z;
 v.render(()=>{
  z=calculate({...inputs(),trial:trial.value});A.o.ylabel=z.rootExists?'Log discounted reproduction':'Weighted daughters';
  chart(A,[{points:z.curve.map(r=>[100*r.r,z.rootExists?r.logF:r.F]),color:'blue'},{points:[[100*z.curve[0].r,z.rootExists?0:1],[100*z.curve.at(-1).r,z.rootExists?0:1]],color:'muted',dash:[5,4],width:1.4}]);
  if(z.rootExists)dot(A,100*z.r,0,'purple',5.5,{hollow:true});dot(A,100*z.trialRate,z.rootExists?Math.log(z.trialIntegral):0,'gold',3.6);
  rowBars(B,Array.from({length:9},(_,i)=>{const a=10+5*i,r=z.contributions.find(r=>r.age===a);return{label:a+'–'+(a+4),values:[r?.trial??0,z.rootExists?r?.atRoot??0:null],colors:['gold','purple']};}),{unit:'Weighted daughters per female birth',digits:fmt});
  facts(C,[['Reconstructed model NRR',fmt(z.NRR),'blue'],['Intrinsic annual growth',z.r===null?'no finite root':pct(z.r),'purple'],['Net maternity mean age',z.T===null?'undefined':fmt(z.T)+' years','teal'],['Published source baseline NRR',fmt(z.sourceNRR),'muted']]);
  v.legend([['blue',z.rootExists?'log Lotka integral':'zero maternity kernel'],['muted',z.rootExists?'log(1) = 0':'one daughter reference',{dash:true}],...(z.rootExists?[['purple','intrinsic rate / its contributions']]:[]),['gold','trial rate / its contributions']]);
 });
 v.readout(()=> '**At the trial rate, weighted reproduction is '+fmt(z.trialIntegral)+'.** '+(z.rootExists?'The unique continuous intrinsic rate is approximately '+pct(z.r)+' per year; its integral is '+fmt(z.rootIntegral)+'.':'Zero maternity produces no finite intrinsic root.')+'\n\nThe vertical scale is '+(z.rootExists?'the natural logarithm, so the reference level is 0.':'linear in the zero-kernel view.')+' NRR is reconstructed under the stated interpolation. The published source baseline stays fixed when the authored fertility multiplier changes.');
}
export function lesson3(v){
 const inputs=sourceControls(v,{fertility:true}),A=graph(v,'Fifty schedules against the equality line','log(NRR) / T (%/year)','Intrinsic r (%/year)',{full:true,height:420}),B=graph(v,'The selected maternity timing','Maternal age (years)','Net maternity / year'),C=panel(v,'Approximation error at the selected schedule'),calculate=memo(H.approximation);let z;
 v.render(()=>{
  z=calculate(inputs());const points=z.points.filter(p=>p.r!==null),values=points.flatMap(p=>[100*p.r,100*p.first]);
  if(points.length){const lo=Math.min(0,...values),hi=Math.max(0,...values);chart(A,[{points:[[lo,lo],[hi,hi]],color:'muted',dash:[5,4],width:1.4}],{x:[lo,hi],y:[lo,hi]});for(const p of points)if(p.country!==z.country)dot(A,100*p.first,100*p.r,'blue',3,{hollow:true});for(const p of points)if(p.country===z.country)dot(A,100*p.first,100*p.r,'purple',4.1,{hollow:true});dot(A,100*z.selected.first,100*z.selected.r,'gold',4.2);}
  else chart(A,[]);
  chart(B,[{points:z.selectedSchedule.netMaternity,color:'teal'}],{x:[0,55]});
  signedBars(C,[{label:'First-order error',value:z.selected.first===null?null:100*(z.selected.first-z.selected.r),color:'orange'},{label:'Second-order error',value:z.selected.second===null?null:100*(z.selected.second-z.selected.r),color:'purple'}],'Approximation − r, percentage points/year');
  v.legend([...(points.length?[['blue','other period schedules'],['purple','selected country / second order'],['gold','selected country and year'],['muted','equality',{dash:true}],['orange','first-order error']]:[]),['teal','selected net maternity kernel']]);
 });
 v.readout(()=> '**'+z.selected.name+', '+z.year+': '+(z.selected.r===null?'the root and approximations are undefined.':'r ≈ '+pct(z.selected.r)+' per year; first order ≈ '+pct(z.selected.first)+', second order ≈ '+pct(z.selected.second)+'.')+'**\n\nThe 50 points use retained period inputs, not observed population growth. T is the mean age of the net maternity kernel. The first-order value is a lower bound for this definition of T; its error depends on the full age pattern.');
}
export function lesson4(v){
 const inputs=sourceControls(v),growth=integer(v,'chosen annual growth (per 1,000)',-50,50,0),age=integer(v,'selected age',0,100,30),A=panel(v,'Survival and growth make an age profile',{height:450}),B=panel(v,'Multiply the factors at one age',{height:450}),C=panel(v,'Births minus deaths equals growth',{full:true,height:280}),calculate=memo(H.tilt);let z;
 v.render(()=>{z=calculate({...inputs(),growth:growth.value,age:age.value});ageProfiles(A,[{points:z.profile,color:'blue'}]);if(z.selected.density!==null)dot(A,100*z.selected.density,z.age,'gold');factorCards(B,[['Survival to age '+z.age,fmt(z.selected.survival),'teal'],['Relative birth cohort',fmt(z.selected.weight),'purple'],['Birth normalizer / year',fmt(z.b),'orange'],['Age density / year',fmt(z.selected.density),'blue']]);signedBars(C,[{label:'Girl births b',value:z.b===null?null:1000*z.b,color:'teal'},{label:'Female deaths d',value:z.d===null?null:1000*z.d,color:'orange'},{label:'Growth b − d',value:1000*z.r,color:'gold'}],'Per 1,000 females/year');v.legend([['blue','normalized age density'],['teal','survival / births'],['purple','relative birth cohort'],['orange','normalizer / deaths'],['gold','selected age / growth']]);});
 v.readout(()=> '**At age '+z.age+', density is '+fmt(z.selected.density)+' per year of age.** '+(z.normalizable?'The full normalizer gives b ≈ '+fmt(z.b)+' per year; '+pct(z.tailShare)+' of females are in the 100+ tail.':'This growth/survival combination has no finite age normalizer.')+'\n\nMaternity is explicitly rescaled by approximately '+fmt(z.maternityRescale)+' to support the chosen growth rate. The displayed profile is a stable equivalent under that law.');
}
export function lesson5(v){
 const inputs=sourceControls(v),fertility=integer(v,'fertility (% of source)',0,300,100),child=integer(v,'hazard before age 5 (% of source)',25,250,100),late=integer(v,'hazard from age 60 (% of source)',25,250,100),extra=integer(v,'separate uniform extra hazard (per 1,000)',0,20,10),A=panel(v,'Each age pattern has a different effect',{full:true,height:460}),B=panel(v,'Compare actual mean ages',{height:350}),C=panel(v,'A uniform hazard has an exact cancellation',{height:350}),calculate=memo(H.coale);let z;
 v.render(()=>{z=calculate({...inputs(),fertility:fertility.value,child:child.value,late:late.value,extra:extra.value});ageProfiles(A,[{points:z.baseline.profile,color:'purple',dash:[5,4],width:4.5},{points:z.changed.profile,color:'blue'}]);rowBars(B,[['Baseline',z.baseline],['Fertility only',z.fertilityOnly],['Early hazard only',z.earlyOnly],['Late hazard only',z.lateOnly],['Combined',z.changed]].map(([label,p],i)=>({label,values:[p.meanAge],colors:[['purple','teal','orange','pink','blue'][i]]})),{unit:'Mean age of living females (years)',digits:fmt});facts(C,[['Added annual hazard',fmt(z.uniform.delta),'orange'],['Intrinsic r before',pct(z.baseline.r),'purple'],['Intrinsic r after',pct(z.uniform.r),'blue'],['Complete age density','exactly unchanged','teal']]);v.legend([['purple','baseline'],['blue','combined change'],['teal','fertility only / exact identity'],['orange','early or uniform hazard'],['pink','late hazard only']]);});
 v.readout(()=> '**The selected changes produce '+(z.changed.meanAge===null?'no reproductive stable profile.':'mean age ≈ '+fmt(z.changed.meanAge)+' years, versus '+fmt(z.baseline.meanAge)+' at baseline.')+'** Early and later survival act through different parts of the renewal and survival calculation.\n\nIn the separate uniform-hazard identity, r falls by '+fmt(z.uniform.delta)+' per year and deaths rise by that amount, while the complete normalized age profile and birth normalizer stay unchanged.');
}
export function lesson6(v){
 const inputs=sourceControls(v,{hazard:true}),A=graph(v,'Stationarity makes survival the age-profile template','Age (years)','Survival probability',{full:true,height:360}),B=panel(v,'Balanced events under replacement',{height:310}),C=panel(v,'Two different ways to weight ages',{height:310}),calculate=memo(H.stationary);let z;
 v.render(()=>{z=calculate(inputs());chart(A,[{points:z.survival,color:'blue'}],{x:[0,100],y:[0,1]});signedBars(B,[{label:'Girl births',value:1000*z.b,color:'teal'},{label:'Female deaths',value:1000*z.d,color:'orange'},{label:'Net growth',value:0,color:'gold'}],'Events per 1,000 females/year');rowBars(C,[{label:'Living females',values:[z.meanAge],colors:['blue']},{label:'Stationary deaths',values:[z.meanAgeAtDeath],colors:['purple']}],{unit:'Mean age (years)',digits:fmt});v.legend([['blue','survival / age of living females'],['teal','births'],['orange','deaths'],['purple','age at stationary death'],['gold','exact zero growth']]);});
 v.readout(()=> '**e₀ ≈ '+fmt(z.e0)+' years; b = d ≈ '+fmt(1000*z.b)+' per 1,000 female-years.** Mean age among living females is '+fmt(z.meanAge)+' years; mean age at stationary death is '+fmt(z.meanAgeAtDeath)+' years.\n\nReplacement is imposed by rescaling maternity, not inferred from rounded data. The stated interpolation supplies '+fmt(z.survivalAreaThrough100)+' person-years below 100 and '+fmt(z.tailLifeYears)+' in the explicit 100+ tail per newborn female.');
}
export function lesson8(v){
 const growth=integer(v,'baseline growth (per 1,000/year)',-10,30,10),amplitude=integer(v,'birth-cycle amplitude (%)',0,100,60),period=integer(v,'birth-cycle period (years)',20,60,40),time=integer(v,'current model year',0,120,20),census=integer(v,'years between censuses',1,30,10);
 const A=graph(v,'The declared birth history','Years before the selected census','Births / current birth flow',{height:430,minWidth:440}),B=graph(v,'Two different age-specific growth rates','Age (years)','Annual growth (%)',{height:430,minWidth:440}),C=panel(v,'Reconstruct the current age profile',{height:450,minWidth:440}),D=panel(v,'Check the complete normalization',{height:450,minWidth:440}),calculate=memo(H.variable);let z;
 v.render(()=>{
  z=calculate({growth:growth.value,amplitude:amplitude.value,period:period.value,time:time.value,census:census.value});chart(A,[{points:z.births,color:'blue'}],{x:[-120,0]});dot(A,0,1,'gold');
  chart(B,[{points:z.profile.map(p=>[p.age,100*p.instant]),color:'purple'},{points:z.profile.map(p=>[p.age,100*p.finite]),color:'orange',dash:[5,3]}],{x:[0,120]});
  ageProfiles(C,[{points:z.profile.map(p=>[p.age,p.reconstructed]),color:'purple',width:4.7,dash:[5,4]},{points:z.profile.map(p=>[p.age,p.censusRaw]),color:'orange',width:3.4,dash:[1,5]},{points:z.profile.map(p=>[p.age,p.actual]),color:'blue'}]);
  facts(D,[['True current birth rate / year',fmt(z.b),'blue'],['Finite-census implied rate',fmt(z.finiteB),'orange'],['Raw substitute: total mass',fmt(z.finiteUnnormalizedMass),'orange'],['TV after separate normalization',fmt(z.finiteReconstructionTV),'purple'],['Actual age share beyond 120',pct(z.tailShareBeyond120),'teal']]);
  v.legend([['blue','declared births / actual profile'],['purple','instantaneous relation'],['orange','finite-census substitute',{dash:true}],['teal','explicit oldest-age tail'],['gold','selected census']]);
 });
 v.readout(()=> '**The instantaneous relation reproduces the current profile.** Using the two-census rate with the actual birth normalizer instead gives total mass '+fmt(z.finiteUnnormalizedMass)+'. '+(z.amplitude===0?'At zero cycle amplitude, growth is constant and the two rate definitions agree.':'The two-census rate averages growth over '+z.census+' years at each fixed age.')+'\n\nAfter separately normalizing that substitute, its total-variation distance from the actual profile is '+fmt(z.finiteReconstructionTV)+'. This authored positive birth history uses the complete infinite survival tail.');
}
export function lesson9(v){
 const steps=integer(v,'selected ten-year census step',0,80,40),sequence=v.select('shared changing-law sequence',['periodic','Thue–Morse'],'periodic'),initial=v.select('two starting profiles',['opposed','near','same'],'opposed'),A=panel(v,'Two populations under one changing law',{height:380}),B=graph(v,'Forgetting the starting age profile','Ten-year census step','Total-variation distance',{height:380}),C=graph(v,'A proved block contraction','Ten-year census step','Relative ratio range',{full:true,height:330}),calculate=memo(H.changing);let z;
 v.animate(t=>{
  z=calculate({steps:Math.min(80,steps.value+Math.floor(2*t)),sequence:sequence.value,initial:initial.value});rowBars(A,z.ageLabels.map((label,i)=>({label,values:[z.selected.first[i].value,z.selected.second[i].value]})).reverse(),{unit:'Share in each authored age class'});
  chart(B,[{points:z.history.map(r=>[r.step,r.distance.value]),color:'blue'}],{x:[0,80],y:[0,1]});dot(B,z.steps,z.selected.distance.value,'gold');
  const rows=z.history.filter(r=>r.relativeSpread!==null);chart(C,[{points:rows.map(r=>[r.step,r.relativeSpread.value]),color:'blue'},{points:rows.flatMap((r,i)=>i?[[r.step,rows[i-1].blockBound.value],[r.step,r.blockBound.value]]:[[r.step,r.blockBound.value]]),color:'teal',dash:[5,4]}],{x:[10,80],y:[0,1]});if(z.selected.relativeSpread!==null)dot(C,z.steps,z.selected.relativeSpread.value,'gold');
  v.legend([['blue','first population / actual distance'],['purple','second population'],['teal','proved block upper bound',{dash:true}],['gold','selected census']]);
 },{period:41,once:true,autoplay:false,still:0});
 v.readout(()=> '**At step '+z.steps+', total variation is '+fmt(z.selected.distance.value)+'.** '+(z.initial==='same'?'The two starting profiles are identical; the relative-spread display uses 0 for this case.':z.steps<10?'The first certified ten-step block has not yet elapsed.':'The ratio range contracts under the certified block coefficient; its bound is deliberately conservative.')+'\n\nThe exact 10-step matrix bounds give ε ≈ '+fmt(z.epsilon.value)+'. The proof applies to the complete bounded sequence; the finite trace illustrates it. These four authored age classes exit at 40, with ten years per step.');
}
export function lesson10(v){
 const steps=integer(v,'selected ten-year census step',0,40,20),females=integer(v,'initial females (%)',0,100,50),daughterShare=integer(v,'female share of births (%)',40,60,50),utilization=integer(v,'capacity utilization (%)',0,50,50),maleFertility=integer(v,'male capacity (% of baseline)',0,200,100),A=panel(v,'The selected two-sex age structure',{height:390}),B=graph(v,'Three explicitly different birth closures','Ten-year census step','Births at the next census',{height:390}),C=panel(v,'One stated birth-production rule',{full:true,height:300}),calculate=memo(H.twoSex);let z;
 v.render(()=>{
  z=calculate({steps:steps.value,females:females.value,daughterShare:daughterShare.value,utilization:utilization.value,maleFertility:maleFertility.value});const selected=z.tracks['two-sex'].selected;
  if(selected.total)rowBars(A,z.ageLabels.map((label,i)=>({label,values:[selected.female[i]/selected.total,selected.male[i]/selected.total]})).reverse(),{unit:'Share of all females and males'});else{view(A);text(A,'Population empty',5,4.8,'muted',{align:'center',size:16});text(A,'Age and sex shares are undefined',5,3.5,'muted',{align:'center'});}
  chart(B,[['female-only','teal'],['male-only','orange'],['two-sex','blue']].map(([mode,color])=>({points:z.tracks[mode].history.map(r=>[r.step,r.births]),color})),{x:[0,40]});dot(B,z.steps,selected.births,'gold');
  factorCards(C,[['Female capacity F',fmt(selected.femaleCapacity),'blue'],['Male capacity G',fmt(selected.maleCapacity),'purple'],['Utilization η',pct(z.utilization/100),'orange'],['Chosen births B',fmt(selected.births),'teal']]);
  v.legend([['blue','females / two-sex closure'],['purple','males'],['teal','female-only closure / chosen births'],['orange','male-only closure / utilization'],['gold','selected census']]);
 });
 v.readout(()=>{const s=z.tracks['two-sex'].selected;return '**Female-only intrinsic growth: '+(z.femaleIntrinsic===null?'undefined':pct(z.femaleIntrinsic)+' per year')+'; male-only: '+(z.maleIntrinsic===null?'undefined':pct(z.maleIntrinsic)+' per year')+'.** The chosen two-sex projection has '+(s.annualGrowth===null?'undefined growth at this census.':'finite-step annualized growth '+pct(s.annualGrowth)+'.')+'\n\nThe capacity rule is B = 2ηFG/(F+G), with the explicit zero-capacity branch B=0. It is a chosen birth-production law. Four authored ten-year classes exit at 40; the two-sex trace is not a certified general intrinsic-rate theorem.';});
}
function historicalTable(s,table){
 const n=table.ageLabels.length,maximum=nice(Math.max(...table.calculated,...table.observed)),X=x=>2.15+5.1*x/maximum;view(s,[0,10],[-1,n+1.2]);
 for(const x of[0,maximum/2,maximum]){s.line(X(x),-.15,X(x),n-.1,{color:'grid',width:1});text(s,tick(x),X(x),n+.55,'muted',{align:'center',size:10});}
 for(let i=0;i<n;i++){const y=n-i-.6,a=table.calculated[i],b=table.observed[i];text(s,table.ageLabels[i],.1,y,'muted',{baseline:'middle',size:11});s.line(X(a),y,X(b),y,{color:'muted',width:1.4});dot(s,X(a),y,'blue',5,{hollow:true});dot(s,X(b),y,'pink',2.8,{hollow:true});text(s,a+' / '+b,9.9,y,'ink',{align:'right',baseline:'middle',size:11});}
 text(s,'Reported rounded entries · calculated / observed',5,-.6,'muted',{align:'center',size:10.3});
}
export function lesson11(v){
 const inputs=sourceControls(v),age=integer(v,'cohort age',0,100,30),growth=integer(v,'cohort growth (per 1,000/year)',-30,50,14),initial=v.select('modern projection starts',['young','old','uniform','older-only','empty'],'old'),steps=integer(v,'modern annual census',0,300,100),B=panel(v,'England and Wales 1871–1880 · actual female table',{full:true,height:530}),A=panel(v,'Past births times survival',{height:400}),C=graph(v,'A separate modern same-law projection','Annual census','Distance from its stable target',{height:400}),calculate=memo(H.historical),project=memo(H.projection);let z,q;
 v.render(()=>{
  z=calculate({...inputs(),age:age.value,growth:growth.value});q=project({...inputs(),initial:initial.value,steps:steps.value});factorCards(A,[['Chosen annual growth',pct(z.r),'gold'],['Birth cohort / current births',fmt(z.birthCohortRelativeToCurrent),'purple'],['Maternal survival l(a)',fmt(z.survival),'orange'],['Age factor n(a,t) / B(t)',fmt(z.relativeAgeDensity),'teal']]);historicalTable(B,z.table);
  chart(C,[{points:q.history.filter(r=>r.distance!==null).map(r=>[r.step,r.distance]),color:'teal'}],{x:[0,300],y:[0,1]});if(q.selected.distance!==null)dot(C,q.steps,q.selected.distance,'gold');v.legend([['blue','reported calculated table'],['pink','reported observed table'],['teal','cohort factor / modern projection'],['purple','birth-cohort ratio'],['orange','survival'],['gold','selected age / census']]);
 });
 v.readout(()=> '**At age '+z.age+', the relative cohort factor is '+fmt(z.birthCohortRelativeToCurrent)+' × '+fmt(z.survival)+' = '+fmt(z.relativeAgeDensity)+'.** This factor becomes an age probability density only after multiplication by the appropriate birth normalizer.\n\nThe historical table preserves the paper’s reported female entries, with calculated sum '+z.reportedCalculatedSum+' and observed sum '+z.reportedObservedSum+'. It is categorical, not a smooth density. The cohort illustration and modern projection use distinct retained period inputs and authored initial populations.');
}
export function lesson12(v){
 const country=v.select('modern period schedules',H.countries.map(c=>({value:c.country,label:c.name})),'SWE'),first=v.select('first schedule year',H.years.map(String),'1950'),second=v.select('second schedule year',H.years.map(String),'2023'),A=panel(v,'Four rate swaps produce four stable equivalents',{full:true,height:460}),B=panel(v,'Intrinsic growth belongs to each complete law',{height:350}),C=panel(v,'Historical Sweden · reported life expectancies',{height:350}),calculate=memo(H.periodSwap);let z;
 v.render(()=>{
  z=calculate({country:country.value,first:Number(first.value),second:Number(second.value)});const colors=['blue','purple','orange','teal'];
  ageProfiles(A,z.first===z.second?[{points:z.rows[0].profile,color:'blue'}]:z.rows.map((r,i)=>({points:r.profile,color:colors[i],dash:i===0?[5,4]:[],width:i===0?4:2.3})));
  signedBars(B,z.rows.map((r,i)=>({label:'F'+r.fertilityYear+' / M'+r.mortalityYear,value:100*r.r,color:colors[i]})),'Intrinsic growth (% per year)');
  rowBars(C,[{label:'1860',values:[z.historicalContext.oldLifeExpectancy],colors:['blue']},{label:'1946–50',values:[z.historicalContext.newLifeExpectancy],colors:['teal']}],{maximum:80,unit:'Reported life expectancy at birth (years)',digits:fmt});
  v.legend(z.first===z.second?[['blue','all four combinations coincide'],['teal','historical 1946–1950 reference']]:z.rows.map((r,i)=>[colors[i],'F'+r.fertilityYear+' / M'+r.mortalityYear]));
 });
 v.readout(()=> '**'+z.name+': '+(z.first===z.second?'the same year was selected twice, so all four rate combinations coincide.':'fertility and mortality years are swapped independently.')+'** Mean ages in row order are '+z.rows.map(r=>fmt(r.meanAge)).join(', ')+' years.\n\nF denotes fertility year and M denotes mortality year. These curves are calculated stable equivalents from retained WPP 2024 inputs. The separate historical source panel preserves Coale’s reported Swedish life expectancies 45.4 and 71.6 years. Its original age curves were inspected without digitization.');
}
