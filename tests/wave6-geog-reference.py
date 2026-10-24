"""Independent NumPy/SciPy references for GEOG8; run from repository root."""
import json
from pathlib import Path
import numpy as np
from scipy.spatial import HalfspaceIntersection, ConvexHull
from scipy.spatial.distance import cdist
from scipy.integrate import quad

sites=np.array([[2,2],[8,2],[2,8],[8,8]],dtype=float)
values=np.array([1,4,2,5])
rows=[]
for length in [.2,2,6]:
    for nugget in [0,.1,1]:
        K=np.exp(-cdist(sites,sites)/length)+nugget*np.eye(4)
        A=np.block([[K,np.ones((4,1))],[np.ones((1,4)),np.zeros((1,1))]])
        for point in [[0,0],[2,2],[5,5],[10,10],[1e-12,9.999]]:
            c=np.exp(-cdist(sites,np.array([point]))[:,0]/length)
            sol=np.linalg.solve(A,np.r_[c,1])
            w=sol[:4]
            variance=1-2*np.dot(w,c)+w@K@w
            rows.append(dict(kind='kriging',length=length,nugget=nugget,point=point,weights=w.tolist(),value=float(w@values),variance=float(variance)))
for moving in [[4,3],[9,1],[1,9],[5,5],[9.99,9.99],[1e-8,5]]:
    pts=np.vstack([sites,moving]);regions=[]
    for i,p in enumerate(pts):
        planes=[[-1,0,0],[1,0,-10],[0,-1,0],[0,1,-10]]
        for j,q in enumerate(pts):
            if i!=j: planes.append([2*(q[0]-p[0]),2*(q[1]-p[1]),np.dot(p,p)-np.dot(q,q)])
        vertices=HalfspaceIntersection(np.array(planes,dtype=float),p).intersections
        regions.append(dict(vertices=vertices.tolist(),area=float(ConvexHull(vertices).volume)))
    rows.append(dict(kind='voronoi',points=pts.tolist(),regions=regions))
for mode,power in [('exponential',2),('power law',1),('power law',2),('power law',1+1e-12),('power law',2-1e-12),('power law',4)]:
    for length in [.2,2,5]:
        for radius in [0,1e-8,.01,3,12]:
            fn=lambda r:2*np.pi*r*(np.exp(-r/length) if mode=='exponential' else (1+r/length)**(-power))
            value,error=quad(fn,0,radius,epsabs=1e-22 if radius<.1 else 1e-12,epsrel=2e-13)
            rows.append(dict(kind='radial',mode=mode,power=power,length=length,radius=radius,value=value))
raw=Path('content/geog/ch08.snow.js').read_text()
deaths=json.loads(raw.split('export const deaths=',1)[1].split(';',1)[0])
pumps=json.loads(raw.split('export const pumps=',1)[1].split(';',1)[0])
coords=[[p['x'],p['y']] for p in pumps]
for metric in ['euclidean','cityblock']:
    nearest=np.argmin(cdist(np.array(deaths),np.array(coords),metric=metric),axis=1)
    rows.append(dict(kind='snow',metric=metric,counts=np.bincount(nearest,minlength=13).tolist()))
out=dict(method='Independent NumPy constrained covariance solve, SciPy halfspace intersection/ConvexHull, adaptive quadrature and cdist',cases=rows)
target=Path('tests/fixtures/wave6-geog-reference.json');target.write_text(json.dumps(out,indent=2)+'\n')
print(f'{len(rows)} independent reference cases -> {target}')
