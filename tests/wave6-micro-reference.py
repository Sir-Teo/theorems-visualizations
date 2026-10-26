"""Independent high-precision MICRO12 references. No production code is used.

Welfare comes from integrated marginal curves; constrained choices use first-order
conditions and feasible intervals; finite cattle choices enumerate all maximizers.
Network motion uses an analytic separated clock, independently of log-RK4.
"""
from pathlib import Path
import json,math,random,os
import mpmath as mp
ROOT=Path(__file__).resolve().parents[1]
DIGITS=int(os.environ.get('MICRO_DIGITS','1400'));ODE_DIGITS=int(os.environ.get('MICRO_ODE_DIGITS','90'))
mp.mp.dps=DIGITS;F=mp.mpf;RNG=random.Random(1200413);ROWS=[]
def get(p,k,d):return F(p.get(k,d))
def quad(fn,points):return mp.quadgl(fn,points,maxdegree=2)
def sg(x):return int(mp.sign(x))
def clipped(x,a,b):return max(F(a),min(F(b),x))
def quant(x):
 x=F(x);v=float(x);return dict(value=v if math.isfinite(v)else None,sign=sg(x),logMagnitude=float(mp.log(abs(x)))if x else None,belowRange=bool(x and v==0),aboveRange=not math.isfinite(v))
def emit(name,p,z,meta=None,scalars=None,reference=None):
 r={'name':name,'p':p,'quantities':{k:quant(v)for k,v in z.items()}}
 if meta:r['meta']=meta
 if scalars:r['scalars']={k:float(v)for k,v in scalars.items()}
 if reference:r['reference']=reference
 ROWS.append(r)
def market(p):
 a=get(p,'demand',12);b=get(p,'demandSlope',.5);c=get(p,'privateIntercept',2);d=get(p,'privateSlope',.5);e=get(p,'damage',2);f=get(p,'damageSlope',.25);cap=get(p,'capacity',16)
 MB=lambda x:a-b*x;MC=lambda x:c+d*x;MD=lambda x:e+f*x
 private=clipped(mp.findroot(lambda x:MB(x)-MC(x),(0,cap)),0,cap);social=clipped(mp.findroot(lambda x:MB(x)-MC(x)-MD(x),(0,cap)),0,cap)
 # Independent integration of marginal curves, including corner optima.
 integral=lambda fn,x:quad(fn,[0,x])if x else F(0)
 B=lambda x:integral(MB,x);C=lambda x:integral(MC,x);D=lambda x:integral(MD,x);P=lambda x:B(x)-C(x);W=lambda x:P(x)-D(x)
 loss=lambda x:quad(lambda y:MB(y)-MC(y)-MD(y),[x,social])if x!=social else F(0)
 return locals()
def make_external(name,p):
 m=market(p);a,b,c,d,e,f,cap=[m[k]for k in ['a','b','c','d','e','f','cap']];private,social=m['private'],m['social'];B,C,D,P,W,loss=[m[k]for k in ['B','C','D','P','W','loss']]
 if name=='externality':
  x=get(p,'quantity',10);t=get(p,'tax',0);taxed=clipped(mp.findroot(lambda y:m['MB'](y)-m['MC'](y)-t,(0,cap)),0,cap)
  z=dict(selectedQuantity=x,privateQuantity=private,socialQuantity=social,taxQuantity=taxed,optimalTax=m['MD'](social),marginalBenefit=m['MB'](x),marginalPrivateCost=m['MC'](x),marginalDamage=m['MD'](x),marginalSocialCost=m['MC'](x)+m['MD'](x),benefit=B(x),privateCost=C(x),externalCost=D(x),welfare=W(x),socialWelfare=W(social),privateWelfare=W(private),taxWelfare=W(taxed),privateLoss=loss(private),selectedLoss=loss(x),taxLoss=loss(taxed),taxRevenue=t*taxed)
  emit(name,p,z,dict(position='below efficient quantity'if x<social else'above efficient quantity'if x>social else'efficient quantity'));return
 if name=='positiveSpillover':
  spill=get(p,'spillover',2);s=get(p,'subsidy',2);social=clipped(mp.findroot(lambda x:m['MB'](x)+spill-m['MC'](x),(0,cap)),0,cap);policy=clipped(mp.findroot(lambda x:m['MB'](x)+s-m['MC'](x),(0,cap)),0,cap);w=lambda x:P(x)+spill*x
  emit(name,p,dict(privateQuantity=private,socialQuantity=social,policyQuantity=policy,optimalSubsidy=spill,privateWelfare=w(private),socialWelfare=w(social),policyWelfare=w(policy),externalBenefit=spill*policy,subsidyPayment=s*policy,policyLoss=quad(lambda x:m['MB'](x)+spill-m['MC'](x),[policy,social]),privateLoss=quad(lambda x:m['MB'](x)+spill-m['MC'](x),[private,social])));return
 rights=p.get('rights','produce');fallback=private if rights=='produce'else F(0);z,meta=deal(p,P,D,fallback,social,rights);emit(name,p,z,meta)
