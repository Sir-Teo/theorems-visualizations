"""Independent high-precision KT loss references (no JavaScript implementation)."""
import json, pathlib, sys
try:
    import mpmath as mp
except ModuleNotFoundError:
    sys.path.insert(0, '/tmp/atlas-numerical-python')
    import mpmath as mp
mp.mp.dps = 100
rows = []
for n in [1, 2, 3, 4, 10, 100, 4000, 20000]:
    for k in sorted({0, 1, n//50, 3*n//20, n//2, n-1, n}):
        loss = (mp.loggamma(n+1)+mp.log(mp.pi)-mp.loggamma(k+mp.mpf('.5'))-mp.loggamma(n-k+mp.mpf('.5')))/mp.log(2)
        # For the few exact dyadic probabilities, remove gamma evaluation noise.
        rounded = mp.nint(loss)
        ceil_loss = rounded if abs(loss-rounded) < mp.mpf('1e-90') else mp.ceil(loss)
        rows.append({'n': n, 'ones': k, 'ideal': str(loss), 'ceil': int(ceil_loss), 'prefix': int(ceil_loss+1)})
root = pathlib.Path(__file__).resolve().parents[1]
(root/'docs/verification/info-complexity-references.json').write_text(json.dumps({'precision':100,'kt':rows},indent=2)+'\n')
