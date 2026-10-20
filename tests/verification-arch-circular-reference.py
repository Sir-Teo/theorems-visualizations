"""Independent 80-digit tangency equations from exact annular area moments."""
import json,mpmath as mp
mp.mp.dps=80
printed=['.000097','.00153','.00750','.02284','.05369','.10748','.19394','.32761','.53654'];out=[]
for angle,pub in zip(range(15,136,15),printed):
 a=mp.radians(angle)
 def eq(t,theta):
  ri=1-t/2;ro=1+t/2
  # Integral of r dr is t; integral of r^2 dr is this first-moment factor.
  c=(ro**3-ri**3)/(3*t)
  H=a/mp.tan(a/2)-c/ro
  return ro*H+c*(1-mp.cos(theta))-ri*(H*mp.cos(theta)+theta*mp.sin(theta)),c*mp.sin(theta)-ri*((1-H)*mp.sin(theta)+theta*mp.cos(theta))
 t,theta=mp.findroot(eq,(mp.mpf(pub),min(a*mp.mpf('.61'),mp.mpf('1.1'))),tol=mp.mpf('1e-72'),maxsteps=100)
 assert t>0 and 0<theta<a and max(abs(x) for x in eq(t,theta))<mp.mpf('1e-65')
 out.append(dict(angle=angle,printed=pub,thickness=mp.nstr(t,75),contactDegrees=mp.nstr(mp.degrees(theta),75),residual=mp.nstr(max(abs(x) for x in eq(t,theta)),5)))
print(json.dumps(out,indent=2))
