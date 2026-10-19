const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export function evaluatePolynomial(coefficients, z) {
  let value = [0, 0];
  for (let j = coefficients.length - 1; j >= 0; j--) value = add(mul(value, z), coefficients[j]);
  return value;
}
export function shiftedCoefficients(coefficients, center) {
  const out = coefficients.map(() => [0, 0]);
  for (let j = 0; j < coefficients.length; j++) {
    let power = [1, 0], choose = 1;
    for (let k = j; k >= 0; k--) {
      out[k] = add(out[k], mul(coefficients[j], power).map(x => choose * x));
      power = mul(power, center); choose *= k / (j - k + 1);
    }
  }
  return out;
}
export function polynomialCircleMoment(coefficients, center, radius) {
  return shiftedCoefficients(coefficients, center).reduce((sum, b, k) => sum + (b[0] ** 2 + b[1] ** 2) * radius ** (2 * k), 0);
}

export const polynomialMaximum = {
  num: '5.23', kind: 'Theorem', name: 'A polynomial takes its maximum modulus on the boundary',
  refs: ['Rudin, Real and Complex Analysis, 3rd ed., Section 5.23, p. 110'],
  statement: String.raw`If $P$ is a complex polynomial, then
$$\max_{|z|\le1}|P(z)|=\max_{|z|=1}|P(z)|.$$
A nonconstant polynomial cannot attain this maximum at an interior point. This is the polynomial case of the maximum modulus theorem.`,
  idea: String.raw`Suppose an interior point $z_0$ maximizes $|P|$, and write $P(z_0+w)=\sum_{k=0}^d b_kw^k$. On a sufficiently small circle about $z_0$, orthogonality gives
$$\frac1{2\pi}\int_{-\pi}^{\pi}|P(z_0+re^{it})|^2dt=\sum_{k=0}^d|b_k|^2r^{2k}.$$
The left side is at most $|P(z_0)|^2=|b_0|^2$, so every $b_k$ with $k>0$ vanishes. Thus an interior maximum forces $P$ to be constant. Compactness gives a maximum somewhere in the closed disc.`,
  caption: String.raw`Drag the interior point $z_0$ and vary the circle's radius. Left: the modulus in the unit disc and the selected circle. Right: the squared modulus along that circle, its sampled mean, and the center value. For a polynomial the independently computed coefficient sum equals the mean and is at least the center value. The boundary/whole-disc maxima in the readout are finite-grid estimates. Switch to $1-|z|^2$ to break the polynomial hypothesis: it has an interior maximum and its circular mean can be smaller than its center value.`,
  deps: ['rca-4.14', 'pma-4.16'], see: ['rca-10.24'], tags: ['polynomial', 'maximum modulus'],
  viz(v) {
    const M = v.M, tau = 2 * Math.PI;
    const mode = v.select('function', [{ value: 'poly', label: 'polynomial' }, { value: 'bump', label: '$1-|z|^2$ (not a polynomial in $z$)' }], 'poly');
    const degree = v.slider('highest power $d$', 1, 8, 3, { int: true });
    const strength = v.slider('linear coefficient $a$', -1, 1, -.5, { step: .05 });
    const fraction = v.slider('radius / distance to boundary', .05, .95, .65, { step: .01 });
    const L = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, height: 330, axes: false, title: '$|f(z)|$ and a circle about $z_0$' });
    const R = v.stage({ x: [-Math.PI, Math.PI], y: [0, 3], height: 330, title: '$|f(z_0+re^{it})|^2$' });
    const center = L.handle(.15, .1, { color: 'gold', label: 'z₀', constrain: (x, y) => { const r = Math.hypot(x,y); return r > .9 ? [.9*x/r,.9*y/r] : [x,y]; } });
    let state;
    v.render(() => {
      const poly = mode.value === 'poly', d = degree.value;
      degree.el.hidden = strength.el.hidden = !poly;
      const coefficients = Array.from({ length: d + 1 }, () => [0,0]);
      coefficients[0] = [.2,.15]; coefficients[1] = [strength.value,0]; coefficients[d][0] += 1;
      const f = z => poly ? evaluatePolynomial(coefficients,z) : [1-z[0]**2-z[1]**2,0];
      const square = z => { const w=f(z); return w[0]**2+w[1]**2; };
      const z = [center.x,center.y], radius = fraction.value * (1-Math.hypot(...z));
      const onCircle = t => [z[0]+radius*Math.cos(t),z[1]+radius*Math.sin(t)];
      let mean = 0, boundary = 0, grid = 0;
      for(let j=0;j<1024;j++) { const t=tau*j/1024; mean+=square(onCircle(t))/1024; boundary=Math.max(boundary,square([Math.cos(t),Math.sin(t)])); }
      for(let i=-30;i<=30;i++)for(let j=-30;j<=30;j++)if(i*i+j*j<=900)grid=Math.max(grid,square([i/30,j/30]));
      grid=Math.max(grid,boundary);
      const value = square(z), predicted = poly ? polynomialCircleMoment(coefficients,z,radius) : null;
      const maximum = Math.max(value,mean,...M.linspace(-Math.PI,Math.PI,257).map(t=>square(onCircle(t))));
      L.raster((x,y) => x*x+y*y>1 ? null : v.ramp(Math.min(1,Math.sqrt(square([x,y])/Math.max(grid,1e-12))), 'accent', 'bg'), { key: `${mode.value}/${d}/${strength.value}`, res: 3 });
      L.circle(0,0,1,{color:'ink',width:2}); L.circle(...z,radius,{color:'gold',width:2});
      R.setView(null,[0,Math.max(.1,1.15*maximum)]);
      R.fn(t=>square(onCircle(t)),{color:'accent',width:2,n:512});
      R.hline(mean,{color:'green',width:2});R.hline(value,{color:'gold',dash:[5,4],width:2});
      state={poly,radius,mean,value,predicted,boundary:Math.sqrt(boundary),grid:Math.sqrt(grid)};
    });
    v.legend([['accent','squared modulus on the circle'],['green','sampled circular mean'],['gold','center value squared',{dash:true}]]);
    v.readout(()=>!state?'':`Radius ${v.fix(state.radius,3)}; center squared ${v.fix(state.value,5)}; circular mean ${v.fix(state.mean,5)}. `+(state.poly?`Coefficient sum ${v.fix(state.predicted,5)}; quadrature discrepancy ${Math.abs(state.mean-state.predicted).toExponential(2)}. `:'The polynomial hypothesis fails; the coefficient identity does not apply. ')+`Sampled maximum modulus: boundary ${v.fix(state.boundary,4)}, whole disc ${v.fix(state.grid,4)}.`);
  },
};
