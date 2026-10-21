"""Independent70-digit stationary paths and positive window quadratures.
No production imports; source claims are separately transcribed in the manifest.
"""
import json,sys
from pathlib import Path
import mpmath as mp
mp.mp.dps=70
D=mp.mpf
mask=2**32-1
def uniforms(seed):
 state=seed&mask
 while True:
  state=(state+0x6d2b79f5)&mask;t=((state^(state>>15))*(state|1))&mask;t^=(t+((t^(t>>7))*(t|61)&mask))&mask
  yield (D((t^(t>>14))&mask)+D('.5'))/2**32
def model(T,percent,Wcm,acm,seed,source):
 W=D(str(Wcm))/100;a=D(str(acm))/100;f=D(str(percent))/100;lam=T*(1-f);rows=[]
 for i in range(200):
  rng=uniforms(seed+1009*i+10301*source);foreign=next(rng)<f;x=D(0);row=[]
  while x<W:
   end=x-mp.log(next(rng))/(T*(1-f if foreign else f));stop=min(end,W)
   if foreign:row.append(dict(start=x,stop=stop,left=x==0,right=end>=W))
   x=end;foreign=not foreign
  rows.append(row)
 kept=[];exposure=D(0);events=censored=left=0;coverage=D(0)
 for row in rows:
  for s in row:
   length=s['stop']-s['start'];coverage+=length
   if s['left']:left+=1;continue
   if length>a:
    exposure+=length-a
    if s['right']:censored+=1
    else:events+=1
   if not s['right'] and length>=a:kept.append(length)
 xmax=min(W,max(a+5/lam,max(kept,default=D(0))*D('1.03')));dx=(xmax-a)/32;counts=[0]*32
 for x in kept:counts[min(31,int(mp.floor((x-a)/dx)))]+=1
 # Positive direct integrals, split into natural exponential scales.
 def quad(lo,hi):
  points=[lo]+[lo+k/lam for k in [1,2,4,8,16,32,64,128,256,512,1024] if lo+k/lam<hi]+[hi]
  return mp.quad(lambda l:(W-l)*mp.exp(-lam*l),points)
 Z=quad(a,W);bins=[]
 for i,count in enumerate(counts):
  lo=a+i*dx;hi=xmax if i==31 else a+(i+1)*dx
  bins.append(dict(lo=str(lo),hi=str(hi),count=count,observed=str(D(count)/len(kept)) if kept else '0',expected=str(quad(lo,hi)/Z)))
 return dict(paint=[[dict(start=str(s['start']),stop=str(s['stop']),left=s['left'],right=s['right']) for s in row] for row in rows[:3]],count=len(kept),exposure=str(exposure),events=events,censored=censored,left=left,observedFraction=str(coverage/(200*W)),estimate=str(events/(exposure*(1-f))) if exposure else None,expectedCount=str(200*f*lam**2*Z),xmax=str(xmax),bins=bins,tail=str(quad(xmax,W)/Z) if xmax<W else '0')
cases=[[1800,2,10,.05,1500,4,3,False],[20,.2,2,.3,100,.2,0,True],[4000,8,40,0,4000,10,9999,True],[330,2.3,10,.05,1500,4,3,False],[4000,8,2,.3,100,10,1,True],[255,5.8,17,.13,321,.7,2718,True]]
out=[]
for T,f,W,a,DT,Df,seed,den in cases:
 out.append(dict(args=[T,f,W,a,DT,Df,seed,den],N=model(T,f,W,a,seed,1),D=model(DT,Df,W,a,seed,2) if den else None))
dest=Path(sys.argv[1]) if len(sys.argv)>1 else Path('docs/verification/bighist-admixture-reference.json')
dest.write_text(json.dumps(out,indent=2)+'\n')
print('PASS independent70digit200-window paths/complete-selection/censored-exposure and positive bin quadratures for6profiles')
