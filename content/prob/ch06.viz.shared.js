export const SOURCE='https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf';
export const reference=(section,page)=>[`Durrett, Probability: Theory and Examples, fifth edition, ${section}, printed pp${page}`];
export const scope='Seeded finite computations illustrate the stated infinite-time result; a finite trace does not prove stationarity, ergodicity or convergence. Controls and seeds determine every plotted value and replay through Share.';
export const fmt=(x,d=4)=>Number(x).toFixed(d);
export function chart(v,title,xlabel='time n',ylabel='value',height=330,extra={}){return v.stage({x:[-1,2],y:[-1,2],axes:'box',gutter:true,height,title,xlabel,ylabel,...extra});}
export function fit(s,series,{xpad=.12,ypad=.2,includeZero=false}={}){const points=series.flat().filter(p=>p&&p.every(Number.isFinite));if(!points.length){s.setView([-1,1],[-1,1]);return;}let xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);let a=Math.min(...xs),b=Math.max(...xs),c=Math.min(...ys),d=Math.max(...ys);if(includeZero){c=Math.min(0,c);d=Math.max(0,d);}const dx=Math.max(1,b-a),dy=Math.max(.2,d-c);s.setView([a-xpad*dx,b+xpad*dx],[c-ypad*dy,d+ypad*dy]);}
export const linePoints=a=>a.map((y,i)=>[i+1,y]);
export function series(s,a,color='accent',options={}){s.path(a,{color,width:2,...options});}
export function ring(s,points,colors){points.forEach((p,i)=>s.dot(...p,{r:5,color:colors?.(i)||'accent'}));}
export const continuous={step:'any',fmt:x=>x.toFixed(3)};
export function integer(v,label,min,max,value){return v.slider(label,min,max,value,{int:true});}
export const fraction=(x,n)=>`${x}/${n} = ${fmt(x/n)}`;
export function seeded(v,initial=17){return integer(v,'seed',1,99,initial);}
export const angles={fifth:{value:1/5,label:'1/5 (rational)'},sqrt:{value:Math.SQRT2-1,label:'√2 − 1'},gold:{value:(Math.sqrt(5)-1)/2,label:'(√5 − 1)/2'}};
export const angleOptions=Object.entries(angles).map(([value,q])=>({value,label:q.label}));
export function circlePoints(n,r=1){return Array.from({length:n},(_,j)=>[r*Math.cos(2*Math.PI*j/n),r*Math.sin(2*Math.PI*j/n)]);}
export function drawPermutation(s,n,step,selected=[]){s.setView([-1.5,1.5],[-1.5,1.5]);const ps=circlePoints(n);for(let j=0;j<n;j++){const p=ps[j],q=ps[(j+step)%n];s.arrow(...p,...q,{color:'muted',head:4,width:1});}ring(s,ps,j=>selected.includes(j)?'orange':'accent');}
