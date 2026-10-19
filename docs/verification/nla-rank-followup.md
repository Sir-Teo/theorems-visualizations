# NLA truncation-rank follow-up

The peer finding in `nla-1.8` was correct: keeping k SVD terms does not force rank k when retained singular values vanish. The statement now gives rank(A_k)=min(k,rank(A))≤k; for k>0 equality holds exactly when sigma_k>0. The k=0 case explicitly has rank zero. The proof now counts nonzero retained singular values.

A direct counterexample is A=diag(3,0,0), k=2: the actual `svd`→`truncate`→`rank` path returns A_2=A, singular values [3,0,0], rank 1 and residual 0. One-off numerical checks covered k=0,1,2 for diag(3,0,0), diag(3,1,0), the zero matrix and diag(3e−9,0,0). All 12 cases return the expected min(k,rank(A)) and tail Frobenius error. No unit test merely matching the corrected prose was added.

The numerical implementation was already correct. `truncate` sums the selected weighted outer products; zero singular values contribute zero, regardless of the orthonormal completion of the corresponding singular vectors. The actual `rank` helper counts singular values above its scale-relative numerical tolerance, rather than returning k. Its source is unchanged. The misleading helper comment is corrected.

The existing six-dimensional demo deliberately has six positive singular values. Its caption now distinguishes that full-rank example from the general rank bound, and its readout computes the numerical rank of A_k using `M.rank(Ak)`. Competitor labels say rank at most k. The same incorrect exact-rank terminology in downstream image example `nla-1.9` is corrected to “first k SVD terms”/“rank at most k”; only nonzero outer-product layers are called rank one. The syllabus picture description also allows equality rather than claiming all competitors are strictly worse. The zero-based array access SIG[k] correctly refers to the one-based sigma_(k+1).

Validation:

- Existing `node tests/verification-pure-math.test.mjs`: 15 independent mathematical groups pass.
- `node scripts/check.mjs nla --static`: 52 items, 0 errors, 0 warnings.
- `tests/verification-nla-rank-browser.mjs`:4/4 native item/theme cases pass, actual local KaTeX 0.16.11, one worker. Controls exercise k=1/5, zero/nonzero perturbation, both norm/competitor families and a new matrix; image controls exercise k=0/64 and a second image. Runtime and TeX errors are empty.
- Light/dark screenshots inspected; results and screenshots are under `/tmp/nla-rank-followup/`.

This is an independently demonstrated mathematical correction. No additional historical/original-source claim was closed and no source flag changed.
