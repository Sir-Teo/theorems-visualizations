"""Independent arbitrary-precision real Taylor recurrence; no browser/JS implementation imported.

Requires mpmath 1.3.0. Run: python3 scripts/verify-tych.py /tmp/tych-reference.json
The two precisions/truncations must agree before any reference value is written.
"""
import json
import sys
import mpmath as mp


def values(alpha, time, xs, precision, terms):
    with mp.workdps(precision):
        a, t = mp.mpf(str(alpha)), mp.mpf(str(time))
        # h(z)=-(t+z)^(-a), g(z)=exp(h(z)); g_n=sum(j*h_j*g_(n-j))/n.
        h = [-t ** -a]
        for j in range(1, terms + 2):
            h.append(h[-1] * (-a - j + 1) / (j * t))
        g = [mp.exp(h[0])]
        for n in range(1, terms + 2):
            g.append(mp.fsum(j * h[j] * g[n-j] for j in range(1, n+1)) / n)
        result = []
        for x in xs:
            x = mp.mpf(str(x))
            weight, u, dt = mp.mpf(1), g[0], g[1]
            for k in range(1, terms + 1):
                weight *= x * x / (2 * (2 * k - 1))
                u += g[k] * weight
                dt += (k + 1) * g[k + 1] * weight
            result.append((+u, +dt))
        return result


rows = []
for alpha in [1.2, 1.5, 1.9]:
    for time in [.05, .15, .8, 2]:
        xs = [0, .5, 1, 2, 3] + ([5] if time >= .8 else [])
        low = values(alpha, time, xs, 200, 400)
        high = values(alpha, time, xs, 300, 600)
        for x, first, second in zip(xs, low, high):
            for v, w in zip(first, second):
                assert abs(v-w) < mp.mpf('1e-25') * max(abs(w), mp.mpf('1e-280')), (alpha, time, x)
            rows.append(dict(alpha=alpha, t=time, x=x, u=float(second[0]), ut=float(second[1])))
        print(f'checked alpha={alpha}, t={time}', flush=True)

with open(sys.argv[1], 'w') as f:
    json.dump(dict(method='Independent exponential-of-real-power-series recurrence; 200-digit/400-term and 300-digit/600-term agreement',
                   library='mpmath 1.3.0', source='https://users.math.msu.edu/users/yanb/847ch3.pdf (Theorem 4.4)', rows=rows), f, indent=2)
    f.write('\n')
