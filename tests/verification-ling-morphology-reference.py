"""Independent literal surface patterns (not the production tier assignment algorithm)."""
import itertools,json,pathlib
patterns=['{0}a{1}a{2}','{0}ā{1}i{2}','{0}i{1}ā{2}','ma{0}{1}ū{2}','ma{0}{1}a{2}at','{0}u{1}u{2}','{0}a{1}{2}']
roots=[''.join(x) for x in itertools.product('ktbšʕḵ',repeat=3)]+['drs']
rows=[[r,i,p.format(*r)] for r in roots for i,p in enumerate(patterns)]
copy=[]
for n in range(1,7):
 for chars in itertools.product('abet',repeat=n):
  word=''.join(chars)
  copy.append([word,'full',word+'-'+word])
  if word[0] in 'bt' and len(word)>1 and word[1] in 'ae':
   copy.append([word,'CV',word[:2]+word])
   if len(word)>2 and word[2] in 'bt':copy.append([word,'CVC',word[:3]+word])
p=pathlib.Path(__file__).resolve().parents[1]/'docs/verification/ling-morphology-reference.json'
p.write_text(json.dumps({'roots':rows,'copies':copy},ensure_ascii=False,indent=1)+'\n')
print(f'{len(rows)} literal template forms; {len(copy)} independently classified copy outputs')