def deal(p,P,D,fallback,target,rights):
 cost=get(p,'transactionCost',0);share=get(p,'transferShare',.5);tie=p.get('tie','agreement');gross=(P(target)-D(target))-(P(fallback)-D(fallback));net=gross-cost
 if rights=='quiet':lower=D(target)+cost/2;upper=P(target)-cost/2
 else:lower=P(fallback)-P(target)+cost/2;upper=D(fallback)-D(target)-cost/2
 accepted=target!=fallback and(net>0 or net==0 and tie=='agreement');x=target if accepted else fallback;paid=cost if accepted else F(0);payment=lower+share*(upper-lower)if accepted else F(0);signed=-payment if rights=='quiet'else payment;gainP=P(x)-P(fallback)+signed-paid/2;gainD=D(fallback)-D(x)-signed-paid/2
 z=dict(fallback=fallback,target=target,quantity=x,grossGain=gross,netPotentialGain=net,paymentLower=lower,paymentUpper=upper,payment=payment,signedToProducer=signed,transactionCostPaid=paid,producerGain=gainP,harmedGain=gainD,realizedGain=gainP+gainD,welfare=P(x)-D(x)-paid)
 status='fallback already efficient'if target==fallback else'profitable agreement'if net>0 else'indifferent agreement'if net==0 else'no feasible agreement'
 return z,dict(accepted=bool(accepted),status=status,paymentDirection='producer pays affected party'if rights=='quiet'else'affected party pays producer')
def make_abatement(p):
 EA=get(p,'emissionsA',8);EB=get(p,'emissionsB',8);kA=get(p,'slopeA',1);kB=get(p,'slopeB',3);rho=get(p,'reduction',.5);share=get(p,'permitShare',.5);R=rho*(EA+EB);lo=max(F(0),R-EB);hi=min(EA,R)
 A=clipped(mp.findroot(lambda x:kA*x-kB*(R-x),(0,R or 1)),lo,hi);B=R-A;cost=lambda k,x:quad(lambda y:k*y,[0,x])if x else F(0);macA=kA*A;macB=kB*B
 price=max(macA,macB)if R==EA+EB else F(0)if R==0 else macA if 0<A<EA else macB
 standardA=R*EA/(EA+EB);standardB=R-standardA;ca=cost(kA,A);cb=cost(kB,B);standard=cost(kA,standardA)+cost(kB,standardB);cap=EA+EB-R;la=share*cap;lb=cap-la;ea=EA-A;eb=EB-B;pa=ea-la;pb=eb-lb;ta=price*pa;tb=price*pb
 z=dict(required=R,abatementA=A,abatementB=B,minimumA=lo,maximumA=hi,macA=macA,macB=macB,price=price,costA=ca,costB=cb,totalCost=ca+cb,standardA=standardA,standardB=standardB,standardCost=standard,savings=standard-ca-cb,cap=cap,emissionsA=ea,emissionsB=eb,permitsA=la,permitsB=lb,purchaseA=pa,purchaseB=pb,paymentA=ta,paymentB=tb,financialCostA=ca+ta,financialCostB=cb+tb,emissionsResidual=ea+eb-cap,transferResidual=ta+tb)
 # Analytically exact identities avoid meaningless quadrature residue.
 if kA*EA==kB*EB:z['savings']=F(0)
 z['emissionsResidual']=z['transferResidual']=F(0)
 status='no required abatement'if R==0 else'full abatement; supporting price not unique'if R==EA+EB else'capacity-constrained allocation'if A in[0,EA]or B in[0,EB]else'interior equal marginal costs'
 emit('abatement',p,z,dict(status=status))
