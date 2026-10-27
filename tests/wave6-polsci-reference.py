# Independent finite combinatorial oracle: no production JavaScript imports.
from fractions import Fraction as F
from itertools import permutations,combinations_with_replacement,product
from functools import lru_cache
from math import factorial,comb
from pathlib import Path
import json,random,hashlib,mpmath as mp,time
mp.mp.dps=120
HERE=Path(__file__).resolve().parent
FACTS=json.loads((HERE/'fixtures/wave6-polsci-source-facts.json').read_text())
CODES='AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split()
ALLOC=[(code,name,w)for code,(name,w)in zip(CODES,FACTS['electoralVotesByName'].items())]
assert len(ALLOC)==51 and sum(w for _,_,w in ALLOC)==538
q=lambda x:{'exact':{'n':str(F(x).numerator),'d':str(F(x).denominator)},'value':float(x),'sign':(x>0)-(x<0)}
def frac(x):return F(int(x['exact']['n']),int(x['exact']['d']))
def analyze(n,win,weights=None,table=True):
 weights=weights or [1]*n;masks=list(range(1<<n));members=[[i for i in range(n)if mask>>i&1]for mask in masks];totals=[sum(weights[i]for i in ms)for ms in members];wins=[bool(win(mask,totals[mask],len(members[mask])))for mask in masks]
 by_size=[[0]*n for _ in range(n)];swings=[0]*n;rows=[];minimal=[];win_sizes=[0]*(n+1)
 for mask in masks:
  ms=members[mask];critical=[i for i in ms if not wins[mask^(1<<i)]]if wins[mask]else[]
  if wins[mask]:win_sizes[len(ms)]+=1
  for i in critical:swings[i]+=1;by_size[i][len(ms)-1]+=1
  is_minimal=wins[mask]and all(not wins[mask^(1<<i)]for i in ms)
  if is_minimal:minimal.append(mask)
  if table:rows.append({'mask':mask,'members':ms,'weight':totals[mask],'win':wins[mask],'minimal':is_minimal,'critical':critical})
 if n<=6:
  pivots=[[0]*n for _ in range(n)]
  for order in permutations(range(n)):
   mask=0
   for k,i in enumerate(order):
    before=wins[mask];mask|=1<<i
    if not before and wins[mask]:pivots[i][k]+=1
 else:
  # Condition on the player's uniformly distributed rank and uniform predecessor set.
  pivots=[[int(F(by_size[i][k],n*comb(n-1,k))*factorial(n))for k in range(n)]for i in range(n)]
 ssi_counts=list(map(sum,pivots));total_swings=sum(swings);orders=factorial(n)
 return {'n':n,'weights':weights[:],'valid':not wins[0]and wins[-1],'proper':all(not wins[s]or not wins[((1<<n)-1)^s]for s in masks),'winningBySize':win_sizes,'minimalWinning':minimal,'table':rows,'swings':list(map(str,swings)),'pivotCounts':[list(map(str,row))for row in pivots],'ssiCounts':list(map(str,ssi_counts)),'orderings':str(orders),'ssi':[q(F(x,orders))for x in ssi_counts],'absolute':[q(F(x,2**(n-1)))for x in swings],'normalized':[q(F(x,total_swings))for x in swings]if total_swings else[None]*n,'totalSwings':str(total_swings),'winningCoalitions':sum(win_sizes)}
@lru_cache(None)
def _weighted(weights,quota,min_members):return analyze(len(weights),lambda mask,total,count:total>=quota and count>=min_members,list(weights))
def council(weights=(4,3,2,1),quota=6,minMembers=0,mask=3):
 weights=list(weights);g=_weighted(tuple(weights),quota,minMembers);return{**g,'quota':quota,'minMembers':minMembers,'selected':g['table'][mask],'weightShares':[q(F(w,sum(weights)))for w in weights]if sum(weights)else[None]*len(weights)}
