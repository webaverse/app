import inventory from './inventory.js';
import * as blockchain from './blockchain.js';
import storage from './storage.js';
import bip39 from './bip39.js';
import hdkeySpec from './hdkey.js';
const hdkey = hdkeySpec.default;

(async () => {

const {
  /* web3,
  addresses,
  abis, */
  contracts,
} = await blockchain.load();

const loginToken = await storage.get('loginToken');
const {mnemonic} = loginToken;
const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(mnemonic)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
const myAddress = wallet.getAddressString();

let username = await contracts.Account.methods.getMetadata(myAddress, 'name').call();
if (!username) {
  username = 'Anonymous';
}
const balance = await contracts.FT.methods.balanceOf(myAddress).call();

const _renderTabs = () => {
  const div = document.createElement('div');
  div.classList.add('tabs');
  div.innerHTML = `\
    <a href="/" class="tab selected">Me</a>
    <a href="/users" class=tab>Creators</a>
    <a href="/items" class=tab>Items</a>
  `;
  document.body.appendChild(div);
  
  const tabsElements = Array.from(div.querySelectorAll('.tab'));
  for (let i = 0; i < tabsElements.length; i++) {
  	const tab = tabsElements[i];
  	tab.addEventListener('click', e => {
      e.preventDefault();

      const href = tab.getAttribute('href');
      _pushState(href);
  	});
  }
};
const _setStoreHtml = h => {
  const oldStore = document.querySelector('.store');
  oldStore && oldStore.parentNode.removeChild(oldStore);
  
  const div = document.createElement('div');
  div.classList.add('store');
  div.innerHTML = h;
  document.body.appendChild(div);
};
const _pushState = u => {
  history.pushState({}, '', u);
  _setUrl(u);
};
const _selecTabIndex = index => {
  const div = document.querySelector('.tabs');
  const tabsElements = Array.from(div.querySelectorAll('.tab'));
  const contents = Array.from(div.querySelectorAll('.content'));
  const contents2 = Array.from(div.querySelectorAll('.content2'));
  
  for (let i = 0; i < tabsElements.length; i++) {
    const tab = tabsElements[i];
    /* const content = contents[i];
    const content2 = contents2[i]; */
    tab.classList.remove('selected');
    /* content.classList.remove('selected');
    content2.classList.remove('selected'); */
  }
  if (index !== -1) {
    const tab = tabsElements[index];
    /* const content = contents[index];
    const content2 = contents2[index]; */
    tab.classList.add('selected');
    /* content.classList.add('selected');
    content2.classList.add('selected'); */
  }
};
const _loadContents = () => {
  /* window.addEventListener('mousemove', e => {
    let {clientX, clientY, target} = e;
    target = target.closest('.card');
    if (target) {
    	const {x, y, width, height} = target.getBoundingClientRect();
    	const cx = x + width/2;
    	const cy = y + height/2;
    	const dx = (clientX - cx) / width * 30;
    	const dy = -(clientY - cy) / width * 30;
    	target.style.transform = `rotateY(${dx}deg) rotateX(${dy}deg)`;
	  }
  });
  window.addEventListener('mouseout', e => {
  	let {clientX, clientY, target} = e;
  	target = target.closest('.card');
    if (target) {
    	target.style.transform = null;
	  }
  }); */
};
/* const _ensureStore = () => {
	if (!document.querySelector('.store')) {
		_setStoreHtml();
	  _loadContents();
	}
}; */
const _setIframe = u => {
  return; // XXX
	const iframeContainer = document.getElementById('iframe-container');
	iframeContainer.innerHTML = '';
	if (u) {
	  const iframe = document.createElement('iframe');
	  iframe.classList.add('preview');
	  iframe.src = '/edit.html?ftu=0&o=' + u;
	  iframe.setAttribute('frameBorder', 0);
	  iframeContainer.appendChild(iframe);
	}
};

const _set404Html = () => {
  const oldStore = document.querySelector('.store');
  oldStore && oldStore.parentNode.removeChild(oldStore);

  const div = document.createElement('div');
  div.classList.add('store');
  div.innerHTML = `\
    <section>
      <h1>404</h1>
    </section>
  `;
  document.body.appendChild(div);
};

const _setUrl = async u => {
  let match;
  if (match = u.match(/^(?:\/(users)(?:\/([0xa-f0-9]+))?)?(?:\/(items)(?:\/([0xa-f0-9]+))?)?(?:\/)?$/i)) {
    // _ensureStore();

    const users = !!match[1];
    const address = match[2];
    const items = !!match[3];
    const hash = match[4];

    if (address) {
      const tokenIds = await contracts.NFT.methods.getTokenIdsOf(address).call();

      let username = await contracts.Account.methods.getMetadata(address, 'name').call();
      if (!username) {
        username = 'Anonymous';
      }
      const balance = await contracts.FT.methods.balanceOf(address).call();

      _setStoreHtml(`\
        <section class=profile>
          <ul class=users>
            <li>
              <img src="https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png" class="preview">
              <div class="wrap">
                <img src="https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png" class="avatar">
                <div class=detail-1>${username}</div>
                <div class=detail-2>${address}</div>
                <div class=detail-3>${balance} FT</div>
              </div>
            </li>
          </ul>
          <!-- <a href="edit.html" class=big-button>Goto HomeSpace</a> -->
          <button class=big-button>Mint NFT...</button>
          <button class=big-button>Withdraw to mainnet...</button>
        </section>
      `);
      
      _selecTabIndex(1);
    } else if (hash) {
      _setStoreHtml(`\
        <section id=iframe-container></section>
      `);
      
      _setIframe(`https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm`);
      _selecTabIndex(2);
    } else if (users) {
      _setStoreHtml(`\
        <section>
          <ul class=users id=users></ul>
        </section>
      `);
      
      const usersEl = document.querySelector('#users');

      // (async() => {
        const res = await fetch('https://accounts.webaverse.com/');
        const accounts = await res.json();
        // console.log('got accounts', accounts);

        usersEl.innerHTML = accounts.map(account => {
          const avatarUrl = account.avatarUrl || `https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png`;
          return `\
            <li class=user address="${account.address}">
              <a href="/users/${account.address}" class="anchor">
                <img src="${avatarUrl}" class="preview">
              </a>
              <div class="wrap">
                <img src="${avatarUrl}" class="avatar">
                <div class=detail-1>${account.name || 'Anonymous'}</div>
                <div class=detail-2>${account.address}</div>
              </div>
            </li>
          `;
        }).join('\n');
        const users = Array.from(usersEl.querySelectorAll('.user'));

        for (const user of users) {
          const anchor = user.querySelector('.anchor');
          anchor.addEventListener('click', e => {
            e.preventDefault();
            /* const address = user.getAttribute('address');
            _pushState(`/users/${account.address}`); */
            const href = anchor.getAttribute('href');
            _pushState(href);
          });
        }
      // })();

      _selecTabIndex(1);
    } else if (items) {
      _setStoreHtml(`\
        <section>
          <div class="content2">
            <ul class=items id=items></ul>
          </div>
        </section>
      `);

      const itemsEl = document.querySelector('#items');

      inventory.getFiles(0, 100).then(files => {
        itemsEl.innerHTML = files.map(file => `\
          <li class="item card" hash="${file.properties.hash.slice(2)}" filename="${file.properties.filename}">
            <div class=title>${file.properties.filename}</div>
            <a href="/items/${file.properties.hash}" class="anchor">
              <img src="${file.image}" class="preview">
            </a>
            <div class="wrap">
              <img src="https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png" class="avatar">
              <div class=detail-1>${username}</div>
              <div class=detail-2>${myAddress}</div>
            </div>
          </li>
        `).join('\n');
        const items = Array.from(itemsEl.querySelectorAll('.item'));

        for (const item of items) {
          const anchor = item.querySelector('.anchor');
          anchor.addEventListener('click', e => {
            e.preventDefault();
            /* const hash = item.getAttribute('hash');
            const filename = item.getAttribute('filename');
            _pushState(`/items/0x${hash}`); */
            const href = anchor.getAttribute('href');
            _pushState(href);
          });
        }
      });

      _selecTabIndex(2);
    } else {
      _setStoreHtml(`\
        <section class=profile>
          <ul class=users>
            <li>
              <img src="https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png" class="preview">
              <div class="wrap">
                <img src="https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png" class="avatar">
                <div class=detail-1>${username}</div>
                <div class=detail-2>${myAddress}</div>
                <div class=detail-3>${balance} FT</div>
              </div>
            </li>
          </ul>
          <!-- <a href="edit.html" class=big-button>Goto HomeSpace</a> -->
          <button class=big-button>Mint NFT...</button>
          <button class=big-button>Withdraw to mainnet...</button>
        </section>
      `);
      
      _selecTabIndex(0);
    }
  } else {
    _set404Html();
  }
};

_renderTabs();

window.addEventListener('popstate', event => {
  _setUrl(location.pathname);
});

const pathname = location.pathname;
_setUrl(pathname);

})();