def make_goods(p):
 rival=p.get('rival',True);ex=p.get('excludable',True);users=p.get('users',4);passes=p.get('passes',2);stock=get(p,'stock',6);n=min(users,passes)if ex else users
 used=min(F(n),stock)if rival else stock if n else F(0);per=used/n if rival and n else stock if n else F(0)
 status=('private good'if ex else'common-pool resource')if rival else('club good'if ex else'pure public good')
 emit('goodsClass',p,dict(perUser=per,physicalUsed=used,unused=stock-used,sumExperiences=n*per),dict(admitted=n,excluded=users-n,status=status))
def public_values(p):
 a=get(p,'benefitA',8);b=get(p,'benefitB',6);ka=get(p,'slopeA',1);kb=get(p,'slopeB',1);c=get(p,'cost',4);sa=a/ka;sb=b/kb;ma=lambda g:max(F(0),a-ka*g);mb=lambda g:max(F(0),b-kb*g)
 # Solve each feasible active-set segment independently, rather than assuming both active.
 candidates=[F(0),sa,sb];breaks=sorted(set(candidates));
 for left,right in zip(breaks,breaks[1:]):
  middle=(left+right)/2;active=[(a,ka)]if middle<sa else[];active+=([(b,kb)]if middle<sb else[])
  if active:
   root=(sum(t[0]for t in active)-c)/sum(t[1]for t in active)
   if left<=root<=right:candidates.append(root)
 B=lambda ai,ki,s,g:quad(lambda x:ai-ki*x,[0,min(g,s)])if g else F(0);BA=lambda g:B(a,ka,sa,g);BB=lambda g:B(b,kb,sb,g);W=lambda g:BA(g)+BB(g)-c*g
 best=max(candidates,key=W)
 return locals()
def make_public(p):
 m=public_values(p);g=get(p,'provision',5);a,b,ka,kb,c,sa,sb,best,ma,mb,BA,BB,W=[m[k]for k in ['a','b','ka','kb','c','sa','sb','best','ma','mb','BA','BB','W']];qa=max(F(0),(a-c)/ka);qb=max(F(0),(b-c)/kb)
 z=dict(efficient=best,saturationA=sa,saturationB=sb,mbA=ma(g),mbB=mb(g),mbTotal=ma(g)+mb(g),benefitA=BA(g),benefitB=BB(g),provisionCost=c*g,welfare=W(g),optimalWelfare=W(best),loss=W(best)-W(g),privateQuantityA=qa,privateQuantityB=qb,privateQuantityTotal=qa+qb,optimalMarginalResidual=F(0)if best else ma(best)+mb(best)-c)
 emit('publicProvision',p,z,dict(activeAtOptimum=[ma(best)>0,mb(best)>0],status='zero-provision corner'if best==0 else'positive efficient provision'))
def make_voluntary(p):
 n=p.get('players',4);a=get(p,'benefit',8);b=get(p,'slope',1);c=get(p,'cost',2);fraction=get(p,'provisionFraction',.75);sat=a/b;N=max(F(0),mp.findroot(lambda g:a-b*g-c,(0,sat)));S=max(F(0),mp.findroot(lambda g:n*(a-b*g)-c,(0,sat)));g=fraction*sat;B=lambda x:quad(lambda t:a-b*t,[0,x]);W=lambda x:n*B(x)-c*x
 emit('voluntary',p,dict(saturation=sat,nash=N,social=S,selected=g,symmetricNashContribution=N/n,symmetricSocialContribution=S/n,selectedContribution=g/n,individualMarginalBenefit=a-b*g,socialMarginalBenefit=n*(a-b*g),selectedWelfare=W(g),nashWelfare=W(N),optimalWelfare=W(S),nashLoss=W(S)-W(N),selectedLoss=W(S)-W(g)),dict(nashSet='all contributions zero'if N==0 else'one contribution equals Nash total'if n==1 else'all nonnegative contribution vectors with the displayed Nash total'))
def make_grazing(p):
 a=get(p,'productivity',10);b=get(p,'congestion',1);c=get(p,'cost',2);fraction=get(p,'effortFraction',1);NS=mp.findroot(lambda n:a-b*n-c,(0,30));NO=mp.findroot(lambda n:a-b*n/2-c,(0,60));n=fraction*NO;Y=lambda z:quad(lambda t:a-b*t,[0,z]);rent=lambda z:Y(z)-c*z
 z=dict(owner=NS,openAccess=NO,effort=n,product=Y(n),marginalProduct=a-b*n,effortCost=c*n,rent=rent(n),ownerRent=rent(NS),openAccessRent=F(0),loss=rent(NS)-rent(n))
 if n:z['averageProduct']=Y(n)/n
 if fraction==1:z['rent']=F(0)
 if fraction==F('.5'):z['loss']=F(0)
 emit('grazing',p,z,dict(position='below rent-maximizing effort'if n<NS else'above rent-maximizing effort'if n>NS else'rent-maximizing effort'))