def ordering(weights=(4,3,2,1),quota=6,index=0,reveal=4):
 g=council(weights,quota,0,0);n=len(weights);order=list(list(permutations(range(n)))[index]);steps=[];mask=0;total=0;pivot=None
 for k,i in enumerate(order):
  before=total;mask|=1<<i;total+=weights[i];crossing=before<quota<=total
  if crossing:pivot=i
  steps.append({'position':k+1,'player':i,'mask':mask,'weight':total,'win':total>=quota,'pivot':crossing})
 return{**g,'index':index,'reveal':reveal,'order':order,'steps':steps,'pivot':pivot,'visible':steps[:reveal]}
def eec(quota=12,fourCountries=False,mask=39):return{**council([4,4,4,2,2,1],quota,4 if fourCountries else 0,mask),'fourCountries':fourCountries,'names':['Germany','France','Italy','Belgium','Netherlands','Luxembourg']}
def entrant(weights=(2,2,1),quota=4,newWeight=1,mask=5):
 weights=list(weights);n=len(weights);before=council(weights,quota,0,mask);after=council(weights+[newWeight],quota,0,mask|(1<<n));deltas=[];changes=[]
 for i in range(n):
  old=int(before['swings'][i]);new=int(after['swings'][i]);deltas.append({'rawChange':str(new-old),'excessBeyondDuplicatedContexts':str(new-2*old),'absolute':q(frac(after['absolute'][i])-frac(before['absolute'][i])),'normalized':q(frac(after['normalized'][i])-frac(before['normalized'][i]))if before['normalized'][i]and after['normalized'][i]else None,'ssi':q(frac(after['ssi'][i])-frac(before['ssi'][i]))})
  gained=[];lost=[]
  for s in range(1<<n):
   if s>>i&1:continue
   old_swing=not before['table'][s]['win']and before['table'][s|(1<<i)]['win'];t=s|(1<<n);new_swing=not after['table'][t]['win']and after['table'][t|(1<<i)]['win']
   if new_swing and not old_swing:gained.append(s)
   if old_swing and not new_swing:lost.append(s)
  changes.append({'gained':gained,'lost':lost})
 return{'weights':weights,'quota':quota,'newWeight':newWeight,'mask':mask,'before':before,'after':after,'deltas':deltas,'changes':changes}
