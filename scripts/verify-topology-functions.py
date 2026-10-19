#!/usr/bin/env python3
"""Independent high-precision references: monotone-interval bisection, not inverse trig formulas."""
import json
from pathlib import Path
import mpmath as mp
mp.mp.dps=80
D=mp.mpf

def bisect(fun,a,b):
    fa=fun(a);fb=fun(b)
    if abs(fa)<D('1e-70'):return a
    if abs(fb)<D('1e-70'):return b
    assert fa*fb<0
    for _ in range(245):
        m=(a+b)/2;fm=fun(m)
        if fa*fm<=0:b=m
        else:a=m;fa=fm
    return (a+b)/2

def local(key,x,e,a):
    f=(lambda t:1/t) if key=='inv' else (lambda t:mp.sin(3*t*t))
    lo,hi=(a,D(1)) if key=='inv' else (D(0),D(2))
    parts=[lo,hi] if key=='inv' else sorted([lo,hi]+[mp.sqrt((mp.pi/2+k*mp.pi)/3) for k in range(4) if mp.pi/2+k*mp.pi<12])
    roots=[]
    for target in [f(x)-e,f(x)+e]:
        for left,right in zip(parts,parts[1:]):
            if (f(left)-target)*(f(right)-target)<=0:roots.append(bisect(lambda t:f(t)-target,left,right))
    return min([hi-lo]+[abs(y-x) for y in roots])

samples=[]
for key in ['sin','inv']:
    for a in ([D(0)] if key=='sin' else list(map(D,['.005','.02','.2','.5']))):
        for e in map(D,['.05','.4','1.5']):
            lo,hi=(a,D(1)) if key=='inv' else (D(0),D(2))
            for frac in map(D,['0','.001','.1','.33','.75','1']):
                x=lo+(hi-lo)*frac
                samples.append(dict(key=key,a=str(a),epsilon=str(e),x=str(x),delta=mp.nstr(local(key,x,e,a),65)))
            if key=='inv':
                value=hi-lo if e>=1/a-1 else bisect(lambda d:1/a-1/(a+d)-e,D(0),hi-lo)
                samples.append(dict(key='uniform-inv',a=str(a),epsilon=str(e),delta=mp.nstr(value,65)))
x,y=mp.findroot(lambda x,y:(D('2.5')*mp.cos(D('2.5')*x)+D('.4')*y,-2*mp.sin(2*y)+D('.4')*x),('.63','.06'))
wave=dict(x=mp.nstr(x,65),y=mp.nstr(y,65),value=mp.nstr(mp.sin(D('2.5')*x)+mp.cos(2*y)+D('.4')*x*y,65),boundary_upper=mp.nstr(max(1+mp.cos(D('.9'))+D('.2'),1+mp.sin(D('2.5')*mp.sqrt(1-D('.45')**2))+D('.18')),65))
out={'method':'mpmath 80 digits; monotone-interval bisection and stationary equations','wave_maximum':wave,'radii':samples}
path=Path(__file__).resolve().parents[1]/'docs/verification/topology-function-references.json'
path.write_text(json.dumps(out,indent=2)+'\n')
print('Wrote',path,len(samples),'independent radius references')
