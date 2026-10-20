"""Independent Decimal geometric construction; no production import or symbolic DH matrix."""
import json, decimal, pathlib, hashlib
from decimal import Decimal as D
ROOT=pathlib.Path(__file__).resolve().parents[1]
decimal.getcontext().prec=85
PI=D('3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628')
def trig(deg):
 x=D(str(deg))*PI/180; ss=x; cs=D(1); a=x; b=D(1)
 for j in range(1,160):
  a=-a*x*x/D((2*j)*(2*j+1)); b=-b*x*x/D((2*j-1)*(2*j)); ss+=a;cs+=b
 return ss,cs
def add(a,b):return[x+y for x,y in zip(a,b)]
def scale(a,k):return[x*k for x in a]
def step(frame,row):
 p,x,y,z=frame;a,alpha,d,theta=map(lambda t:D(str(t)),row);s,c=trig(theta);S,C=trig(alpha)
 X=add(scale(x,c),scale(y,s));Y=add(scale(x,-s),scale(y,c));foot=add(p,scale(z,d));P=add(foot,scale(X,a))
 return (P,X,add(scale(Y,C),scale(z,S)),add(scale(Y,-S),scale(z,C))),foot
cases=[]
default=[[0,90,.6,30],[1,0,0,40],[.8,0,0,-50],[.4,-90,.2,20]]
rows=[default,[[1.5,180,1,180],[-1.5,-180,-1,-180],[1.5,90,-1,-90],[-1.5,-90,1,90]],[[0,0,0,0]]*4,[[.29,73,-.47,-127],[-.83,-69,.23,89],[1.13,117,-.91,137],[-1.41,-153,.77,-19]],[[1.5,0,1,0]]*4]
for group,R in enumerate(rows):
 for n in range(1,5):
  frame=([D(0)]*3,[D(1),D(0),D(0)],[D(0),D(1),D(0)],[D(0),D(0),D(1)]);frames=[];feet=[]
  for row in R[:n]:
   frame,foot=step(frame,row);p,x,y,z=frame;frames.append([[x[i],y[i],z[i],p[i]] for i in range(3)]+[[D(0),D(0),D(0),D(1)]]);feet.append(foot)
  fmt=lambda v:format(v,'.70g')
  cases.append(dict(group=group,rows=R,n=n,frames=[[[fmt(x) for x in r]for r in m]for m in frames],feet=[[fmt(x)for x in r]for r in feet]))
out=dict(method='85-digit Decimal: recursive world-frame x/y/z basis rotations and offsets; 160-term sine/cosine Taylor sums; no DH matrix import',source=dict(url='https://web.archive.org/web/20220615161556id_/https://home.konkuk.ac.kr/~cgkang/courses/robotics/courseMaterials/DHpaper.pdf',sha256='dd9f1c8ad008fe65d211707aa394c0b81458a38494cdd0f650e38282141ac28e',printedPages='215–221',matrixPage=219),cases=cases)
p=ROOT/'docs/verification/robot-denavit-reference.json';p.write_text(json.dumps(out,indent=2)+'\n');print(p,len(cases),hashlib.sha256(p.read_bytes()).hexdigest())
