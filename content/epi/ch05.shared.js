// Authored finite populations and seeded experiments, except explicitly sourced paper tables.
export const CDC='https://archive.cdc.gov/www_cdc_gov/csels/dsepd/ss1978/lesson1/section7.html';
export const DENSITY='https://academic.oup.com/ije/article/48/6/1981/5519661';
export const MATCH='https://pmc.ncbi.nlm.nih.gov/articles/PMC9188848/';
export const NESTED='https://pmc.ncbi.nlm.nih.gov/articles/PMC4374014/';
export const CROSSOVER='https://pubmed.ncbi.nlm.nih.gov/1985444/';
export {memo,mean,moments} from '../stat/ch03.shared.js';
export function rng(seed=1){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return(seed+.5)/4294967296;};}
export const fmt=x=>x===null||!Number.isFinite(x)?'not estimable':x.toFixed(3);
export const pct=x=>`${(100*x).toFixed(1)}%`;
export const ratio=(a,b)=>b>0?a/b:null;
export function wilson(d,n){const p=d/n,z=1.95996398454,q=z*z/n,c=(p+q/2)/(1+q),h=z*Math.sqrt(p*(1-p)/n+q/(4*n))/(1+q);return[c-h,c+h];}
export function logRatioCI(a,b,c,d,personTime=false){if(!(a>0&&c>0&&b>0&&d>0))return null;const est=(a/b)/(c/d),se=Math.sqrt(1/a+1/c-(personTime?0:1/b+1/d));return[est*Math.exp(-1.96*se),est*Math.exp(1.96*se)];}
export function oddsRatio(a,b,c,d){return b*c>0?a*d/(b*c):null;}
export function bernoulliCount(N,p,r){let d=0;for(let i=0;i<N;i++)d+= +(r()<p);return d;}
export function cohort({N=400,RR=2,T=5,confounded=false,informative=false,seed=3,lambda=.04}){const r=rng(seed);return Array.from({length:N},(_,i)=>{const z=confounded?+(r()<.5):0,e=+(r()<(confounded?(z?.8:.2):.5)),event=-Math.log(r())/(lambda*RR**e*3**z),loss=-Math.log(r())/.025,censor=informative&&r()<.4?event*(.2+.6*r()):loss,stop=Math.min(event,censor,T),caseEvent=event<=censor&&event<=T;return{i,z,e,event,censor,stop,caseEvent};});}
export function rateTable(rows){return[0,1].map(e=>{const group=rows.filter(p=>p.e===e);return{N:group.length,D:group.filter(p=>p.caseEvent).length,PT:group.reduce((s,p)=>s+p.stop,0)};});}
export function simpleCohort(N,RR,T,seed=3){return cohort({N,RR,T,lambda:.12,seed}).map(p=>({...p,censor:Infinity,stop:Math.min(p.event,T),caseEvent:p.event<=T}));}
export function pickWithoutReplacement(a,m,r){const b=a.slice(),out=[];for(let j=0;j<Math.min(m,b.length);j++){const k=Math.floor(r()*b.length);out.push(b[k]);b[k]=b.at(-1);b.pop();}return out;}
export function riskSets(rows){return rows.filter(p=>p.caseEvent).sort((a,b)=>a.event-b.event).map(c=>({c,atRisk:rows.filter(p=>p.event>=c.event&&p.censor>=c.event)}));}
export function nestedSets(rows,m,r){return riskSets(rows).map(({c,atRisk})=>{const controls=pickWithoutReplacement(atRisk.filter(p=>p.i!==c.i),m,r),set=[c,...controls],a=set.filter(p=>p.e).length;return{c,controls,a,b:set.length-a};});}
export function conditionalEstimate(sets){const terms=sets.filter(s=>s.a>0&&s.b>0);if(!terms.length)return null;const score=beta=>terms.reduce((z,s)=>z+s.c.e-Math.exp(beta)*s.a/(Math.exp(beta)*s.a+s.b),0);if(score(-8)<=0||score(8)>=0)return null;let lo=-8,hi=8;for(let i=0;i<65;i++){const m=(lo+hi)/2;if(score(m)>0)lo=m;else hi=m;}return Math.exp((lo+hi)/2);}
export function fullSets(rows){return riskSets(rows).map(({c,atRisk})=>{const a=atRisk.filter(p=>p.e).length;return{c,a,b:atRisk.length-a};});}
export function endOdds(rows){const D=[0,0],S=[0,0];rows.forEach(p=>(p.caseEvent?D:S)[p.e]++);return oddsRatio(D[1],S[1],D[0],S[0]);}
export function designSample(rows,kind,m,fraction,r){const sets=riskSets(rows),selected=new Set(rows.filter(p=>p.caseEvent).map(p=>p.i));let draws=0;const baseline=new Set();const pi=Array(rows.length).fill(0);
 if(kind==='case-cohort'){rows.forEach(p=>{if(p.caseEvent)pi[p.i]=1;else pi[p.i]=fraction;if(r()<fraction){selected.add(p.i);baseline.add(p.i);draws++;}});}else{const none=Array(rows.length).fill(1);for(const {c,atRisk} of sets){const pool=atRisk.filter(p=>p.i!==c.i),take=Math.min(m,pool.length);pickWithoutReplacement(pool,take,r).forEach(p=>{selected.add(p.i);draws++;});for(const p of pool)none[p.i]*=1-take/pool.length;}rows.forEach(p=>pi[p.i]=p.caseEvent?1:1-none[p.i]);}
 const HT=rows.reduce((s,p)=>s+(selected.has(p.i)&&p.e&&pi[p.i]>0?1/pi[p.i]:0),0)/rows.length,naive=rows.filter(p=>selected.has(p.i)).reduce((s,p)=>s+p.e,0)/selected.size;return{selected,baseline,pi,HT,naive,draws};}
