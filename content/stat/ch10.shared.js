// Bayesian experiments. The runtime math library is injected as M so the models
// remain independently testable without importing browser code into content.
export const SOURCES = {
  notes: 'https://www.stat.cmu.edu/~larry/=sml/Bayes.pdf',
  bayes: 'https://sites.socsci.uci.edu/~bskyrms/bio/readings/bayes_essay.pdf',
  gelfand: 'https://hedibert.org/wp-content/uploads/2013/12/1990GelfandSmith.pdf',
  exchangeable: 'https://www.stat.berkeley.edu/~ryantibs/papers/defin.pdf',
  variance: 'https://sites.stat.columbia.edu/gelman/bayescomputation/Gelman2006.pdf',
};
export function finite(x, name='value') { if (!Number.isFinite(x)) throw new RangeError(name+' must be finite'); return x; }
export function positive(x, name='value') { finite(x,name); if (!(x>0)) throw new RangeError(name+' must be positive'); return x; }
export function integer(x, lo=0, hi=100000) { if (!Number.isInteger(x)||x<lo||x>hi) throw new RangeError('integer outside domain'); return x; }
export function bounded(x, lo, hi) { finite(x); if(x<lo||x>hi) throw new RangeError('value outside domain'); return x; }
export const sum = xs => xs.reduce((a,b)=>a+b,0);
export const mean = xs => sum(xs)/xs.length;
export function summary(xs) {
  if(!xs.length) return {n:0,mean:null,variance:null,se:null};
  const m=mean(xs), variance=xs.length>1?sum(xs.map(x=>(x-m)**2))/(xs.length-1):null;
  return {n:xs.length,mean:m,variance,se:variance===null?null:Math.sqrt(variance/xs.length)};
}
export function logSum(xs) { const m=Math.max(...xs); return m===-Infinity?m:m+Math.log(sum(xs.map(x=>Math.exp(x-m)))); }
export function bisect(f, a, b, target=0, steps=65) {
  const rising=f(b)>f(a);
  for(let i=0;i<steps;i++){const m=(a+b)/2;if(m===a||m===b)break;if((f(m)<target)===rising)a=m;else b=m;}
  return (a+b)/2;
}
export function simpson(f,a,b,n=512) {
  integer(n,2,200000);if(n%2)throw new RangeError('even quadrature count required');
  const h=(b-a)/n;let q=f(a)+f(b);for(let i=1;i<n;i++)q+=(i%2?4:2)*f(a+i*h);return q*h/3;
}
export function normalize(weights) {
  if(!Array.isArray(weights)||!weights.length||weights.some(x=>!Number.isFinite(x)||x<0))throw new RangeError('nonnegative finite weights required');
  const t=sum(weights);if(!(t>0)&&Number.isFinite(t))throw new RangeError('positive total weight required');
  if(!Number.isFinite(t))throw new RangeError('weight total overflow');return weights.map(w=>w/t);
}
export function betaMixture(M,components,weights) {
  const w=normalize(weights);if(components.length!==w.length)throw new RangeError('component mismatch');
  const ds=components.map(([a,b])=>M.dist.beta(positive(a),positive(b)));
  const pdf=x=>sum(ds.map((d,i)=>w[i]===0?0:w[i]*d.pdf(x))), cdf=x=>sum(ds.map((d,i)=>w[i]*d.cdf(x)));
  return {components:components.map(x=>x.slice()),weights:w,pdf,cdf,
    mean:sum(ds.map((d,i)=>w[i]*d.mean)),quantile:p=>p<=0?0:p>=1?1:bisect(cdf,0,1,p),
    sample:r=>{let u=r();for(let i=0;i<w.length;i++){u-=w[i];if(u<0||i===w.length-1)return ds[i].sample(r);}}};
}
export function betaUpdate(M,a,b,s,n) {
  positive(a);positive(b);integer(n);integer(s,0,n);
  return {a:a+s,b:b+n-s,n,s,priorMean:a/(a+b),mean:(a+s)/(a+b+n),dataWeight:n/(a+b+n),
    logEvidence:M.lbeta(a+s,b+n-s)-M.lbeta(a,b),law:M.dist.beta(a+s,b+n-s)};
}
export function mixtureUpdate(M,components,weights,s,n) {
  const prior=betaMixture(M,components,weights), updates=components.map(([a,b])=>betaUpdate(M,a,b,s,n));
  const logs=updates.map((x,i)=>prior.weights[i]===0?-Infinity:Math.log(prior.weights[i])+x.logEvidence), logEvidence=logSum(logs);
  return {prior,logEvidence,posterior:betaMixture(M,updates.map(x=>[x.a,x.b]),logs.map(x=>Math.exp(x-logEvidence)))};
}
export function betaCoin(M,{a=1,b=1,p=.6,n=20,seed=1}={}) {
  bounded(p,0,1);integer(n,0,2000);integer(seed,1,100000);const r=M.rng(seed),points=[],means=[a/(a+b)];let s=0;
  for(let i=0;i<n;i++){const u=r(),v=r(),success=u<p;s+=success;points.push({u,v,success});means.push((a+s)/(a+b+i+1));}
  return {...betaUpdate(M,a,b,s,n),points,means,p};
}
export function succession(M,n=8,reps=1000,seed=1) {
  integer(n,0,50);integer(reps,1,10000);integer(seed,1,100000);const r=M.rng(seed),groups=Array.from({length:n+1},(_,s)=>({s,count:0,next:0,predicted:(s+1)/(n+2)}));
  for(let k=0;k<reps;k++){const p=r();let s=0;for(let j=0;j<n;j++)s+=r()<p;groups[s].count++;groups[s].next+=r()<p;}
  return groups.map(g=>({...g,observed:g.count?g.next/g.count:null,se:g.count?Math.sqrt(g.predicted*(1-g.predicted)/g.count):null,expectedCount:reps/(n+1)}));
}
export function normalUpdate(M,{mu=0,tau=1,sigma=1,n=10,xbar=.5}={}) {
  finite(mu);positive(tau);positive(sigma);integer(n);finite(xbar);
  const priorPrecision=1/(tau*tau),dataPrecision=n/(sigma*sigma),variance=1/(priorPrecision+dataPrecision),weight=dataPrecision*variance;
  const postMean=weight*xbar+(1-weight)*mu;
  return {mean:postMean,variance,sd:Math.sqrt(variance),weight,priorPrecision,dataPrecision,law:M.dist.normal(postMean,Math.sqrt(variance)),predictive:M.dist.normal(postMean,Math.sqrt(sigma*sigma+variance))};
}
export function normalPredictive(M,options,reps=1000,seed=1) {
  integer(reps,1,10000);integer(seed,1,100000);const post=normalUpdate(M,options),r=M.rng(seed),noise=M.dist.normal(0,options.sigma??1),theta=[],future=[];
  for(let i=0;i<reps;i++){const t=post.law.sample(r);theta.push(t);future.push(t+noise.sample(r));}
  return {...post,theta,future,measured:summary(future)};
}
export function gammaUpdate(M,{a=2,rate=1,count=8,exposure=4,futureExposure=1}={}) {
  positive(a);positive(rate);integer(count);bounded(exposure,0,100000);positive(futureExposure);
  if(exposure===0&&count!==0)throw new RangeError('positive count impossible with zero exposure');
  const shape=a+count,postRate=rate+exposure,p=postRate/(postRate+futureExposure);
  return {shape,rate:postRate,law:M.dist.gamma(shape,1/postRate),predictive:M.dist.negbinom(shape,p),mean:shape/postRate,
    predictiveMean:shape*futureExposure/postRate,predictiveVariance:shape*futureExposure/postRate*(1+futureExposure/postRate)};
}
export function gammaExperiment(M,options,reps=1000,seed=1) {
  integer(reps,1,10000);integer(seed,1,100000);const model=gammaUpdate(M,options),r=M.rng(seed),values=[];
  for(let i=0;i<reps;i++)values.push(M.dist.poisson(model.law.sample(r)*(options.futureExposure??1)).sample(r));
  return {...model,values,measured:summary(values)};
}
export function credibleLaw(M,kind='skewed') {
  if(kind==='skewed')return betaMixture(M,[[2,8]],[1]);
  if(kind==='symmetric')return betaMixture(M,[[6,6]],[1]);
  if(kind==='bimodal')return betaMixture(M,[[2,18],[18,2]],[.5,.5]);
  throw new RangeError('unknown posterior');
}
// These three smooth polynomial densities have their extrema separated by far
// more than one mesh cell. Crossings are refined; areas use the exact beta CDF.
export function credibleSets(M,kind='skewed',mass=.95) {
  bounded(mass,.5,.99);const d=credibleLaw(M,kind),grid=Array.from({length:513},(_,i)=>i/512),peak=Math.max(...grid.map(d.pdf));
  const intervals=level=>{const cuts=[0];for(let i=1;i<grid.length;i++){const a=grid[i-1],b=grid[i];if((d.pdf(a)>=level)!==(d.pdf(b)>=level))cuts.push(bisect(d.pdf,a,b,level));}cuts.push(1);const out=[];for(let i=1;i<cuts.length;i++)if(d.pdf((cuts[i-1]+cuts[i])/2)>=level)out.push([cuts[i-1],cuts[i]]);return out;};
  const area=level=>sum(intervals(level).map(([a,b])=>d.cdf(b)-d.cdf(a))),level=bisect(area,0,peak,mass),hpd=intervals(level),et=[d.quantile((1-mass)/2),d.quantile((1+mass)/2)];
  return {law:d,level,hpd,equalTailed:et,hpdMass:sum(hpd.map(([a,b])=>d.cdf(b)-d.cdf(a))),equalMass:d.cdf(et[1])-d.cdf(et[0]),hpdLength:sum(hpd.map(([a,b])=>b-a)),equalLength:et[1]-et[0]};
}
export function coverage(M,{mu=0,tau=.4,sigma=1,n=10,truth=1,mass=.95,reps=1000,seed=1,priorAverage=false}={}) {
  bounded(mass,.5,.99);integer(n,1,10000);integer(reps,1,10000);integer(seed,1,100000);finite(truth);
  const post=normalUpdate(M,{mu,tau,sigma,n,xbar:truth}),z=M.dist.normal(0,1).quantile((1+mass)/2),half=z*post.sd,noiseSd=post.weight*sigma/Math.sqrt(n),bias=post.mean-truth,N=M.dist.normal(0,1);
  const exact=priorAverage?mass:N.cdf((half-bias)/noiseSd)-N.cdf((-half-bias)/noiseSd),r=M.rng(seed),prior=M.dist.normal(mu,tau),rows=[];let hits=0;
  for(let i=0;i<reps;i++){const t=priorAverage?prior.sample(r):truth,xbar=t+sigma/Math.sqrt(n)*N.sample(r),m=post.weight*xbar+(1-post.weight)*mu,hit=Math.abs(m-t)<=half;hits+=hit;if(i<60)rows.push({truth:t,lo:m-half,hi:m+half,hit});}
  return {rows,hits,reps,observed:hits/reps,exact,se:Math.sqrt(exact*(1-exact)/reps),half};
}
export function gaussianBayesFactor({n=10,sigma=1,tau=1,z=2.5,priorNull=.5}={}) {
  positive(n);positive(sigma);positive(tau);finite(z);bounded(priorNull,.001,.999);
  const k=n*(tau/sigma)**2,logBF=.5*Math.log1p(k)-.5*z*z*k/(1+k),logOdds=logBF+Math.log(priorNull)-Math.log1p(-priorNull);
  return {k,logBF,BF:Math.exp(logBF),posteriorNull:logOdds>=0?1/(1+Math.exp(-logOdds)):Math.exp(logOdds)/(1+Math.exp(logOdds)),xbar:z*sigma/Math.sqrt(n)};
}
export const GROUP_Y=Object.freeze([18,6,-5,4,0,2,12,9]);
export const GROUP_SE=Object.freeze([9,6,10,7,5,8,6,11]);
export function pooling(tau=5,{y=GROUP_Y,se=GROUP_SE,mu0=0,muVariance=100}={}) {
  bounded(tau,0,1000);positive(muVariance);finite(mu0);
  if(!y.length||y.length!==se.length)throw new RangeError('group mismatch');y.forEach(x=>finite(x));se.forEach(x=>positive(x));
  const vs=se.map(s=>s*s+tau*tau),p=sum(vs.map(v=>1/v)),m=sum(y.map((x,i)=>(x-mu0)/vs[i])),muVar=1/(1/muVariance+p),mu=mu0+muVar*m;
  const weights=se.map(s=>tau*tau/(tau*tau+s*s)),means=y.map((x,i)=>weights[i]*x+(1-weights[i])*mu),variances=se.map((s,i)=>weights[i]*s*s+(1-weights[i])**2*muVar);
  const logLikelihood=-.5*(y.length*Math.log(2*Math.PI)+sum(vs.map(Math.log))+Math.log1p(muVariance*p)+sum(y.map((x,i)=>(x-mu0)**2/vs[i]))-muVar*m*m);
  return {mu,muVariance:muVar,means,variances,weights,logLikelihood};
}
export function improperIntegral(range=8) {
  bounded(range,0,40);const base=pooling(0).logLikelihood,f=t=>Math.exp(pooling(Math.exp(t)).logLikelihood-base);
  return {logFlat:simpson(f,-range,0,512),halfNormal:simpson(t=>f(t)*Math.exp(t)*Math.sqrt(2/Math.PI)*Math.exp(-Math.exp(2*t)/2),-range,0,512),lowerLikelihoodRatio:f(-range)};
}
export function normalMixtureUpdate(M,components,weights,n,xbar,sigma=1) {
  integer(n,1,10000);finite(xbar);positive(sigma);const w=normalize(weights);
  if(w.length!==components.length)throw new RangeError('component mismatch');
  const posts=components.map(([mu,tau])=>normalUpdate(M,{mu,tau,sigma,n,xbar}));
  const logs=components.map(([mu,tau],i)=>{const v=tau*tau+sigma*sigma/n;return Math.log(w[i])-.5*(Math.log(2*Math.PI*v)+(xbar-mu)**2/v);}),evidence=logSum(logs),pw=logs.map(x=>Math.exp(x-evidence));
  return {posts,weights:pw,logEvidence:evidence,pdf:x=>sum(posts.map((p,i)=>pw[i]*p.law.pdf(x))),cdf:x=>sum(posts.map((p,i)=>pw[i]*p.law.cdf(x)))};
}
export function normalTV(M,model,n,xbar,sigma=1) {
  const scale=Math.sqrt(n)/sigma,ds=model.posts.map(p=>M.dist.normal(scale*(p.mean-xbar),scale*p.sd)),N=M.dist.normal(0,1);
  const density=u=>sum(ds.map((d,i)=>model.weights[i]*d.pdf(u))),limit=Math.max(9,...ds.map(d=>Math.abs(d.mean)+9*d.stdev));
  const tv=simpson(u=>Math.abs(density(u)-N.pdf(u))/2,-limit,limit,4096);
  const tailBound=(N.cdf(-limit)+N.cdf(-limit)+sum(ds.map((d,i)=>model.weights[i]*(d.cdf(-limit)+M.dist.normal(-d.mean,d.stdev).cdf(-limit)))))/2;
  return {tv,tailBound,density,limit};
}
export function bvmExample(M,n=32,seed=1) {
  integer(n,1,1024);integer(seed,1,100000);const r=M.rng(seed),N=M.dist.normal(0,1),data=Array.from({length:n},()=>N.sample(r)),xbar=mean(data);
  const priors=[{components:[[-2,.4]],weights:[1]},{components:[[0,2]],weights:[1]},{components:[[-3,.7],[3,.7]],weights:[.5,.5]}];
  return {data,xbar,models:priors.map(p=>{const model=normalMixtureUpdate(M,p.components,p.weights,n,xbar);return{...model,...normalTV(M,model,n,xbar)};}),atom:2,atomTV:1};
}
export function polya(M,{a=2,b=2,n=200,reps=500,seed=1}={}) {
  positive(a);positive(b);integer(n,1,2000);integer(reps,1,2000);integer(seed,1,100000);const r=M.rng(seed),counts=[],path=[];
  for(let j=0;j<reps;j++){let s=0;for(let k=0;k<n;k++){s+=r()<(a+s)/(a+b+k);if(j===0)path.push([k+1,s/(k+1)]);}counts.push(s);}
  const logNorm=M.lbeta(a,b),pmf=k=>Number.isInteger(k)&&k>=0&&k<=n?Math.exp(M.lgamma(n+1)-M.lgamma(k+1)-M.lgamma(n-k+1)+M.lbeta(a+k,b+n-k)-logNorm):0;
  return {counts,frequencies:counts.map(s=>s/n),path,pmf,mean:a/(a+b),variance:a*b*(a+b+n)/(n*(a+b)**2*(a+b+1)),covariance:a*b/((a+b)**2*(a+b+1)),limit:M.dist.beta(a,b)};
}
export function finiteExchangeable() { return {joint:[[0,.5],[.5,0]],mean:.5,covariance:-.25}; }
export function importance(M,{threshold=3,proposalMean=3,proposalSd=1,n=1000,seed=1}={}) {
  bounded(threshold,1,5);bounded(proposalMean,0,6);if(![.5,1,2].includes(proposalSd))throw new RangeError('proposal SD must be .5, 1 or 2');integer(n,1,10000);integer(seed,1,100000);
  const r=M.rng(seed),q=M.dist.normal(proposalMean,proposalSd),N=M.dist.normal(0,1),truth=N.cdf(-threshold),weights=[],values=[],samples=[],running=[];let total=0;
  for(let i=0;i<n;i++){const x=q.sample(r),w=Math.exp(-x*x/2+(x-proposalMean)**2/(2*proposalSd**2))*proposalSd,v=x>threshold?w:0;weights.push(w);values.push(v);samples.push(x);total+=v;running.push(total/(i+1));}
  const A=1-1/(2*proposalSd**2),h=A>0?-proposalMean/(2*A*proposalSd**2):null,D=A>0?proposalMean**2/(2*proposalSd**2)+proposalMean**2/(4*A*proposalSd**4):null;
  const second=A>0?proposalSd/Math.sqrt(2*A)*Math.exp(D)*N.cdf(-(threshold-h)*Math.sqrt(2*A)):Infinity,variance=second-truth*truth,wmax=Math.max(...weights),scaled=weights.map(w=>w/wmax),ess=sum(scaled)**2/sum(scaled.map(w=>w*w));
  return {samples,values,weights,running,truth,estimate:total/n,variance,exactSE:Number.isFinite(variance)?Math.sqrt(Math.max(0,variance)/n):Infinity,crudeVariance:truth*(1-truth),ess,empirical:summary(values)};
}
export const bananaLog = (x,y,b=.5) => -.5*(x*x+(y-b*(x*x-1))**2)-Math.log(2*Math.PI);
export function metropolis(M,{bend=.5,scale=1,n=1000,seed=1}={}) {
  bounded(bend,0,1);bounded(scale,.05,5);integer(n,1,4000);integer(seed,1,100000);const r=M.rng(seed),N=M.dist.normal(0,1),states=[[0,0]],proposals=[];let accepted=0;
  for(let i=0;i<n;i++){const [x,y]=states.at(-1),candidate=[x+scale*N.sample(r),y+scale*N.sample(r)],logRatio=bananaLog(...candidate,bend)-bananaLog(x,y,bend),alpha=Math.exp(Math.min(0,logRatio)),u=r(),keep=u<alpha;accepted+=keep;proposals.push({candidate,alpha,u,accepted:keep,logRatio});states.push(keep?candidate:[x,y]);}
  return {states,proposals,accepted,rate:accepted/n,meanX:mean(states.slice(1).map(p=>p[0])),meanY:mean(states.slice(1).map(p=>p[1])),targetVarianceY:1+2*bend*bend};
}
export function autocorrelation(xs,lag=1) {
  integer(lag,0,10000);if(lag>=xs.length)return null;const m=mean(xs),den=sum(xs.map(x=>(x-m)**2));return den?sum(xs.slice(lag).map((x,i)=>(x-m)*(xs[i]-m)))/den:null;
}
export function gaussianGibbs(M,{rho=.8,n=1000,seed=1,stationary=true}={}) {
  bounded(rho,-.99,.99);integer(n,1,4000);integer(seed,1,100000);const r=M.rng(seed),N=M.dist.normal(0,1),sd=Math.sqrt((1-rho)*(1+rho));let x=stationary?N.sample(r):3,y=stationary?rho*x+sd*N.sample(r):3;const initial=[x,y],path=[[x,y]],values=[];
  for(let i=0;i<n;i++){x=rho*y+sd*N.sample(r);path.push([x,y]);y=rho*x+sd*N.sample(r);path.push([x,y]);values.push(y);}
  const ar=rho*rho;let extra=0,power=ar,biasTotal=0;for(let k=1;k<=n;k++){if(k<n)extra+=(n-k)*power;biasTotal+=power;power*=ar;}
  return {initial,path,values,mean:mean(values),lagOne:autocorrelation(values),stationaryMeanVariance:(n+2*extra)/(n*n),meanBias:stationary?0:3*biasTotal/n,theoreticalLag:k=>ar**k};
}
// A supplied balanced example of Gelfand–Smith §3.4, not their pump dataset.
export const VARIANCE_DATA=Object.freeze([Object.freeze([-2,-1,0]),Object.freeze([0,1,2]),Object.freeze([2,3,4])]);
export const VARIANCE_PRIOR=Object.freeze({mu:0,muVariance:4,betweenShape:3,betweenScale:2,withinShape:3,withinScale:2});
export function inverseGamma(M,shape,scale) {
  positive(shape);positive(scale);const gamma=M.dist.gamma(shape,1/scale),logConstant=shape*Math.log(scale)-M.lgamma(shape);
  return {shape,scale,mean:shape>1?scale/(shape-1):Infinity,
    pdf:x=>x<=0?0:Math.exp(logConstant-(shape+1)*Math.log(x)-scale/x),
    sample:r=>1/gamma.sample(r)};
}
export function varianceConditionals(M,state) {
  const {theta,mu,between,within}=state,P=VARIANCE_PRIOR,K=VARIANCE_DATA.length,J=VARIANCE_DATA[0].length;
  if(theta.length!==K)throw new RangeError('wrong group dimension');theta.forEach(x=>finite(x));finite(mu);positive(between);positive(within);
  const bs=P.betweenScale+.5*sum(theta.map(t=>(t-mu)**2)),ws=P.withinScale+.5*sum(VARIANCE_DATA.map((row,i)=>sum(row.map(x=>(x-theta[i])**2))));
  const muVar=1/(1/P.muVariance+K/between),muMean=muVar*(P.mu/P.muVariance+sum(theta)/between),thetaVar=1/(J/within+1/between);
  return {between:inverseGamma(M,P.betweenShape+K/2,bs),within:inverseGamma(M,P.withinShape+K*J/2,ws),
    mu:M.dist.normal(muMean,Math.sqrt(muVar)),theta:VARIANCE_DATA.map(row=>M.dist.normal(thetaVar*(sum(row)/within+mu/between),Math.sqrt(thetaVar)))};
}
export function varianceLogMarginal(M,between,within) {
  positive(between);positive(within);const P=VARIANCE_PRIOR,K=VARIANCE_DATA.length,J=VARIANCE_DATA[0].length,means=VARIANCE_DATA.map(mean),grand=mean(means),v=between+within/J;
  const sse=sum(VARIANCE_DATA.map((row,i)=>sum(row.map(y=>(y-means[i])**2)))),ssb=sum(means.map(y=>(y-grand)**2));
  const logDet=K*(J-1)*Math.log(within)+K*Math.log(J)+K*Math.log(v)+Math.log1p(K*P.muVariance/v);
  const q=sse/within+ssb/v+K*(grand-P.mu)**2/(v+K*P.muVariance);
  const logIG=(x,a,b)=>a*Math.log(b)-M.lgamma(a)-(a+1)*Math.log(x)-b/x;
  return -.5*(K*J*Math.log(2*Math.PI)+logDet+q)+logIG(between,P.betweenShape,P.betweenScale)+logIG(within,P.withinShape,P.withinScale);
}
export function varianceReference(M,{steps=160,lo=-7,hi=6}={}) {
  integer(steps,20,600);if(steps%2)throw new RangeError('even grid required');finite(lo);finite(hi);if(!(lo<hi))throw new RangeError('ordered grid bounds required');
  const h=(hi-lo)/steps,us=Array.from({length:steps+1},(_,i)=>lo+h*i),xs=us.map(Math.exp),weights=us.map((_,i)=>(i===0||i===steps?1:i%2?4:2)*h/3);
  const logs=us.map((u,i)=>us.map((v,j)=>varianceLogMarginal(M,xs[i],xs[j])+u+v)),maximum=Math.max(...logs.map(row=>Math.max(...row)));
  const rowMass=Array(steps+1).fill(0),colMass=Array(steps+1).fill(0);let norm=0,meanBetween=0,meanWithin=0;
  for(let i=0;i<=steps;i++)for(let j=0;j<=steps;j++){const d=Math.exp(logs[i][j]-maximum),w=d*weights[i]*weights[j];norm+=w;meanBetween+=w*xs[i];meanWithin+=w*xs[j];rowMass[i]+=d*weights[j];colMass[j]+=d*weights[i];}
  return {xs,us,lo,hi,steps,logNormalization:maximum+Math.log(norm),meanBetween:meanBetween/norm,meanWithin:meanWithin/norm,
    between:xs.map((x,i)=>[x,rowMass[i]/norm/x]),within:xs.map((x,i)=>[x,colMass[i]/norm/x]),
    betweenLogMass:rowMass.map((x,i)=>x*weights[i]/norm),withinLogMass:colMass.map((x,i)=>x*weights[i]/norm)};
}
export function varianceExperiment(M,{cycles=10,chains=100,seed=1}={}) {
  integer(cycles,1,50);integer(chains,1,2000);integer(seed,1,100000);
  const rawBetween=[],rawWithin=[],conditionalBetween=[],conditionalWithin=[],trace=[];
  const copy=(state,block)=>({block,theta:state.theta.slice(),mu:state.mu,between:state.between,within:state.within});
  for(let k=0;k<chains;k++){
    const r=M.rng(seed*1009+k*9176),state={theta:[0,0,0],mu:0,between:1,within:1};if(k===0)trace.push(copy(state,'initial'));
    for(let t=0;t<cycles;t++){
      state.between=varianceConditionals(M,state).between.sample(r);if(k===0)trace.push(copy(state,'between variance'));
      state.within=varianceConditionals(M,state).within.sample(r);if(k===0)trace.push(copy(state,'within variance'));
      state.mu=varianceConditionals(M,state).mu.sample(r);if(k===0)trace.push(copy(state,'common mean'));
      state.theta=varianceConditionals(M,state).theta.map(d=>d.sample(r));if(k===0)trace.push(copy(state,'group effects'));
    }
    // Independent conditional imputations share the same mixing state as the
    // conditional-density averages. Thus both have the same finite-cycle bias.
    const d=varianceConditionals(M,state);conditionalBetween.push(d.between);conditionalWithin.push(d.within);rawBetween.push(d.between.sample(r));rawWithin.push(d.within.sample(r));
  }
  const rbBetween=summary(conditionalBetween.map(d=>d.mean)),rbWithin=summary(conditionalWithin.map(d=>d.mean));
  return {trace,rawBetween,rawWithin,conditionalBetween,conditionalWithin,rawBetweenSummary:summary(rawBetween),rawWithinSummary:summary(rawWithin),rbBetween,rbWithin,
    density:(which,x)=>mean((which==='between'?conditionalBetween:conditionalWithin).map(d=>d.pdf(x))),
    densitySE:(which,x)=>summary((which==='between'?conditionalBetween:conditionalWithin).map(d=>d.pdf(x))).se};
}
export function betaInterval(M,a,b,lo,hi) {
  positive(a);positive(b);bounded(lo,0,1);bounded(hi,lo,1);
  if(lo===hi)return 0;
  // Over a very short interior interval the density varies little. Integrate
  // it directly rather than cancelling nearly identical CDF values.
  if(hi-lo<=1e-4*Math.min(lo,1-hi)/(a+b))return simpson(M.dist.beta(a,b).pdf,lo,hi,8);
  // Use the reflected beta law in the upper tail, avoiding 1 minus 1.
  if(lo>a/(a+b)){const reflected=M.dist.beta(b,a);return reflected.cdf(1-lo)-reflected.cdf(1-hi);}
  const law=M.dist.beta(a,b);return law.cdf(hi)-law.cdf(lo);
}
export function bayesTable(M,{n=20,seed=1,lo=.25,hi=.75}={}) {
  integer(n,0,200);integer(seed,1,100000);bounded(lo,0,1);bounded(hi,0,1);if(lo>hi)throw new RangeError('ordered posterior interval required');
  const r=M.rng(seed),first=[r(),r()],points=[];let successes=0;
  for(let i=0;i<n;i++){const point=[r(),r()],success=point[0]<first[0];successes+=success;points.push({point,success});}
  const posterior=M.dist.beta(successes+1,n-successes+1);
  return {first,points,successes,posterior,probability:betaInterval(M,successes+1,n-successes+1,lo,hi),predictive:(successes+1)/(n+2)};
}
export function jeffreys(p) {
  bounded(p,Number.MIN_VALUE,1-Number.EPSILON);
  const jacobian=p*(1-p),phi=Math.log(p)-Math.log1p(-p),information=1/jacobian;
  return {p,phi,jacobian,information,informationPhi:jacobian,priorP:1/(Math.PI*Math.sqrt(jacobian)),priorPhi:Math.sqrt(jacobian)/Math.PI,flatPTransformed:jacobian};
}
