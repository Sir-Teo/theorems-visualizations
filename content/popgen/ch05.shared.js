// Chapter-local deterministic population-genetic models. Frequencies are dimensionless.
export const meanFitness=(q,s,h)=>1-s*q*(2*h+(1-2*h)*q);
export function mutationStep(q,u,s,h=0){const w=meanFitness(q,s,h);const selected=q*(1-s*(h+(1-h)*q))/w;return u+(1-u)*selected;}
// Stable positive root after factoring out the all-mutant equilibrium.
export function mutationEq(u,s,h=0){if(u===0)return 0;if(s===0)return 1;const A=s*(1-2*h),B=s*h*(1+u),D=Math.sqrt(B*B+4*A*u);return Math.min(1,2*u/(B+D));}
export function path(step,start,n){const out=[[0,start]];let q=start;for(let t=1;t<=n;t++){q=step(q);out.push([t,q]);}return out;}
export const load=(q,s,h)=>s*q*(2*h+(1-2*h)*q);
export function substitution(p0,s,n){let p=p0,D=0,H=0;const rows=[[0,p,D,H]];for(let t=1;t<=n;t++){const d=s*(1-p);D+=d;H-=Math.log1p(-d);p=p/(1-d);rows.push([t,p,D,H]);}return rows;}
export const migrant=(p,m,c)=>p+m*(c-p);
export const migrationExact=(p,m,c,t)=>t===0?p:c+(p-c)*Math.exp(t*Math.log1p(-m));
export const localStep=(p,m,s,dominant=false)=>(1-m)*p/(1-s*(dominant?(1-p)**2:1-p));
export const localEq=(m,s,dominant=false)=>m>=s?0:1-(dominant?Math.sqrt(m/s):m/s);
export function rng(seed){let state=seed>>>0;return()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return(state+.5)/4294967296;};}
export function migrantSample(p,m,c,N,t,seed){p=Math.round(2*N*p)/(2*N);const random=rng(seed),out=[[0,p]];for(let j=1;j<=t;j++){const a=migrant(p,m,c);let count=0;for(let k=0;k<2*N;k++)if(random()<a)count++;p=count/(2*N);out.push([j,p]);}return out;}
export function binomial(n,p){const a=Array(n+1).fill(0);if(p===0){a[0]=1;return a;}if(p===1){a[n]=1;return a;}for(let k=0;k<=n;k++){let c=1;for(let j=1;j<=k;j++)c*=((n-j+1)/j);a[k]=c*p**k*(1-p)**(n-k);}return a;}
export function mutationMatrix(L,u){return Array.from({length:L+1},(_,i)=>{const a=binomial(i,1-u),b=binomial(L-i,u),row=Array(L+1).fill(0);a.forEach((x,j)=>b.forEach((y,k)=>row[j+k]+=x*y));return row;});}
export function quasi(L,u,sigma,T,back=true){const M=back?mutationMatrix(L,u):null,Q=Math.exp(L*Math.log1p(-u));let x=Array(L+1).fill(0);x[0]=1;const trace=[[0,1,sigma]];for(let t=1;t<=T;t++){const w=1+(sigma-1)*x[0];if(back){const z=Array(L+1).fill(0);x.forEach((a,i)=>M[i].forEach((p,j)=>z[j]+=a*(i===0?sigma:1)*p/w));x=z;}else{const master=sigma*Q*x[0]/w;x=[master,1-master,...Array(L-1).fill(0)];}trace.push([t,x[0],1+(sigma-1)*x[0]]);}return{x,trace,Q,approx:Math.max(0,(sigma*Q-1)/(sigma-1))};}
export function driveStep(egg,sperm,k,s,h=0,female=false){const DD=egg*sperm,Dd=egg*(1-sperm)+(1-egg)*sperm,dd=(1-egg)*(1-sperm),w=DD*(1-s)+Dd*(1-h)+dd;return{egg:(DD*(1-s)+k*Dd*(1-h))/w,sperm:(DD*(1-s)+(female?.5:k)*Dd*(1-h))/w,w,genotypes:[DD,Dd,dd]};}
export function driveTrace(p,k,s,h,T,female=false){let egg=p,sperm=p;const rows=[];for(let t=0;t<=T;t++){const r=driveStep(egg,sperm,k,s,h,female);rows.push([t,egg,sperm,r.w,...r.genotypes]);egg=r.egg;sperm=r.sperm;}return rows;}
export const fmt=(x,d=4)=>!Number.isFinite(x)?'undefined':x!==0&&(Math.abs(x)<1e-4||Math.abs(x)>1e5)?x.toExponential(2):x.toFixed(d);
export const memo=f=>{let key,result;return(...a)=>{const k=JSON.stringify(a);if(k!==key){result=f(...a);key=k;}return result;};};
export const samples=(a,b,f,n=151)=>Array.from({length:n},(_,i)=>{const x=a+(b-a)*i/(n-1);return[x,f(x)];});
export const chart=(v,title,xlabel,ylabel,extra={})=>v.stage({x:extra.xlog?[1e-6,1]:[-.1,1.1],y:[-.15,1.15],axes:'box',gutter:true,height:330,title,xlabel,ylabel,...extra});
export function fit(s,arrays){const p=arrays.flat(),xs=p.map(a=>a[0]),ys=p.map(a=>a[1]),a=Math.min(...xs),b=Math.max(...xs),c=Math.min(...ys),d=Math.max(...ys),dx=Math.max(.1,b-a),dy=Math.max(.001,d-c);s.setView([a-.09*dx,b+.09*dx],[c-.22*dy,d+.22*dy]);const compact=x=>x===0?'0':x.toExponential(0).replace('e-','e−').replace('+','');s.setTicks(undefined,dy<.01?(d-c<.15*dy?[[d,compact(d)]]:[c,(c+d)/2,d].map(x=>[x,compact(x)])):null);}
export const line=(s,a,color='accent',extra={})=>s.path(a,{color,width:2,...extra});
export const slider=(v,label,min,max,value,extra={})=>v.slider(label,min,max,value,{step:'any',fmt:x=>fmt(x),...extra});
