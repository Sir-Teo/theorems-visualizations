# New supplementary comparisons only. Original pair/comparison/thresholds remain untouched.
from pathlib import Path
from PIL import Image,ImageChops
import json,hashlib,sys
p=Path(sys.argv[1]);d=json.loads((p/'metadata.raw').read_bytes());assert d['caseName']=='S2' and d['variant']=='old' and d['theme']=='light'
labels=['actual-final-canvas','reference','diagnostic-connected-reference'];images={};result={'identity':'tiny-old-S2-connected-control-light-v1','unmasked':True,'originalThresholdsUnchanged':True,'originalRawSHA256':{}}
for name in labels:
 raw=(p/(name+'.raw')).read_bytes();assert len(raw)==640*360*4;images[name]=Image.frombytes('RGBA',(640,360),raw);result['originalRawSHA256'][name]=hashlib.sha256(raw).hexdigest()
def stats(im):
 v=[z for pixel in im.getdata() for z in pixel];return {'nonzeroChannels':sum(z!=0 for z in v),'mean':sum(v)/len(v),'maximum':max(v)}
for a,b in [(labels[0],labels[1]),(labels[0],labels[2]),(labels[1],labels[2])]:
 name=a+'-vs-'+b;diff=ImageChops.difference(images[a],images[b]);diff.save(p/('diagnostic-'+name+'-raw-diff.png'));rgb=[]
 for im in [images[a],images[b]]:
  bg=Image.new('RGBA',im.size,(247,245,240,255));bg.alpha_composite(im);rgb.append(bg.convert('RGB'))
 cd=ImageChops.difference(*rgb);cd.save(p/('diagnostic-'+name+'-rgb-diff.png'));result[name]={'rawRGBA':stats(diff),'compositedRGB':stats(cd)}
(p/'diagnostic-three-comparisons.json').write_text(json.dumps(result,indent=2)+'\n')
