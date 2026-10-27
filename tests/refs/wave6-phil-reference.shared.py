"""Independent reference. Never imports JS; exact input Fractions and precision-controlled logarithms."""
from fractions import Fraction as F
import mpmath as mp
from math import comb


def rational(x):
    # The reference treats each provided numeric input as its actual binary64 value.
    return F.from_float(float(x))


def probability(x):
    z = rational(x)
    if not 0 <= z <= 1:
        raise ValueError('probability outside [0,1]')
    return z


def norm(weights):
    if any(x < 0 for x in weights):
        raise ValueError('negative mass')
    total = sum(weights, F(0))
    return None if total == 0 else [x / total for x in weights]


def bayes(p, sensitivity, false_positive):
    p, s, f = map(probability, [p, sensitivity, false_positive])
    # Enumerate disjoint truth worlds; conditioning is a separate operation.
    worlds = [p*s, p*(1-s), (1-p)*f, (1-p)*(1-f)]
    evidence = worlds[0] + worlds[2]
    posterior = None if evidence == 0 else worlds[0] / evidence
    return dict(worlds=worlds, evidence=evidence, posterior=posterior,
                status='impossible-evidence' if evidence == 0 else 'defined',
                prior=p, difference=None if posterior is None else posterior-p,support=[x>0 for x in worlds],differenceSign=None if posterior is None else int(posterior>p)-int(posterior<p))


def static_book(p, q):
    p, q = map(rational, [p, q])
    # Select a legal simple portfolio, then independently settle its tickets.
    tickets=[]
    if p < 0: tickets=[('A', -1, p)]
    elif p > 1: tickets=[('A', 1, p)]
    elif q < 0: tickets=[('notA', -1, q)]
    elif q > 1: tickets=[('notA', 1, q)]
    elif p+q > 1: tickets=[('A', 1, p), ('notA', 1, q)]
    elif p+q < 1: tickets=[('A', -1, p), ('notA', -1, q)]
    payoffs=[]
    for world in [True,False]:
        payoffs.append(sum((direction*(int(world if event=='A' else not world)-price)
                            for event,direction,price in tickets),F(0)))
    return dict(prices=[p,q],sum=p+q,tickets=[dict(event=e,direction=d,price=c) for e,d,c in tickets],
                payoffs=payoffs,coherent=0<=p<=1 and 0<=q<=1 and p+q==1,
                reason='negative-price' if p<0 or (0<=p<=1 and q<0) else 'price-above-one' if p>1 or q>1 else 'complements-overpriced' if p+q>1 else 'complements-underpriced' if p+q<1 else 'coherent',
                guaranteedLoss=min([-x for x in payoffs]) if tickets else F(0))


def conditional(weights, proposed):
    w=[rational(x) for x in weights]
    if len(w)!=4:raise ValueError('four truth worlds required')
    prior=norm(w)
    if proposed!='conditional': probability(proposed)
    if prior is None:return dict(status='empty-prior',prior=None,posterior=None,strategy=None)
    # Order A&E, notA&E, A&notE, notA&notE.
    e=prior[0]+prior[1]
    if e==0:return dict(status='impossible-evidence',prior=prior,posterior=None,strategy=None)
    posterior=[prior[0]/e,prior[1]/e,F(0),F(0)]
    r=posterior[0]; q=r if proposed=='conditional' else probability(proposed); difference=r-q; sign=(difference>0)-(difference<0); d=abs(difference)
    rows=[]
    for a,ev in [(True,True),(False,True),(True,False),(False,False)]:
        bet1=sign*(int(a and ev)-prior[0])
        bet2=sign*r*(int(not ev)-(1-e))
        bet3=d*(int(ev)-e)
        bet4=sign*(q-int(a)) if ev else F(0)
        rows.append(dict(world=[a,ev],bets=[bet1,bet2,bet3,bet4],total=bet1+bet2+bet3+bet4))
    assert all(row['total']==-d*e for row in rows)
    return dict(status='defined',prior=prior,evidence=e,posterior=posterior,
                target=r,proposed=q,strategy=rows,guaranteedLoss=d*e,lossPositive=d>0,lossLog='-infinity' if d==0 else mp.log(mp.mpf((d*e).numerator)/(d*e).denominator))


