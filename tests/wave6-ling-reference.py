"""Independent set/count/high-precision oracle; never imports production JS.
Original WCS factual files are read directly, not production aggregates.
"""
from pathlib import Path
from collections import defaultdict,Counter
from itertools import product
import argparse,json,math,re,random,hashlib
import mpmath as mp
ap=argparse.ArgumentParser();ap.add_argument('--dps',type=int,default=90);ap.add_argument('--out',required=True);ns=ap.parse_args();mp.mp.dps=ns.dps
M=lambda x:mp.mpf(x) # Native binary64 arguments retain their exact values.
def lin(n,a=0,b=1):
 a,b=M(a),M(b);return[a+(b-a)*i/(n-1)for i in range(n-1)]+[b]
def clean(x):
 if isinstance(x,dict):return{k:clean(v)for k,v in x.items()}
 if isinstance(x,(list,tuple)):return[clean(v)for v in x]
 if isinstance(x,mp.mpf):
  if abs(x)<M('1e-70'):return 0
  return float(mp.nstr(x,15))
 return x
NAMES=['Ada','Bo','Cy'];REL=[0,1,0,0,0,1,1,0,0];READ=[int(i//4==i%4)for i in range(16)]
WORLD=[dict(id=i,present=True,red=bool(i&1),square=bool(i&2),large=bool(i&4))for i in range(8)]
CORPUS='Cats chase mice. Dogs chase cats. Cats eat fish. Dogs eat meat. Birds eat seeds. Birds chase bugs. Mice eat seeds.'
DEFAULTS=dict(reference=dict(left=0,right=1,beliefs=[True,False,True]),composition=dict(subject=0,object=1,negative=False,relation=REL,step=4),truthWorld=dict(world=WORLD,quantifier='every',restrictor='red squares',predicate='large'),quantifiers=dict(aOnly=2,both=3,bOnly=2,outside=2,quantifier='most'),scope=dict(students=3,books=3,relation=READ,selectedStudent=0,selectedBook=0),presupposition=dict(embedding='affirmation',past=True,now=False),scalar=dict(n=6,alpha=4,allCost=0,priorSuccess=.5,continuation='plain'),deixis=dict(speaker=0,time=4,worldShift=0,radius=.4),prototype=dict(weights=[1,1,1,1],selected=0),colorFocus=dict(language=1,term=None,chip=0),distribution=dict(text=CORPUS,window=2,target=0,other=1,xContext=0,yContext=1),vagueness=dict(height=178,center=180,width=8,logisticScale=3),signValue=dict(system='English contrast',removeNeighbor=False,addContrast=False,anchor=50,selected=50))

def reference(a):
 l,r=a['left'],a['right'];refs=['Venus','Venus',None];beliefs=a['beliefs'];ids=[l,r]
 return dict(**a,expressions=['Morning Star','Evening Star','Odysseus'],senses=['dawn presentation','dusk presentation','fictional presentation'],referents=refs,identity=None if any(refs[i]is None for i in ids)else refs[l]==refs[r],sameSense=l==r,ordinary=[None if refs[i]is None else True for i in ids],indirect=[beliefs[i]for i in ids],substitutionPreservesReport=beliefs[l]==beliefs[r])
def composition(a):
 s,o=a['subject'],a['object'];R={(i//3,i%3)for i,v in enumerate(a['relation'])if v};extension=[i for i in range(3)if(i,o)in R];positive=(s,o)in R
 return dict(**a,names=NAMES,objectMeaning=o,predicateValues=[i in extension for i in range(3)],extension=extension,positive=positive,truth=not positive if a['negative']else positive,application=['object='+NAMES[o],'greets('+NAMES[o]+')',NAMES[s]+' greets '+NAMES[o],'negate proposition'if a['negative']else'retain proposition'])
def evaluate(q,A,B):
 if q=='every':return A<=B
 if q=='some':return bool(A&B)
 if q=='no':return not A&B
 if q=='most':return len(A&B)>len(A-B)
 if q=='exactly three':return len(A&B)==3
 if q=='union exactly three':return len(A|B)==3
 raise ValueError(q)
def quantifiers(a):
 A=set(range(a['aOnly']+a['both']));B=set(range(a['aOnly'],a['aOnly']+a['both']+a['bOnly']));truth=evaluate(a['quantifier'],A,B);restricted=evaluate(a['quantifier'],A,A&B)
 return dict(**a,a=len(A),b=len(B),union=len(A|B),universe=len(A|B)+a['outside'],truth=truth,restrictedTruth=restricted,sameInThisModel=truth==restricted,conservativeDefinition=a['quantifier']!='union exactly three',witnesses=sorted(A&B),counterexamples=sorted(A-B))
def truthWorld(a):
 domain={x['id']for x in a['world']if x['present']};A={x['id']for x in a['world']if x['present']and(a['restrictor']=='all present objects'or a['restrictor']=='red squares'and x['red']and x['square']or a['restrictor']=='blue circles'and not x['red']and not x['square'])};B={x['id']for x in a['world']if x['present']and(x['large']if a['predicate']=='large'else not x['large'])}
 return dict(**a,domain=sorted(domain),A=sorted(A),B=sorted(B),intersection=sorted(A&B),counterexamples=sorted(A-B),truth=evaluate(a['quantifier'],A,B),vacuous=not A and a['quantifier']=='every')
def scope(a):
 m,n=a['students'],a['books'];edges=[(i,j)for i in range(m)for j in range(n)if a['relation'][4*i+j]];R=set(edges);rows=[[j for j in range(n)if(i,j)in R]for i in range(m)];common=[j for j in range(n)if all((i,j)in R for i in range(m))]
 return dict(**a,rowWitnesses=rows,commonBooks=common,distributive=all(bool(row)for row in rows),shared=bool(common),counterexampleStudents=[i for i,row in enumerate(rows)if not row],edges=edges)
def presupposition(a):
 worlds=[]
 for i in range(4):
  p,n=bool(i&2),bool(i&1);stopped=not n if p else None;e=a['embedding']
  if e=='filtered conditional':v=not(p and n)
  elif not p:v=None
  elif e=='negation':v=n
  elif e=='question':v='no alternative'if n else'yes alternative'
  else:v=not n
  worlds.append(dict(id=i,past=p,now=n,stopped=stopped,value=v,admitted=v is True or isinstance(v,str)))
 admitted=[x for x in worlds if x['admitted']]
 return dict(**a,worlds=worlds,selected=next(x for x in worlds if x['past']==a['past']and x['now']==a['now']),admitted=[x['id']for x in admitted],projectsPast=all(x['past']for x in admitted),entailsNotNow=all(not x['now']for x in admitted),isAssertion=a['embedding']!='question')
def scalar(a):
 n=a['n'];alpha,cost,p=map(M,[a['alpha'],a['allCost'],a['priorSuccess']]);states=list(range(n+1));extensions=[{0},set(range(1,n+1)),{n}];truth=[[k in S for S in extensions]for k in states];literal=[[M(int(k in S))/len(S)for k in states]for S in extensions];costs=[M(0),M(0),cost];speaker=[]
 for k in states:
  weights=[mp.power(literal[j][k],alpha)*mp.exp(-alpha*costs[j])if k in extensions[j]else M(0)for j in range(3)];total=sum(weights);speaker.append([w/total for w in weights])
 prior=[mp.binomial(n,k)*p**k*(1-p)**(n-k)for k in states];support=extensions[1].copy()
 if a['continuation']=='in fact all':support&=extensions[2]
 if a['continuation']=='but none':support&=extensions[0]
 weights=[prior[k]*speaker[k][1]if k in support else M(0)for k in states];Z=sum(weights);posterior=[w/Z for w in weights]if Z else None
 return dict(**a,states=states,messages=['none','some','all'],truth=truth,supports=[len(S)for S in extensions],literal=literal,costs=costs,speaker=speaker,prior=prior,posterior=posterior,normalizer=Z,literalSupport=sorted(support),consistent=bool(support),allStillPossible=posterior is not None and posterior[n]>0)
def deixis(a):
 t,shift,r=map(M,[a['time'],a['worldShift'],a['radius']]);s=a['speaker'];position=lambda s,t:1+t/2 if s==0 else 9-t/3;here=position(s,t);other=here+shift
 return dict(**a,names=['Ada','Bo'],here=here,alternative=other,tuple=[s,here,t],truth=abs(shift)<=r,trajectories=[[[u,position(k,u)]for u in lin(41,0,10)]for k in range(2)],positions=[position(k,t)for k in range(2)],alternativePositions=[position(k,t)+(shift if k==s else 0)for k in range(2)])
EXAMPLES=[dict(name=n,bird=b,features=f)for n,b,f in [('robin',True,[1,1,1,1]),('sparrow',True,[1,1,1,.7]),('penguin',True,[0,.5,0,0]),('ostrich',True,[0,0,0,0]),('bat',False,[1,1,1,0])]]
def prototype(a):
 w=list(map(M,a['weights']));total=sum(w);scores=[sum(x*y for x,y in zip(w,map(M,e['features'])))/total if total else None for e in EXAMPLES]
 return dict(**a,total=total,features=['flies','small body','perches','song-like call'],examples=EXAMPLES,scores=scores,defined=total>0,selectedScore=scores[a['selected']],categoryMembership=EXAMPLES[a['selected']]['bird'])

SOURCE=Path(__file__).parent/'fixtures/wave6-ling-wcs';L={};ALIASES=defaultdict(list);FOCI=defaultdict(set);ALL=defaultdict(set);CHIP=[]
for line in(SOURCE/'lang.txt').read_text().splitlines():
 r=line.split('\t');L[int(r[0])]=r[1:3]
for line in(SOURCE/'dict.txt').read_text().splitlines()[1:]:
 l,num,label,code=line.split('\t');key=(int(l),code)
 if label not in ALIASES[key]:ALIASES[key].append(label)
for line in(SOURCE/'lab.txt').read_text().splitlines()[1:]:
 r=line.split('\t')
 if r[1]not in'BCDEFGHI'or int(r[2])==0:continue
 CHIP.append([int(r[0]),r[1],int(r[2]),int(r[3]),r[4],float(r[5]),*map(float,r[6:])])
CHIP.sort(key=lambda r:(r[1],r[2]));INDEX={r[1]+str(r[2]):i for i,r in enumerate(CHIP)}
for line in(SOURCE/'foci-exp.txt').read_text().splitlines():
 lang,speaker,seq,code,cell=line.split('\t')
 if cell not in INDEX:continue
 i=INDEX[cell];l,s=int(lang),int(speaker);FOCI[(l,code)].add((s,i));ALL[l].add((s,i))
def white(x,y):return mp.matrix([M(x)/M(y),1,(1-M(x)-M(y))/M(y)])
WC=white(.31006,.31616);D65=white(.3127,.3290);BR=mp.matrix([[M(x)for x in r]for r in [[.8951,.2664,-.1614],[-.7502,1.7135,.0367],[.0389,-.0685,1.0296]]]);adaptation=BR**-1*mp.diag([(BR*D65)[i]/(BR*WC)[i]for i in range(3)])*BR
SRGB=mp.matrix([[mp.mpf(506752)/1228815,mp.mpf(87881)/245763,mp.mpf(12673)/70218],[mp.mpf(87098)/409605,mp.mpf(175762)/245763,mp.mpf(12673)/175545],[mp.mpf(7918)/409605,mp.mpf(87881)/737289,mp.mpf(1001167)/1053270]])
def preview(row):
 L,a,b=map(M,row[6:]);y=(L+16)/116;q=[y+a/500,y,y-b/200];delta=mp.mpf(6)/29;xyz=mp.matrix([(x**3 if x>delta else 3*delta**2*(x-mp.mpf(4)/29))*WC[i]for i,x in enumerate(q)]);rgb=SRGB**-1*adaptation*xyz;clipped=any(x<M(-1e-10)or x>1+M(1e-10)for x in rgb);out=[]
 for x in rgb:
  x=min(mp.mpf(1),max(mp.mpf(0),x));v=mp.mpf('12.92')*x if x<=M(.0031308)else mp.mpf('1.055')*x**(mp.mpf(1)/M(2.4))-mp.mpf('.055');out.append(int(mp.floor(255*v+mp.mpf('.5'))))
 return dict(rgb=out,clipped=clipped)
PALETTE=list(map(preview,CHIP))
def colorFocus(a):
 l,term,chip=a['language'],a['term'],a['chip'];choices=ALL[l]if term is None else FOCI[l,term];counts=Counter(i for _,i in choices);speakers={s for s,_ in choices};N=len(speakers);array=[counts[i]for i in range(320)]
 return dict(**a,name=L[l][0],country=L[l][1],labels=ALIASES[l,term]if term is not None else[],consultants=N,counts=array,fractions=[mp.mpf(n)/N for n in array],selectedCount=array[chip],selectedFraction=mp.mpf(array[chip])/N,selectedChip=CHIP[chip],selectedPreview=PALETTE[chip],recordedChromaticTermCodes=len({code for lang,code in FOCI if lang==l}),totalFocalCellChoices=len(choices))
def distribution(a):
 sentences=[re.findall(r"[a-z]+(?:'[a-z]+)*",s)for s in re.split(r'[.!?\n]+',a['text'].lower().replace('’',"'"))];sentences=[s for s in sentences if s];tokens=sum(sentences,[]);vocabulary=sorted(set(tokens));N=len(vocabulary);C=Counter()
 for sentence in sentences:
  for offset in range(1,a['window']+1):
   for left,right in zip(sentence,sentence[offset:]):C[left,right]+=1;C[right,left]+=1
 counts=[[C[u,v]for v in vocabulary]for u in vocabulary];norms=[mp.sqrt(sum(x*x for x in row))for row in counts];cosines=[[mp.fdot(u,v)/(norms[i]*norms[j])if norms[i]and norms[j]else None for j,v in enumerate(counts)]for i,u in enumerate(counts)];target,other,x,y=[a[k]for k in ['target','other','xContext','yContext']];selected=target if target<N else None;comparison=other if other<N else None
 return dict(**a,sentences=sentences,tokens=tokens,vocabulary=vocabulary,counts=counts,norms=norms,cosines=cosines,selected=selected,comparison=comparison,projection=[[row[x],row[y]]for row in counts]if x<N and y<N else None,similarity=cosines[selected][comparison]if selected is not None and comparison is not None else None,totalDirectedPairs=sum(C.values()),empty=N==0)
def vagueness(a):
 center,width,scale=map(M,[a['center'],a['width'],a['logisticScale']]);
 def val(h):
  h=M(h);d=h-center;status='supertrue'if d>=width else'superfalse'if d< -width else'gap';fraction=mp.mpf(int(d>=0))if not width else min(mp.mpf(1),max(mp.mpf(0),(d+width)/(2*width)));return dict(height=h,status=status,fraction=fraction,logistic=1/(1+mp.exp(-d/scale)))
 return dict(**a,lower=center-width,upper=center+width,numericallyCollapsed=a['width']>0 and a['center']-a['width']==a['center']+a['width'],selected=val(a['height']),curve=[val(h)for h in lin(141,140,210)],thresholds=[center+t*width for t in lin(9,-1,1)])
def signValue(a):
 baseline=[dict(word='sheep',anchor=20),dict(word='mutton',anchor=80)]if a['system']=='English contrast'else[dict(word='mouton',anchor=50)];labels=[dict(x)for x in baseline]
 if a['removeNeighbor']and len(labels)>1:labels.pop()
 if a['addContrast']:labels.append(dict(word='new term',anchor=a['anchor']))
 def assign(terms,x):return min(range(len(terms)),key=lambda i:(abs(M(terms[i]['anchor'])-x),i))
 assignment=[assign(labels,x)for x in range(101)];before=[assign(baseline,x)for x in range(101)]
 return dict(**a,labels=labels,baseline=baseline,assignment=assignment,before=before,counts=[assignment.count(i)for i in range(len(labels))],chosen=assignment[a['selected']],changedPositions=sum(labels[j]['word']!=baseline[before[i]]['word']for i,j in enumerate(assignment)),tieRule='Earlier listed label wins an exact distance tie.')

CASES=[];SEEN=set()
def add(f,**args):
 a=DEFAULTS[f]|args;k=(f,json.dumps(a,sort_keys=True))
 if k not in SEEN:CASES.append(dict(family=f,args=a));SEEN.add(k)
for f in DEFAULTS:add(f)
for l,r,b in product(range(3),range(3),product([False,True],repeat=3)):add('reference',left=l,right=r,beliefs=list(b))
for mask in range(512):add('composition',relation=[(mask>>i)&1 for i in range(9)],subject=mask%3,object=(mask//3)%3,negative=bool(mask%2),step=mask%5)
for ao,ab,bo,q in product(range(5),range(5),range(5),['every','some','no','most','exactly three','union exactly three']):add('quantifiers',aOnly=ao,both=ab,bOnly=bo,quantifier=q)
for q in ['every','some','no','most','exactly three','union exactly three']:add('quantifiers',aOnly=12,both=12,bOnly=12,outside=12,quantifier=q)
worlds=[WORLD,[dict(x,present=False)for x in WORLD]]
for i,k in product(range(8),['present','red','square','large']):w=[dict(x)for x in WORLD];w[i][k]=not w[i][k];worlds.append(w)
for w,q,r,p in product(worlds,['every','some','no','most','exactly three'],['red squares','blue circles','all present objects'],['large','small']):add('truthWorld',world=w,quantifier=q,restrictor=r,predicate=p)
for mask in range(512):add('scope',relation=[(mask>>(i//4*3+i%4))&1 if i//4<3 and i%4<3 else 0 for i in range(16)])
for m,n,mask in product(range(5),range(5),[0,1,33825,65535,43690]):add('scope',students=m,books=n,relation=[(mask>>i)&1 for i in range(16)],selectedStudent=(m+1)%4,selectedBook=(n+1)%4)
for e,p,n in product(['affirmation','negation','question','filtered conditional'],[False,True],[False,True]):add('presupposition',embedding=e,past=p,now=n)
for n,alpha,cost,p,c in product([2,4,6,8],[0,1,4,8],[0,2,4],[.1,.5,.9],['plain','in fact all','but none']):add('scalar',n=n,alpha=alpha,allCost=cost,priorSuccess=p,continuation=c)
for s,t,shift,r in product([0,1],[0,4,10],[-2,-.4,0,.4,2],[.1,.4,1]):add('deixis',speaker=s,time=t,worldShift=shift,radius=r)
for w,s in product(product([0,1],repeat=4),range(5)):add('prototype',weights=list(w),selected=s)
for w,s in product([[math.ulp(0.0)]*4,[math.ulp(0.0),0,0,math.ulp(0.0)],[1e-250,2e-250,3e-250,4e-250],[1e-20,1,0,.5]],range(5)):add('prototype',weights=w,selected=s)
for l in range(1,111):
 for index,term in enumerate([None]+sorted({code for lang,code in FOCI if lang==l})):add('colorFocus',language=l,term=term,chip=(l*13+index*7)%320)
for length in range(5):
 for words in product(['a','b','c'],repeat=length):
  for window in [1,2,4]:add('distribution',text=' '.join(words),window=window)
for text in ['a b. c a','a b! c b? a','a\na b','Cat CAT. cat','don’t don\'t go','123 !?','cat. dog. bird.','a a a a a']:
 for window in range(1,5):add('distribution',text=text,window=window)
for c,w,s in product([150,180,190],[0,math.ulp(0.0),1e-15,1,8,20],[1,3,12]):
 for h in sorted(set([140,178,210,max(140,c-w),c,min(210,c+w)])):add('vagueness',center=c,width=w,logisticScale=s,height=h)
for s,r,a,c,p in product(['English contrast','French example'],[False,True],[False,True],[30,50,70],[0,20,50,80,100]):add('signValue',system=s,removeNeighbor=r,addContrast=a,anchor=c,selected=p)
for i,row in enumerate(CASES):
 row['expected']=clean(globals()[row['family']](row['args']))
 if(i+1)%500==0:print('computed',i+1,'/',len(CASES),flush=True)
data=dict(method='Independent set relations, pair counting, finite Bayesian normalization and mpmath color conversion. Native binary64 inputs;15significant-digit serialization; numeric residues below1e-70 canonicalized to0.',families=dict(Counter(r['family']for r in CASES)),cases=CASES)
b=(json.dumps(data,ensure_ascii=False,separators=(',',':'),allow_nan=False)+'\n').encode();Path(ns.out).write_bytes(b);print(json.dumps(dict(cases=len(CASES),families=data['families'],bytes=len(b),sha256=hashlib.sha256(b).hexdigest())),flush=True)
