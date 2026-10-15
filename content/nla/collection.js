// Collection metadata (see AUTHORING.md §0).
export default {
  id: "nla",
  short: "NLA",
  title: "Numerical Linear Algebra",
  field: "math",
  area: "applied",
  order: 200,
  source: {
    type: "course",
    refs: ["Trefethen & Bau, Numerical Linear Algebra", "Golub & Van Loan, Matrix Computations"]
  },
  blurb: String.raw`QR, LU and Cholesky factorizations, least squares, conditioning and stability, eigenvalue algorithms, the SVD in practice, and Krylov methods.`
};
