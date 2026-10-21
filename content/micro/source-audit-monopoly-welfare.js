// Explicit constant-cost examples; no root bracket or truncated surplus integral.
export function monopolyWelfareState(kind,c,e=2){
  const linear=kind==='lin',r=1-1/e;
  const demand=q=>linear?12-q:8*q**(-1/e);
  const marginalRevenue=q=>linear?12-2*q:r*demand(q);
  const benefit=q=>linear?12*q-q*q/2:8*q**r/r;
  const welfare=q=>benefit(q)-c*q;
  const qm=linear?(12-c)/2:(8*r/c)**e,qc=linear?12-c:(8/c)**e;
  const pm=demand(qm),profit=(pm-c)*qm,wm=welfare(qm),wc=welfare(qc);
  return{kind,c,e,linear,r,qm,qc,pm,profit,wm,wc,dwl:wc-wm,cs:wm-profit,competitiveCS:wc,transfer:profit,demand,marginalRevenue,benefit,welfare};
}

// One indivisible unit per buyer, descending midpoint values. Indifferent buyers buy.
export function finiteDiscriminationState(n,c,price,perfect=false){
  // Divide once: grid-representable ties (e.g. n=20, value=cost=3.25)
  // should not be moved below cost by subtractive roundoff.
  const values=Array.from({length:n},(_,i)=>(10*n-10*i-5)/n);
  let bestPrice=10,bestProfit=0,bestSold=0;
  for(let k=1;k<=n;k++){
    const p=values[k-1],profit=k*(p-c);
    if(profit>bestProfit+1e-12){bestPrice=p;bestProfit=profit;bestSold=k;}
  }
  const buyers=values.map(value=>({value,serve:perfect?value>=c:value>=price,pay:perfect?value:price}));
  let profit=0,cs=0,total=0,efficient=0,missed=0,waste=0,sold=0,efficientSold=0;
  for(const b of buyers){
    efficient+=Math.max(0,b.value-c);if(b.value>=c)efficientSold++;
    if(b.serve){sold++;profit+=b.pay-c;cs+=b.value-b.pay;total+=b.value-c;waste+=Math.max(0,c-b.value);}
    else missed+=Math.max(0,b.value-c);
  }
  return{n,c,price,perfect,values,buyers,profit,cs,total,efficient,missed,waste,dwl:missed+waste,sold,efficientSold,bestPrice,bestProfit,bestSold};
}
