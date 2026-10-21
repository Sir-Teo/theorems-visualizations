export const REP='https://people.csail.mit.edu/tk/6971/Elowitz00.pdf';
export const HES='https://pmc.ncbi.nlm.nih.gov/articles/PMC2669796/';
export const CELL='https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.1001788';
export const KAI='https://arxiv.org/html/q-bio/0703009';
export const fmt=(x,d=3)=>x===null?'not resolved':Math.abs(x)>0&&(Math.abs(x)<1e-4||Math.abs(x)>1e5)?x.toExponential(2):Number(x).toFixed(d);
export const slider=(v,label,min,max,value)=>v.slider(label,min,max,value,{step:'any',fmt:x=>fmt(x)});
export const chart=(v,title,xlabel='time (model units)',ylabel='level',extra={})=>v.stage({x:[-1,1],y:[-1,1],axes:'box',gutter:true,height:330,title,xlabel,ylabel,...extra});
export const samples=(a,b,f,n=181)=>Array.from({length:n},(_,i)=>{const x=a+(b-a)*i/(n-1);return[x,f(x)];});
export function fit(s,arrays,xpad=.09,ypad=.22){const p=arrays.flat(),xs=p.map(a=>a[0]),ys=p.map(a=>a[1]),a=Math.min(...xs),b=Math.max(...xs),c=Math.min(...ys),d=Math.max(...ys),dx=Math.max(.1,b-a),dy=Math.max(.01,d-c);s.setView([a-xpad*dx,b+xpad*dx],[c-ypad*dy,d+ypad*dy]);}
export const line=(s,p,color='accent',extra={})=>s.path(p,{color,width:2,...extra});
export const memo=f=>{let key,result;return(...args)=>{const k=JSON.stringify(args);if(key!==k){result=f(...args);key=k;}return result;};};
