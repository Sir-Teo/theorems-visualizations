"""Independent DOP853 endpoints for the fixed deep-5.8 field; requires numpy/scipy.
Run from repo root: node --input-type=module -e "import{residualModel}from './content/deep/source-audit.shared.js';const m=residualModel();console.log(JSON.stringify({parameters:m.parameters,P0:m.P0}));" | python3 tests/verification-deep-reference.py
"""
import json, sys
import numpy as np
import scipy
from scipy.integrate import solve_ivp
m=json.load(sys.stdin);p=m['parameters'];w1=np.array(p['W1']);w2=np.array(p['W2']);b=np.array(p['bb']);wt=np.array(p['wt'])
out={'method':'SciPy solve_ivp DOP853; rtol=2.3e-14; atol=1e-14','scipy':scipy.__version__,'amplitudes':{}}
for a in [.5,1.1,3]:
    vals=[]
    for x in m['P0']:
        s=solve_ivp(lambda t,x:a*w2@np.tanh(w1@x+wt*(t-.5)+b),(0,1),x,method='DOP853',rtol=2.3e-14,atol=1e-14)
        assert s.success
        vals.append(s.y[:,-1].tolist())
    out['amplitudes'][str(a)]=vals
with open('tests/verification-deep-reference.json','w') as f:json.dump(out,f,indent=2);f.write('\n')
print('Saved 144 independent endpoint vectors:',out['method'],scipy.__version__)
