"""Independent80digit area integration in height/azimuth and cap polar coordinates."""
import json
import mpmath as m
m.mp.dps=80
R=m.sqrt(2)
def width(z):
 r=m.sqrt(2-z*z)
 return m.asin(1/r)-m.acos(1/r)
out=dict(pendentives=str(4*R*m.quad(width,[0,1])),plan=str(4*m.quad(lambda z:z*width(z),[0,1])),caps=[])
for hs in ['.2','.35','.75','1']:
 h=m.mpf(hs);r=(1+h*h)/(2*h);alpha=2*m.atan(h)
 area=2*m.pi*r*r*m.quad(m.sin,[0,alpha])
 out['caps'].append(dict(h=float(h),radius=str(r),area=str(area)))
out['sameSphereCap']=str(2*m.pi*R*R*m.quad(m.sin,[0,m.pi/4]))
print(json.dumps(out,indent=2))
