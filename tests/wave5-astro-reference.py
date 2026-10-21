"""Independent Voigt oracle: direct real Gaussian/Lorentz convolution, adaptive Simpson.
The browser uses a Fourier integral in the core and fixed Simpson in the wings.
No external numerical package is needed. Gaussian truncation at |u|=12 has negligible mass.
"""
import json,math

def integrate(f,a,b,tol=1e-12):
    fa,fb,fm=f(a),f(b),f((a+b)/2)
    whole=(b-a)*(fa+4*fm+fb)/6
    def rec(a,b,fa,fm,fb,whole,tol,depth):
        c=(a+b)/2;fl=f((a+c)/2);fr=f((c+b)/2)
        left=(c-a)*(fa+4*fl+fm)/6;right=(b-c)*(fm+4*fr+fb)/6
        if depth==0 or abs(left+right-whole)<15*tol:
            return left+right+(left+right-whole)/15
        return rec(a,c,fa,fl,fm,left,tol/2,depth-1)+rec(c,b,fm,fr,fb,right,tol/2,depth-1)
    return rec(a,b,fa,fm,fb,whole,tol,24)

def profile(x,a):
    if a==0:return math.exp(-x*x)/math.sqrt(math.pi)
    pts=sorted(set([-12.,12.,0.]+[max(-12,min(12,x+k*a)) for k in [-100,-10,-1,0,1,10,100]]))
    f=lambda u:math.exp(-u*u)*a/(math.pi**1.5*((x-u)**2+a*a))
    return sum(integrate(f,p,q,1e-12/len(pts)) for p,q in zip(pts,pts[1:]))

if __name__=='__main__':
    print(json.dumps([[x,a,profile(x,a)] for a in [.001,.01,.1,.5] for x in [0,.2,1,3,7.9,8,8.001,15,80]]))
