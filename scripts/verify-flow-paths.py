"""Independent 100-digit closed-form reference for the prescribed flow sequence."""
import json, pathlib, sys
try:
    import mpmath as mp
except ModuleNotFoundError:
    sys.path.insert(0, '/tmp/atlas-numerical-python')
    import mpmath as mp
mp.mp.dps=150
r=(mp.sqrt(5)-1)/2
rows=[]
for n in [1,2,3,4,5,9,13,30,101,1001]:
    B=r*(1-r**(n//2))/(1-r)
    a=(n+1)//4;b=(n-1)//4
    A=r*(1-r**(2*a))/(1-r*r)
    C=r*r*(1-r**(2*b))/(1-r*r)
    f=[C,1+A,B,1+A+C-B,B-A,B-C,B,1+C,A]
    rows.append({'n':n,'bottleneck':str(1 if n==1 else r**((n-1+1)//2)),'flow':list(map(str,f)),'value':str(C+1+A+B)})
root=pathlib.Path(__file__).resolve().parents[1]
(root/'docs/verification/flow-paths-references.json').write_text(json.dumps({'precision':150,'r':str(r),'limit':str(2+mp.sqrt(5)),'rows':rows},indent=2)+'\n')
