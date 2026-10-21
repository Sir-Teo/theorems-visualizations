"""Independent 90-digit author-MATLAB sum and analytic two-partial derivative."""
from decimal import Decimal as D, localcontext
from pathlib import Path
import json
with localcontext() as ctx:
 ctx.prec=90;c4=D('261.6256');ln2=D(2).ln()
 def score(fs,s):
  terms=sorted((D(f)*D(h),D(a)) for f in fs for h,a in s if D(a)>0);v=D(0)
  for j,(f,a) in enumerate(terms):
   for g,b in terms[j+1:]:
    x=D('.24')*(g-f)/(D('.0207')*f+D('18.96'));v+=5*min(a,b)*((-D('3.51')*x).exp()-(-D('5.75')*x).exp())
  return v
 def counter(r):
  P=sorted([(c4,D(0)),(2*c4,D(0)),(r*c4,c4),(2*r*c4,2*c4)]);v=D(0);gradient=D(0)
  for i,(f,df) in enumerate(P):
   for g,dg in P[i+1:]:
    den=D('.0207')*f+D('18.96');delta=g-f;x=D('.24')*delta/den;dx=D('.24')*((dg-df)*den-delta*D('.0207')*df)/den**2
    e=(-D('3.51')*x).exp();q=(-D('5.75')*x).exp();v+=5*(e-q);gradient+=5*(-D('3.51')*e+D('5.75')*q)*dx
  return dict(ratio=str(r),score=str(v),derivative=str(gradient),cents=str(1200*r.ln()/ln2))
 counterexample=[counter(D(r)) for r in ['1.4814','1.4815','1.4816']]
 assert D(counterexample[1]['score'])<D(counterexample[0]['score']) and D(counterexample[1]['score'])<D(counterexample[2]['score'])
 assert D(counterexample[0]['derivative'])<0<D(counterexample[-1]['derivative'])
 fixtures=[]
 for A in ['1.87','2','2.1','2.123456789','2.22']:
  s=[((D(A).ln()*D(j).ln()/ln2).exp(),D('.88')**(j-1)) for j in range(1,7)]
  dyads=[]
  for r in ['1','1.25','1.4815','1.5','2',A]:dyads.append(dict(ratio=float(r),score=float(score([c4,c4*D(r)],s))))
  cadences={}
  for action in ['related','ordinary','harmonic','baseline']:
   spec=s if action in ['related','ordinary'] else [(D(j),D('.88')**(j-1)) for j in range(1,7)]
   step=D(A).ln()/12 if action in ['related','harmonic'] else ln2/12
   events=[[c4*(step*k).exp() for k in chord] for chord in [[0,4,7],[5,9,12],[7,11,14],[0,4,7]]]
   cadences[action]=dict(frequencies=[[float(f) for f in fs] for fs in events],mean=float(sum(score(fs,spec) for fs in events)/4))
  fixtures.append(dict(A=float(A),s=[[float(h),float(a)] for h,a in s],dyads=dyads,cadences=cadences))
 result=dict(method='90-digit Decimal exponentials, independently sorted MATLAB all-pair formula and analytic derivative; arbitrary score units',counterexample=counterexample,stretch=fixtures)
p=Path(__file__).resolve().parents[1]/'docs/verification/music-roughness-reference.json';p.write_text(json.dumps(result,indent=2)+'\n');print('PASS independent90-digit counterexample/derivative,30dyads and20completecadence score fixtures')
