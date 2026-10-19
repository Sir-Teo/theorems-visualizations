// Periodically toggled ideal RC-switch circuits. Input flips every 1/f seconds;
// one complete low/high cycle takes 2/f, hence f/2 rising output transitions per second.
export function clockPower(V,C,leak,R,f,Ron=1000){
 const h=1/f,tau=Ron*C,rc=Math.exp(-h/tau),cLow=V*rc/(1+rc),cHigh=V/(1+rc),cSwing=cHigh-cLow;
 const Rp=1/(1/R+1/Ron),vLow=V*Ron/(R+Ron),ah=-Math.expm1(-h/(R*C)),al=-Math.expm1(-h/(Rp*C)),den=ah+al-ah*al;
 const rLow=(vLow*al+V*(1-al)*ah)/den,rHigh=rLow+(V-rLow)*ah,rSwing=rHigh-rLow;
 const pc=V*leak+f/2*V*C*cSwing,pr=V*V/(2*(R+Ron))+f/2*V*C*rSwing*R/(R+Ron);
 const current=(phase,which)=>{const k=Math.floor(phase),u=phase-k,t=u*h;if(which==='cmos')return(k%2===0?(V-cLow)/Ron*Math.exp(-t/tau):0)+leak;return k%2===0?(V-rLow)/R*Math.exp(-t/(R*C)):(V-vLow-(rHigh-vLow)*Math.exp(-t/(Rp*C)))/R;};
 return{pc,pr,cLow,cHigh,cSwing,rLow,rHigh,rSwing,current,f95:1/(2*tau*Math.atanh(.95)),staticC:V*leak,slowDynamicC:f/2*C*V*V};
}
export function clockCurrentPaths(V,C,leak,R,f){const q=clockPower(V,C,leak,R,f),Ron=1000,Rp=1/(1/R+1/Ron),cm=[],rs=[],taus=[Ron*C,R*C,Rp*C];for(let k=0;k<4;k++){const set=new Set([0,1]);for(let j=1;j<80;j++)set.add(j/80);for(const tau of taus)for(let j=0;j<=100;j++)set.add(Math.min(1,20*tau*f*j/100));for(const u of[...set].sort((a,b)=>a-b)){const phase=k+u;for(const[which,list]of[['cmos',cm],['resistor',rs]]){const edge=u===1?phase-1e-12:phase;list.push([phase,q.current(edge,which)/(V/Ron)]);}}}return{...q,cm,rs};}