def make_prices(p):
 b=get(p,'costSlope',1);d=get(p,'benefitSlope',.5);rho=get(p,'uncertainty',.6);shock=get(p,'shock',.5);a=F(20);base=F(5);h=a+(b+d)*base;price=a+b*base;r=F(4)/5*rho*b*base;u=shock*r
 choose=lambda s:mp.findroot(lambda x:h-d*x-(a+b*x+s),(0,10));Astar=choose(u);Aprice=mp.findroot(lambda x:a+b*x+u-price,(0,10));W=lambda x,s:quad(lambda y:(h-d*y)-(a+b*y+s),[0,x]);loss=lambda x,s:quad(lambda y:(h-d*y)-(a+b*y+s),[x,choose(s)])
 EQ=quad(lambda s:loss(base,s),[-r,0,r])/(2*r)if r else F(0);EP=quad(lambda s:loss((price-a-s)/b,s),[-r,0,r])/(2*r)if r else F(0)
 # Integrating a symmetric exact tie should return exact zero, not quadrature dust.
 difference=EP-EQ
 if d==0:EP=F(0);difference=-EQ
 if b==d:EP=EQ;difference=F(0)
 emit('pricesQuantities',p,dict(benefitIntercept=h,fixedPrice=price,shockSupport=r,selectedShock=u,variance=r*r/3,fixedQuantity=base,priceQuantity=Aprice,optimalQuantity=Astar,quantityLoss=F(0)if u==0 else loss(base,u),priceLoss=F(0)if d==0 or u==0 else loss(Aprice,u),quantityWelfare=W(base,u),priceWelfare=W(Aprice,u),optimalWelfare=W(Astar,u),expectedQuantityLoss=EQ,expectedPriceLoss=EP,expectedDifference=difference,slopeDifference=d-b),dict(status='price has lower expected loss'if difference<0 else'quantity has lower expected loss'if difference>0 else'equal expected loss'))
def make_lindahl(p):
 a=get(p,'benefitA',8);b=get(p,'benefitB',6);c=get(p,'cost',8);share=get(p,'share',.625);r=a*get(p,'report',1);G=max(F(0),(a+b-c)/2);R=max(F(0),(r+b-c)/2);pa=a-G;pb=c-pa;ra=r-R if R else r;rb=c-ra;sa=share*c;sb=c-sa;da=max(F(0),a-sa);db=max(F(0),b-sb);B=lambda ai,g:quad(lambda x:ai-x,[0,g]);uA=B(a,G)-pa*G;uB=B(b,G)-pb*G;vA=B(a,R)-ra*R;vB=B(b,R)-rb*R
 emit('lindahl',p,dict(efficient=G,equilibriumPriceA=pa,equilibriumPriceB=pb,equilibriumShareA=pa/c,selectedPriceA=sa,selectedPriceB=sb,demandA=da,demandB=db,demandGap=da-db,reportedInterceptA=r,reportedProvision=R,reportedPriceA=ra,reportedPriceB=rb,truePayoffA=uA,reportPayoffA=vA,truePayoffB=uB,reportPayoffB=vB,reportGainA=vA-uA,trueWelfareChange=F(0)if r==a else vA+vB-uA-uB,reportedBudgetResidual=F(0)),dict(status='individual demands agree'if da==db else'individual demands disagree'))
def make_cattle(p):
 margin=get(p,'margin',5);decline=get(p,'decline',1);d=get(p,'damage',1);rights=p.get('rights','produce');profits=[sum(margin-decline*(i-1)for i in range(1,n+1))for n in range(5)];damages=[sum(d*i for i in range(1,n+1))for n in range(5)];joint=[a-b for a,b in zip(profits,damages)];priv=[i for i,x in enumerate(profits)if x==max(profits)];social=[i for i,x in enumerate(joint)if x==max(joint)];fallback=priv[0]if rights=='produce'else 0
 z,meta=deal(p,lambda n:F(profits[int(n)]),lambda n:F(damages[int(n)]),F(fallback),F(social[0]),rights)
 for i in range(5):z.update({f'rows.{i}.profit':profits[i],f'rows.{i}.damage':damages[i],f'rows.{i}.joint':joint[i]})
 meta.update(privateMaximizers=priv,jointMaximizers=social);emit('cattle',p,z,meta)
