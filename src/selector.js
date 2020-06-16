const selector = document.getElementById('selector');
const selections = document.getElementById('selections');
selector.addEventListener('click', e => {
  selector.classList.toggle('open');
  selections.classList.toggle('open');
});