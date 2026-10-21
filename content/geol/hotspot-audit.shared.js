import{D,R_EARTH,dest,rotMat,rotApply,angDist,clamp}from'./ch03.shared.js';
// Rounded source ages are not invented volcano-centre coordinates: these are specific ODP drilling holes.
export const HOTSPOT_SITES=[
 {name:'Koko (1206A)',point:[172+8.7536/60,34+55.5485/60],age:49.15,ageError:.21},
 {name:'Nintoku (1205A)',point:[170+22.6992/60,41+19.9986/60],age:55.59,ageError:.25},
 {name:'Detroit (1203A)',point:[167+44.3969/60,50+56.9976/60],age:75.82,ageError:.62}
];
export const HOTSPOT_ANCHOR=[-155.3,19.4]; // chosen present source coordinate, not an ODP measurement
export const HOTSPOT_BOUNDS=[[270,330],[30,140],[320,390],[30,140],[20,160]];
export const HOTSPOT_DEFAULT={a1:300,w1:80,a2:350,w2:70,d:65,tb:47,dr:0};
export function hotspotPosition(P,t){const mk=(a,w)=>{const pole=dest(HOTSPOT_ANCHOR,a-90,P.d),omega=w/(R_EARTH*Math.sin(P.d*D))/D;return{pole,omega};},a=mk(P.a1,P.w1),b=mk(P.a2,P.w2),pastNorth=P.dr*clamp((t-P.tb)/(85-P.tb),0,1),H=t>P.tb?dest(HOTSPOT_ANCHOR,0,pastNorth):HOTSPOT_ANCHOR;
 return t<=P.tb?rotApply(rotMat(a.pole,a.omega*t),H):rotApply(rotMat(a.pole,a.omega*P.tb),rotApply(rotMat(b.pole,b.omega*(t-P.tb)),H));}
export function hotspotDiagnostics(P){const residuals=HOTSPOT_SITES.map(s=>angDist(hotspotPosition(P,s.age),s.point)*D*R_EARTH);return{residuals,rms:Math.sqrt(residuals.reduce((a,b)=>a+b*b,0)/residuals.length)};}
const names=['a1','w1','a2','w2','d'];
// Bounded deterministic coordinate pattern search; accepts improvements only, no global/unique-fit claim.
export function improveHotspot(P){let x=names.map(n=>P[n]),q={...P},cost=hotspotDiagnostics(q).rms,evaluations=1,step=[8,15,8,15,12];for(let level=0;level<12;level++){for(let sweep=0;sweep<12;sweep++){let changed=false;for(let i=0;i<5;i++)for(const sign of[-1,1]){const z=[...x];z[i]=clamp(z[i]+sign*step[i],...HOTSPOT_BOUNDS[i]);const Q={...P,...Object.fromEntries(names.map((n,j)=>[n,z[j]]))},value=hotspotDiagnostics(Q).rms;evaluations++;if(value<cost){x=z;q=Q;cost=value;changed=true;}}if(!changed)break;}step=step.map(s=>s/2);}return{P:q,rms:cost,evaluations};}
export function hotspotRadialCurve(P){return Array.from({length:171},(_,i)=>{const t=i/2;return[angDist(HOTSPOT_ANCHOR,hotspotPosition(P,t))*D*R_EARTH,t];});}
