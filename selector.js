const selector = document.getElementById('selector');
const selections = document.getElementById('selections');
selector.addEventListener('click', e => {
  selector.classList.toggle('open');
  selections.classList.toggle('open');
});

document.addEventListener('click', e => {
  if (e.target && !['header-label', 'selector', 'selections'].includes(e.target.id) && selector.classList.contains('open')) {
    selector.classList.toggle('open');
    selections.classList.toggle('open');
  }
});
