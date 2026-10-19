export function cantorDistribution(x) {
  if(x<=0)return 0;if(x>=1)return 1;
  let sum=0,weight=.5;
  for(let k=0;k<45;k++,weight/=2){x*=3;if(x>=2){sum+=weight;x-=2;}else if(x>=1)return sum+weight;}
  return sum;
}
export const singularDerivative = {
  num:'7.13',kind:'Theorem',name:'A singular measure has zero derivative Lebesgue almost everywhere',
  refs:['Rudin, Real and Complex Analysis, 3rd ed., Theorem 7.13 and proof, p. 142'],
  statement:String.raw`Let $\mu$ be a complex Borel measure on $\mathbb R^k$ with $\mu\perp m$. If $E_i(x)$ shrinks to $x$ nicely, then $\mu(E_i(x))/m(E_i(x))\to0$ for Lebesgue almost every $x$. In particular $D\mu=0$ $m$-a.e.`,
  idea:String.raw`By Jordan decomposition, reduce to a positive singular measure. Given $\varepsilon>0$, regularity provides a compact null set $K$ carrying all but $\varepsilon$ of its mass. Outside $K$, sufficiently small balls see only the remaining measure $\mu_2$, whose norm is below $\varepsilon$. The maximal theorem bounds $m\{\overline D\mu>\lambda\}\le 3^k\varepsilon/\lambda$. Let $\varepsilon\to0$, then take countably many $\lambda>0$. Nice shrinking sets are controlled by their containing balls and the fixed volume-ratio bound.`,
  caption:String.raw`The Cantor measure has mass one on a set of length zero. At construction level $n$, the shaded intervals still carry all its mass but have total length $(2/3)^n$. Drag $x$ and shrink $r$ to inspect $\mu((x-r,x+r))/(2r)$. Outside the Cantor set the quotient is eventually zero. At Cantor points it can be large, which does not contradict the theorem: the exceptional set is null for Lebesgue measure, although it carries all of $\mu$. The level-$n$ intervals illustrate the support; quotient values use the Cantor distribution to 45 ternary digits.`,
  deps:['rca-7.4','rca-7.9','rca-6.6','rca-2.18'],tags:['singular measures','differentiation'],
  viz(v){
    const n=v.slider('support construction level $n$',1,8,4,{int:true});
    const r=v.slider('radius $r$',.00001,.25,.02,{log:true});
    const L=v.stage({x:[-.04,1.04],y:[-.2,1.15],height:300,title:'Cantor distribution and remaining support intervals'});
    const R=v.stage({x:[-5,-.6],y:[-4,5],height:300,title:'log quotient against log radius (base 10)'});
    const x=L.handle(.4,-.1,{color:'gold',label:'x',constrain:x=>[Math.max(0,Math.min(1,x)),-.1]});let state;
    v.render(()=>{
      let intervals=[[0,1]];
      for(let k=0;k<n.value;k++)intervals=intervals.flatMap(([a,b])=>[[a,a+(b-a)/3],[b-(b-a)/3,b]]);
      for(const [a,b]of intervals)L.rect(a,-.05,b,.015,{fill:'purple',fillAlpha:.7,stroke:false});
      L.fn(cantorDistribution,{color:'ink',n:1600});L.vband(x.x-r.value,x.x+r.value,{color:'gold',alpha:.15});
      const quotient=radius=>(cantorDistribution(x.x+radius)-cantorDistribution(x.x-radius))/(2*radius);
      const points=Array.from({length:250},(_,j)=>{const exponent=-5+4.4*j/249,value=quotient(10**exponent);return value>0?[exponent,Math.log10(value)]:null;});
      R.path(points,{color:'accent',width:2});const q=quotient(r.value);if(q>0)R.dot(Math.log10(r.value),Math.log10(q),{color:'gold',r:5});
      state={q,n:n.value,length:(2/3)**n.value,x:x.x,r:r.value};
    });
    v.legend([['purple','finite support cover',{area:true}],['ink','Cantor distribution'],['gold','selected interval',{area:true}],['accent','positive quotients (zeros omitted from log plot)']]);
    v.readout(()=>state?`Support cover length ${v.fix(state.length,5)}, measure mass 1. At x=${v.fix(state.x,5)}, r=${v.fmt(state.r,3)}, quotient=${v.fix(state.q,5)}. The theorem is almost everywhere for Lebesgue measure.`:'');
  },
};
