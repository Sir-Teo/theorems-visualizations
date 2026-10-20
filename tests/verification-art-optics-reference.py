"""Independent80-digit Decimal source oracle; no production imports or third-party libraries.

python3 tests/verification-art-optics-reference.py /path/to/owner/CIE_xyz_1931_2deg.csv
"""
from decimal import Decimal as D, getcontext
import csv, hashlib, json, pathlib, sys
getcontext().prec = 80
def atan(x):
    term = x; result = x; k = 1
    while abs(term) > D('1e-84'):
        term *= -x*x
        result += term / (2*k+1)
        k += 1
    return result
pi = 16*atan(D(1)/5)-4*atan(D(1)/239)
def sin(x):
    result = term = x; k = 1
    while abs(term) > D('1e-84'):
        term *= -x*x/(2*k*(2*k+1)); result += term; k += 1
    return result
def cos(x):
    return sin(pi/2-x)
den = [9,16,10,9,10,16,9]; total = sum(D(1)/n for n in den)
start = D(0); centroids = []
for n in den:
    width = 2*pi/n/total; a = start+width/2; radius = sin(width/2)/(width/2)
    centroids.append([radius*sin(a),radius*cos(a)]); start += width
weights = [[10,6,5,3,2,1,1],[4]*7,[0,6,0,0,6,0,0]]
weights += [[12 if i==j else 0 for i in range(7)] for j in range(7)]
newton = []
for values in weights:
    w = list(map(D,values)); z = [sum(x*c[k] for x,c in zip(w,centroids))/sum(w) for k in range(2)]
    newton.append({'weights':values,'Z':list(map(str,z)),'full':str(sum(x*x for x in z).sqrt())})
source = pathlib.Path(sys.argv[1]); sha = hashlib.sha256(source.read_bytes()).hexdigest()
assert sha == 'fa663e3535a7e0763a745993a1f0a192eb0275ac46ad2d1befd7626841e713c1'
with source.open() as stream:
    rows = {int(row[0]):list(map(D,row[1:])) for row in csv.reader(stream)}
B = list(map(D,['1.039612120','.231792344','1.010469450']))
C = list(map(D,['.006000699','.0200179144','103.560653']))
def index(l):
    x = (l/1000)**2
    return (1+sum(b*x/(x-c) for b,c in zip(B,C))).sqrt()
ref = index(D(550)); spread = index(D(380))-index(D(780))
def offset(l): return (index(l)-ref)/spread
def inverse(q):
    if q >= offset(D(380)): return D(380)
    if q <= offset(D(780)): return D(780)
    lo,hi = D(380),D(780)
    for _ in range(280):
        mid = (lo+hi)/2
        if offset(mid)>q: lo=mid
        else: hi=mid
    return (lo+hi)/2
def cmf(l):
    k = min(779,int(l)); t = l-k
    return [a*(1-t)+b*t for a,b in zip(rows[k],rows[k+1])]
def integral(lo,hi):
    out = [D(0)]*3
    for k in range(380,780):
        a,b = max(D(k),lo),min(D(k+1),hi)
        if a>=b: continue
        left,right = cmf(a),cmf(b)
        out = [s+(b-a)*(x+y)/2 for s,x,y in zip(out,left,right)]
    return out
white = integral(D(380),D(780)); prism = []
for xx,ww,dd in [('0','.12','.8'),('.2','.12','.8'),('-.2','.12','.8'),('0','.1','1.2'),('1.8','2.5','1.2'),('-1.8','2.5','1.2'),('0','2.5','.001')]:
    x,w,d = map(D,[xx,ww,dd]); lo,hi = inverse((x+w/2)/d),inverse((x-w/2)/d)
    a = integral(lo,hi)
    prism.append({'x':float(x),'width':float(w),'separation':float(d),'interval':list(map(str,[lo,hi])),'white':list(map(str,a)),'black':list(map(str,[s-v for s,v in zip(white,a)]))})
out = pathlib.Path(__file__).resolve().parents[1]/'docs/verification/art-optics-reference.json'
out.write_text(json.dumps({'source':'CIE2019 official1931 standard-observer table, DOI10.25039/CIE.DS.xvudnb9b, CC BY-SA4.0; derived numerical reference values','precision':80,'ownerSHA256':sha,'centroids':[[str(x) for x in a] for a in centroids],'newton':newton,'prism':prism},indent=2)+'\n')
print(f'80digit Decimal oracle: {len(newton)} Newton mixtures, seven analytic arc centroids, {len(prism)} full source-integrated complementary prism cases')
