// MAT6: explicit educational models, not a thermodynamic database.
export const fmt=x=>x===null?'undetermined':!Number.isFinite(x)?String(x):x!==0&&(Math.abs(x)<1e-4||Math.abs(x)>=1e5)?x.toExponential(5):Number(x.toPrecision(6)).toString();
export const sample=(fn,a,b,n=240)=>Array.from({length:n+1},(_,j)=>fn(a+(b-a)*j/n));
const finite=(x,n)=>{if(!Number.isFinite(x))throw new RangeError(n);return x;};
const range=(x,a,b,n)=>{finite(x,n);if(x<a||x>b)throw new RangeError(n);return x;};
const integer=(x,a,b,n)=>{range(x,a,b,n);if(!Number.isInteger(x))throw new RangeError(n);return x;};
const xlog=x=>x===0?0:x*Math.log(x);
export const mix=x=>{range(x,0,1,'composition');return xlog(x)+xlog(1-x);};
export const alloy={TA:1,TB:1.45,hA:5,hB:6};
export function freeEnergy(x,T,phase='solid'){
 range(T,.5,2,'temperature');if(!['solid','liquid'].includes(phase))throw new RangeError('phase');
 return T*mix(x)+(phase==='liquid'?(1-x)*alloy.hA*(1-T/alloy.TA)+x*alloy.hB*(1-T/alloy.TB):0);
}
export function idealTie(T){
 range(T,.5,2,'temperature');if(T<=alloy.TA||T>=alloy.TB)return null;
 const a=alloy.hA*(alloy.TA-T)/(T*alloy.TA),b=alloy.hB*(alloy.TB-T)/(T*alloy.TB),KA=Math.exp(a),KB=Math.exp(b),den=KB-KA,liquidA=Math.expm1(b)/den,solidA=KA*liquidA,liquid=liquidA<.5?1-liquidA:-Math.expm1(a)/den,solid=solidA<.5?1-solidA:KB*liquid;
 const muA=T*(solid<.5?Math.log1p(-solid):Math.log(solidA)),muB=T*(solid<.5?Math.log(solid):Math.log1p(-solidA)),slope=muB-muA;
 return {T,liquid,solid,liquidA,solidA,KA,KB,muA,muB,slope,intercept:muA};
}
export function lever(a,b,z){
 range(a,0,1,'left composition');range(b,0,1,'right composition');range(z,0,1,'overall composition');if(a>b)throw new RangeError('ordered endpoints');
 if(a===b)return {a,b,z,unique:false,feasible:z===a,left:null,right:null,balance:null};
 const right=(z-a)/(b-a),left=(b-z)/(b-a);return {a,b,z,unique:true,feasible:z>=a&&z<=b,left,right,balance:left*a+right*b};
}
export function idealState(T,z){
 range(z,0,1,'overall composition');const tie=idealTie(T);let liquid=0,solid=0,xL=null,xS=null,field;
 if(T<=alloy.TA){solid=1;xS=z;field='solid';}else if(T>=alloy.TB){liquid=1;xL=z;field='liquid';}
 else if(z<tie.liquid){liquid=1;xL=z;field='liquid';}else if(z>tie.solid){solid=1;xS=z;field='solid';}
 else{const q=lever(tie.liquid,tie.solid,z);solid=q.right;liquid=q.left;xL=tie.liquid;xS=tie.solid;field='liquid + solid';}
 const energy=(liquid?liquid*freeEnergy(xL,T,'liquid'):0)+(solid?solid*freeEnergy(xS,T,'solid'):0),balance=(liquid?liquid*xL:0)+(solid?solid*xS:0);
 return {T,z,tie,liquid,solid,xL,xS,field,energy,balance};
}
export function lens(z){range(z,0,1,'overall composition');const root=which=>{let a=alloy.TA,b=alloy.TB;for(let i=0;i<60;i++){const t=(a+b)/2,q=idealTie(t);if(!q){if(t<=alloy.TA)a=t;else b=t;continue;}if(q[which]<z)a=t;else b=t;}return(a+b)/2;};return {solidus:z===0?alloy.TA:z===1?alloy.TB:root('solid'),liquidus:z===0?alloy.TA:z===1?alloy.TB:root('liquid')};}
export function scheil(C0=.08,k=.4,fraction=.8,limit=.6){
 range(C0,.001,.3,'initial solute fraction');range(k,.1,.95,'partition coefficient');range(fraction,0,1,'requested solid fraction');range(limit,.31,1,'liquid composition limit');
 const logStop=Math.log(limit/C0)/(k-1),stop=-Math.expm1(logStop),limited=fraction>=stop,fs=limited?stop:fraction,logRemaining=limited?logStop:Math.log1p(-fs),remaining=Math.exp(logRemaining),CL=limited?limit:C0*Math.exp((k-1)*logRemaining),newSolid=k*CL,soluteSolid=C0*(-Math.expm1(k*logRemaining)),average=fs>0?soluteSolid/fs:null;
 return {C0,k,requested:fraction,limit,stop,fs,remaining,CL,newSolid,soluteSolid,average,balance:soluteSolid+remaining*CL,limited,fsRounded:fs===1&&remaining>0,profile:f=>{range(f,0,fs,'deposition fraction');return f===fs?newSolid:k*C0*Math.exp((k-1)*Math.log1p(-f));}};
}
// MIT3.012 lecture19 p3 gives these near-invariant Pb–Sn mass compositions.
export const leadTin={alpha:.183,eutectic:.619,beta:.978};
export function eutectic(z=.4,transformed=1){
 const {alpha:a,eutectic:e,beta:b}=leadTin;range(z,a,b,'near-eutectic composition');range(transformed,0,1,'transformed residual liquid');
 const primary=z<e?(e-z)/(e-a):(z-e)/(b-e),remaining=1-primary,inside=lever(a,b,e),eutecticMass=remaining*transformed,liquid=remaining*(1-transformed),alpha=(z<e?primary:0)+eutecticMass*inside.left,beta=(z>e?primary:0)+eutecticMass*inside.right;
 return {z,transformed,primary,primaryPhase:z<e?'α':z>e?'β':'none',remaining,eutecticMass,liquid,alpha,beta,inside,balance:alpha*a+beta*b+liquid*e};
}
export function invariant(type='eutectic',z=.4,extent=1){
 range(z,.1,.9,'overall composition');range(extent,0,1,'reaction extent');if(!['eutectic','eutectoid','peritectic'].includes(type))throw new RangeError('reaction');
 const a=.1,b=.45,c=.9;
 if(type!=='peritectic'){
  // A parent at b makes products at a and c; an excess endpoint is inert here.
  const parent=z<=b?(z-a)/(b-a):(c-z)/(c-b),excess=1-parent,weights=lever(a,c,b),made=parent*extent,parentLeft=parent-made,left=(z<b?excess:0)+made*weights.left,right=(z>b?excess:0)+made*weights.right;
  return {type,z,extent,a,b,c,parent,parentLeft,left,right,made,excess,balance:left*a+parentLeft*b+right*c,productWeights:weights};
 }
 // Initial solid at a and liquid at c react to product at b.
 const start=lever(a,c,z),reaction=lever(a,c,b),maxProduct=Math.min(start.left/reaction.left,start.right/reaction.right),made=extent*maxProduct,left=start.left-made*reaction.left,right=start.right-made*reaction.right;
 return {type,z,extent,a,b,c,start,reaction,maxProduct,made,left,right,balance:left*a+made*b+right*c};
}
// Rounded conventional metastable Fe–Fe3C landmarks; curves below are declared straight segments.
export const iron={alpha:.022,eutectoid:.76,gammaMax:2.14,eutectic:4.3,cementite:6.67,TE:727,TL:1147,TP:1493,steel:2.1};
const lerp=(x,a,b,u,v)=>u+(v-u)*(x-a)/(b-a);
export function ironBoundaries(T){
 range(T,600,1600,'temperature °C');const q={T};
 if(T<727){q.alpha=.022;q.gammaLeft=null;q.gammaRight=null;q.region='low';}
 else if(T<=1147){q.alpha=T<912?lerp(T,727,912,.022,0):0;q.gammaLeft=T<912?lerp(T,727,912,.76,0):0;q.gammaRight=lerp(T,727,1147,.76,2.14);q.region='solid';}
 else if(T<1493){q.gammaRight=lerp(T,1147,1493,2.14,.16);q.liquidLeft=lerp(T,1147,1493,4.3,.53);q.liquidRight=T<1252?lerp(T,1147,1252,4.3,6.67):6.67;q.deltaRight=T>1394?lerp(T,1394,1493,0,.09):null;q.gammaLeft=T>1394?lerp(T,1394,1493,0,.16):0;q.region='melting';}
 else if(T<1538){q.deltaRight=lerp(T,1493,1538,.09,0);q.liquidLeft=lerp(T,1493,1538,.53,0);q.region='delta';}else q.region='liquid';
 return q;
}
export function ironState(T,z){
 range(z,0,6.67,'wt% carbon');const b=ironBoundaries(T);let phases;
 if(T===727)phases=z>=.022&&z<=6.67?'α + γ + Fe₃C invariant (amounts undetermined)':'α';
 else if(T===1147&&z>=2.14)phases='γ + L + Fe₃C invariant (amounts undetermined)';
 else if(T===1493&&z>=.09&&z<=.53)phases='δ + γ + L invariant (amounts undetermined)';
 else if(z===6.67&&T<=1252)phases='Fe₃C';
 else if(b.region==='low')phases=z<=b.alpha?'α':'α + Fe₃C';
 else if(b.region==='solid')phases=z<b.alpha?'α':z<b.gammaLeft?'α + γ':z<=b.gammaRight?'γ':'γ + Fe₃C';
 else if(b.region==='melting')phases=b.deltaRight!==null&&z<b.deltaRight?'δ':z<b.gammaLeft?'δ + γ':z<=b.gammaRight?'γ':z<b.liquidLeft?'γ + L':z>b.liquidRight?'L + Fe₃C':'L';
 else if(b.region==='delta')phases=z<=b.deltaRight?'δ':z<b.liquidLeft?'δ + L':'L';else phases='L';
 return {T,z,b,phases,classification:z<iron.steel?'steel range (approximate convention)':'cast-iron range (approximate convention)'};
}
export function pearlite(z=.4,transformed=1){
 const {alpha:a,eutectoid:e,cementite:c}=iron;range(z,a,2.1,'steel wt% carbon');range(transformed,0,1,'austenite transformation');
 const pro=z<e?(e-z)/(e-a):(z-e)/(c-e),parent=1-pro,inside=lever(a/c,1,e/c),pearlite=parent*transformed,austenite=parent*(1-transformed),ferrite=(z<e?pro:0)+pearlite*inside.left,cementite=(z>e?pro:0)+pearlite*inside.right;
 return {z,transformed,pro,proPhase:z<e?'ferrite':z>e?'cementite':'none',parent,pearlite,austenite,inside,ferrite,cementite,balance:ferrite*a+cementite*c+austenite*e};
}
export const seedGenerator=seed=>{integer(seed,1,2147483646,'seed');let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};};
export function laplacian(c,N){const out=new Float64Array(c.length);for(let y=0;y<N;y++)for(let x=0;x<N;x++){const j=y*N+x;out[j]=c[y*N+(x+1)%N]+c[y*N+(x+N-1)%N]+c[((y+1)%N)*N+x]+c[((y+N-1)%N)*N+x]-4*c[j];}return out;}
export const well=c=>c*c*(1-c)*(1-c),wellPrime=c=>2*c*(1-c)*(1-2*c),wellSecond=c=>2-12*c+12*c*c;
export function phaseEnergy(c,N,kappa){let E=0;for(let y=0;y<N;y++)for(let x=0;x<N;x++){const j=y*N+x;E+=well(c[j])+kappa/2*((c[j]-c[y*N+(x+1)%N])**2+(c[j]-c[((y+1)%N)*N+x])**2);}return E;}
export function phaseRHS(c,N,kappa){const lap=laplacian(c,N),mu=Float64Array.from(c,(v,j)=>wellPrime(v)-kappa*lap[j]);return {mu,rhs:laplacian(mu,N)};}
export function phaseModes(mean,kappa,N=24){range(mean,.2,.8,'mean composition');range(kappa,.4,2,'gradient coefficient');integer(N,4,64,'grid size');const rows=[];for(let p=0;p<N;p++)for(let q=0;q<N;q++){const eigenvalue=4*Math.sin(Math.PI*p/N)**2+4*Math.sin(Math.PI*q/N)**2;rows.push({p,q,eigenvalue,growth:-eigenvalue*(wellSecond(mean)+kappa*eigenvalue)});}return rows;}
const phaseCache=new Map();
export function phaseHistory(mean=.5,kappa=1,seed=7,N=24,end=40){
 range(mean,.2,.8,'mean composition');range(kappa,.4,2,'gradient coefficient');integer(N,8,32,'grid size');range(end,0,40,'end time');const key=[mean,kappa,seed,N,end].join(':');if(phaseCache.has(key))return phaseCache.get(key);
 const random=seedGenerator(seed),noise=Array.from({length:N*N},()=>random()-.5),avg=noise.reduce((a,b)=>a+b,0)/noise.length;let c=Float64Array.from(noise,x=>mean+.04*(x-avg)),E=phaseEnergy(c,N,kappa),t=0,steps=0,rejected=0,smallest=Infinity,clockDefect=0,stopped=null;
 const timeSteps=[],frames=[],record=()=>frames.push({time:t,stepCount:steps,c:Array.from(c),energy:E,mass:c.reduce((a,b)=>a+b,0)/c.length,min:Math.min(...c),max:Math.max(...c)});record();
 for(let frame=1;frame<=20;frame++){const target=end*frame/20;while(t<target&&!stopped){const residue=target-t;if(residue<=128*Number.EPSILON*Math.max(1,target)){clockDefect+=residue;t=target;break;}let dt=Math.min(.04,target-t);const {rhs}=phaseRHS(c,N,kappa);let next,En;
  for(let attempt=0;attempt<30;attempt++){const predictor=Float64Array.from(c,(x,j)=>x+dt*rhs[j]),r2=phaseRHS(predictor,N,kappa).rhs;next=Float64Array.from(c,(x,j)=>x+dt*(rhs[j]+r2[j])/2);En=phaseEnergy(next,N,kappa);if(next.every(x=>x>=0&&x<=1)&&En<=E)break;dt/=2;rejected++;next=null;}
  if(!next||t+dt===t){stopped='finite-precision energy/composition step check unresolved';break;}c=next;E=En;t+=dt;smallest=Math.min(smallest,dt);timeSteps.push(dt);steps++;if(steps>20000)stopped='integration step budget reached';
 }record();}
 const q={mean,kappa,seed,N,end,frames,timeSteps,steps,rejected,smallest,clockDefect,stopped,achieved:t,modes:phaseModes(mean,kappa,N)};if(phaseCache.size>=12)phaseCache.delete(phaseCache.keys().next().value);phaseCache.set(key,q);return q;
}
export function braggWilliams(T){
 range(T,.5,6,'reduced temperature');const Tc=4;if(T>=Tc)return {T,Tc,order:0,residual:0};let a=0,b=1;
 // atanh(m)/m has a removable singularity; this equation excludes the zero root.
 const excess=m=>{if(m>=.1)return Math.atanh(m)/m-1;const t=m*m;let power=t,sum=0;for(let j=1;j<=12;j++){sum+=power/(2*j+1);power*=t;}return sum;},target=(Tc-T)/T;
 for(let i=0;i<64;i++){const m=(a+b)/2;if(excess(m)<target)a=m;else b=m;}const order=(a+b)/2;return {T,Tc,order,residual:order-Math.tanh(Tc*order/T)};
}
export const orderFreeEnergy=(m,T)=>{range(m,-1,1,'staggered order');range(T,.5,6,'temperature');return -2*m*m+T*mix((1+m)/2);};
export function neighbours(j,N){const x=j%N,y=Math.floor(j/N);return [y*N+(x+1)%N,y*N+(x+N-1)%N,((y+1)%N)*N+x,((y+N-1)%N)*N+x];}
export function latticeEnergy(s,N){let E=0;for(let j=0;j<s.length;j++){const x=j%N,y=Math.floor(j/N);E+=s[j]*(s[y*N+(x+1)%N]+s[((y+1)%N)*N+x]);}return E;}
export function exchangeEnergy(s,N,a,b){if(a===b||s[a]===s[b])return 0;const A=neighbours(a,N),B=neighbours(b,N);return -2*s[a]*A.reduce((sum,j)=>sum+s[j],0)-2*s[b]*B.reduce((sum,j)=>sum+s[j],0)+(A.includes(b)?4*s[a]*s[b]:0);}
const orderCache=new Map();
export function ordering(T=2.5,sweeps=150,seed=7,start='ordered',N=16){
 range(T,.5,6,'temperature');integer(sweeps,0,400,'sweeps');integer(N,4,24,'lattice side');if(N%2)throw new RangeError('even lattice');if(!['ordered','shuffled'].includes(start))throw new RangeError('initial state');const key=[T,sweeps,seed,start,N].join(':');if(orderCache.has(key))return orderCache.get(key);const random=seedGenerator(seed),size=N*N,s=Int8Array.from({length:size},(_,j)=>(j%N+Math.floor(j/N))%2?1:-1);
 if(start==='shuffled')for(let j=size-1;j>0;j--){const k=Math.floor(random()*(j+1)),v=s[j];s[j]=s[k];s[k]=v;}
 let energy=latticeEnergy(s,N),accepted=0,attempted=0;const trace=[],record=step=>{let m=0;for(let j=0;j<size;j++)m+=s[j]*((j%N+Math.floor(j/N))%2?1:-1);trace.push({sweep:step,order:m/size,energy:energy/size});};record(0);
 for(let sweep=1;sweep<=sweeps;sweep++){for(let j=0;j<size;j++){const a=Math.floor(random()*size);let b=Math.floor(random()*(size-1));if(b>=a)b++;attempted++;if(s[a]===s[b])continue;const dE=exchangeEnergy(s,N,a,b);if(dE<=0||random()<Math.exp(-dE/T)){s[a]*=-1;s[b]*=-1;energy+=dE;accepted++;}}record(sweep);}
 const tail=trace.slice(Math.max(1,Math.floor(trace.length*.75))),meanAbs=tail.length?tail.reduce((sum,r)=>sum+Math.abs(r.order),0)/tail.length:null,meanSigned=tail.length?tail.reduce((sum,r)=>sum+r.order,0)/tail.length:null;
 const out={T,sweeps,seed,start,N,s:Array.from(s),trace,energy,accepted,attempted,meanAbs,meanSigned,composition:s.reduce((a,b)=>a+b,0),mf:braggWilliams(T)};if(orderCache.size>=20)orderCache.delete(orderCache.keys().next().value);orderCache.set(key,out);return out;
}
