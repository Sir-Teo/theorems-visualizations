"""Independent fsum covariance and complete integer-shift enumeration on raw texts.
node --input-type=module -e "import{TEXTS}from'./content/ling/ch04.shared.js';import fs from'node:fs';fs.writeFileSync('/tmp/ling-wordstats-inputs.json',JSON.stringify(TEXTS))"
python3 tests/verification-ling-wordstats-reference.py /tmp/ling-wordstats-inputs.json > docs/verification/ling-wordstats-reference.json
"""
import collections, hashlib, json, math, re, sys, unicodedata
texts=json.load(open(sys.argv[1])); out={}
for key,text in texts.items():
 tokens=re.findall(r"[a-zà-öø-ÿœæß]+(?:'[a-zà-öø-ÿœæß]+)*",unicodedata.normalize('NFC',text).lower().replace('’',"'").replace('‘',"'"));counts=collections.Counter(tokens)
 rows=[[w,c,i+1,len(w.replace("'",''))] for i,(w,c) in enumerate(sorted(counts.items(),key=lambda p:(-p[1],p[0])))]; groups=collections.defaultdict(list)
 for w,c,r,L in rows:groups[c].append(L)
 def fit(n,b):
  x=[math.log(r+b) for _,_,r,_ in rows[:n]]; y=[math.log(c) for _,c,_,_ in rows[:n]];mx=math.fsum(x)/n;my=math.fsum(y)/n
  s=max(0,-math.fsum((a-mx)*(c-my) for a,c in zip(x,y))/math.fsum((a-mx)**2 for a in x));lnC=my+s*mx
  return dict(n=n,b=b,s=s,lnC=lnC,sse=math.fsum((v-lnC+s*u)**2 for u,v in zip(x,y)))
 fits={}
 for extent in ['100','1000','all']:
  n=min(len(rows),len(rows) if extent=='all' else int(extent)); grid=[fit(n,b) for b in range(201)]; fits[extent]={'fits':[grid[b] for b in [0,1,3,9,37,100,200]],'best':min(grid,key=lambda f:f['sse'])}
 out[key]=dict(N=len(tokens),V=len(rows),rowHash=hashlib.sha256(json.dumps(rows,ensure_ascii=False,separators=(',',':')).encode()).hexdigest(),groups=[[c,len(a),sum(a),sum(a)/len(a)] for c,a in sorted(groups.items()) if len(a)>=5],fits=fits)
print(json.dumps(out,ensure_ascii=False,indent=2))
