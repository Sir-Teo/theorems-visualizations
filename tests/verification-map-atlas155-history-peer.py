"""Offline exact RGBA/source/manifest audit; no browser or renderer execution."""
import sys,json,hashlib,pathlib,collections
import numpy as np
root=pathlib.Path(sys.argv[1]);old=pathlib.Path(sys.argv[2]);out=pathlib.Path(sys.argv[3]);out.mkdir(parents=True,exist_ok=True)
d=json.load(open(root/'capture.json'));size=d['width']*d['height']*4
assert size==128532480 and d['browser']=='155.0.8059.85' and not d['errors']
labels=['pre-unselected-A','pre-unselected-B','pre-selected-A','pre-selected-B','A0','A1','A2','A3']
def digest(p):
 h=hashlib.sha256()
 with open(p,'rb') as f:
  while b:=f.read(1048576):h.update(b)
 return h.hexdigest()
raw={}
for label in labels:
 p=root/(label+'.rgba');assert p.stat().st_size==size;sha=digest(p);assert sha==d['rawFiles'][label]['sha256'];transfers=[t for t in d['transfers'] if t['label']==label];offset=0
 for t in transfers:assert t['offset']==offset and 0<t['length']<=1048576;offset+=t['length']
 assert offset==size and len(transfers)==123;raw[label]={'bytes':size,'sha256':sha,'chunks':len(transfers)}
def compare(a,b):
 channels=pixels=maxd=0;left=d['width'];right=-1;top=d['height'];bottom=-1;offset=0
 with open(a,'rb') as A,open(b,'rb') as B:
  while aa:=A.read(1048576):
   bb=B.read(len(aa));assert len(aa)==len(bb);x=np.frombuffer(aa,np.uint8).reshape(-1,4);y=np.frombuffer(bb,np.uint8).reshape(-1,4);delta=np.abs(x.astype(np.int16)-y.astype(np.int16));channels+=int(np.count_nonzero(delta));maxd=max(maxd,int(delta.max()));ix=np.flatnonzero(np.any(delta,axis=1));pixels+=len(ix)
   if len(ix):
    n=ix+offset//4;xs=n%d['width'];ys=d['height']-1-n//d['width'];left=min(left,int(xs.min()));right=max(right,int(xs.max()));top=min(top,int(ys.min()));bottom=max(bottom,int(ys.max()))
   offset+=len(aa)
  assert not B.read(1)
 return {'channels':channels,'pixels':pixels,'max':maxd,'bounds':[left,top,right,bottom] if pixels else None,'comparedBytes':offset}
comparisons={}
for a,b in [('pre-unselected-A','pre-unselected-B'),('pre-selected-A','pre-selected-B'),('A0','A1'),('A1','A2'),('A3','A2'),('A0','A3')]:
 row=compare(root/(a+'.rgba'),root/(b+'.rgba'));comparisons[a+'-'+b]=row
 if a+'-'+b in d['comparisons']:
  for k in ['channels','pixels','max','bounds']:assert row[k]==d['comparisons'][a+'-'+b][k]
 else:assert row['channels']==0
historical={label:compare(root/(label+'.rgba'),old/(label+'.rgba')) for label in ['A0','A1','A2','A3']}
if d['mode']=='unguarded':assert all(r['channels']==0 for r in historical.values())
for f in d['frames']:
 assert f['glError']==0;v=f['after'];r=v['resources'];assert v['scene']['status']=='ready' and v['meta'] is None and v['scratch'] is None and v['stats']=={}
 assert sorted(m['key'] for m in v['models'])==['bundles:0.5','edges:0.5','edges:4'];assert all(not m['released'] for m in v['models']);assert all(g['budgetOwned'] for g in v['groups'])
 assert r['componentSum']==r['logicalRetainedBytes']==sum(r['components'].values());assert r['logicalPeakBytes']<=64000000 and r['logicalRetainedBytes']<=64000000 and r['maskPixels']<=8000000 and r['primarySamples']==0 and r['inputCanvasPixels']==1;assert v['scene']['canvas']==[d['width'],d['height']]
 events=d['textHistory'][f['traceStart']:f['traceEnd']];beg=[e for e in events if e['type']=='draw-begin'];end=[e for e in events if e['type']=='draw-end'];assert len(beg)==len(end)==1 and end[0]['result'] is True and beg[0]['stage']==f['label'] and end[0]['stage']==f['label']
assert not any(e['type']=='draw-begin' for e in d['postCaptureHistory'])
source={}
for file,h in d['originalSources'].items():
 p=pathlib.Path('/tmp/atlas-continuation/checkpoint5')/file;actual=digest(p);assert actual==h['originalSHA256'];source[file]={'frozenOriginalSHA256':actual,'servedSHA256':h['servedSHA256']}
 if d['mode']=='unguarded':assert actual==h['servedSHA256']
for file,h in d['hashes'].items():
 if file.startswith('data/') or file=='assets/js/graph.js':assert digest(pathlib.Path('/tmp/atlas-continuation/checkpoint5')/file)==h
trace=d['textHistory'];summary={'mode':d['mode'],'browser':d['browser'],'raw':raw,'comparisons':comparisons,'historicalByteComparisons':historical,'sources':source,'draws':[e for e in trace if e['type'].startswith('draw-')],'eventCounts':dict(collections.Counter(e['type'] for e in trace)),'traceSerializedBytes':len(json.dumps(trace).encode()),'postCaptureEvents':len(d['postCaptureHistory']),'rawDiskBytes':size*8,'mainCoexistingDiagnosticBytes':size*4,'status':'PASS','limits':'No browser, upload content hash, later alternate-binding acceptance, or physical-memory claim.'}
json.dump(summary,open(out/(d['mode']+'-audit.json'),'w'),indent=2);print(json.dumps({k:v for k,v in summary.items() if k in ['mode','eventCounts','postCaptureEvents','status','rawDiskBytes']}))
