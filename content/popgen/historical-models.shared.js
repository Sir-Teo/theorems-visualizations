export const KIMURA_1968={genome:4e9,rate:1.2/(28e6*300),generation:4,cost:30,load:.1};
export function kimuraBudget(genome,rate,generation,cost,load){const perYear=genome*rate,perGen=perYear*generation,limit=load/cost;return{perYear,perGen,limit,ratio:perGen/limit,amax:Math.min(1,limit/perGen)};}
export function diversityModel(N,mu,cap=Infinity){const ne=1/(1/N+1/cap),theta=4*ne*mu;return{ne,theta,pi:theta/(1+4*theta/3)};}
