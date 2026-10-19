export const koebeExample={
  num:'14.11',kind:'Model',name:'Koebe functions in the normalized univalent class',
  refs:['Rudin, Real and Complex Analysis, 3rd ed., Example 14.11 and proof, p. 285'],
  statement:String.raw`For $|\alpha|\le1$, the function $f_\alpha(z)=z/(1-\alpha z)^2$ belongs to $\mathscr S$. For $|\alpha|=1$ these are Koebe functions.`,
  idea:String.raw`The normalization follows at once. If $f_\alpha(z)=f_\alpha(w)$, clearing the nonzero denominators gives $(z-w)(1-\alpha^2zw)=0$. In $U$, $|\alpha^2zw|<1$, so $z=w$. When $|\alpha|=1$, rotation reduces the image to that of $z/(1-z)^2$, the plane slit along $(-\infty,-1/4]$.`,
  caption:String.raw`Vary $\alpha$ and the interior circle radius. The image curves use the exact rational map. Drag two points in the disc: the readout shows the nonzero factor $1-\alpha^2zw$ in the injectivity argument. As the radius approaches1 at $|\alpha|=1$, the image approaches a slit plane; the finite circle is not the full boundary.`,
  deps:['rca-14.10'],tags:['Koebe function','univalent functions'],
  viz(v){
    const a=v.slider(String.raw`$\alpha$ (real slice)`,-1,1,1,{step:.01});
    const radius=v.slider('interior circle radius',.1,.95,.7,{step:.01});
    const L=v.stage({x:[-1.2,1.2],y:[-1.2,1.2],equal:true,height:320,title:'two points in the unit disc'});
    const R=v.stage({x:[-4,4],y:[-4,4],equal:true,height:320,title:'exact Koebe-family images (axes adapt)'});
    const clamp=(x,y)=>{const r=Math.hypot(x,y);return r>.95?[.95*x/r,.95*y/r]:[x,y];};
    const z=L.handle(.25,.3,{color:'gold',label:'z',constrain:clamp}),w=L.handle(-.3,.1,{color:'green',label:'w',constrain:clamp});let st;
    v.render(()=>{
      const map=(x,y)=>{const c=1-a.value*x,d=-a.value*y,re=c*c-d*d,im=2*c*d,norm=re*re+im*im;return[(x*re+y*im)/norm,(y*re-x*im)/norm];};
      const points=Array.from({length:720},(_,j)=>{const t=2*Math.PI*j/719;return map(radius.value*Math.cos(t),radius.value*Math.sin(t));});
      const extent=Math.max(1,...points.flat().map(Math.abs))*1.1;R.setView([-extent,extent],[-extent,extent]);
      L.circle(0,0,1,{color:'ink'});L.circle(0,0,radius.value,{color:'accent'});R.path(points,{color:'accent',width:2});R.dot(...map(z.x,z.y),{color:'gold',r:5});R.dot(...map(w.x,w.y),{color:'green',r:5});
      const factor=Math.hypot(1-a.value*a.value*(z.x*w.x-z.y*w.y),a.value*a.value*(z.x*w.y+z.y*w.x));st={factor};
    });
    v.legend([['accent','image of an interior circle'],['gold','z and f(z)',{dot:true}],['green','w and f(w)',{dot:true}]]);
    v.readout(()=>st?`|1−α²zw|=${v.fix(st.factor,6)}>0; equal images therefore force z=w. f(0)=0 and f′(0)=1.`:'');
  },
};
export const omittedDiameter={
  num:'14.15',kind:'Theorem',name:'The omitted set has diameter at most four',
  refs:['Rudin, Real and Complex Analysis, 3rd ed., Theorem 14.15 and proof, pp. 288–289'],
  statement:String.raw`Suppose $F$ is univalent and holomorphic on $U\setminus\{0\}$ and has a simple pole at0 with residue1. If $w_1,w_2\notin F(U\setminus\{0\})$, then $|w_1-w_2|\le4$.`,
  idea:String.raw`For an omitted $w_1$, $f=1/(F-w_1)$ extends to a member of $\mathscr S$. The quarter theorem gives $D(0,1/4)\subset f(U)$, so $F(U\setminus\{0\})-w_1$ contains every finite point of modulus greater than4. Thus any other omitted point is at distance at most4. Equality is realized by $F(z)=z^{-1}+z$, whose omitted set is $[-2,2]$.`,
  caption:String.raw`For $F(z)=z^{-1}+az$, $0\le a\le1$, the omitted set is the closed ellipse with semiaxes $1+a$ and $1-a$, degenerating to $[-2,2]$ at $a=1$. Its diameter is exactly $2(1+a)\le4$. The outer curve is the image of an interior circle and lies outside the omitted set. This family illustrates the sharp constant; the theorem covers every normalized univalent pole map.`,
  deps:['rca-14.14','rca-14.10'],tags:['univalent functions','omitted values'],
  viz(v){
    const a=v.slider('ellipse parameter $a$',0,1,1,{step:.01}),r=v.slider('interior circle radius',.35,.98,.8,{step:.01});
    const S=v.stage({x:[-3.6,3.6],y:[-3.1,3.1],equal:true,height:380,full:true,title:'omitted ellipse and image of an interior circle'});
    v.render(()=>{const q=a.value,rho=r.value;S.curve(t=>[(1/rho+q*rho)*Math.cos(t),(q*rho-1/rho)*Math.sin(t)],0,2*Math.PI,{color:'accent',width:2});
      if(q===1)S.line(-2,0,2,0,{color:'red',width:5});else S.poly(Array.from({length:400},(_,j)=>{const t=2*Math.PI*j/399;return[(1+q)*Math.cos(t),(1-q)*Math.sin(t)];}),{fill:'red',fillAlpha:.18,color:'red'});
      S.dot(-1-q,0,{color:'gold',r:5});S.dot(1+q,0,{color:'gold',r:5});S.line(-1-q,0,1+q,0,{color:'gold',width:2,dash:[4,4]});});
    v.legend([['accent','image of |z|=r'],['red','omitted set',{area:true}],['gold','a diametral pair',{dot:true}]]);
    v.readout(()=>`Omitted diameter = 2(1+a) = ${v.fix(2*(1+a.value),4)} ≤ 4. Residue at the pole is 1.`);
  },
};
export const nonsimpleExamples={
  num:'14.17',kind:'Model',name:'Slits give nonsimple boundary points',
  refs:['Rudin, Real and Complex Analysis, 3rd ed., Examples 14.17, p. 289'],
  statement:String.raw`In the slit disc $\Omega=U\setminus[0,1)$, each $\beta\in(0,1]$ is a nonsimple boundary point. An interior sequence alternating between the two banks cannot be threaded by a curve in $\Omega$ converging to $\beta$.`,
  idea:String.raw`Fix a small disc about a positive slit point that does not contain the slit tip0. The upper and lower banks are disconnected within that neighborhood. Any curve joining successive opposite-bank points must leave it to go around0. A continuous curve ending at$\beta$ must eventually remain in every neighborhood of$\beta$, so no such curve can pass through the alternating sequence in order.`,
  caption:String.raw`Shrink the alternating sequence toward the selected slit point. The purple neighborhood excludes the tip0; successive gold points lie on opposite banks. The dashed curve joins a finite initial sequence by detouring around0. Such finite joins exist, but they keep leaving the neighborhood, so they cannot converge to the boundary point.`,
  deps:['rca-14.16'],tags:['boundary extension','slit domain'],
  viz(v){
    const beta=v.slider('boundary point $β$',.15,.85,.6,{step:.01}),n=v.slider('sequence length',2,16,8,{int:true});
    const S=v.stage({x:[-1.1,1.1],y:[-1.1,1.1],equal:true,height:400,full:true,axes:false,title:'alternating banks in the slit disc'});
    v.render(()=>{const b=beta.value;S.circle(0,0,1,{color:'ink'});S.line(0,0,1,0,{color:'red',width:3});S.circle(b,0,b/3,{color:'purple',fill:'purple',fillAlpha:.1});
      let previous;for(let j=1;j<=n.value;j++){const y=(j%2?1:-1)*.15/j,p=[b,y];S.dot(...p,{color:'gold',r:4});if(previous){S.path([previous,[-.08,previous[1]],[-.08,y],p],{color:'accent',width:1,dash:[3,3]});}previous=p;}
      S.dot(b,0,{color:'purple',r:5});S.dot(0,0,{color:'red',r:4});});
    v.legend([['red','removed slit'],['purple','a neighborhood avoiding the tip',{area:true}],['gold','alternating sequence',{dot:true}],['accent','finite detours',{dash:true}]]);
    v.readout(()=>`All finite detours must go around the slit tip. Their distance from β reaches at least β=${v.fix(beta.value,2)}, while the sequence tends to β.`);
  },
};