def confirmation(p,s,f):
    r=bayes(p,s,f)
    if r['posterior'] is None:return dict(**r,classification='undefined',probabilityRatio=None,logLikelihoodRatio=None)
    p=r['prior'];post=r['posterior'];s,f=map(probability,[s,f]);change=post-p
    cls='confirms' if change>0 else 'disconfirms' if change<0 else 'neutral'
    ratio=None if p==0 else post/p
    # Extended-real log ratio is classified, not serialized as a non-JSON number.
    llr='undefined' if s==f==0 else '-infinity' if s==0 else 'infinity' if f==0 else mp.log(mp.mpf(s.numerator)/s.denominator)-mp.log(mp.mpf(f.numerator)/f.denominator)
    return dict(**r,classification=cls,probabilityRatio=ratio,logLikelihoodRatio=llr)


def log_ratio(a,b):
    if a==b==0:return 'undefined'
    if a==0:return '-infinity'
    if b==0:return 'infinity'
    r=a/b
    return mp.log(mp.mpf(r.numerator)/r.denominator)


def sequence(p,s,f,observations,copied=False):
    p,s,f=map(probability,[p,s,f]);joint=[p,1-p];rows=[];first=None
    for i,obs in enumerate(observations):
        if obs not in [0,1]:raise ValueError('binary record required')
        if copied and i>0:
            likelihood=[F(int(obs==first)),F(int(obs==first))]
        else:likelihood=[s if obs else 1-s,f if obs else 1-f]
        if i==0:first=obs
        joint=[a*b for a,b in zip(joint,likelihood)];post=norm(joint)
        rows.append(dict(observation=obs,likelihood=likelihood,joint=joint.copy(),posterior=post,
                         status='impossible-record' if post is None else 'defined',support=[x>0 for x in joint],logOdds=log_ratio(joint[0],joint[1]),logLikelihoodRatio=log_ratio(likelihood[0],likelihood[1])))
    return dict(prior=[p,1-p],copied=copied,rows=rows,priorLogOdds=log_ratio(p,1-p))


def finite_agents(theta,prior_a,prior_b,record):
    theta=[probability(x) for x in theta]
    if len(theta)!=len(prior_a) or len(theta)!=len(prior_b):raise ValueError('model dimensions')
    a=norm([rational(x) for x in prior_a]);b=norm([rational(x) for x in prior_b])
    if a is None or b is None:return dict(status='empty-prior')
    rows=[];likelihood=[F(1)]*len(theta)
    for n in range(len(record)+1):
        if n:
            obs=record[n-1]
            if obs not in [0,1]:raise ValueError('binary record required')
            likelihood=[x*(t if obs else 1-t) for x,t in zip(likelihood,theta)]
        pa=norm([x*y for x,y in zip(a,likelihood)]);pb=norm([x*y for x,y in zip(b,likelihood)])
        tv=None if pa is None or pb is None else sum((abs(x-y) for x,y in zip(pa,pb)),F(0))/2
        rows.append(dict(n=n,likelihood=likelihood.copy(),posteriorA=pa,posteriorB=pb,totalVariation=tv,supportA=[x*y>0 for x,y in zip(a,likelihood)],supportB=[x*y>0 for x,y in zip(b,likelihood)]))
    return dict(status='defined',theta=theta,priorA=a,priorB=b,rows=rows)


def lottery(n,k,threshold):
    if not isinstance(n,int) or not isinstance(k,int) or n<1 or not 0<=k<=n:raise ValueError('lottery dimensions')
    t=probability(threshold);individual=F(n-1,n)
    # Enumerate each equally likely winning ticket rather than multiplying marginals.
    survivors=[winner for winner in range(n) if winner>=k]
    conjunction=F(len(survivors),n)
    return dict(n=n,k=k,individual=individual,conjunction=conjunction,survivingWorlds=len(survivors),
                threshold=t,individualAccepted=individual>=t,conjunctionAccepted=conjunction>=t,
                jointlyInconsistent=k==n and individual>=t)


