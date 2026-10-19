/** Actual two-coordinate optimizer experiment used by deep-4.5. */
export function adaptiveQuadratic(a, eta, kind, corr = true, N = 100) {
          let x = 1, y = 1, mx = 0, my = 0, sx = 0, sy = 0, Gx = 0, Gy = 0; const pts = [[1, 1]], f = [1], re = [], eps = 1e-8, f0 = 0.5 * (a + 1); let first = 0;
          for (let k = 1; k <= N; k++) {
            const gx = a * x, gy = y; let dx, dy;
            if (kind === 'gd') { dx = (0.9 / a) * gx; dy = (0.9 / a) * gy; }
            else if (kind === 'ada') { Gx += gx * gx; Gy += gy * gy; dx = eta * gx / (Math.sqrt(Gx) + eps); dy = eta * gy / (Math.sqrt(Gy) + eps); }
            else if (kind === 'rms') { sx = 0.9 * sx + 0.1 * gx * gx; sy = 0.9 * sy + 0.1 * gy * gy; dx = eta * gx / (Math.sqrt(sx) + eps); dy = eta * gy / (Math.sqrt(sy) + eps); }
            else {
              mx = 0.9 * mx + 0.1 * gx; my = 0.9 * my + 0.1 * gy; sx = 0.999 * sx + 0.001 * gx * gx; sy = 0.999 * sy + 0.001 * gy * gy;
              const c1 = corr ? 1 - 0.9 ** k : 1, c2 = corr ? 1 - 0.999 ** k : 1;
              dx = eta * (mx / c1) / (Math.sqrt(sx / c2) + eps); dy = eta * (my / c1) / (Math.sqrt(sy / c2) + eps);
            }
            if (k === 1) first = Math.hypot(dx, dy);
            re.push([Math.abs(dx / gx) || 1e-9, Math.abs(dy / gy) || 1e-9]);
            x -= dx; y -= dy; pts.push([x, y]); f.push(0.5 * (a * x * x + y * y) / f0);
          }
          return { pts, f, re, first };
        }
