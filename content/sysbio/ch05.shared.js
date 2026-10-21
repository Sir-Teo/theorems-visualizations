// Chapter-local oscillator calculations. Model/source conventions are documented in ch05.js.
export const hill=(x,K,n)=>{if(x<=0)return 0;const z=n*Math.log(x/K);return z>0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));};
export function bisect(f,lo,hi,steps=64){for(let k=0;k<steps;k++){const x=(lo+hi)/2;if(f(x)>0)hi=x;else lo=x;}return(lo+hi)/2;}
export function rk4(f,y,t,h){const a=f(y,t),b=f(y.map((x,i)=>x+h*a[i]/2),t+h/2),c=f(y.map((x,i)=>x+h*b[i]/2),t+h/2),d=f(y.map((x,i)=>x+h*c[i]),t+h);return y.map((x,i)=>x+h*(a[i]+2*b[i]+2*c[i]+d[i])/6);}
export function integrate(f,y,end,dt=.02,stride=5){const steps=Math.ceil(end/dt),h=end/steps,out=[];for(let k=0;k<=steps;k++){if(k%stride===0||k===steps)out.push([k*h,...y]);if(k<steps)y=rk4(f,y,k*h,h);}return out;}
export function rhythm(rows,col=1){const tail=rows.slice(Math.floor(rows.length/2)),vals=tail.map(r=>r[col]),amplitude=Math.max(...vals)-Math.min(...vals),peaks=[];for(let i=1;i<tail.length-1;i++)if(tail[i][col]>tail[i-1][col]&&tail[i][col]>=tail[i+1][col])peaks.push(tail[i][0]);return{amplitude,period:peaks.length>2&&amplitude>1e-4?(peaks.at(-1)-peaks[0])/(peaks.length-1):null,peaks};}
export function repressilatorFixed(alpha=216,leak=.216,n=2){return bisect(p=>p-alpha*(1-hill(p,1,n))-leak,0,alpha+leak+1);}
export function repressilatorStability(alpha,leak,beta,n){const p=repressilatorFixed(alpha,leak,n),H=hill(p,1,n),gain=alpha*n*H*(1-H)/p,dr=(1-beta)**2+2*beta*gain,di=2*Math.sqrt(3)*beta*gain,mag=Math.hypot(dr,di),sr=Math.sqrt((mag+dr)/2),si=sr===0?0:di/(2*sr),real=(sr-1-beta)/2,imag=si/2;return{p,gain,real,imag,criticalGain:4*(1+beta)**2/(Math.sqrt((1+beta)**4+12*beta*(1+beta)**2)+(1+beta)**2)};}
export function linearClass(d,beta){const tol=64*Number.EPSILON*(1+beta+d.gain);return Math.abs(d.real)<=tol?'numerically at the boundary; linearization is inconclusive':d.real<0?'locally asymptotically stable':'linearly unstable';}
export function repressilatorRhs(y,alpha,leak,beta,n){return y.map((x,i)=>i<3?-x+alpha*(1-hill(y[3+(i+2)%3],1,n))+leak:beta*(y[i-3]-x));}
export function repressilator({alpha=216,leak=.216,beta=.2,n=2,end=220,dt=.025,symmetric=false}={}){const p=repressilatorFixed(alpha,leak,n),y=symmetric?Array(6).fill(p):[p*1.1,p*.9,p,p,p,p];return integrate(y=>repressilatorRhs(y,alpha,leak,beta,n),y,end,Math.min(dt,.1/Math.max(1,beta)),8);}
// Monk/Higham normalized Hes1 DDE: time in minutes; m,p are rescaled levels.
export function hesFixed({mu=.03,nu=.03,p0=100,n=5}={}){const p=bisect(p=>mu*nu*p-(1-hill(p,p0,n)),0,1/(mu*nu));return{p,m:nu*p};}
export function hesThreshold(params={}){const {mu=.03,nu=.03,p0=100,n=5}=params,{p,m}=hesFixed(params),H=hill(p,p0,n),gain=n*H*(1-H)/p;if(gain<=mu*nu)return{p,m,gain,omega:null,delay:null};const z=2*(gain*gain-mu*mu*nu*nu)/(mu*mu+nu*nu+Math.sqrt((mu*mu-nu*nu)**2+4*gain*gain)),omega=Math.sqrt(z),phase=Math.atan2(omega*(mu+nu),z-mu*nu);return{p,m,gain,omega,delay:phase/omega};}
export function hesTrace({delay=18.5,mu=.03,nu=.03,p0=100,n=5,end=700,dt=.05}={}){const initial=[3,100],steps=Math.ceil(end/dt),h=end/steps,states=[initial],rows=[[0,...initial]],at=t=>{if(t<=0)return initial[1];const k=t/h,i=Math.floor(k),f=k-i;return states[i][1]*(1-f)+(states[Math.min(i+1,states.length-1)][1])*f;};for(let k=0;k<steps;k++){const t=k*h,y=states[k];let next;if(delay>=h){next=rk4((z,s)=>[1-hill(at(s-delay),p0,n)-mu*z[0],z[0]-nu*z[1]],y,t,h);}else if(delay===0){next=rk4(z=>[1-hill(z[1],p0,n)-mu*z[0],z[0]-nu*z[1]],y,t,h);}else{
 // For a delay shorter than one step, use a local linear predictor for the portion inside the current step.
 const f0=[1-hill(at(t-delay),p0,n)-mu*y[0],y[0]-nu*y[1]];
 next=rk4((z,s)=>{const past=s-delay,pp=past<=t?at(past):y[1]+(past-t)*f0[1];return[1-hill(pp,p0,n)-mu*z[0],z[0]-nu*z[1]];},y,t,h);
 }states.push(next);if((k+1)%10===0||k+1===steps)rows.push([(k+1)*h,...next]);}return rows;}
