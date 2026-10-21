# Offline complete screenshot gate, unchanged mean<2 / channel fraction over20<.02.
import sys,json
from pathlib import Path
from PIL import Image,ImageChops
p=Path(sys.argv[1]);a=Image.open(p/'complete-gpu.png').convert('RGB');b=Image.open(p/'complete-direct-Canvas.png').convert('RGB')
assert a.size==b.size
x=ImageChops.difference(a,b);x.save(p/'complete-direct-diff.png');h=x.histogram();n=a.width*a.height*3;s=sum((i%256)*v for i,v in enumerate(h));changed=sum(v for i,v in enumerate(h) if i%256>20)
(p/'direct-difference.json').write_text(json.dumps({'width':a.width,'height':a.height,'mean':s/n,'changed':changed/n,'mask':'none; all RGB channels of full map-page screenshots'},indent=2))
