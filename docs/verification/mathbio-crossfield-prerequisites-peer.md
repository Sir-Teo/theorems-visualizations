# Independent peer: seven mathematical-biology prerequisite applications

Recommend accepting exact prerequisite candidate `47c466a937528fee41143961a6c25551600b9138`, together with the separately reviewed Gompertz statement qualifier `94742318b79711f95f73d0936381a573c19ccd32`. This is a bounded mathematical prerequisite/prose and equation-layout review, not a new source-body closure or a complete state audit of the unchanged visualizations. In particular, unresolved Kolmogorov 1936 item 3.14 retains its original flag and implementation.

## Exact snapshots and scope

The candidate and its parent were extracted with `git archive` into `/tmp/atlas-worker-two/mathbio-prerequisites-peer-47c466a` and `/tmp/atlas-worker-two/mathbio-prerequisites-parent`. The later qualifier was independently archived into `/tmp/atlas-worker-two/mathbio-gompertz-peer-9474231`; its parent is exact `1b5e4d6`. No producer worktree was edited. The intervening energy explanation is reviewed separately and is not accepted by this report.

All seven actual prerequisite statements and explanations were read, together with the changed application, relevant visualization calculations and producer report. The direct applications are:

- 1.3 → pma5.15: Taylor's theorem applied to log(1+x), x=p/100>0, produces a negative remainder after x and hence a compound doubling time longer than the continuous one. The signed relative error of 70/p is `0.7 log(1+x)/(x log 2)-1`; it is positive at p=1, then crosses zero. The second derivative has the required sign on [0,x]. No claim of underestimation at every compound rate survives.
- 1.6 → ode1.4: u=1/N gives `u'+ru=r/K`, with factor exp(rt). The explicit reciprocal solution remains positive for forward time when N0,r,K>0, so the linear solution recovers the unique positive logistic solution on that interval. Positivity for all negative times is not asserted.
- 1.7 → pma5.5: for u(τ)=N(τ/r)/K the chain rule gives `du/dτ=N'/(Kr)=u(1-u)`. This works for any positive initial population; the commonly shifted increasing sigmoid additionally needs 0<u0<1. The twelve generated cultures in the actual code all meet that additional condition.
- 1.8 → ode1.5: y=log(N/K) obeys y'=-ay for negative, zero or positive y0. Exponentiating its exponential solution gives a positive N; this analytic solution is distinct from fitting synthetic data.
- 2.2 → ladr5.50: M=[[1,1],[b,0]] has distinct real eigenvalues for b>0 and eigenvectors [1,λ−1]. Every nonzero nonnegative initial vector has a positive dominant coefficient. The subdominant mode decays relatively because |λ−/λ+|<1; at offered b=3, λ−≈−1.3028 grows absolutely. The repair correctly distinguishes these claims.
- 4.2 → ladr3.43: the same age-class basis and fixed census rates justify L² and L^t by matrix composition. Time-dependent rates require the ordered product of distinct matrices.
- 4.4 → ladr8.46: complexification permits Jordan form for the real census operator. A primitive matrix has a simple dominant block; remaining powers include binomial polynomial factors times eigenvalue powers. After normalization they decay; zero-eigenvalue nilpotent blocks vanish. The text preserves the possible polynomial correction and does not give an unconditional pure-geometric rate.

The equivalent statement wrapping in 4.2 and 4.4 preserves their mathematical content and is readable at 320px in both themes.

## Independent finding and closure: Gompertz domain

The original prerequisite candidate correctly allowed either sign of y0 but retained an unqualified statement that every Gompertz curve is sigmoid. For N0=1.5K, y>0, `N'=-aNy<0` and `N''=a²Ny(y+1)>0`: the forward path decreases convexly. At N0=K it is constant. For 0<N0<K the full curve is sigmoid; its inflection time is `log(-log(N0/K))/a`, strictly positive only for N0<K/e.

Exact qualifier `9474231` states these distinctions, including already-concave below-capacity forward paths. An all-71-item and complete-syllabus comparison against its exact parent allows only the specified 1.8 statement substitution. Flags, functions, numerical models and all other properties remain identical. The 192 derivative/curvature cases pass. Fresh 320px light and dark renders pass and both actual statement images were personally inspected. This closes the concrete finding.

## Checks and own evidence

`/tmp/atlas-worker-two/mathbio-prerequisites-peer-evidence/verify.log` records an all-71-item comparison and full syllabus comparison, allowing only the seven idea/dependency pairs, the 1.7 domain qualification and equivalent 4.2/4.4 equation wrapping. Every flag and visualization function is preserved. The reused verification driver was adapted to immutable peer archives and independently rerun: 296 Taylor/error rates, 36 linear-equation integrations, 108 chain-rule rescalings, 72 signed Gompertz cases, 114 rabbit eigenbasis states, 832 matrix census compositions and 486 real/complex Jordan powers, including nilpotent cases, all pass.

An additional independently written `independent-reference.py` uses 102-digit Decimal and exact Fraction arithmetic. It finds the rule-of-70 error zero at approximately p=1.9838005786 and the p=1 exact time 69.6607168936; checks 216 direct rabbit recurrence states against an independently constructed eigenbasis; checks 24 exact rational chain-rule substitutions; and checks 48 size-three Jordan powers against direct matrix multiplication, including λ=0. Its JSON is saved alongside the script. The chain-rule and Jordan checks have exact rational equality, rather than numerical tolerances.

Focused static checking passes 7 items with zero errors/warnings. Own fresh native checks pass all fourteen seven-item/theme explanation groups and four 4.2/4.4 statement/theme groups, at viewport 320 and content width 284. They check actual runtime errors, blank stages, TeX and page/formula bounds. All fourteen own idea images and four statement images were personally inspected at readable resolution. Logs are `native.log`, `matrix-layout.log` and `static.log`; screenshots share the same evidence directory.

The qualifier's own isolated output is `/tmp/atlas-worker-two/mathbio-gompertz-peer-evidence/`, including `math-byteguard.log`, `native.log` and both actual `statement-320-{light,dark}.png`. This report recommends no source-flag changes and makes no broad certification of the unchanged inputs, saved-state protocol or external historical source bodies.
