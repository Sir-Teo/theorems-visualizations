// Dedicated audited convection solver, isolated from shared cooling helpers.
// Based on the existing chapter solver; Heun stages now recompute buoyancy velocity.
export const CONV_L = 2 * Math.SQRT2; // width: two rolls at the critical wavelength 2√2 h
export function makeConvection({ nx = 80, nz = 28, Ra = 1e4, seed = 3, amp = 0.05, monotone = false } = {}) {
  const L = CONV_L, dx = L / nx, dz = 1 / nz;
  const Mx = Math.max(8, nx >> 1), Nz = Math.max(6, nz >> 1);
  const Sx = [], Sz = [], k2 = [];
  for (let m = 0; m < Mx; m++) { const r = new Float64Array(nx); for (let i = 0; i < nx; i++) r[i] = Math.sin(((m + 1) * Math.PI * (i + 0.5) * dx) / L); Sx.push(r); }
  for (let n = 0; n < Nz; n++) { const r = new Float64Array(nz); for (let j = 0; j < nz; j++) r[j] = Math.sin((n + 1) * Math.PI * (j + 0.5) * dz); Sz.push(r); }
  for (let n = 0; n < Nz; n++) { const r = new Float64Array(Mx); for (let m = 0; m < Mx; m++) { const k = ((m + 1) * Math.PI) / L, q = (n + 1) * Math.PI; r[m] = (k * k + q * q) ** 2; } k2.push(r); }
  const T = new Float64Array(nx * nz), T1 = new Float64Array(nx * nz), K1 = new Float64Array(nx * nz);
  const U = new Float64Array(nx * nz), W = new Float64Array(nx * nz), P = new Float64Array(nx * nz), Tx = new Float64Array(nx * nz);
  const A = new Float64Array(nz * Mx), C = new Float64Array(nz * Mx), B = new Float64Array(Nz * Mx);
  // simple seeded noise
  let sd = seed >>> 0 || 1; const rnd = () => ((sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0) / 4294967296) - 0.5;
  const S = { nx, nz, L, dx, dz, Ra, T, U, W, P, time: 0, steps: 0 };
  S.reset = () => {
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const z = (j + 0.5) * dz, x = (i + 0.5) * dx;
      T[j * nx + i] = 1 - z + amp * Math.sin(Math.PI * z) * (Math.cos((2 * Math.PI * x) / L) + 0.3 * rnd());
    }
    S.time = 0; S.steps = 0;
  };
  /** Solve for the flow from the current T. */
  function flow(F = T) {
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = F[j * nx + (i > 0 ? i - 1 : 0)], b = F[j * nx + (i < nx - 1 ? i + 1 : nx - 1)];
      Tx[j * nx + i] = (b - a) / (2 * dx);
    }
    // A[j][m] = Σ_i Tx[j][i] Sx[m][i]
    for (let j = 0; j < nz; j++) for (let m = 0; m < Mx; m++) { let s = 0; const sm = Sx[m], o = j * nx; for (let i = 0; i < nx; i++) s += Tx[o + i] * sm[i]; A[j * Mx + m] = s; }
    // C[n][m] = Σ_j A[j][m] Sz[n][j]
    const nrm = 4 / (nx * nz);
    for (let n = 0; n < Nz; n++) for (let m = 0; m < Mx; m++) { let s = 0; const sn = Sz[n]; for (let j = 0; j < nz; j++) s += A[j * Mx + m] * sn[j]; B[n * Mx + m] = (Ra * nrm * s) / k2[n][m]; }
    // back: C[j][m] = Σ_n B[n][m] Sz[n][j]; P[j][i] = Σ_m C[j][m] Sx[m][i]
    for (let j = 0; j < nz; j++) for (let m = 0; m < Mx; m++) { let s = 0; for (let n = 0; n < Nz; n++) s += B[n * Mx + m] * Sz[n][j]; C[j * Mx + m] = s; }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { let s = 0; for (let m = 0; m < Mx; m++) s += C[j * Mx + m] * Sx[m][i]; P[j * nx + i] = s; }
    let umax = 1e-9;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const o = j * nx + i;
      const pu = j < nz - 1 ? P[o + nx] : -P[o], pd = j > 0 ? P[o - nx] : -P[o];
      const pr = i < nx - 1 ? P[o + 1] : -P[o], pl = i > 0 ? P[o - 1] : -P[o];
      U[o] = (pu - pd) / (2 * dz); W[o] = -(pr - pl) / (2 * dx);
      const a = Math.abs(U[o]) / dx + Math.abs(W[o]) / dz; if (a > umax) umax = a;
    }
    return umax;
  }
  // d/dt of field F (with boundary values 1 below, 0 above, mirror at sides) into out
  function rhs(F, out) {
    const at = (i, j) => { // ghost-aware read
      if (i < 0) i = -i-1; else if (i >= nx) i = 2*nx-1-i;
      if (j < 0) return 2 - F[(-j-1)*nx+i]; if (j >= nz) return -F[(2*nz-1-j)*nx+i];
      return F[j * nx + i];
    };
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const o = j * nx + i, c = F[o], e = at(i + 1, j), w = at(i - 1, j), n = at(i, j + 1), s = at(i, j - 1);
      const lap = (e + w - 2 * c) / (dx * dx) + (n + s - 2 * c) / (dz * dz);
      const u = U[o], v = W[o];
      let tx, tz;
      if (monotone) { tx=u>=0?(c-w)/dx:(e-c)/dx;tz=v>=0?(c-s)/dz:(n-c)/dz; }
      else if (u >= 0) tx = (2 * e + 3 * c - 6 * w + at(i - 2, j)) / (6 * dx); else tx = -(2 * w + 3 * c - 6 * e + at(i + 2, j)) / (6 * dx);
      if (!monotone && v >= 0) tz = (2 * n + 3 * c - 6 * s + at(i, j - 2)) / (6 * dz); else if (!monotone) tz = -(2 * s + 3 * c - 6 * n + at(i, j + 2)) / (6 * dz);
      out[o] = lap - u * tx - v * tz;
    }
  }
  /** One RK2 step of at most dtMax; returns the dt used. */
  S.step = (dtMax = 1) => {
    const umax = flow();
    let dt = monotone?Math.min(dtMax,.8/(2*umax+3/dx**2+3/dz**2)):Math.min(dtMax, 0.4 / umax, 0.2 * Math.min(dx * dx, dz * dz));
    rhs(T, K1);
    for(;;){
      for (let o = 0; o < T.length; o++) T1[o] = T[o] + dt * K1[o];
      // Recompute buoyancy at the provisional state; enforce the positivity CFL for both Euler stages.
      const u1=flow(T1);if(!monotone||dt*(2*u1+3/dx**2+3/dz**2)<=.9)break;dt*=.5;
    }
    const K2 = new Float64Array(T.length); rhs(T1, K2);
    for (let o = 0; o < T.length; o++) T[o] += 0.5 * dt * (K1[o] + K2[o]);
    S.time += dt; S.steps++;
    return dt;
  };
  /** Run until model time `t` or until `ms` milliseconds have passed; returns true when t is reached. */
  S.advance = (t, ms = 1e9) => {
    const t0 = performance.now();
    while (S.time < t - 1e-12) { S.step(t - S.time); if (performance.now() - t0 > ms) break; }
    return S.time >= t - 1e-12;
  };
  /** Temperature at (x, z) by bilinear interpolation; x ∈ [0, L], z ∈ [0, 1]. */
  S.at = (x,z) => {
    const fx=Math.max(-.5,Math.min(nx-.5,x/dx-.5)),fz=Math.max(-.5,Math.min(nz-.5,z/dz-.5)),i=Math.floor(fx),j=Math.floor(fz),a=fx-i,b=fz-j;
    const cell=(ii,jj)=>{ii=ii<0?-ii-1:ii>=nx?2*nx-1-ii:ii;return jj<0?2-T[(-jj-1)*nx+ii]:jj>=nz?-T[(2*nz-1-jj)*nx+ii]:T[jj*nx+ii];};
    return (1-b)*((1-a)*cell(i,j)+a*cell(i+1,j))+b*((1-a)*cell(i,j+1)+a*cell(i+1,j+1));
  };
  /** Nusselt number: mean of the conductive flux at the bottom and top walls (equal when steady). */
  S.nu = () => {
    let top = 0, bot = 0;
    for (let i = 0; i < nx; i++) { top += T[(nz - 1) * nx + i] / (dz / 2); bot += (1 - T[i]) / (dz / 2); }
    return { top: top / nx, bottom: bot / nx, mean: (top + bot) / (2 * nx) };
  };
  S.wrms = () => { flow(); let s = 0; for (let o = 0; o < W.length; o++) s += W[o] * W[o]; return Math.sqrt(s / W.length); };
  /** Starting-plume initial condition: cold interior, a thin hot basal layer and a hot blob of width `w` at the centre of the floor. */
  S.initPlume = ({ bump = 1, w = 0.1, layer = 0.05 } = {}) => {
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const z = (j + 0.5) * dz, x = (i + 0.5) * dx - L / 2;
      const base = Math.max(0, 1 - z / layer), blob = bump * Math.exp(-(x * x) / (2 * w * w) - (z * z) / (2 * (1.2 * w) ** 2));
      T[j * nx + i] = Math.min(1, Math.max(base, blob));
    }
    S.time = 0; S.steps = 0;
  };
  /** Stream function ψ (u = ∂ψ/∂z, w = −∂ψ/∂x) at (x, z) from the last flow solve (call S.wrms() or S.step() first). */
  S.psiAt=(x,z)=>{
    const fx=Math.max(-.5,Math.min(nx-.5,x/dx-.5)),fz=Math.max(-.5,Math.min(nz-.5,z/dz-.5)),i=Math.floor(fx),j=Math.floor(fz),a=fx-i,b=fz-j;
    const cell=(ii,jj)=>{let sign=1;if(ii<0){ii=-ii-1;sign=-sign;}else if(ii>=nx){ii=2*nx-1-ii;sign=-sign;}if(jj<0){jj=-jj-1;sign=-sign;}else if(jj>=nz){jj=2*nz-1-jj;sign=-sign;}return sign*P[jj*nx+ii];};
    return (1-b)*((1-a)*cell(i,j)+a*cell(i+1,j))+b*((1-a)*cell(i,j+1)+a*cell(i+1,j+1));
  };
  S.reset();
  return S;
}
// Separate hypothetical eruption-marker kinematics; no melt or moving-lid coupling.
export function markerTrack(arrival,time,ratio,L=CONV_L){const out=[];if(!(arrival>0))return out;const speed=ratio/arrival,gap=.2*arrival;for(let ti=arrival,n=0;ti<=time&&n<40;ti+=gap,n++){const age=time-ti,x=L/2+speed*age;if(x>L-.05)break;out.push([x,age]);}return out;}
