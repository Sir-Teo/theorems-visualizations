import {rand,hashStr} from './ch05.shared.js';

/** Fixed smooth field in deep-5.8, with the original reproducible random weights. */
export function makeResidualField() {
  const r = rand(hashStr('resode')), H = 6;
        const W1 = Array.from({ length: H }, () => [r.normal() * 1.1, r.normal() * 1.1]), bb = Array.from({ length: H }, () => r.normal() * 0.8), wt = Array.from({ length: H }, () => r.normal() * 1.3);
        const W2 = Array.from({ length: 2 }, () => Array.from({ length: H }, () => r.normal() * 0.55));
        const field = (x, y, t, a) => { let u = 0, w = 0; for (let j = 0; j < H; j++) { const th = Math.tanh(W1[j][0] * x + W1[j][1] * y + wt[j] * (t - 0.5) + bb[j]); u += W2[0][j] * th; w += W2[1][j] * th; } return [a * u, a * w]; };
  field.parameters = { W1, bb, wt, W2 };
  return field;
}

export const residualEuler = (field, p, L, a, keep = false) => { let x = p[0], y = p[1]; const tr = keep ? [[x, y]] : null; for (let l = 0; l < L; l++) { const [u, w] = field(x, y, l / L, a); x += u / L; y += w / L; if (keep) tr.push([x, y]); } return keep ? tr : [x, y]; };

export const residualRK4 = (field, p, a, n = 400, keep = 0) => { let x = p[0], y = p[1]; const h = 1 / n, tr = keep ? [[x, y]] : null; for (let k = 0; k < n; k++) { const t = k * h, k1 = field(x, y, t, a), k2 = field(x + 0.5 * h * k1[0], y + 0.5 * h * k1[1], t + 0.5 * h, a), k3 = field(x + 0.5 * h * k2[0], y + 0.5 * h * k2[1], t + 0.5 * h, a), k4 = field(x + h * k3[0], y + h * k3[1], t + h, a); x += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); if (keep && (k + 1) % keep === 0) tr.push([x, y]); } return keep ? tr : [x, y]; };
