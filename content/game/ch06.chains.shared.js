// Finite birth–death chains, independently derived from the declared update rules.
import {Q,quantity}from './ch06.selection.shared.js';
import {constant,expQ,scale,sumIntervals,probability,numerical,uniquelyRounded,differenceFrom,roundI}from './ch06.enclosure.shared.js';
const {add,sub,mul,div,neg,sign}=Q;
function bound(x,a,b,label,integer=false){if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b||integer&&!Number.isInteger(x))throw Error(label+' outside declared range');}
function matrix2(A){if(!Array.isArray(A)||A.length!==2||A.some(r=>!Array.isArray(r)||r.length!==2))throw Error('a 2×2 row payoff matrix is required');for(const x of A.flat())bound(x,-10,10,'payoff');return A.map(r=>r.map(Q.exact));}
const maximum=xs=>xs.reduce((a,b)=>sign(sub(a,b))>=0?a:b);
const packed=xs=>xs.map(quantity);
function logistic(logOdds,bits){const shift=sign(logOdds)>0?logOdds:Q.ZERO,yes=expQ(sub(logOdds,shift),bits),no=expQ(neg(shift),bits);return probability(yes,no);}
function weights(logs,coefficients,bits){const shift=maximum(logs);return logs.map((x,j)=>roundI(scale(expQ(sub(x,shift),bits),coefficients?.[j]??1),bits+32));}
function rounded(xs){return xs.every(uniquelyRounded);}
const PRECISIONS=[160,320,640,1280,2560,4096];

export function moran({matrix=[[0,4],[2,2]],population=12,selectionStrength=.5,initialCount=1}={}){
 bound(population,2,30,'population',true);bound(selectionStrength,0,10,'selection strength');bound(initialCount,0,population,'initial first-strategy count',true);const A=matrix2(matrix),N=population,beta=Q.exact(selectionStrength),states=[],logWeights=[Q.ZERO];
 for(let i=1;i<N;i++){
  const first=div(add(mul(i-1,A[0][0]),mul(N-i,A[0][1])),N-1),second=div(add(mul(i,A[1][0]),mul(N-i-1,A[1][1])),N-1),logRatio=mul(beta,sub(second,first));
  states.push({count:i,firstPayoff:quantity(first),secondPayoff:quantity(second),logDownUpRatio:quantity(logRatio)});logWeights.push(add(logWeights.at(-1),logRatio));
 }
 const neutral=logWeights.every(x=>!sign(x));let evaluated,bitsUsed=0;
 for(const bits of PRECISIONS){
  const w=weights(logWeights,null,bits),probabilities=Array.from({length:N+1},(_,k)=>neutral?constant(div(k,N)):k===0?constant(0):k===N?constant(1):probability(sumIntervals(w.slice(0,k)),sumIntervals(w.slice(k))));
  const transitionIntervals=states.map(s=>{const i=s.count,logOdds=neg(s.logDownUpRatio.exact); // log fA/fB; count factors stay outside the exponential.
   const shift=sign(logOdds)>0?logOdds:Q.ZERO,first=scale(expQ(sub(logOdds,shift),bits),i),second=scale(expQ(neg(shift),bits),N-i);
   return{up:scale(probability(first,second),div(N-i,N)),down:scale(probability(second,first),div(i,N))};});
  const selectionDifference=neutral?constant(0):differenceFrom(probabilities[1],div(1,N));
  evaluated={probabilities,transitionIntervals,selectionDifference};bitsUsed=bits;
  if(rounded([...probabilities,...transitionIntervals.flatMap(s=>[s.up,s.down]),selectionDifference])&&(neutral||sign(selectionDifference.lo)>0||sign(selectionDifference.hi)<0))break;
 }
 const {probabilities,transitionIntervals,selectionDifference}=evaluated,delta=numerical(selectionDifference);
 if(!rounded([...probabilities,...transitionIntervals.flatMap(s=>[s.up,s.down]),selectionDifference]))throw Error('finite-chain binary64 rounding unresolved after refinement');
 return{parameters:{matrix:matrix.map(r=>[...r]),population,selectionStrength,initialCount},states:states.map((s,j)=>({...s,upProbability:numerical(transitionIntervals[j].up),downProbability:numerical(transitionIntervals[j].down)})),logWeights:packed(logWeights),fixation:probabilities.map(numerical),selectedFixation:numerical(probabilities[initialCount]),neutralSelected:quantity(div(initialCount,N)),singleMutantDifference:delta,neutral,selectionComparison:neutral?'exactly neutral':delta.sign===1?'first-strategy single mutant is favoured':delta.sign===-1?'first-strategy single mutant is disfavoured':'selection sign unresolved',precisionBits:bitsUsed,allProbabilitiesUniquelyRounded:true,scope:'Frequency-dependent Moran birth–death process without self-interaction or mutation. Fitness is exp(βπ), reproduction is proportional to fitness and the replaced individual is uniform. Counts 0 and N are absorbing. Fixation is computed from all cumulative log down/up ratios, using positive rational exponential enclosures and correlated subset normalization; paths and Monte Carlo frequencies are not used. Exact neutrality means all interior payoff gaps times β vanish. The selected count is an integer; a rare mutant comparison uses count 1.'};
}

