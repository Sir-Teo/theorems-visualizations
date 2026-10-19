"""Independent 80-digit references; requires mpmath==1.3.0. No site imports."""
import json
import sys
import mpmath as mp
mp.mp.dps = 80
radii = [mp.mpf(i)/10 for i in range(1,33)]
result = {
    'method': 'mpmath 1.3.0, 80 digits; independent erf and elementary antiderivatives',
    'gaussian': [{'r': float(r), 'line': float(mp.sqrt(mp.pi)*mp.erf(r)),
                  'q': float(mp.pi*mp.erf(r)**2),
                  'd': float(mp.pi*(1-mp.exp(-r*r))),
                  'd2': float(mp.pi*(1-mp.exp(-2*r*r)))} for r in radii],
    'slicingIntegrals': {
        'wavy': float(mp.mpf('.5')+mp.mpf('.2')*((1-mp.cos(8))/8+(1-mp.cos(4))/4)),
        # Integration by parts after t=1/x gives integral sin(1/x) dx = sin(1)-Ci(1).
        'chirp': float((1+mp.sin(1)-mp.ci(1))/2),
    }
}
# Green's theorem on the mapped boundary supplies independent area/moment
# references; this does not integrate f(T)*Jacobian over the parameter rectangle.
maps = {
    'polar': (lambda u,v:(u*mp.cos(v),u*mp.sin(v)), ['.5','2','.2','2.3']),
    'para': (lambda u,v:(u*u-v*v,2*u*v), ['.6','1.5','.3','1.2']),
    'shear': (lambda u,v:(u+mp.mpf('.6')*v,mp.mpf('.8')*v), ['0','1.6','0','1.2']),
    'reverse': (lambda u,v:(-u-mp.mpf('.6')*v,mp.mpf('.8')*v), ['0','1.6','0','1.2']),
}
result['changeOfVariables'] = []
for name,(T,box) in maps.items():
    u0,u1,v0,v1 = map(mp.mpf,box)
    corners = [(u0,v0),(u1,v0),(u1,v1),(u0,v1)]
    for kind in ['one','r2']:
        value = mp.mpf(0)
        for i,p in enumerate(corners):
            q = corners[(i+1)%4]
            def point(t):
                return T(p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1]))
            def boundary(t):
                x,y = point(t)
                potential = x if kind=='one' else x+x**3/3+x*y*y
                return potential*mp.diff(lambda z:point(z)[1],t)
            value += mp.quad(boundary,[0,1])
        result['changeOfVariables'].append({'map':name,'integrand':kind,'integral':float(abs(value))})
result['method'] += '; mapped-boundary Green integrals for change of variables'
with open(sys.argv[1], 'w') as out:
    json.dump(result, out, indent=2)
    out.write('\n')