def make_samuelson(p):
 a=get(p,'tasteA',1);b=get(p,'tasteB',.8);R=get(p,'resources',16);c=get(p,'cost',2);w=get(p,'weight',.5);r=a*get(p,'report',1);mode=p.get('mode','hold allocation')
 def alloc(taste):
  A=w*taste+(1-w)*b;g=max(F(0),mp.findroot(lambda g:A*(R-c*g)-c*(1+g),(0,R/c)));X=R-c*g;return g,w*X,(1-w)*X
 truth=alloc(a);g,x,y=alloc(r)if mode=='plan from reports'else truth;ma=a*x/(1+g);mb=b*y/(1+g);ra=r*x/(1+g);ua=mp.log(x)+a*mp.log1p(g);ub=mp.log(y)+b*mp.log1p(g)
 z=dict(truthfulProvision=truth[0],provision=g,privateA=x,privateB=y,publicResourceCost=c*g,trueMrsA=ma,trueMrsB=mb,trueMrsTotal=ma+mb,reportedMrsA=ra,reportedMrsTotal=ra+mb,trueMarginalResidual=ma+mb-c,reportedMarginalResidual=ra+mb-c,resourceResidual=F(0))
 # First-order equalities are algebraic identities at the corresponding interior optimum.
 if g and(mode=='plan from reports'or r==a):z['reportedMarginalResidual']=F(0)
 if g and(mode=='hold allocation'or r==a):z['trueMarginalResidual']=F(0)
 emit('samuelson',p,z,dict(status='positive public provision'if g else'zero-public-good corner'),dict(utilityA=ua,utilityB=ub,weightedUtility=w*ua+(1-w)*ub))

def make_network(p):
 v=get(p,'strength',4);price=get(p,'price',.75);k=get(p,'adjustment',.8);x0=get(p,'initial',.35);t=get(p,'time',8);margin=v-4*price;delta=margin/v;flow=k*x0*(v*x0*(1-x0)-price);z=dict(thresholdPrice=v/4,margin=margin,discriminant=delta,initialFlow=flow);roots=[]
 if delta>=0:roots=[(1-mp.sqrt(delta))/2,(1+mp.sqrt(delta))/2];z.update(lower=roots[0],upper=roots[1])
 stationary=flow==0;extra=any(x and abs(x)<F('1e-40')for x in[v,price,k,x0,t]);digits=DIGITS if extra else ODE_DIGITS
 with mp.workdps(digits):
  v=+v;price=+price;k=+k;x0=+x0;t=+t;delta=1-4*price/v
  if not t or stationary:state=x0
  else:
   def clock(x):
    if not price:return(mp.log(x)-1/x-mp.log1p(-x))/v
    D=v*x*(1-x)-price
    if delta>0:
     s=mp.sqrt(delta);lo=2*(price/v)/(1+s);hi=1-lo;I=mp.log(abs((x-lo)/(hi-x)))/(v*s)
    elif delta==0:I=1/(v*(x-F('.5')))
    else:
     a=mp.sqrt(-delta)/2;I=-mp.atan((x-F('.5'))/a)/(v*a)
    return-mp.log(x)/price+mp.log(abs(D))/(2*price)+v*I/(2*price)
   start=clock(x0);target=k*t;direction=sg(flow);initialLog=mp.log(x0)
   if direction>0:lo=initialLog;hi=mp.log((1+mp.sqrt(delta))/2)if price else F(0)
   else:
    targetRoot=(1+mp.sqrt(delta))/2 if delta>0 and x0>(1+mp.sqrt(delta))/2 else F('.5')if delta==0 and x0>F('.5')else None
    lo=mp.log(targetRoot)if targetRoot is not None else initialLog-k*price*t;hi=initialLog
   for _ in range(480):
    mid=(lo+hi)/2
    if mid==lo or mid==hi:break
    f=clock(mp.exp(mid))-start-target
    if(direction>0 and f>0)or(direction<0 and f<0):hi=mid
    else:lo=mid
   state=mp.exp((lo+hi)/2)
  z['state']=+state
  emit('network',p,z,dict(stationary=stationary,status='zero unstable from the right; full adoption stable'if not price else'zero and upper equilibria stable; lower critical mass unstable'if margin>0 else'coalesced equilibrium attracts from above and repels from below'if margin==0 else'only zero-adoption equilibrium'),reference={'trajectoryDigits':digits,'method':'analytic separated clock; log-space bisection, at most480 steps'})

