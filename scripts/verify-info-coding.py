"""Independent Fraction enumeration of fixed-block coding probabilities/cumulatives."""
from fractions import Fraction as F
from itertools import product
from json import dumps
from pathlib import Path

def exact_model(p):
    a=list(map(F,p)); total=sum(a)
    return [x/total for x in a]

def reference(text,p,adaptive):
    # Enumerate the full fixed-length alphabet rather than following interval updates.
    def prob(s):
        counts=[1,1,1]; value=F(1)
        for c in s:
            j='abc'.index(c)
            value*=F(counts[j],sum(counts)) if adaptive else p[j]
            counts[j]+=1
        return value
    lo=F(0)
    for a in product('abc',repeat=len(text)):
        s=''.join(a); weight=prob(s)
        if s==text: break
        lo+=weight
    hi=lo+prob(text)
    if hi==lo: return {'text':text,'error':True}
    k=0
    while True:
        j=-(-(lo.numerator*2**k)//lo.denominator)
        if F(j+1,2**k)<=hi:break
        k+=1
    return {'text':text,'L':str(lo.numerator),'U':str(hi.numerator),'ld':str(lo.denominator),'ud':str(hi.denominator),'code':format(j,f'0{k}b') if k else ''}

groups=[]
for weights in [[.6,.3,.1],[.25,.5,.25],[0,.5,.5],[1,0,0]]:
    for adaptive in [False,True]:
        p=exact_model(weights)
        rows=[reference(''.join(s),p,adaptive) for n in range(4) for s in product('abc',repeat=n)]
        groups.append({'p':weights,'adaptive':adaptive,'rows':rows})
Path('docs/verification/info-coding-references.json').write_text(dumps({'method':'Fraction; enumerate complete block CDF, then enumerate dyadic mesh cells','groups':groups},indent=2)+'\n')
