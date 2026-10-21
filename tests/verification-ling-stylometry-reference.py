"""Read the actual official PG1404 edition, not production data;50digit score oracle.
python3 tests/verification-ling-stylometry-reference.py /path/to/federalist-pg1404.txt > docs/verification/ling-stylometry-reference.json
"""
import collections,hashlib,json,pathlib,re,sys
from decimal import Decimal as D,getcontext
getcontext().prec=50
p=pathlib.Path(sys.argv[1]);raw=p.read_bytes();assert hashlib.sha256(raw).hexdigest()=='0b92fadc9d7afd767eefd27805a20e44417ff26d1fb2f964229f39dcc7b2a65d'
s=raw.decode('utf-8-sig').replace('\r\n','\n');matches=list(re.finditer(r'^FEDERALIST No\. (\d+)\s*$',s,re.M));assert [int(m[1]) for m in matches]==list(range(1,86))
words=['by','from','to','upon','while','whilst','enough','also','there','on','would','an','of','the','and','that'];rows=[]
for i,m in enumerate(matches):
 n=int(m[1]);part=s[m.end():matches[i+1].start() if i<84 else s.index('*** END')];salute=re.search(r'To the People of the State of New York[:.]',part);assert salute
 body=part[salute.end():].split('PUBLIUS',1)[0];assert 'PUBLIUS' in part or n==37;tokens=re.findall(r"[a-z]+(?:'[a-z]+)*",body.lower().replace('’',"'"));counts=collections.Counter(tokens);header=part[:salute.start()]
 if re.search(r'^MADISON, with HAMILTON\s*$',header,re.M):a='HM'
 elif re.search(r'^HAMILTON\s*$',header,re.M):a='H'
 elif re.search(r'^MADISON\s*$',header,re.M):a='M'
 elif re.search(r'^JAY\s*$',header,re.M):a='J'
 else:raise ValueError((n,header))
 if n in list(range(49,59))+[62,63]:assert a=='M';a='?'
 rows.append(dict(n=n,a=a,N=len(tokens),c={w:counts[w] for w in words}))
assert sum(p['N'] for p in rows)==188133
assert collections.Counter(p['a'] for p in rows)==dict(H=51,M=14,J=5,HM=3,**{'?':12})
def rate(papers,ws):return {w:(sum(D(p['c'][w]) for p in papers)+D('.5'))/(sum(p['N'] for p in papers)+1) for w in ws}
def score(p,H,M,ws):return [D(p['c'][w])*(M[w]/H[w]).ln()-p['N']*(M[w]-H[w]) for w in ws]
known=[p for p in rows if p['a'] in ['H','M']];H=[p for p in known if p['a']=='H'];M=[p for p in known if p['a']=='M'];models={}
for key,ws in dict(upon=['upon'],bym=['by','from','to'],all=words).items():
 h,m=rate(H,ws),rate(M,ws);selected=[];loo=[]
 for p in rows:
  terms=score(p,h,m,ws);selected.append(dict(n=p['n'],terms=list(map(str,terms)),score=str(sum(terms))))
 for p in known:
  h0=rate([q for q in H if q['n']!=p['n']],ws);m0=rate([q for q in M if q['n']!=p['n']],ws);terms=score(p,h0,m0,ws);v=sum(terms);loo.append(dict(n=p['n'],score=str(v),predicted='M' if v>0 else 'H' if v<0 else 'tie'))
 models[key]=dict(words=ws,rH={w:str(v) for w,v in h.items()},rM={w:str(v) for w,v in m.items()},selected=selected,loo=loo)
print(json.dumps(dict(sourceSHA256=hashlib.sha256(raw).hexdigest(),rows=rows,models=models),indent=2))