DISPATCH={'externality':lambda p:make_external('externality',p),'positiveSpillover':lambda p:make_external('positiveSpillover',p),'bargaining':lambda p:make_external('bargaining',p),'abatement':make_abatement,'goodsClass':make_goods,'publicProvision':make_public,'voluntary':make_voluntary,'grazing':make_grazing,'network':make_network,'pricesQuantities':make_prices,'lindahl':make_lindahl,'cattle':make_cattle,'samuelson':make_samuelson}
def case(name,p):DISPATCH[name](p)
RANGES={
'externality':dict(demand=(8,16),demandSlope=(.1,.5),privateIntercept=(0,5),privateSlope=(.1,1.5),damage=(0,8),damageSlope=(0,.5),quantity=(0,16),tax=(0,16)),
'positiveSpillover':dict(demand=(8,16),demandSlope=(.1,.5),privateIntercept=(0,5),privateSlope=(.1,1.5),spillover=(0,8),subsidy=(0,8)),
'bargaining':dict(demand=(8,16),demandSlope=(.1,.5),privateIntercept=(0,5),privateSlope=(.1,1.5),damage=(0,8),damageSlope=(0,.5),transactionCost=(0,120),transferShare=(0,1)),
'abatement':dict(emissionsA=(2,12),emissionsB=(2,12),slopeA=(.1,4),slopeB=(.1,4),reduction=(0,1),permitShare=(0,1)),
'publicProvision':dict(benefitA=(2,10),benefitB=(2,10),slopeA=(.5,2),slopeB=(.5,2),cost=(.5,12),provision=(0,20)),
'voluntary':dict(benefit=(2,10),slope=(.5,2),cost=(1,8),provisionFraction=(0,1)),
'grazing':dict(productivity=(6,12),congestion=(.5,2),cost=(1,5),effortFraction=(0,1)),
'pricesQuantities':dict(costSlope=(.25,4),benefitSlope=(0,4),uncertainty=(0,1),shock=(-1,1)),
'lindahl':dict(benefitA=(6,10),benefitB=(6,10),cost=(6,12),share=(0,1),report=(.85,1)),
'cattle':dict(margin=(0,12),decline=(0,3),damage=(0,6),transactionCost=(0,80),transferShare=(0,1)),
'samuelson':dict(tasteA=(.2,3),tasteB=(.2,3),resources=(8,24),cost=(1,4),weight=(.1,.9),report=(.5,1))}
for name,ranges in RANGES.items():
 case(name,{})
 for i in range(24):
  p={k:RNG.uniform(*r)for k,r in ranges.items()}
  if name in['bargaining','cattle']:p['rights']=['produce','quiet'][i%2]
  if name=='voluntary':p['players']=1+i%10
  if name=='samuelson':p['mode']=['hold allocation','plan from reports'][i%2]
  case(name,p)
 for upper in[False,True]:
  p={k:r[int(upper)]for k,r in ranges.items()}
  if name=='voluntary':p['players']=10 if upper else 1
  case(name,p)
 print(json.dumps({'family':name,'casesSoFar':len(ROWS)}),flush=True)
# Exact corners, full maximizing sets, adjacent binary64 inputs and retained tiny products.
tiny=float.fromhex('0x0.0000000000001p-1022')
for p in[dict(quantity=0),dict(quantity=tiny,damage=tiny,damageSlope=tiny),dict(demand=8,privateIntercept=5,damage=8,quantity=0),dict(demand=16,demandSlope=.1,privateIntercept=0,privateSlope=.1,damage=0,damageSlope=0,quantity=16),dict(damage=0,damageSlope=0,quantity=10,tax=0)]:case('externality',p)
for rights,cost in[('produce',2),('quiet',32)]:
 for c in[math.nextafter(cost,0),float(cost),math.nextafter(cost,math.inf)]:
  for tie in['agreement','fallback']:case('bargaining',dict(rights=rights,transactionCost=c,damageSlope=0,tie=tie))
