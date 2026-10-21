"""Offline lossless views of the exact diagnostic readPixels bytes; no browser."""
import hashlib, json, sys
from pathlib import Path
import numpy as np
from PIL import Image

out = Path(sys.argv[1])
state = json.loads((out / 'capture.json').read_text())
w, h = state['width'], state['height']
arrays, manifest = {}, {}
for label in ['A0', 'A1', 'A2', 'A3']:
    raw = out / (label + '.rgba')
    assert raw.stat().st_size == w*h*4 == state['rawFiles'][label]['bytes']
    with raw.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    assert digest == state['rawFiles'][label]['sha256']
    arrays[label] = np.memmap(raw, dtype=np.uint8, mode='r', shape=(h,w,4))[::-1]
    Image.fromarray(arrays[label], 'RGBA').save(out / (label + '-exact-RGBA.png'))
    # White compositing is a display aid only; the RGBA PNG above is byte-lossless.
    rgba = Image.open(out / (label + '-exact-RGBA.png'))
    white = Image.new('RGBA', rgba.size, 'white')
    white.alpha_composite(rgba)
    white.convert('RGB').save(out / (label + '-white-display.png'))
for a, b in [('A0','A1'),('A1','A2'),('A3','A2'),('A0','A3')]:
    changed = pixels = maximum = 0
    heat = Image.new('RGB', (w,h), 'black')
    for y in range(0,h,128):
        delta = np.abs(arrays[a][y:y+128].astype(np.int16)-arrays[b][y:y+128].astype(np.int16))
        changed += int(np.count_nonzero(delta))
        pixels += int(np.count_nonzero(np.any(delta, axis=2)))
        maximum = max(maximum, int(np.max(delta)))
        magnitude = np.max(delta, axis=2)
        rgb = np.zeros((*magnitude.shape,3), dtype=np.uint8)
        rgb[:,:,0] = np.minimum(255, magnitude*4)
        rgb[:,:,1] = np.where(magnitude>0, 32, 0)
        heat.paste(Image.fromarray(rgb, 'RGB'), (0,y))
    expected = state['comparisons'][a+'-'+b]
    assert (changed,pixels,maximum) == (expected['channels'],expected['pixels'],expected['max'])
    heat.save(out / (a+'-'+b+'-difference-x4.png'))
    if expected['bounds']:
        l,t,r,bottom = expected['bounds']
        box = (max(0,l-10),max(0,t-10),min(w,r+11),min(h,bottom+11))
        heat.crop(box).save(out / (a+'-'+b+'-difference-crop.png'))
        Image.fromarray(arrays[a], 'RGBA').crop(box).save(out / (a+'-'+b+'-actual-crop.png'))
        Image.fromarray(arrays[b], 'RGBA').crop(box).save(out / (a+'-'+b+'-reference-crop.png'))
    manifest[a+'-'+b] = {'channels':changed,'pixels':pixels,'max':maximum,'bounds':expected['bounds']}
for p in sorted(out.glob('*.png')):
    with p.open('rb') as stream:
        manifest[p.name] = {'bytes':p.stat().st_size,'sha256':hashlib.file_digest(stream,'sha256').hexdigest()}
(out / 'offline-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
print(json.dumps({k:v for k,v in manifest.items() if not k.endswith('.png')},indent=2))
