import{hhRun,hhRest,hhSim,spikeTimes}from'./ch02.shared.js';
export const HH_FIRING_GRID=[...Array.from({length:49},(_,j)=>j*.25),...Array.from({length:14},(_,j)=>14+2*j),...Array.from({length:11},(_,j)=>50+10*j)];
export const hhFiringDt=T=>T>10?.025:.04;
export function finiteHHRate(events,after=100){const kept=events.filter(t=>t>after);return{rate:kept.length>=3?1000/(kept.at(-1)-kept.at(-2)):null,count:kept.length,kept};}
/** Sequential constant-current steps with carried states; this is not a continuous slow ramp. */
export function hhFiringSweeps(T,{grid=HH_FIRING_GRID,hold=300,dt=hhFiringDt(T)}={}){const history=(Is,y)=>{const rows=Is.map(I=>{const q=hhRun(()=>I,{T,tEnd:hold,dt,y0:y});y=q.y;return{I,...finiteHHRate(q.spikes),final:q.y};});return{rows,final:y};},up=history(grid,hhRest()),down=history(grid.slice().reverse(),up.final),step=grid.map(I=>{const q=hhRun(()=>I,{T,tEnd:hold,dt,y0:hhRest()});return{I,...finiteHHRate(q.spikes),final:q.y};});return{T,hold,dt,up:up.rows,down:down.rows.reverse(),step};}
/** Actual selected current fromt0, initialized at rest or the final state of a100ms I20 warm run. */
export function hhFiringTrace(T,I,start,{duration=150,dt=hhFiringDt(T)}={}){const y0=start==='spiking'?hhRun(()=>20,{T,tEnd:100,dt}).y:hhRest(),q=hhSim(()=>I,{T,tEnd:duration,dt,every:2,y0}),events=spikeTimes(q.t,q.V,0);return{...q,events,rate:finiteHHRate(events,50),initial:y0,T,I,dt,start};}
