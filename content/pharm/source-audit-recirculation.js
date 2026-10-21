// Chosen parent-equivalent amounts, not a mycophenolate parameter fit.
export const RECIRCULATION={dose:100,volume:40,clearance:6,absorptionRate:1.2};
export function recirculation(fb,fr,gap,first,horizon=72,dt=.05){
 const{dose:D,volume:V,clearance:CL,absorptionRate:ka}=RECIRCULATION,k=CL/V;
 let G=D,A=0,GB=0,feces=0,el=0,auc=0,clock=0,nextMeal=first;
 const out={t:[],c:[],gb:[],g:[],a:[],el:[],feces:[],meals:[]};
 const save=t=>{out.t.push(t);out.c.push(A/V);out.gb.push(GB);out.g.push(G);out.a.push(A);out.el.push(el);out.feces.push(feces);};
 const advance=h=>{if(h<=0)return;const eg=Math.exp(-ka*h),ea=Math.exp(-k*h),g=G*eg,a=A*ea+ka*G*(ea-eg)/(ka-k),processed=G-g+A-a;G=g;A=a;GB+=fb*processed;el+=(1-fb)*processed;auc+=processed/CL;};
 save(0);const n=Math.ceil(horizon/dt);
 for(let i=1;i<=n;i++){const t=Math.min(horizon,i*dt);while(nextMeal<=t+1e-9){advance(nextMeal-clock);clock=nextMeal;save(clock);G+=fr*GB;feces+=(1-fr)*GB;GB=0;save(clock);out.meals.push(clock);nextMeal+=gap;}advance(t-clock);clock=t;save(t);}
 const tail=(G+A+fr*GB)/(CL*(1-fb*fr));
 return {...out,end:{G,A,GB,feces,el},auc,tail,totalAuc:auc+tail,mass:G+A+GB+feces+el};
}
export function recirculationPeaks(trace){
 const t=[],c=[];for(let i=0;i<trace.t.length;i++){if(t.at(-1)===trace.t[i])c[c.length-1]=trace.c[i];else{t.push(trace.t[i]);c.push(trace.c[i]);}}
 const peaks=[];for(let i=1;i<c.length-1;i++)if(c[i]>c[i-1]&&c[i]>=c[i+1])peaks.push({time:t[i],value:c[i]});
 return {first:peaks[0]??null,secondary:peaks.slice(1).filter(p=>p.value>.02*(peaks[0]?.value??0))};
}
