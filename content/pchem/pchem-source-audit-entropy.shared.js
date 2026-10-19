// Finite illustrative models; source anchors and assumptions in the entropy audit.
export const BLOCK_C=100, PACKET_Q=50, PACKETS=70;
export function minimumPacketWork(TA,TB,q=PACKET_Q,C=BLOCK_C){
  if(!(TA>0&&TB>q/C))throw new RangeError('positive final temperatures required');
  return q*(TA/(TB-q/C)-1);
}
export function packetLedger(mode,TA0,TB0,w,steps=PACKETS){
  let TA=TA0,TB=TB0,S=0,admissible=true;
  const out={TA:[TA],TB:[TB],S:[0],dS:[0],q:[0],ok:[true],admissible:[true]};
  for(let i=0;i<steps;i++){
    const q=mode==='down'?Math.max(0,Math.min(PACKET_Q,BLOCK_C*(TA-TB)/2)):PACKET_Q;
    const da=mode==='down'?-q/BLOCK_C:(q+(mode==='work'?w:0))/BLOCK_C,db=mode==='down'?q/BLOCK_C:-q/BLOCK_C;
    if(!(TA+da>0&&TB+db>0))throw new RangeError('positive final temperatures required');
    const d=BLOCK_C*(Math.log1p(da/TA)+Math.log1p(db/TB));
    TA+=da;TB+=db;S+=d;admissible&&=d>=-1e-12;
    out.TA.push(TA);out.TB.push(TB);out.S.push(S);out.dS.push(d);out.q.push(q);out.ok.push(q>0);out.admissible.push(admissible);
  }return out;
}
export function clausiusCycle(R,drop,fraction,ratio){
  const Th=600,Tc=300,t1=Th-drop,t2=Tc+drop,dS=R*Math.log(ratio),qh=t1*dS,qc0=t2*dS,w=qh-qc0,qc=qc0+fraction*w,a=qh/Th,b=-qc/Tc;
  return{t1,t2,dS,qh,qc0,qc,w,delivered:(1-fraction)*w,a,b,tot:a+b,eff:(1-fraction)*w/qh,carnot:1-Tc/Th,gas:qh/t1-qc0/t2};
}
export const binaryEntropy=x=>x<=0||x>=1?0:-x*Math.log(x)-(1-x)*Math.log1p(-x);
export function lnChoose(N,n){if(n<0||n>N||!Number.isInteger(N)||!Number.isInteger(n))throw new RangeError('integer binomial arguments required');n=Math.min(n,N-n);let s=0;for(let k=1;k<=n;k++)s+=Math.log((N-n+k)/k);return s;}
export function frozenOrientation(R,bias,T){const p=1/(1+Math.exp(bias/(R*T)));return{p,S:R*binaryEntropy(p)};}
