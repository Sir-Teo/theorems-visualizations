import{reg,logic}from'./ch03.shared.js';
// Mangan & Alon2003 original Tables1–2; historical database versions1.1/1.3, not a current census.
export const FFL_HISTORICAL_COUNTS={C1:[28,26],C2:[2,5],C3:[4,0],C4:[1,0],I1:[5,21],I2:[0,3],I3:[1,1],I4:[1,0]};
export function fflSensitivityOutput(t,lg,sx,sy){const y=reg(t.s[0],sx,.5,2);return logic(lg,reg(t.s[2],sx,.5,2),reg(t.s[1],sy*y,.5,2));}
export function fflSensitivity(t,lg,N=24){let x=0,y=0;for(let i=0;i<=N;i++)for(let j=0;j<=N;j++){const a=i/N,b=j/N,f=fflSensitivityOutput(t,lg,a,b);if(i<N)x+=Math.abs(fflSensitivityOutput(t,lg,a+1/N,b)-f);if(j<N)y+=Math.abs(fflSensitivityOutput(t,lg,a,b+1/N)-f);}return[x/(N+1),y/(N+1)];}
