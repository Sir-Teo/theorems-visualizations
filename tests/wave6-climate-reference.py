"""Regenerate the independent SciPy reference used by wave6-climate.test.mjs.

Run from the repository root: python3 tests/wave6-climate-reference.py
The production model uses closed modal formulas and fixed-step RK4; these
references use an augmented matrix exponential and adaptive DOP853 instead.
"""
import json
from pathlib import Path
import numpy as np
from scipy.linalg import expm
from scipy.integrate import solve_ivp

year = 365.25 * 86400
rows = []
for depth, deep, lam, gamma in [(50,1000,1.2,.7),(10,200,.5,2),(200,2000,3,.01),(50,1000,1.2,0),(50,1000,1.2,1e-12)]:
    C, Cd = 4.1e6*depth/year, 4.1e6*deep/year
    p = dict(depth=depth,deep=deep,lambda_=lam,gamma=gamma,forcing=3.7)
    p['lambda'] = p.pop('lambda_')
    A = np.array([[-(lam+gamma)/C,gamma/C,3.7/C],[gamma/Cd,-gamma/Cd,0],[0,0,0]])
    for t in [0,1e-12,.01,1,70,500,10000]:
        q = expm(A*t) @ np.array([0,0,1])
        rows.append(dict(kind='thermal',params=p,t=t,expected=q[:2].tolist()))
for permanent in [0,.25,.6]:
    for tau in [20,80,250]:
        C, Cd, lam, gamma = 4.1e6*50/year, 4.1e6*1000/year, 1.2, .7
        def forcing(t):
            if t <= 70: return 3.7*t/70
            return 3.7*np.log1p(permanent+(1-permanent)*np.exp(-(t-70)/tau))/np.log(2)
        def rhs(t,y):
            exchange = gamma*(y[0]-y[1])
            return [(forcing(t)-lam*y[0]-exchange)/C, exchange/Cd]
        first = solve_ivp(rhs,[0,70],[0,0],method='DOP853',rtol=2e-13,atol=2e-14,dense_output=True)
        second = solve_ivp(rhs,[70,300],first.y[:,-1],method='DOP853',rtol=2e-13,atol=2e-14,dense_output=True)
        for t in [1,69.999,70,70.001,120,300]:
            q = first.sol(t) if t<=70 else second.sol(t)
            rows.append(dict(kind='commitment',params=dict(mode='zero emissions: toy sinks',permanent=permanent,carbonYears=tau),t=t,expected=q.tolist()))
for mu in [0,.35,.55,.6]:
    for delayed in [True,False]:
        for seed, initial in [('warm surface',[1,0]),('recharged ocean',[0,1])]:
            A = np.array([[mu-.35,1.5],[-1.5 if delayed else 0,-.2]])
            for t in [0,.1,4,20]:
                q = expm(t*A) @ initial
                rows.append(dict(kind='recharge',params=dict(feedback=mu,delayed=delayed,seed=seed),t=t,expected=q.tolist()))
out = dict(method='SciPy expm (augmented constant-forcing matrix) and adaptive DOP853, rtol=2e-13, atol=2e-14',cases=rows)
target = Path('tests/fixtures/wave6-climate-reference.json')
target.parent.mkdir(exist_ok=True)
target.write_text(json.dumps(out,indent=2)+'\n')
print(f'{len(rows)} independent reference cases -> {target}')
