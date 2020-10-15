import {loginManager} from './login.js';

const ftu = document.getElementById('ftu');
const ftuUsername = document.getElementById('ftu-username');

let ftuPhase;
export async function tryTutorial() {
  const ftuDone = loginManager.getFtu();
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
      await loginManager.setFtu(ftuUsername.value, '');
    }
  };
});