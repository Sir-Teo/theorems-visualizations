const form = document.querySelector('#filters');
if (form) {
  const query = document.querySelector('#query'), method = document.querySelector('#method');
  const cards = [...document.querySelectorAll('.domain-card')];
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase('en').trim();
  const search = cards.map(card => ({ card, text: normalize(card.textContent), methods: card.dataset.methods.split(' ') }));
  function update() {
    const words = normalize(query.value).split(/\s+/).filter(Boolean);
    let count = 0;
    for (const row of search) {
      row.card.hidden = !words.every(w => row.text.includes(w)) || (method.value !== '' && !row.methods.includes(method.value));
      if (!row.card.hidden) count++;
    }
    document.querySelector('#results').textContent = count + ' of ' + cards.length + ' domains';
    document.querySelector('#empty').hidden = count !== 0;
  }
  form.hidden = false;
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('reset', () => { query.value = ''; method.value = ''; update(); });
  update();
}
