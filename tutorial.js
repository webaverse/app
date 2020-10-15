import {loginManager} from './login.js';
import {parseQuery} from './util.js';

const ftu = document.getElementById('ftu');
const ftuUsername = document.getElementById('ftu-username');

let ftuPhase;
export async function tryTutorial() {
  const ftuDone = loginManager.getFtu() && !parseQuery(location.search)['ftu'];
  ftuPhase = ftuDone ? 4 : 1;
  ftu.classList.add('phase-' + ftuPhase);
  ftuUsername.focus();
  ftuUsername.select();
}

Array.from(document.querySelectorAll('.avatar-grid > .avatar.model')).forEach(avatarButton => {
  avatarButton.onclick = () => {
    console.log('click avatar');
  };
});
Array.from(document.querySelectorAll('.avatar-grid > .avatar.upload')).forEach(avatarButton => {
  avatarButton.onclick = () => {
    console.log('click upload');
  };
});

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

Array.from(document.querySelectorAll('.prev-phase-button')).forEach(prevPhaseButton => {
  prevPhaseButton.onclick = async () => {
    ftu.classList.remove('phase-' + ftuPhase);
    ftuPhase--;
    ftu.classList.add('phase-' + ftuPhase);
  };
});