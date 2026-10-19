/** Characteristic shift with midpoint survival and a trapezoidal, implicit newborn boundary. */
export function advanceAgeDensity(current, survival, fertility, h) {
 const n=current.length-1,next=new Array(n+1).fill(0);
 for(let i=0;i<n;i++)next[i+1]=current[i]*survival[i];
 let births=0;for(let i=1;i<=n;i++)births+=h*(i===n?.5:1)*fertility[i]*next[i];
 next[0]=births/(1-.5*h*fertility[0]);return next;
}
export const ageMass = (density,h) => h*density.reduce((s,x,i)=>s+(i===0||i===density.length-1?.5:1)*x,0);
export function teachingAgeGrid(initial,level,h=.1,NA=120,NT=300) {
 const mortality=a=>.05+.0005*a*a*a,fertility=Array.from({length:NA+1},(_,i)=>level*Math.exp(-((i*h-5)**2)/(2*1.2**2)));
 const survival=Array.from({length:NA},(_,i)=>Math.exp(-h*mortality((i+.5)*h))),ell=[1];for(const p of survival)ell.push(ell.at(-1)*p);
 const characteristic=r=>h*ell.reduce((s,x,i)=>s+(i===0||i===NA?.5:1)*fertility[i]*x*Math.exp(-r*i*h),0)-1;
 let lo=-1,hi=1;for(let i=0;i<80;i++){const m=(lo+hi)/2;if(characteristic(m)>0)lo=m;else hi=m;}const r=(lo+hi)/2;
 let n=Array.from({length:NA+1},(_,i)=>initial==='young'?Math.exp(-((i*h-2)**2)/1.2):initial==='old'?Math.exp(-((i*h-8)**2)/1.2):1),mass=ageMass(n,h);n=n.map(x=>x/mass);const snaps=[n];for(let i=0;i<NT;i++){n=advanceAgeDensity(n,survival,fertility,h);snaps.push(n);}
 let stable=ell.map((x,i)=>x*Math.exp(-r*i*h)),sm=ageMass(stable,h);stable=stable.map(x=>x/sm);
 let mxs=0;for(let k=0;k<=NT;k+=5)for(let i=0;i<=NA;i+=3)mxs=Math.max(mxs,snaps[k][i]*Math.exp(-r*k*h));
 return {snaps,r,stable,Bs:snaps.map(s=>s[0]),mxs,ell,survival,fertility};
}
