import storage from './storage.js';

const ftu = document.getElementById('ftu');
// const ftuPhases = Array.from(document.querySelectorAll('.ftu-phase'));
let ftuPhase;
export async function tryTutorial() {
  const ftuDone = await storage.get('ftuDone');
  ftuPhase = ftuDone ? 4 : 1;
  ftu.classList.add('phase-' + ftuPhase);
}

Array.from(document.querySelectorAll('.next-phase-button')).forEach(nextPhaseButton => {
  nextPhaseButton.onclick = async () => {
    ftu.classList.remove('phase-' + ftuPhase);
    ftuPhase++;
    if (ftuPhase <= 3) {
      ftu.classList.add('phase-' + ftuPhase);
    } else {
      await storage.set('ftuDone', true);
    }
  };
});