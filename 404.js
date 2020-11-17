import inventory from './inventory.js';
import * as blockchain from './blockchain.js';
import {tryLogin} from './login.js';
import storage from './storage.js';
import bip39 from './bip39.js';
import hdkeySpec from './hdkey.js';
const hdkey = hdkeySpec.default;

(async () => {

const _renderHeader = () => {
  const div = document.createElement('header');
  // div.classList.add('tabs');
  div.innerHTML = `\
    <div class=tabs>
      <a href="/" class="tab selected">Me</a>
      <a href="/store" class=tab>Store</a>
      <a href="/users" class=tab>Creators</a>
      <a href="/items" class=tab>Items</a>
    </div>
    <form id=login-form style="display: none;"></form>
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
_renderHeader();

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
const _selectTabIndex = index => {
  const div = document.querySelector('.tabs');
  const tabsElements = Array.from(div.querySelectorAll('.tab'));
  // const contents = Array.from(div.querySelectorAll('.content'));
  // const contents2 = Array.from(div.querySelectorAll('.content2'));
  
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

let currentUrl = '';
const _setUrl = async u => {
  currentUrl = u;

  let match;
  if (match = u.match(/^(?:\/(store))?(?:\/(users)(?:\/([0xa-f0-9]+))?)?(?:\/(items)(?:\/([0-9]+))?)?(?:\/)?$/i)) {
    // _ensureStore();

    const store = !!match[1];
    const users = !!match[2];
    const address = match[3];
    const items = !!match[4];
    const tokenId = match[5];

    if (store) { // store
      _setStoreHtml(`\
        <section>
          <div class="content2">
            <ul class=items id=items></ul>
          </div>
        </section>
      `);
      
      const res = await fetch('https://store.webaverse.com/');
      const booths = await res.json();
      if (currentUrl !== u) return;
      
      const itemsEl = document.querySelector('#items');
      
      console.log('got booths', booths);
      itemsEl.innerHTML = booths.map(booth => {
        if (booth.files.length > 0) {
          return `\
            <div class=booth>
              <div class=label><b>${booth.address}</b> selling <b>${booth.files.length}</b></div>
              ${booth.files.map(file => `\
                <li class="item card" tokenid="${file.id}" filename="${file.properties.filename}">
                  <div class=title>${file.properties.filename}</div>
                  <a href="/items/${file.id}" class="anchor">
                    <img src="${file.image}" class="preview">
                  </a>
                  <div class="wrap">
                    <img src="https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png" class="avatar">
                    <div class=detail-1>${username}</div>
                    <div class=detail-2>${myAddress}</div>
                    <div class=detail-3>${file.properties.hash.slice(2)}</div>
                  </div>
                </li>
              `).join('\n')}
            </div>
          `;
        } else {
          return '';
        }
      }).flat().join('\n');
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
      
      _selectTabIndex(1);
    } else if (address) { // user
      const tokenIds = await contracts.NFT.methods.getTokenIdsOf(address).call();

      let username = await contracts.Account.methods.getMetadata(address, 'name').call();
      if (!username) {
        username = 'Anonymous';
      }
      let avatarPreview = await contracts.Account.methods.getMetadata(address, 'avatarPreview').call();
      if (!avatarPreview) {
        avatarPreview = `https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png`;
      }
      const balance = await contracts.FT.methods.balanceOf(address).call();
      
      const res = await fetch('https://tokens.webaverse.com/' + address);
      const files = await res.json();

      if (currentUrl !== u) return;

      _setStoreHtml(`\
        <section class=profile>
          <ul class=users>
            <li>
              <img src="${avatarPreview}" class="preview">
              <div class="wrap">
                <img src="${avatarPreview}" class="avatar">
                <div class=detail-1>${username}</div>
                <div class=detail-2>${address}</div>
                <div class=detail-3>${balance} FT</div>
              </div>
            </li>
          </ul>
          <!-- <a href="edit.html" class=big-button>Goto HomeSpace</a> -->
          <!-- <button class=big-button>Mint NFT...</button>
          <button class=big-button>Withdraw to mainnet...</button> -->
        </section>
        <section>
          <div class="content2">
            <ul class=items id=items></ul>
          </div>
        </section>
      `);
      
      const itemsEl = document.querySelector('#items');
      
      // const files = await inventory.getFiles(0, 100);
      itemsEl.innerHTML = files.map(file => `\
        <li class="item card" tokenid="${file.id}" filename="${file.properties.filename}">
          <div class=title>${file.properties.filename}</div>
          <a href="/items/${file.id}" class="anchor">
            <img src="${file.image}" class="preview">
          </a>
          <div class="wrap">
            <img src="https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png" class="avatar">
            <div class=detail-1>${username}</div>
            <div class=detail-2>${myAddress}</div>
            <div class=detail-3>${file.properties.hash.slice(2)}</div>
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
      
      _selectTabIndex(3);
    } else if (tokenId) { // item
      /* _setStoreHtml(`\
        <section id=iframe-container></section>
      `); */

      const res = await fetch('https://tokens.webaverse.com/' + tokenId);
      const file = await res.json();

      if (currentUrl !== u) return;

      _setStoreHtml(`\
        <section class=profile>
          <ul class=items>
            <li class="item card" tokenid="${file.id}" filename="${file.properties.filename}">
              <div class=title>${file.properties.filename}</div>
              <a href="/items/${file.id}" class="anchor">
                <img src="${file.image}" class="preview">
              </a>
              <div class="wrap">
                <img src="https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png" class="avatar">
                <div class=detail-1>${username}</div>
                <div class=detail-2>${myAddress}</div>
                <div class=detail-3>${file.properties.hash.slice(2)}</div>
              </div>
            </li>
          </ul>
          <!-- <a href="edit.html" class=big-button>Goto HomeSpace</a> -->
          <!-- <button class=big-button>Mint NFT...</button>
          <button class=big-button>Withdraw to mainnet...</button> -->
        </section>
      `);
      
      // _setIframe(`https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm`);
      _selectTabIndex(3);
    } else if (users) { // users
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
        
        if (currentUrl !== u) return;

        usersEl.innerHTML = accounts.map(account => {
          const avatarPreview = account.avatarPreview || `https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png`;
          return `\
            <li class=user address="${account.address}">
              <a href="/users/${account.address}" class="anchor">
                <img src="${avatarPreview}" class="preview">
              </a>
              <div class="wrap">
                <img src="${avatarPreview}" class="avatar">
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

      _selectTabIndex(2);
    } else if (items) { // items
      const files = await inventory.getFiles(0, 100);
      
      if (currentUrl !== u) return;

      _setStoreHtml(`\
        <section>
          <div class="content2">
            <ul class=items id=items></ul>
          </div>
        </section>
      `);

      const itemsEl = document.querySelector('#items');
      itemsEl.innerHTML = files.map(file => `\
        <li class="item card" tokenid="${file.id}" filename="${file.properties.filename}">
          <div class=title>${file.properties.filename}</div>
          <a href="/items/${file.id}" class="anchor">
            <img src="${file.image}" class="preview">
          </a>
          <div class="wrap">
            <img src="https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png" class="avatar">
            <div class=detail-1>${username}</div>
            <div class=detail-2>${myAddress}</div>
            <div class=detail-3>${file.properties.hash.slice(2)}</div>
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

      _selectTabIndex(3);
    } else { // home
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
      
      _selectTabIndex(0);
    }
  } else {
    _set404Html();
  }
};

await tryLogin();

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

window.addEventListener('popstate', event => {
  _setUrl(location.pathname);
});

const pathname = location.pathname;
_setUrl(pathname);

})();