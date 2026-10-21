# Offline only; raw buffers and metadata already exist before this is invoked.
from pathlib import Path
from PIL import Image,ImageChops
import json,sys
p=Path(sys.argv[1]);d=json.loads((p/'metadata.raw').read_bytes());bg=(14,16,20) if d['theme']=='dark' else (247,245,240);ims={}
for x in d['images']:
 raw=(p/(x['label']+'.raw')).read_bytes();im=Image.frombytes('RGBA',(x['width'],x['height']),raw)
 if x['orientation']=='bottom-up':
  im=im.transpose(Image.Transpose.FLIP_TOP_BOTTOM);a=im.getchannel('A');data=[]
  for r,g,b,alpha in im.getdata():data.append((min(255,round(r*255/alpha)) if alpha else 0,min(255,round(g*255/alpha)) if alpha else 0,min(255,round(b*255/alpha)) if alpha else 0,alpha))
  im.putdata(data)
 comp=Image.new('RGBA',im.size,bg+(255,));comp.alpha_composite(im);im=comp.convert('RGB');ims[x['label']]=im;im.save(p/(x['label']+'.png'))
def compare(a,b,name):
 A,B=ims[a],ims[b]
 if A.size!=B.size:return {'sizeMismatch':[A.size,B.size]}
 diff=ImageChops.difference(A,B);diff.save(p/(name+'-difference.png'));v=list(diff.getdata());z=[c for px in v for c in px];return {'mean':sum(z)/len(z),'changedFractionAbove20':sum(x>20 for x in z)/len(z),'nonzeroChannels':sum(x!=0 for x in z),'max':max(z),'pixels':A.width*A.height}
control=next(x['label'] for x in d['images'] if x['label'].startswith('control-gpu-'));out={'controlVsCanvas':compare(control,'control-reference','control-vs-canvas')}
if d['outcome']['active'] is False:out['fallbackVsReference']=compare('actual-final-canvas','reference','fallback-vs-reference')
(p/'pixel-comparisons.json').write_text(json.dumps(out,indent=2));print(json.dumps(out))