// Tsai–Theriot–Ferrell2014 TextS1, constant-r version. Active/inactive Cdk in nM; Plx/APC fractions; minutes.
export function cellRates(a,r=.5,positive=1){return{on:.0354/Math.sqrt(r)*(1+5*positive*hill(a,30,11)),off:.0354*Math.sqrt(r)*(1+5*positive*(1-hill(a,35,3.5)))};}
export function cellRhs(y,{synthesis=1.5,r=.5,positive=1,lag=1}={}){const[a,i,x,z]=y,{on,off}=cellRates(a,r,positive),exchange=on*i-off*a;return[synthesis-.4*z*a+exchange,-.4*z*i-exchange,(1.5*hill(a,60,5)*(1-x)-.125*x)/lag,(1.5*hill(x,.5,4)*(1-z)-.15*z)/lag];}
export function cellTrace(params={},end=420,dt=.025){return integrate(y=>cellRhs(y,params),[60,0,0,0],end,dt,8);}
export function cellSwitch(a,r=.5,positive=1){const{on,off}=cellRates(a,r,positive);return a*(1+off/on);}
// Rust four-phosphoform model, explicitly tabulated by JRC EUR23772(2009) §2.1/Table1.
// States U,T,D,S in μM, rates h⁻¹. KaiB mediation is implicit in the A=max(0,AT−2S) closure.
export const RUST_RATES=[['UT',0,.479],['TD',0,.213],['SD',0,.506],['US',0,.0532],['TU',.21,.0798],['DT',0,.173],['DS',.31,-.319],['SU',.11,-.133]];
export function rustRates(S,AT=1.3,scale=1,sequester=true){const A=sequester?Math.max(0,AT-2*S):AT,f=A/(.43+A);return{A,rates:Object.fromEntries(RUST_RATES.map(([k,b,a])=>[k,scale*(b+a*f)]))};}
export function rustRhs(y,{AT=1.3,scale=1,sequester=true}={}){const{rates}=rustRates(y[3],AT,scale,sequester),d=[0,0,0,0],idx={U:0,T:1,D:2,S:3};for(const[k,r]of Object.entries(rates)){const i=idx[k[0]],j=idx[k[1]],flow=r*y[i];d[i]-=flow;d[j]+=flow;}return d;}
export function rustTrace(params={},end=160,dt=.025){return integrate(y=>rustRhs(y,params),[3.4,0,0,0],end,Math.min(dt,.025/(params.scale??1)),4);}
