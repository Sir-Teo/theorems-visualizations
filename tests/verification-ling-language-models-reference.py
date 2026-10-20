"""Independent corpus-scan oracle. Only raw embedded source text is imported from JavaScript."""
import collections,json,math,re,pathlib,subprocess
root=pathlib.Path(__file__).resolve().parents[1]
source=subprocess.check_output(['node','--input-type=module','-e',"import{TEXTS}from'./content/ling/ch04.shared.js';process.stdout.write(TEXTS.alice)"],cwd=root,text=True)
tokens=re.findall(r"[a-z]+(?:'[a-z]+)*",source.lower().replace('’',"'").replace('‘',"'"));cut=math.floor(len(tokens)*.85);frequencies=collections.Counter(tokens[:cut]);train=[w if frequencies[w]>1 else '<unk>'for w in tokens[:cut]];vocab=sorted(set(train)|{'<unk>'});test=[w if w in vocab else '<unk>'for w in tokens[cut:]];tables=[]
for order in range(4):
 table=collections.defaultdict(collections.Counter)
 for i in range(order,len(train)):table[tuple(train[i-order:i])][train[i]]+=1
 tables.append(table)
def prob(history,w,n,mode,lam):
 o=min(n-1,len(history));r=tables[o].get(tuple(history[-o:]) if o else (),{});total=sum(r.values())
 if mode=='add':return(r.get(w,0)+lam)/(total+lam*len(vocab))
 if mode=='mle':return r.get(w,0)/total if total else 0
 parts=[(.05,1/len(vocab))]
 for k in range(o+1):
  r=tables[k].get(tuple(history[-k:]) if k else (),{});z=sum(r.values())
  if z:parts.append((2**(k-o),r.get(w,0)/z))
 return math.fsum(a*p for a,p in parts)/math.fsum(a for a,p in parts)
rows=[]
for lam in [.001,.05,.333,1]:
 for n in range(1,5):
  for mode in ['add','interp','mle']:
   probabilities=[prob(test[:i],w,n,mode,lam)for i,w in enumerate(test)];bad=probabilities.count(0);bits=math.fsum(-math.log2(p)for p in probabilities if p);rows.append(dict(n=n,mode=mode,lambda_=lam,bits=None if bad else bits,perplexity=None if bad else 2**(bits/len(test)),unsupported=bad))
path=root/'docs/verification/ling-language-models-reference.json';path.write_text(json.dumps(dict(train=cut,test=len(test),V=len(vocab),rows=rows),indent=2)+'\n');print('Wrote48 full-Alice evaluations with Python counter tables/fsum; no JS model imported:',path)
