const normalize = value => String(value || '').normalize('NFKC').toLocaleLowerCase('en').trim();
export function matchesDomain(row, {query = '', method = '', route = ''} = {}) {
  const words = normalize(query).split(/\s+/).filter(Boolean), text = normalize(row.search);
  return words.every(word => text.includes(word)) && (!method || row.methods.includes(method)) &&
    (!route || route === 'collections' && row.collections > 0 || route === 'editions' && row.editions > 0 || route === 'reading' && row.collections === 0 && row.editions === 0);
}