for p in[dict(reduction=0),dict(reduction=1),dict(reduction=tiny),dict(emissionsA=2,emissionsB=12,slopeA=.1,slopeB=4,reduction=.8),dict(emissionsA=12,emissionsB=2,slopeA=4,slopeB=.1,reduction=.8),dict(slopeA=1,slopeB=1),dict(permitShare=0),dict(permitShare=1)]:case('abatement',p)
for rival in[False,True]:
 for ex in[False,True]:
  for passes in[0,2,12]:case('goodsClass',dict(rival=rival,excludable=ex,users=4,passes=passes))
for p in[{},dict(benefitA=2,benefitB=2,cost=4,provision=0),dict(benefitA=2,benefitB=2,cost=12,provision=0),dict(benefitA=10,benefitB=2,cost=8,provision=2),dict(benefitA=10,benefitB=2,cost=1,provision=9),dict(provision=tiny)]:case('publicProvision',p)
for p in[dict(players=1),dict(players=10),dict(benefit=2,cost=8),dict(benefit=2,cost=2),dict(provisionFraction=0),dict(provisionFraction=tiny)]:case('voluntary',p)
for p in[dict(effortFraction=0),dict(effortFraction=.5),dict(effortFraction=1),dict(effortFraction=tiny)]:case('grazing',p)
for p in[dict(benefitSlope=0),dict(benefitSlope=1),dict(benefitSlope=math.nextafter(1,0)),dict(benefitSlope=math.nextafter(1,2)),dict(uncertainty=0),dict(uncertainty=tiny),dict(shock=0),dict(shock=tiny)]:case('pricesQuantities',p)
for p in[dict(benefitA=6,benefitB=6,cost=12),dict(benefitA=6,benefitB=6,cost=11.8,report=.85),dict(benefitA=6,benefitB=6,cost=11.8,report=.99),dict(share=0),dict(share=1)]:case('lindahl',p)
for p in[dict(margin=0,decline=0,damage=0),dict(margin=0,decline=1,damage=0),dict(margin=1,decline=0,damage=1),dict(margin=5,decline=1,damage=1),dict(margin=5,decline=1,damage=1,transactionCost=2),dict(margin=5,decline=1,damage=1,transactionCost=2,tie='fallback'),dict(damage=tiny),dict(margin=tiny,decline=0,damage=0)]:case('cattle',p)
for mode in['hold allocation','plan from reports']:
 for p in[dict(report=1),dict(report=.5),dict(tasteA=.2,tasteB=.2,resources=8,cost=4),dict(tasteA=.25,tasteB=.25,resources=8,cost=2),dict(weight=.1),dict(weight=.9)]:case('samuelson',dict(mode=mode,**p))
for p in[{},dict(initial=0),dict(initial=1),dict(time=0),dict(price=0),dict(price=0,initial=1),dict(strength=4,price=1,initial=.5),dict(strength=4,price=1,initial=.4),dict(strength=4,price=1,initial=.6),dict(strength=4,price=math.nextafter(1,0),initial=.5),dict(strength=4,price=math.nextafter(1,2),initial=.5),dict(price=3,strength=1,time=20),dict(price=.75,strength=4,initial=.25),dict(price=.75,strength=4,initial=.75),dict(initial=tiny),dict(price=0,initial=tiny),dict(price=tiny),dict(time=tiny),dict(adjustment=2,strength=8,price=3,initial=1,time=20)]:case('network',p)
for i in range(8):case('network',dict(strength=RNG.uniform(1,8),price=RNG.uniform(0,3),adjustment=RNG.uniform(.1,2),initial=RNG.uniform(.02,.98),time=RNG.uniform(0,20)))
out={'method':'Independent high-precision Gauss-Legendre polynomial quadrature, constrained/finite optimization and separated nonlinear clock; exact analytic identities enforce zeros without tolerances','algebraDigits':DIGITS,'ordinaryTrajectoryDigits':ODE_DIGITS,'rows':ROWS}
path=Path(os.environ.get('MICRO_OUTPUT',str(ROOT/'tests/fixtures/wave6-micro-reference.json')));path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(out,indent=2,allow_nan=False)+'\n');print(json.dumps({'cases':len(ROWS),'families':len(set(r['name']for r in ROWS)),'path':str(path),'digits':DIGITS,'trajectoryDigits':ODE_DIGITS}))
