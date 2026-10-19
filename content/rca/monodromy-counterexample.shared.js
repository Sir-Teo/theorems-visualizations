export const monodromyCounterexample={
  num:'16.16',kind:'Proposition',name:'Monodromy fails on every nonsimply connected plane region',
  refs:['Rudin, Real and Complex Analysis, 3rd ed., Remark 16.16 and complete argument, p. 327'],
  statement:String.raw`If a plane region $\Omega$ is not simply connected, some function element admits continuation along every path in $\Omega$ but has no single-valued holomorphic extension to all of $\Omega$.`,
  idea:String.raw`By13.11 there are $w\notin\Omega$ and a closed path $\gamma\subset\Omega$ with $\operatorname{Ind}_\gamma(w)\ne0$. A local logarithm of $z-w$ continues along every path by integrating its derivative $(z-w)^{-1}$. A global extension would make that derivative have a primitive on$\Omega$, forcing $\int_\gamma(z-w)^{-1}dz=0$, contrary to the nonzero index.`,
  caption:String.raw`An annulus is a concrete example. The logarithm continues around a circle without local difficulty, but after$n$turns it changes by$2\pi in$. Vary the turns and the progress along the loop: the point in the annulus returns to its starting position while the lifted logarithm ends on a different sheet unless$n=0$.`,
  deps:['rca-13.11','rca-10.12','rca-16.15'],tags:['monodromy','logarithm'],
  viz(v){
    const turns=v.slider('turns $n$',-3,3,1,{int:true}),t=v.slider('progress',0,1,1,{step:.01});
    const L=v.stage({x:[-1.4,1.4],y:[-1.4,1.4],equal:true,height:320,title:'closed circle in an annulus'});
    const R=v.stage({x:[-.8,.8],y:[-20,20],height:320,title:'continued logarithm: imaginary part follows the argument'});
    v.render(()=>{const angle=2*Math.PI*turns.value*t.value;L.circle(0,0,1.2,{color:'muted'});L.circle(0,0,.4,{color:'red'});L.circle(0,0,1,{color:'accent'});L.dot(Math.cos(angle),Math.sin(angle),{color:'gold',r:6});
      R.line(0,0,0,angle,{color:'accent',width:3});R.dot(0,angle,{color:'gold',r:6});R.dot(0,0,{color:'red',r:4});});
    v.legend([['accent','path and its logarithmic lift'],['red','excluded origin / initial logarithm'],['gold','current value',{dot:true}]]);
    v.readout(()=>`At progress ${v.fix(t.value,2)}, continued log = ${v.fix(2*Math.PI*turns.value*t.value,5)}i. After the full loop, the change is 2πi n = ${v.fix(2*Math.PI*turns.value,5)}i.`);
  },
};
