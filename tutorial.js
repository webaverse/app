throw new Error('lol');
// import {loginManager} from './login.js';
import {rigManager} from './rig.js';
import * as notifications from './notifications.js';
import {parseQuery, bindUploadFileButton, getExt} from './util.js';

const ftu = document.getElementById('ftu');

let ftuPhase;
export async function tryTutorial() {
  const ftuQs = parseQuery(location.search)['ftu'];
  const ftuNeeded = ftuQs === '1' || (!loginManager.getAvatar() && ftuQs !== '0');
  if (ftuNeeded) {
    const notification = notifications.addNotification(`\
      <i class="icon fa fa-alien-monster"></i>
      <div class=wrap>
        <div class=label>Getting started</div>
        <div class=text>
          You don't have an avatar (how embarassing!).<br>
          Wanna fix that up?<br>
        </div>
        <div class=close-button>✕</div>
        <!-- <progress value=0.5></progress>
        <div class=button>Add avatar</div> -->
      </div>
    `, {
      timeout: Infinity,
    });
    notification.querySelector('.close-button').addEventListener('click', e => {
      notifications.removeNotification(notification);
    });
    /* notifications.addNotification(`\
      <i class="icon fa fa-user-ninja"></i>
      <div class=wrap>
        <div class=label>Getting started</div>
        <div class=text>
          You don't have an avatar (how embarassing!).<br>
          Wanna fix that up?<br>
          <div class=button>Add avatar</div>
        </div>
      </div>
    `, {
      timeout: Infinity,
    }); */
  }
  /* ftuPhase = ftuDone ? 4 : 1;
  ftu.classList.add('phase-' + ftuPhase);
  ftuUsername.focus();
  ftuUsername.select(); */
}

/* const ftuUsername = document.getElementById('ftu-username');
ftuUsername.addEventListener('keydown', e => {
  if (e.which === 13) {
    _nextPhase();
  }
});

const avatarGrid = document.getElementById('avatar-grid');
const avatarGridUpload = document.querySelector('#avatar-grid .avatar.upload');
let selectedAvatar = '';
const avatarDivs = [
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
].map(name => {
  const url = 'https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/' + name;
  const previewUrl = `https://preview.exokit.org/[${url}]/preview.png`;
  const avatarDiv = document.createElement('div');
  avatarDiv.classList.add('avatar');
  avatarDiv.classList.add('model');
  avatarDiv.innerHTML = `<img src="${previewUrl}">`;
  avatarDiv.onclick = () => {
    for (const avatarDiv of avatarDivs) {
      avatarDiv.classList.remove('selected');
    }
    avatarDiv.classList.add('selected');
    rigManager.setLocalAvatarUrl(url, name);
    selectedAvatar = url;
  };

  avatarGrid.insertBefore(avatarDiv, avatarGridUpload);
  
  return avatarDiv;
});

bindUploadFileButton(document.getElementById('ftu-upload-avatar-input'), async file => {
  if (getExt(file.name) === 'vrm') {
    const {hash, id} = await loginManager.uploadFile(file);
    console.log('got file upload', {hash, id});
  } else {
    console.warn('uploaded avatar is not .vrm');
  }
}); */

const _nextPhase = async () => {
  ftu.classList.remove('phase-' + ftuPhase);
  ftuPhase++;
  if (ftuPhase <= 3) {
    ftu.classList.add('phase-' + ftuPhase);
  } else {
    await loginManager.setFtu(ftuUsername.value, selectedAvatar);
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