"""Independent exact proxy grouping and60digit Gaussian elimination on normal equations.
python3 tests/verification-ling-menzerath-reference.py /tmp/atlas-worker-one/ling-wordstats-inputs.json > docs/verification/ling-menzerath-reference.json
Original Table2/3/4 observed rows transcribed from original1980 scan pp6–8.
"""
import collections,json,math,re,sys,unicodedata
from fractions import Fraction as F
from decimal import Decimal as D,getcontext
getcontext().prec=60
raw=json.load(open(sys.argv[1]));sources=dict(indonesian=[3.10,2.53,2.29,2.12,2.09],english=[2.79,2.73,2.68,2.51,2.41,2.23,2.00],bachka=[239.91,240.92,204.28,183.95,177.06]);out={}
def fit(groups,form):
 y=[D(str(g['y'])).ln() for g in groups];X=[[D(1)]+([D(g['x']).ln()]if form in ['alt','pow']else[])+([D(g['x'])]if form in ['alt','exp']else[])for g in groups];k=len(X[0]);A=[[sum(row[i]*row[j]for row in X)for j in range(k)]+[sum(row[i]*v for row,v in zip(X,y))]for i in range(k)]
 for i in range(k):
  pivot=max(range(i,k),key=lambda j:abs(A[j][i]));A[i],A[pivot]=A[pivot],A[i];v=A[i][i];A[i]=[x/v for x in A[i]]
  for j in range(k):
   if i==j:continue
   v=A[j][i];A[j]=[x-v*z for x,z in zip(A[j],A[i])]
 c=[r[-1]for r in A];lnA=c[0];b=c[1]if form in ['alt','pow']else D(0);cc=-c[-1]if form in ['alt','exp']else D(0);sse=sum((v-sum(a*z for a,z in zip(row,c)))**2 for row,v in zip(X,y));return dict(lnA=str(lnA),a=str(lnA.exp()),b=str(b),c=str(cc),sse=str(sse))
for key in ['indonesian','english','bachka','alice','pride','de','es']:
 for count in ['types','tokens']:
  if key in sources:groups=[dict(x=i+1,n=None,y=v,sd=None)for i,v in enumerate(sources[key])];included=alln=None
  else:
   toks=re.findall(r"[a-zà-öø-ÿœæß]+(?:'[a-zà-öø-ÿœæß]+)*",unicodedata.normalize('NFC',raw[key]).lower().replace('’',"'").replace('‘',"'"));counts=collections.Counter(toks);by=collections.defaultdict(list);included=0;alln=len(toks)if count=='tokens'else len(counts)
   for w,f in counts.items():
    bare=w.replace("'",'');en=key in ['alice','pride'];k=len(re.findall('[aeiouy]+'if en else'[aeiouyäöüéèàáíóúâêîôû]+',bare))
    if en:
     if bare.endswith('e')and not bare.endswith('le')and k>1:k-=1
     if bare.endswith('ed')and not re.search('[td]ed$',bare)and k>1:k-=1
     if bare.endswith('es')and not re.search('[aeiouyslxzch]es$',bare)and k>1:k-=1
    k=max(1,k)
    if k>7:continue
    n=f if count=='tokens'else 1;by[k].append((F(len(bare),k),n));included+=n
   groups=[]
   for k,rows in sorted(by.items()):
    n=sum(n for y,n in rows)
    if n<5:continue
    mean=sum(y*n for y,n in rows)/n;var=sum(n*(y-mean)**2 for y,n in rows)/n;groups.append(dict(x=k,n=n,y=float(mean),sd=math.sqrt(var)))
  out[key+':'+count]=dict(groups=groups,included=included,all=alln,fits={form:fit(groups,form)for form in ['alt','pow','exp']})
print(json.dumps(out,indent=2))
