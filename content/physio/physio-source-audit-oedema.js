// Chosen constitutive laws; x is excess interstitial volume in L.
export const tissuePressure=x=>x<1.5?-3+2*x:.3*(x-1.5);
export const tissueOncotic=x=>96/(12+x);
export function oedemaModel(venousRise,plasmaOncotic,lymphFraction,leakiness){
 const Pc=17.3+.8*venousRise,sigma=1-leakiness;
 const filtration=x=>7*(Pc-tissuePressure(x)-sigma*(plasmaOncotic-tissueOncotic(x)));
 const lymph=x=>lymphFraction*(2.1+50.4*(1-Math.exp(-Math.max(tissuePressure(x)+3,0)/3)));
 const net=x=>filtration(x)-lymph(x);
 let lo=0,hi=1;if(net(0)<=1e-12)hi=0;else{while(net(hi)>0)hi*=2;for(let k=0;k<60;k++){const m=(lo+hi)/2;if(net(m)>0)lo=m;else hi=m;}}
 return {Pc,sigma,filtration,lymph,net,equilibrium:(lo+hi)/2};
}
export function oedemaTrajectory(model,dt=1,hours=24){
 const rhs=x=>model.net(x)/1000,pts=[];let x=0;const n=Math.round(hours*60/dt);
 for(let k=0;k<=n;k++){pts.push([k*dt/60,x]);if(k===n)break;const a=rhs(x),b=rhs(x+dt*a/2),c=rhs(x+dt*b/2),d=rhs(x+dt*c);x+=dt*(a+2*b+2*c+d)/6;}
 return pts;
}
