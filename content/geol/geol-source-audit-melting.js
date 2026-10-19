// The polynomial version explicitly printed in Hirschmann2000's abstract;
// publisher HTML Table2 / paragraph39 disagree. We do not identify it as a reconciled recommended fit.
export const MELT={a:5.104,b:132.899,c:1120.661,G:15,latent:500,interval:700,rho:3300,rhoC:2900,g:9.8};
export const solidus=P=>MELT.c+MELT.b*P-MELT.a*P*P;
export function decompression(tp,lidKm){
 const{a,b,c,G,latent,interval,rho,rhoC,g}=MELT,delta=tp-c,disc=(b-G)**2-4*a*delta;
 const P0=delta>0&&disc>=0?2*delta/(b-G+Math.sqrt(disc)):0,kmPerGPa=1e6/(rho*g),Pl=lidKm/kmPerGPa;
 const F=P=>P0>Pl&&P<P0?Math.max(0,((b-G)*(P0-Math.max(P,Pl))-a*(P0*P0-Math.max(P,Pl)**2))/(latent+interval)):0;
 const end=P0>Pl?F(Pl):0,q=Math.max(P0-Pl,0),integral=((b-G-2*a*P0)*q*q/2+a*q*q*q/3)/(latent+interval),column=integral*1e6/(rhoC*g);
 return{P0,Pl,F,Fmax:end,kmPerGPa,depth:P0*kmPerGPa,column,integral,nomelt:P0<=Pl,path:P=>tp+G*P-latent*F(P)};
}
