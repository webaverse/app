import storage from './storage.js';

const ftu = document.getElementById('ftu');
// const ftuPhases = Array.from(document.querySelectorAll('.ftu-phase'));
let ftuPhase = 1;
export async function tryTutorial() {
  ftuPhase = await storage.get('ftu');
  if (typeof ftuPhase !== 'number') {
  	ftuPhase = 1;
  }
  ftu.classList.add('phase-' + ftuPhase);
}

Array.from(document.querySelectorAll('.next-phase-button')).forEach(nextPhaseButton => {
  nextPhaseButton.onclick = () => {
    ftu.classList.remove('phase-' + ftuPhase);
    ftuPhase++;
    if (ftuPhase <= 3) {
      ftu.classList.add('phase-' + ftuPhase);
    }
  };
});