"""Independent joint-entropy and rank-count oracle. Imports only raw text."""
import collections,json,math,pathlib,re,subprocess
root=pathlib.Path(__file__).resolve().parents[1]
raw=subprocess.check_output(['node','--input-type=module','-e',"import{TEXTS}from'./content/ling/ch04.shared.js';process.stdout.write(TEXTS.alice)"],cwd=root,text=True)
symbols=re.sub('[^a-z]+',' ',raw.lower()).strip();N=len(symbols)-3;rows=[]
def H(counter):
 total=sum(counter.values());return-math.fsum((x/total)*math.log2(x/total)for x in counter.values())
for k in range(4):
 joint=collections.Counter(symbols[i-k:i+1]for i in range(3,len(symbols)));contexts=collections.Counter();by=collections.defaultdict(collections.Counter)
 for key,value in joint.items():contexts[key[:-1]]+=value;by[key[:-1]][key[-1]]+=value
 rank=[0]*27
 for distribution in by.values():
  for i,n in enumerate(sorted(distribution.values(),reverse=True)):rank[i]+=n
 q=[x/N for x in rank];weights=[(i+1)*(q[i]-(q[i+1]if i<26 else 0))for i in range(27)]
 rows.append(dict(k=k,N=N,contexts=len(by),q=q,conditionalEntropy=H(joint)-H(contexts),upper=-math.fsum(p*math.log2(p)for p in q if p),lower=math.fsum(w*math.log2(i+1)for i,w in enumerate(weights)),weights=weights))
p=root/'docs/verification/ling-shannon-reference.json';p.write_text(json.dumps(dict(method='joint entropy minus context entropy, independently counted common positions',rows=rows),indent=2)+'\n');print('Wrote independent full Alice joint-entropy / rank-mixture references:',p)