export function ecological(gradient=.4,gap=.2){const regions=[.1,.3,.5,.7,.9].map(p=>{const native=.5+gradient*p,exposed=native-gap;return{p,native,exposed,aggregate:(1-p)*native+p*exposed};});const exposed=regions.reduce((s,z)=>s+z.p*z.exposed,0)/regions.reduce((s,z)=>s+z.p,0),native=regions.reduce((s,z)=>s+(1-z.p)*z.native,0)/regions.reduce((s,z)=>s+1-z.p,0);return{regions,exposed,native,slope:gradient-gap};}
export function matchedPairs(N,theta,seed=3,overmatch=false,trend=1){const r=rng(seed);return Array.from({length:N},(_,i)=>{const z=+(r()<.7),p=z?.8:.2,odds=p/(1-p)*theta*trend,ce=+(r()<odds/(1+odds)),control=overmatch?ce:+(r()<p);return{i,z,ce,control};});}
export function pairTable(pairs){let b=0,c=0,both=0,neither=0;for(const p of pairs){if(p.ce&&!p.control)b++;else if(!p.ce&&p.control)c++;else if(p.ce)both++;else neither++;}const n=pairs.length,naive=oddsRatio(b+both,c+neither,c+both,b+neither);return{b,c,both,neither,matched:ratio(b,c),naive,ci:b&&c?[b/c*Math.exp(-1.96*Math.sqrt(1/b+1/c)),b/c*Math.exp(1.96*Math.sqrt(1/b+1/c))]:null,n};}
export function expectedPairs(theta,trend=1){let b=0,c=0,caseP=0,controlP=0;for(const [w,p]of [[.3,.2],[.7,.8]]){const odds=p/(1-p)*theta*trend,q=odds/(1+odds);b+=w*q*(1-p);c+=w*(1-q)*p;caseP+=w*q;controlP+=w*p;}return{b,c,matched:b/c,naive:(caseP/(1-caseP))/(controlP/(1-controlP))};}
export function chart(v,title,xlabel,ylabel,height=300){return v.stage({x:[0,1],y:[0,1],axes:'box',gutter:true,height,title,xlabel,ylabel});}
export function lifelines(s,rows,T,{highlight=null,highlightTime=null}={}){const subset=rows.slice(0,32);s.setView([-.06*T,T*1.08],[-1,33]);for(let j=0;j<subset.length;j++){const p=subset[j],color=p.e?'orange':'accent';s.line(0,j,p.stop,j,{color,width:1.5,alpha:.65});s.dot(p.stop,j,{color:p.caseEvent?'red':'muted',r:p.caseEvent?3:2,hollow:!p.caseEvent});if(highlight&&highlight.has(p.i))s.dot(highlightTime??Math.min(T,p.stop),j,{color:'gold',hollow:true,r:6});}}
// Historical tables below are transcribed, not generated.
export const DOLL={source:'https://doi.org/10.1136/bmj.1.4877.1451',scan:'https://s3.amazonaws.com/alatoldsite/images/stories/demo/pdf/Tabaco/Otraspub/DollHillBMJ1954.pdf',labels:['never','1–14 g','15–24 g','≥25 g'],rates:{'lung cancer':[0,.48,.67,1.14],'other cancers':[2.32,1.41,1.50,1.91],'coronary thrombosis':[3.89,3.91,4.71,5.15],'all causes':[13.61,13.42,13.38,16.30]},observed:[0,12,11,13],expected:[3.77,14.20,10.73,7.31]};
export const FRAM={source:'https://doi.org/10.7326/0003-4819-55-1-33',scan:'https://laoha.org/wp-content/uploads/2024/01/Framingham.pdf',
 cholesterol:{labels:['<210','210–244','≥245'],men:{cases:[16,29,51],N:[454,455,424],expected:[69.4,70.8,71.8]},women:{cases:[8,16,30],N:[445,527,689],expected:[25.2,31.3,38.7]}},
 pressure:{labels:['normal','borderline','definite'],men:{cases:[23,38,37],N:[556,532,299],expected:[68.8,68.6,77.8]},women:{cases:[6,20,31],N:[704,647,395],expected:[26.5,35.0,39.8]}},
 LVH:{labels:['no LVH','possible','definite'],men:{cases:[27,3,7],N:[265,15,19],expected:[75.8,78.4,105.1]},women:{cases:[26,1,4],N:[357,19,19],expected:[40.0,34.6,42.2]}}};

export function conditionalCI(sets,est){if(est===null)return null;const info=sets.reduce((z,s)=>{if(!s.a||!s.b)return z;const p=est*s.a/(est*s.a+s.b);return z+p*(1-p);},0);return info>0?[est*Math.exp(-1.96/Math.sqrt(info)),est*Math.exp(1.96/Math.sqrt(info))]:null;}