def preface(n,q,mode):
    if not isinstance(n,int) or n<1:raise ValueError('claim count')
    q=probability(q);error=1-q;numerical=False
    if mode=='independent':
        if 0<q<1 and q.denominator.bit_length()*n>100000:
            # An independent high-precision closed form avoids constructing half-million-bit fractions.
            numerical=True;qm=mp.mpf(q.numerator)/q.denominator;em=mp.mpf(error.numerator)/error.denominator
            distribution=[mp.binomial(n,k)*em**k*qm**(n-k) for k in range(n+1)]
        else:distribution=[F(comb(n,k))*error**k*q**(n-k) for k in range(n+1)]
    elif mode=='shared':
        distribution=[F(0)]*(n+1);distribution[0]=q;distribution[n]=error
    elif mode=='dispersed':
        mean=n*error;lo=mean.numerator//mean.denominator;fraction=mean-lo
        distribution=[F(0)]*(n+1);distribution[lo]=1-fraction
        if fraction:distribution[lo+1]=fraction
    else:raise ValueError('unknown dependence')
    if numerical:
        assert abs(mp.fsum(distribution)-1)<mp.power(10,-mp.mp.dps+8)
        mean=n*error;expected_mean=mp.mpf(mean.numerator)/mean.denominator
        assert abs(mp.fsum(k*x for k,x in enumerate(distribution))-expected_mean)<mp.power(10,-mp.mp.dps+10)
    else:
        assert sum(distribution,F(0))==1
        assert sum((k*x for k,x in enumerate(distribution)),F(0))==n*error
    return dict(n=n,q=q,mode=mode,allTrue=distribution[0],atLeastOneError=1-distribution[0],
                lower=max(F(0),1-n*error),upper=q,expectedErrors=n*error,errorCounts=distribution,support=[x>0 for x in distribution])


def encode(x):
    if isinstance(x,F):return mp.nstr(mp.mpf(x.numerator)/x.denominator,50,min_fixed=-7,max_fixed=8)
    if isinstance(x,mp.mpf):return mp.nstr(x,50,min_fixed=-7,max_fixed=8)
    if isinstance(x,dict):return {k:encode(v) for k,v in x.items()}
    if isinstance(x,list):return [encode(v) for v in x]
    return x


def interpretations(chance=.5,credence=.5,n=40):
    if not isinstance(n,int) or not 0<=n<=256:raise ValueError('trial count')
    chance,credence=map(probability,[chance,credence]);state=0x51a7c0de;heads=0;record=[];trace=[None]
    for j in range(n):
        state=(1664525*state+1013904223)%(2**32)
        u=F(2*state+1,2**33);is_head=u<chance;record.append(int(is_head));heads+=is_head;trace.append(F(heads,j+1))
    return dict(chance=chance,credence=credence,tosses=n,heads=heads,record=record,
                frequency=trace[-1],frequencyTrace=trace,fairTicketPayoffs=[1-credence,-credence],
                modelExpectedPayoff=chance-credence)


def old_evidence(weights,certain):
    if not isinstance(certain,bool) or len(weights)!=4:raise ValueError('old evidence domain')
    # Enumerate A&E, notA&E, A&notE, notA&notE; discard incompatible worlds only in certain mode.
    rows=list(zip([(True,True),(False,True),(True,False),(False,False)],map(rational,weights)))
    hypothetical=norm([w for _,w in rows])
    if hypothetical is None:return dict(status='empty-prior',hypothetical=None,current=None,posterior=None)
    current=norm([w if not certain or e else F(0) for ((a,e),w) in rows])
    if current is None:return dict(status='impossible-evidence',hypothetical=hypothetical,current=None,posterior=None)
    e=sum((w for (((a,ev),_),w) in zip(rows,current) if ev),F(0))
    h=sum((w for (((a,ev),_),w) in zip(rows,current) if a),F(0))
    he=sum((w for (((a,ev),_),w) in zip(rows,current) if a and ev),F(0))
    post=None if e==0 else he/e
    return dict(status='impossible-evidence' if e==0 else 'defined',hypothetical=hypothetical,current=current,
                evidence=e,prior=h,posterior=post,difference=None if post is None else post-h,certain=certain)


def population(p,s,f,n):
    z=bayes(p,s,f)
    return dict(**z,population=n,expectedCounts=[x*n for x in z['worlds']])
