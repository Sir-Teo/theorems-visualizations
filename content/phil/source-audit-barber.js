// A finite binary relation: rows are shavers, columns are recipients.
function validBlock(matrix, n) {
  if (!Number.isInteger(n) || n < 1 || matrix.length < n || matrix.slice(0, n).some(row => row.length < n || row.slice(0, n).some(x => x !== 0 && x !== 1))) throw new RangeError('A nonempty n×n binary relation is required.');
}
export function barberDiagonal(matrix, n, barber) {
  validBlock(matrix, n);
  if (!Number.isInteger(barber) || barber < 0 || barber >= n) throw new RangeError('The internal barber must be in the quantified domain.');
  const target = Array.from({ length: n }, (_, j) => 1 - matrix[j][j]);
  const mismatches = target.flatMap((value, j) => matrix[barber][j] !== value ? [j] : []);
  return { target, row: matrix[barber].slice(0, n), mismatches,
    self: matrix[barber][barber], requiredSelf: target[barber] };
}
export function matchBarberOffDiagonal(matrix, n, barber) {
  const { target } = barberDiagonal(matrix, n, barber), result = matrix.map(row => [...row]);
  for (let j = 0; j < n; j++) if (j !== barber) result[barber][j] = target[j];
  return result;
}
// Construct an actual relation on V∪{o}. Its rule ranges over V only.
// Either chosen self-bit at(o,o) fails if the rule is extended to include o.
export function outsideBarberWitness(matrix, n, self = 0) {
  validBlock(matrix, n);
  if (self !== 0 && self !== 1) throw new RangeError('A binary self-entry is required.');
  const target = Array.from({ length: n }, (_, j) => 1 - matrix[j][j]);
  return [...matrix.slice(0, n).map(row => [...row.slice(0, n), 0]), [...target, self]];
}
