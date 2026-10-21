// Explicit two-type quadratic-benefit screening model; quantities are nonnegative.
export const screeningBenefit=(theta,q)=>theta*q-q*q/2;

export function screeningOptimum(phi,theta){
  const high=10,c=2,delta=high-theta,qHigh=high-c;
  // The cutoff button phi=(theta-c)/(high-c) yields an exact zero numerator.
  const raw=(theta-c-(high-c)*phi)/(1-phi),qLow=Math.max(0,raw);
  const tLow=screeningBenefit(theta,qLow),rentHigh=delta*qLow;
  const tHigh=screeningBenefit(high,qHigh)-rentHigh;
  const profit=(1-phi)*(tLow-c*qLow)+phi*(tHigh-c*qHigh);
  const efficientLow=theta-c,efficientWelfare=(1-phi)*efficientLow**2/2+phi*(high-c)**2/2;
  const welfare=(1-phi)*(screeningBenefit(theta,qLow)-c*qLow)+phi*(screeningBenefit(high,qHigh)-c*qHigh);
  return{phi,theta,high,c,delta,raw,qLow,tLow,qHigh,tHigh,rentHigh,profit,efficientLow,efficientWelfare,welfare,loss:efficientWelfare-welfare,cutoff:(theta-c)/(high-c),excluded:qLow===0};
}

export function screeningMenuState(phi,theta,qLow,tLow,qHigh,tHigh){
  const optimum=screeningOptimum(phi,theta),benefitLow=screeningBenefit(theta,qLow),benefitHigh=screeningBenefit(10,qHigh);
  const uLow=benefitLow-tLow,uHigh=benefitHigh-tHigh;
  // Remove cancellation noise at binding constraints; genuine violations remain.
  const slacks=[uLow,uHigh,uLow-(screeningBenefit(theta,qHigh)-tHigh),uHigh-(screeningBenefit(10,qLow)-tLow)].map(x=>Math.abs(x)<1e-12?0:x);
  const feasible=qLow>=0&&qHigh>=0&&slacks.every(s=>s>=-1e-9);
  const assignedProfit=(1-phi)*(tLow-2*qLow)+phi*(tHigh-2*qHigh);
  return{phi,theta,qLow,tLow,qHigh,tHigh,slacks,uLow,uHigh,benefitLow,benefitHigh,feasible,assignedProfit,optimum};
}
