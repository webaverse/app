import {loginManager} from './login.js';
import {rigManager} from './rig.js';
import {parseQuery, bindUploadFileButton, getExt} from './util.js';

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

ftuUsername.addEventListener('keydown', e => {
  if (e.which === 13) {
    _nextPhase();
  }
});

const avatarGrid = document.getElementById('avatar-grid');
const avatarGridUpload = avatarGrid.querySelector('.avatar.upload');
[
  'male.vrm',
  'female.vrm',
  'Darkness_Shibu.vrm',
  'HairSample_Female.vrm',
  'HairSample_Male.vrm',
  'Sakurada_Fumiriya.vrm',
  // 'Sendagaya_Shibu.vrm',
  'Sendagaya_Shino.vrm',
  'Victoria_Rubin.vrm',
  'Vita.vrm',
  // 'Vivi.vrm',
].forEach(name => {
  const url = 'https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/' + name;
  const previewUrl = `https://preview.exokit.org/[${url}]/preview.png`;
  const avatarDiv = document.createElement('div');
  avatarDiv.classList.add('avatar');
  avatarDiv.classList.add('model');
  // avatarDiv.setAttribute('avatar', url);
  avatarDiv.innerHTML = `<img src="${previewUrl}">`;
  avatarDiv.onclick = () => {
    // console.log('click avatar');
    // loginManager.setAvatar(url);
    rigManager.setLocalAvatarUrl(url, name);
  };

  avatarGrid.insertBefore(avatarDiv, avatarGridUpload);
});

bindUploadFileButton(document.getElementById('ftu-upload-avatar-input'), async file => {
  if (getExt(file.name) === 'vrm') {
    const {hash, id} = await loginManager.uploadFile(file);
    console.log('got file upload', {hash, id});
  } else {
    console.warn('uploaded avatar is not .vrm');
  }
});

const _nextPhase = async () => {
  ftu.classList.remove('phase-' + ftuPhase);
  ftuPhase++;
  if (ftuPhase <= 3) {
    ftu.classList.add('phase-' + ftuPhase);
  } else {
    await loginManager.setFtu(ftuUsername.value, '');
  }
};
Array.from(document.querySelectorAll('.next-phase-button')).forEach(nextPhaseButton => {
  nextPhaseButton.onclick = _nextPhase;
});

const _prevPhase = async () => {
  ftu.classList.remove('phase-' + ftuPhase);
  ftuPhase--;
  ftu.classList.add('phase-' + ftuPhase);
};
Array.from(document.querySelectorAll('.prev-phase-button')).forEach(prevPhaseButton => {
  prevPhaseButton.onclick = _prevPhase;
});