def tie(N):return F(comb(N-1,(N-1)//2),2**(N-1))
def penrose(roots=(1,2,3,4,5),scheme='square root',quotaPercent=51):
 roots=list(roots);rv=[2*x+1 for x in roots];pops=[x*x for x in rv];weights=[1]*5 if scheme=='equal'else pops[:]if scheme=='population'else rv[:];quota=(sum(weights)*quotaPercent+99)//100;g=council(weights,quota,0,0);within=list(map(tie,pops));citizen=[p*frac(g['absolute'][i])for i,p in enumerate(within)];ideal=[1/p for p in within];total=sum(ideal)
 return{'roots':roots,'scheme':scheme,'quotaPercent':quotaPercent,'rootValues':rv,'populations':pops,'weights':weights,'quota':quota,'game':g,'within':list(map(q,within)),'citizen':list(map(q,citizen)),'idealDelegateShares':[q(x/total)for x in ideal],'asymptoticDelegateShares':[q(F(x,sum(rv)))for x in rv],'asymptoticWithin':[float(mp.sqrt(2/(mp.pi*N)))for N in pops],'citizenRange':{'min':q(min(citizen)),'max':q(max(citizen))}}
def bill(h,s,p,v,H,S,VP,override):
 if override and 3*h>=2*H and 3*s>=2*S:return True
 return bool(p and 2*h>H and(2*s>S or(VP and 2*s==S and v)))
@lru_cache(None)
def legislature_summary(H,S,VP,override):
 roles=[H,S,1,int(VP)];N=sum(roles);orders=factorial(N);ssi=[];swings=[];by_size=[]
 for role,population in enumerate(roles):
  row=[0]*N
  if population:
   remaining=[k-int(i==role)for i,k in enumerate(roles)]
   # Chamber members can only be pivotal at a chamber threshold boundary.
   hs=sorted({H//2,(2*H+2)//3-1})if role==0 else range(remaining[0]+1)
   ss=sorted({S//2,(2*S+2)//3-1,*([S//2-1]if VP and S%2==0 else[])})if role==1 else range(remaining[1]+1)
   for h,s,p,v in product(hs,ss,range(remaining[2]+1),range(remaining[3]+1)):
    if h<0 or h>remaining[0]or s<0 or s>remaining[1]:continue
    old=bill(h,s,p,v,H,S,VP,override);x=[h,s,p,v];x[role]+=1;new=bill(*x,H,S,VP,override)
    if new and not old:row[h+s+p+v]+=comb(remaining[0],h)*comb(remaining[1],s)*comb(remaining[2],p)*comb(remaining[3],v)
  probability=sum((F(count,N*comb(N-1,k))for k,count in enumerate(row)),F(0));numerator=probability*orders;assert numerator.denominator==1;ssi.append(numerator.numerator);swings.append(sum(row));by_size.append(row)
 assert sum(roles[i]*ssi[i]for i in range(4))==orders
 return{'H':H,'S':S,'vicePresident':VP,'override':override,'counts':roles,'N':N,'orderings':str(orders),'ssiCounts':list(map(str,ssi)),'swings':list(map(str,swings)),'swingBySize':[list(map(str,r))for r in by_size],'ssi':[q(F(x,orders))if roles[i]else None for i,x in enumerate(ssi)],'absolute':[q(F(x,2**(N-1)))if roles[i]else None for i,x in enumerate(swings)],'bodySSI':[q(F(x*roles[i],orders))for i,x in enumerate(ssi)]}
def legislature(H=435,S=100,vicePresident=True,override=True,houseYes=218,senateYes=51,presidentYes=True,viceYes=True):
 g=legislature_summary(H,S,vicePresident,override);mh=2*houseYes>H;ms=2*senateYes>S;tb=bool(vicePresident and 2*senateYes==S and viceYes);signature=bool(mh and(ms or tb)and presidentYes);ov=bool(override and 3*houseYes>=2*H and 3*senateYes>=2*S)
 return{**g,'houseYes':houseYes,'senateYes':senateYes,'presidentYes':presidentYes,'viceYes':viceYes,'thresholds':{'houseMajority':H//2+1,'senateMajority':S//2+1,'houseOverride':(2*H+2)//3,'senateOverride':(2*S+2)//3},'routes':{'majorityHouse':mh,'majoritySenate':ms,'tieBreak':tb,'signature':signature,'override':ov,'passes':signature or ov}}
@lru_cache(None)
def veto_summary(permanent,ordinary,quota):
 n=permanent+ordinary;veto_bits=(1<<permanent)-1
 return analyze(n,lambda mask,total,count:mask&veto_bits==veto_bits and count>=quota,table=False)
def vetoCouncil(permanent=5,ordinary=10,quota=9,seed=37,reveal=15):
 n=permanent+ordinary;g=veto_summary(permanent,ordinary,quota);order=list(range(n));state=seed+1
 for i in range(n-1,0,-1):
  state=(state*1664525+1013904223)&0xffffffff;j=state*(i+1)//2**32;order[i],order[j]=order[j],order[i]
 steps=[];mask=0;pivot=None;veto_bits=(1<<permanent)-1
 for k,i in enumerate(order):
  before=mask&veto_bits==veto_bits and mask.bit_count()>=quota;mask|=1<<i;win=mask&veto_bits==veto_bits and mask.bit_count()>=quota;crossing=not before and win
  if crossing:pivot=i
  steps.append({'position':k+1,'player':i,'mask':mask,'count':mask.bit_count(),'vetoYes':(mask&veto_bits).bit_count(),'win':win,'pivot':crossing})
 return{**g,'permanent':permanent,'ordinary':ordinary,'quota':quota,'seed':seed,'reveal':reveal,'order':order,'steps':steps,'pivot':pivot,'visible':steps[:reveal]}
@lru_cache(None)
def trade_summary(mode,gens):
 weights=[4,3,2,1,1,1]if mode=='weighted'else[1]*6
 def win(mask,total,count):
  if mode=='bicameral':return(mask&7).bit_count()>=2 and(mask>>3).bit_count()>=2
  if mode=='weighted':return total>=7
  return any(mask&g==g for g in gens)
 game=analyze(6,win,weights);W=[r['mask']for r in game['table']if r['win']];L=[r['mask']for r in game['table']if not r['win']];trade=None;certificate=None
 # Independent combinations-with-replacement enumerator; exact appearance vectors.
 for k in (2,3):
  losses={}
  for t in combinations_with_replacement(L,k):losses.setdefault(tuple(sum(bool(s>>i&1)for s in t)for i in range(6)),t)
  for t in combinations_with_replacement(W,k):
   counts=tuple(sum(bool(s>>i&1)for s in t)for i in range(6))
   if counts in losses:trade={'k':k,'winning':list(t),'losing':list(losses[counts]),'appearances':list(counts)};break
  if trade:break
 if not trade:
  for weights in product(range(5),repeat=6):
   if not any(weights):continue
   totals=[sum(weights[i]for i in range(6)if mask>>i&1)for mask in range(64)];lo=max(totals[s]for s in L);hi=min(totals[s]for s in W)
   if lo<hi:certificate={'weights':list(weights),'quota':lo+1,'maxLosingWeight':lo,'minWinningWeight':hi};break
 return{'mode':mode,'generators':list(gens),'game':game,'trade':trade,'certificate':certificate,'status':'nonweighted certificate'if trade else'weighted certificate'if certificate else'inconclusive bounded search','tradeLengthsSearched':[2,3],'weightSearchBound':4}
def trade(mode='bicameral',generators=(3,12,48)):return trade_summary(mode,tuple(generators))
@lru_cache(None)
def electoral_summary(quota):
 rows=[]
 for omitted,(code,name,weight)in enumerate(ALLOC):
  # Rebuild the polynomial from the other50members; no production polynomial division.
  coeff=[1]
  for j,(_,_,w)in enumerate(ALLOC):
   if j==omitted:continue
   next_coeff=[0]*(len(coeff)+w)
   for k,count in enumerate(coeff):next_coeff[k]+=count;next_coeff[k+w]+=count
   coeff=next_coeff
  swings=sum(coeff[max(0,quota-weight):quota]);rows.append({'code':code,'name':name,'weight':weight,'swings':str(swings)})
 total=sum(int(r['swings'])for r in rows)
 return{'rows':[{**r,'absolute':q(F(int(r['swings']),2**50)),'normalized':q(F(int(r['swings']),total))}for r in rows],'totalSwings':str(total)}
def electoral(quota=270,scale=2,belief='fair independent',selected=4):
 base=electoral_summary(quota);rows=[]
 for r in base['rows']:
  N=2*scale*r['weight']+1;p=tie(N)if belief=='fair independent'else F(1,N);rows.append({**r,'hypotheticalPopulation':N,'within':q(p),'citizen':q(p*frac(r['absolute'])),'voteShare':q(F(r['weight'],538))})
 groups=[]
 for w in sorted({r['weight']for r in rows}):
  ms=[r for r in rows if r['weight']==w];r=ms[0];groups.append({'weight':w,'codes':[r['code']for r in ms],'count':len(ms),**{k:r[k]for k in ['absolute','normalized','hypotheticalPopulation','within','citizen']}})
 return{'quota':quota,'scale':scale,'belief':belief,'selected':selected,'totalWeight':538,'totalJurisdictions':51,'totalSwings':base['totalSwings'],'rows':rows,'groups':groups,'inspected':rows[selected],'allocationPeriod':'2024 and 2028; 2020 Census','allocationReadDate':'2026-10-27','wholeJurisdictionBlocAssumption':True,'hypotheticalPopulationIsObserved':False}
def portfolios(seats=(42,30,18,10),quota=51,mask=3,cabinetSize=10,reserved=0):
 seats=list(seats);game=council(seats,quota,0,mask);members=game['selected']['members'];cs=game['selected']['weight'];counts=[0]*4;formateur=None;reserve=0
 if members and cs:
  formateur=min(members,key=lambda i:(-seats[i],i));reserve=min(reserved,cabinetSize);remaining=cabinetSize-reserve;targets={i:F(remaining*seats[i],cs)for i in members}
  for i,t in targets.items():counts[i]=t.numerator//t.denominator
  priority=sorted(members,key=lambda i:(-(targets[i]-counts[i]),i))
  for i in priority[:remaining-sum(counts)]:counts[i]+=1
  counts[formateur]+=reserve
 ss=[q(F(s,cs))if cs and i in members else None for i,s in enumerate(seats)];ps=[q(F(c,cabinetSize))if cs and i in members else None for i,c in enumerate(counts)];res=[q(frac(ps[i])-frac(ss[i]))if ss[i]else None for i in range(4)]
 return{'seats':seats,'quota':quota,'mask':mask,'cabinetSize':cabinetSize,'reserved':reserved,'game':game,'coalitionSeats':cs,'formateur':formateur,'usedReserve':reserve,'counts':counts,'seatShares':ss,'portfolioShares':ps,'residuals':res,'sourceSummary':[{**r,'correlation':q(F(r['correlationThousandths'],1000))}for r in FACTS['gamsonSummary']],'observedCabinetMicrodata':False}
def verify_small_assemblies():
 for H,S,VP,override in product([3,5,7],[3,4,5],[False,True],[False,True]):
  g=legislature_summary(H,S,VP,override);N=g['N'];indices=[0,H,H+S,H+S+1 if VP else None]
  for role,index in enumerate(indices):
   if index is None:continue
   row=[0]*N
   for mask in range(1<<N):
    if mask>>index&1:continue
    def literal(s):
     hs=sum((s>>i)&1 for i in range(H));ss=sum((s>>i)&1 for i in range(H,H+S));ps=(s>>(H+S))&1;vs=(s>>(H+S+1))&1 if VP else 0
     return bool((override and hs>=(2*H+2)//3 and ss>=(2*S+2)//3)or(ps and hs>H/2 and(ss>S/2 or(VP and ss==S/2 and vs))))
    if not literal(mask)and literal(mask|(1<<index)):row[mask.bit_count()]+=1
   assert list(map(str,row))==g['swingBySize'][role],(H,S,VP,override,role)
def make_cases():
 rng=random.Random(714203);cases=[]
 def add(f,a):cases.append({'family':f,'args':a,'expected':globals()[f](**a)})
 for family in ['council','ordering','eec','entrant','penrose','legislature','vetoCouncil','trade','electoral','portfolios']:add(family,{})
 for n in [2,3,4,5,6]:
  for w,qta in [([0]*n,1),([1]*n,1),([1]*n,n),([1]*n,n+1)]:add('council',{'weights':w,'quota':qta,'mask':(1<<n)-1})
 while sum(c['family']=='council'for c in cases)<96:
  n=rng.randint(2,6);w=[rng.randint(0,12)for _ in range(n)];add('council',{'weights':w,'quota':rng.randint(1,max(1,sum(w)+1)),'minMembers':rng.randint(0,n),'mask':rng.randrange(1<<n)})
 for k in range(64):
  n=rng.randint(2,6);w=[rng.randint(0,9)for _ in range(n)];add('ordering',{'weights':w,'quota':rng.randint(1,max(1,sum(w))),'index':rng.randrange(factorial(n)),'reveal':rng.randint(0,n)})
 for qta,four in product(range(1,18),[False,True]):add('eec',{'quota':qta,'fourCountries':four,'mask':7 if qta==12 else rng.randrange(64)})
 for k in range(64):
  n=rng.randint(3,5);w=[rng.randint(0,12)for _ in range(n)];add('entrant',{'weights':w,'quota':rng.randint(1,max(1,sum(w))),'newWeight':[0,1,12][k%3],'mask':rng.randrange(1<<n)})
 for k in range(60):add('penrose',{'roots':[rng.randint(1,10)for _ in range(5)]if k>=6 else[[1]*5,[10]*5,[1,2,3,4,5]][k%3],'scheme':['equal','population','square root'][k%3],'quotaPercent':[1,51,100][k%3]if k<9 else rng.randint(1,100)})
 for VP,override in product([False,True],[False,True]):add('legislature',{'vicePresident':VP,'override':override})
 for k in range(24):
  H,S=[(3,3),(5,3),(7,5),(5,4)][k%4];add('legislature',{'H':H,'S':S,'vicePresident':bool(k%2),'override':bool((k//2)%2),'houseYes':rng.randint(0,H),'senateYes':rng.randint(0,S),'presidentYes':bool((k//3)%2),'viceYes':bool((k//5)%2)})
 for k in range(32):
  perm,ordinary=[(5,10),(2,3),(1,4),(3,4)][k%4];add('vetoCouncil',{'permanent':perm,'ordinary':ordinary,'quota':[perm,perm+ordinary,(perm+ordinary)//2+1][k%3]if (perm+ordinary)//2+1>=perm else perm,'seed':[0,37,999][k%3],'reveal':rng.randint(0,perm+ordinary)})
 for k in range(32):add('trade',{'mode':['bicameral','weighted','custom'][k%3],'generators':[rng.randint(1,63)for _ in range(3)]if k>=3 else[3,12,48]})
 for k in range(36):add('electoral',{'quota':[1,2,269,270,271,537,538][k%7],'scale':[1,2,20][k%3],'belief':['fair independent','common uniform lean'][k%2],'selected':[0,4,8,19,27,50][k%6]})
 for k in range(64):add('portfolios',{'seats':[rng.randint(0,60)for _ in range(4)],'quota':rng.randint(1,240),'mask':k%16,'cabinetSize':[1,10,30][k%3],'reserved':[0,1,10][k%3]})
 add('eec',{'quota':12,'fourCountries':True,'mask':39})
 for a in [{'seats':[0,0,0,0]},{'mask':0},{'seats':[1,1,1,1],'mask':15,'quota':3,'cabinetSize':1,'reserved':10}]:add('portfolios',a)
 for a in [{'houseYes':290,'senateYes':67,'presidentYes':False},{'houseYes':289,'senateYes':67,'presidentYes':False},{'houseYes':290,'senateYes':66,'presidentYes':False},{'senateYes':50,'viceYes':True},{'senateYes':50,'viceYes':False}]:add('legislature',a)
 return cases
if __name__=='__main__':
 import argparse
 ap=argparse.ArgumentParser();ap.add_argument('--out',default=str(HERE/'reference.json'));ap.add_argument('--digits',type=int,default=120);args=ap.parse_args();mp.mp.dps=args.digits;t=time.perf_counter();verify_small_assemblies();cases=make_cases();families={f:sum(r['family']==f for r in cases)for f in sorted({r['family']for r in cases})};obj={'method':'Independent exact Fraction subsets/permutations, rank-conditioned binomial chamber boundaries, separate leave-one-out electoral polynomial convolution, and mpmath asymptotic display. No production imports. Shared source facts are inputs, not a numerical oracle.','families':families,'cases':cases};b=(json.dumps(obj,separators=(',',':'),ensure_ascii=False)+'\n').encode();Path(args.out).write_bytes(b);print(json.dumps({'cases':len(cases),'families':families,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'digits':args.digits,'literalSmallChamberComparisons':36*4-18,'durationSeconds':time.perf_counter()-t},indent=2))
