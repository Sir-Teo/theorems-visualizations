/** Characteristic functions, with the ordinary probability-measure convention. */
export function renewalCharacteristic(kind,t){
 if(kind==='uniform')return[Math.abs(t)<1e-12?1:Math.sin(t)/t,0];
 const b=kind==='lattice'?2:Math.SQRT2;
 return[(Math.cos(t)+Math.cos(b*t))/2,-(Math.sin(t)+Math.sin(b*t))/2];
}
export function homogeneousRenewal(v){
 const kind=v.select('probability measure',[{value:'uniform',label:'uniform on [-1,1]'},{value:'irrational',label:'½(δ₁+δ√₂)'},{value:'lattice',label:'½(δ₁+δ₂), cyclic support'}],'irrational');
 const amplitude=v.slider('nonconstant amplitude',0,1,0.7,{step:.01}),frequency=v.slider('frequency ω',.2,10,2*Math.PI,{step:.01});
 v.button('Set ω=2π',()=>frequency.set(2*Math.PI));v.button('Use a constant',()=>amplitude.set(0));
 const L=v.stage({x:[-4,4],y:[-.3,2.3],height:300,title:'candidate φ and its exact convolution with μ'}),R=v.stage({x:[-10,10],y:[0,2.1],height:300,title:'|1−μ̂(t)|: possible frequencies of a harmonic function'});let state;
 v.legend([['accent','φ(x)=1+B cos(ωx)'],['orange','(μ*φ)(x)'],['green','zero residual'],['red','candidate nonzero frequency']]);
 v.render(()=>{const B=amplitude.value,w=frequency.value,m=renewalCharacteristic(kind.value,w),phi=x=>1+B*Math.cos(w*x),conv=x=>1+B*(m[0]*Math.cos(w*x)-m[1]*Math.sin(w*x));
  L.fn(phi,{color:'accent',width:2.5});L.fn(conv,{color:'orange',dash:true,width:2});R.fn(t=>{const z=renewalCharacteristic(kind.value,t);return Math.hypot(1-z[0],z[1]);},{color:'accent',n:1200});R.hline(0,{color:'green'});R.vline(w,{color:'red',dash:true});R.dot(w,Math.hypot(1-m[0],m[1]),{color:'red',r:5});
  state={B,w,residual:B*Math.hypot(1-m[0],m[1]),lattice:kind.value==='lattice'};
 });
 v.readout(()=>state&&`Exact residual sup over all x: ${state.residual.toExponential(3)}. ${state.B===0?'The constant solves the homogeneous equation.':state.residual<1e-12?'This nonconstant periodic function solves it because the support is cyclic.':'This nonconstant candidate fails the homogeneous equation.'} ${state.lattice?'The source hypothesis fails; at ω=2π a nonconstant solution remains.':'The source hypothesis holds: any bounded Borel solution is constant almost everywhere; this does not assert pointwise constancy on null sets.'}`);
}
