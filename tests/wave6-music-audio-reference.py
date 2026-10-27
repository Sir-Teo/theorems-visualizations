"""Independent complete short-buffer reference; no JavaScript imports.
High-precision per-event synthesis and full harmonic recurrence, then Float32 storage.
"""
from pathlib import Path
import argparse,json,math,time
from fractions import Fraction
import mpmath as mp
import numpy as np
parser=argparse.ArgumentParser();parser.add_argument('--digits',type=int,default=90);parser.add_argument('--out',required=True);a=parser.parse_args();mp.mp.dps=a.digits;start=time.monotonic();sr=44100
cases=[{'family':'eventAudio','args':{'duration':.02,'events':[]}}, {'family':'eventAudio','args':{'duration':.05,'events':[{'time':0,'frequency':800,'gain':.8}]}}, {'family':'eventAudio','args':{'duration':.06,'events':[{'time':.01,'frequency':1200,'gain':1},{'time':.025,'frequency':500,'gain':.7}]}}, {'family':'eventAudio','args':{'duration':.05,'events':[{'time':0,'frequency':800,'gain':1}for _ in range(10)]}}]
cases.append({'family':'eventAudio','args':{'duration':.03,'events':[{'time':.015,'frequency':1000,'gain':.8}]}})
for pair,rate,duration in [('3:2',0,.001),('3:2',50,.01),('3:2',100,.02),('4:3',90,.02),('5:4',100,.02),('2:1',100,.02)]:cases.append({'family':'ratioAudio','args':{'pair':pair,'rate':rate,'duration':duration}})
def dec(x):return mp.mpf(str(x))
def stored(values):return[float(np.float32(float(x)))for x in values]
def event(args):
 n=math.ceil(Fraction(str(args['duration']))*sr);raw=[]
 for i in range(n):
  t=mp.mpf(i)/sr;terms=[]
  for e in args['events']:
   exact_u=Fraction(i,sr)-Fraction(str(e['time']));u=mp.mpf(exact_u.numerator)/exact_u.denominator
   if 0<=exact_u<Fraction(1,25):
    half_turns=2*e['frequency']*exact_u
    carrier=mp.mpf(0)if half_turns.denominator==1 else mp.sin(mp.pi*half_turns.numerator/half_turns.denominator)
    terms.append(dec(e['gain'])*mp.sin(mp.pi*u/mp.mpf('.04'))**2*mp.exp(-80*u)*carrier)
  raw.append(mp.fsum(terms))
 raw=[x*max(mp.mpf(0),min(mp.mpf(1),mp.mpf(n-1-i)/(sr/100)))for i,x in enumerate(raw)]
 peak=max(map(abs,raw));gain=mp.mpf('.72')/peak if peak>mp.mpf('.72')else mp.mpf(1)
 return dict(data=stored([x*gain for x in raw]),sampleRate=sr,duration=n/sr,unscaledPeak=float(peak),gain=float(gain),events=args['events'])
def harmonics_at(phase,H):
 # Full finite cosine series via Chebyshev recurrence; not the sine quotient.
 c=mp.cos(2*mp.pi*phase);previous=mp.mpf(1);current=c;L=H+1;terms=[]
 for h in range(1,L):
  terms.append(mp.mpf(2*(L-h))/(L*L)*current);previous,current=current,2*c*current-previous
 return mp.fsum(terms)
def ratio(args):
 p,q=map(int,args['pair'].split(':'));base=mp.power(2,mp.mpf(args['rate'])/10)/2;frequencies=[p*base,q*base];H=[min(4096,max(1,int(mp.floor(6000/f))))for f in frequencies];n=math.ceil(Fraction(str(args['duration']))*sr);data=[]
 for i in range(n):
  ramp=max(mp.mpf(0),min(mp.mpf(1),mp.mpf(i)/(sr/100),mp.mpf(n-1-i)/(sr/100)));value=mp.mpf('.32')*mp.fsum(harmonics_at(f*i/sr,h)for f,h in zip(frequencies,H))*ramp;data.append(value)
 return dict(data=stored(data),sampleRate=sr,duration=n/sr,frequencies=list(map(float,frequencies)),harmonics=H)
for row in cases:row['expected']=(event if row['family']=='eventAudio'else ratio)(row['args'])
out={'caseCount':len(cases),'families':{'eventAudio':5,'ratioAudio':6},'cases':cases};Path(a.out).write_text(json.dumps(out,separators=(',',':'),allow_nan=False)+'\n');print(json.dumps({'status':'PASS','cases':len(cases),'digits':a.digits,'seconds':time.monotonic()-start,'bytes':Path(a.out).stat().st_size}))