function choose(n,k){let z=1n;for(let j=1;j<=k;j++)z=z*BigInt(n-j+1)/BigInt(j);return Q.rational(z);}
export function logitCoordination({population=12,firstLoss=3,secondLoss=2,inverseNoise=2,selectedCount=6}={}){
 bound(population,2,30,'population',true);bound(firstLoss,.25,6,'first-convention deviation loss');bound(secondLoss,.25,6,'second-convention deviation loss');bound(inverseNoise,0,20,'inverse noise');bound(selectedCount,0,population,'selected count',true);
 const N=population,A=Q.exact(firstLoss),D=Q.exact(secondLoss),beta=Q.exact(inverseNoise),potential=[Q.ZERO],increments=[];
 for(let k=0;k<N;k++){const gap=div(sub(mul(add(A,D),k),mul(D,N-1)),N-1);increments.push(gap);potential.push(add(potential.at(-1),gap));}
 const logWeights=potential.map(x=>mul(beta,x)),multiplicity=Array.from({length:N+1},(_,k)=>choose(N,k));let evaluated,bitsUsed=0;
 for(const bits of PRECISIONS){
  const w=weights(logWeights,multiplicity,bits),distribution=w.map((part,k)=>probability(part,sumIntervals(w.filter((_,j)=>j!==k))));
  const transitions=Array.from({length:N+1},(_,k)=>({up:k===N?constant(0):scale(logistic(mul(beta,increments[k]),bits),div(N-k,N)),down:k===0?constant(0):scale(logistic(neg(mul(beta,increments[k-1])),bits),div(k,N))}));
  evaluated={distribution,transitions};bitsUsed=bits;if(rounded([...distribution,...transitions.flatMap(s=>[s.up,s.down])]))break;
 }
 const {distribution,transitions}=evaluated;if(!rounded([...distribution,...transitions.flatMap(s=>[s.up,s.down])]))throw Error('stationary-law binary64 rounding unresolved after refinement');
 const endpointDifference=sub(potential[N],potential[0]),expectedDifference=mul(div(N,2),sub(A,D));
 const links=increments.map((gap,k)=>({from:k,to:k+1,revisionPayoffDifference:quantity(gap),potentialIncrement:quantity(sub(potential[k+1],potential[k])),logExponentResidual:quantity(sub(sub(potential[k+1],potential[k]),gap)),multiplicityBalanceResidual:quantity(sub(mul(multiplicity[k+1],k+1),mul(multiplicity[k],N-k)))}));
 const rows=potential.map((x,k)=>({count:k,potential:quantity(x),multiplicity:quantity(multiplicity[k]),logExponentialWeight:quantity(logWeights[k]),probability:numerical(distribution[k]),upProbability:numerical(transitions[k].up),downProbability:numerical(transitions[k].down)}));
 return{parameters:{population,firstLoss,secondLoss,inverseNoise,selectedCount},rows,selected:rows[selectedCount],links,endpointPotentialDifference:quantity(endpointDifference),endpointIdentityResidual:quantity(sub(endpointDifference,expectedDifference)),riskDominant:sign(sub(A,D))>0?'first convention':sign(sub(A,D))<0?'second convention':'both conventions tie',zeroNoiseSupport:sign(sub(A,D))>0?[N]:sign(sub(A,D))<0?[0]:[0,N],allDetailedBalanceIdentitiesVerified:links.every(x=>!x.logExponentResidual.sign&&!x.multiplicityBalanceResidual.sign),precisionBits:bitsUsed,allProbabilitiesUniquelyRounded:true,scope:'Specific finite coordination protocol: identical players meet all other players equally, with no self-play; one uniformly selected player resamples its action with logit response exp(β payoff). FirstLoss=a−c>0 and secondLoss=d−b>0 are the pure-convention deviation losses. The unique finite-noise stationary count law is proportional to binom(N,k)exp(βΦ(k)); at β=0 it is binomial, not uniform in counts. Risk dominance describes the β→∞ stationary limit for this protocol, not every noise rule or a finite observation window.'};
}
