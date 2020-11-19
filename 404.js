import inventory from './inventory.js';
// import * as blockchain from './blockchain.js';
import {tryLogin, loginManager} from './login.js';
import storage from './storage.js';
// import Web3 from './web3.min.js';
import bip39 from './bip39.js';
import hdkeySpec from './hdkey.js';
const hdkey = hdkeySpec.default;
import ethereumJsTx from './ethereumjs-tx.js';
const {Transaction, Common} = ethereumJsTx;
import {web3, contracts, getAddressFromMnemonic} from './blockchain.js';

const web3SidechainEndpoint = 'https://ethereum.exokit.org';
const storageHost = 'https://storage.exokit.org';
// const discordOauthUrl = `https://discord.com/api/oauth2/authorize?client_id=684141574808272937&redirect_uri=https%3A%2F%2Fapp.webaverse.com%2Fdiscordlogin.html&response_type=code&scope=identify`;

(async () => {

const _renderHeader = () => {
  const div = document.createElement('header');
  div.classList.add('header');
  div.innerHTML = `\
    <div class=tabs>
      <a href="/" class="tab selected">Me</a>
      <a href="/store" class=tab>Store</a>
      <a href="/users" class=tab>Creators</a>
      <a href="/items" class=tab>Items</a>
    </div>
    <form id=login-form></form>
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
  if (match = u.match(/^(?:\/(store))?(?:\/(users)(?:\/([0xa-f0-9]+))?)?(?:\/(items)(?:\/([0-9]+))?)?(?:\/(mint))?(?:\/(withdraw)(?:\/([0-9]+))?)?(?:\/)?$/i)) {
    // _ensureStore();

    const store = !!match[1];
    const users = !!match[2];
    const address = match[3];
    const items = !!match[4];
    const tokenId = match[5];
    const mint = match[6];
    const withdraw = match[7];
    const withdrawId = match[8];

    if (store) { // store
      const res = await fetch('https://store.webaverse.com/');
      const booths = await res.json();
      await Promise.all(booths.map(async booth => {
        let username = await contracts['sidechain'].Account.methods.getMetadata(booth.address, 'name').call();
        if (!username) {
          username = 'Anonymous';
        }
        booth.username = username;
        
        let avatarPreview = await contracts['sidechain'].Account.methods.getMetadata(booth.address, 'avatarPreview').call();
        if (!avatarPreview) {
          avatarPreview = `https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png`;
        }
        booth.avatarPreview = avatarPreview;
      }));

      if (currentUrl !== u) return;
      
      _setStoreHtml(`\
        <section>
          <div class="content2">
            <ul class=items id=items></ul>
          </div>
        </section>
      `);
      
      const itemsEl = document.querySelector('#items');

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
                    <img src="${booth.avatarPreview}" class="avatar">
                    <div class=detail-1>${booth.username}</div>
                    <div class=detail-2>${booth.address}</div>
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
      const tokenIds = await contracts['sidechain'].NFT.methods.getTokenIdsOf(address).call();

      let username = await contracts['sidechain'].Account.methods.getMetadata(address, 'name').call();
      if (!username) {
        username = 'Anonymous';
      }
      let avatarPreview = await contracts['sidechain'].Account.methods.getMetadata(address, 'avatarPreview').call();
      if (!avatarPreview) {
        avatarPreview = `https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png`;
      }
      const balance = await contracts['sidechain'].FT.methods.balanceOf(address).call();
      
      const res = await fetch('https://tokens.webaverse.com/' + address);
      const files = await res.json();
      
      const owners = await Promise.all(files.map(async file => {
        const address = file.owner;
        let username = await contracts['sidechain'].Account.methods.getMetadata(address, 'name').call();
        if (!username) {
          username = 'Anonymous';
        }
        let avatarPreview = await contracts['sidechain'].Account.methods.getMetadata(address, 'avatarPreview').call();
        if (!avatarPreview) {
          avatarPreview = `https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png`;
        }
        
        return {
          address,
          username,
          avatarPreview,
        };
      }));

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
      itemsEl.innerHTML = files.map((file, i) => {
        const owner = owners[i];
        return `\
          <li class="item card" tokenid="${file.id}" filename="${file.properties.filename}">
            <div class=title>${file.properties.filename}</div>
            <a href="/items/${file.id}" class="anchor">
              <img src="${file.image}" class="preview">
            </a>
            <div class="wrap">
              <img src="${owner.avatarPreview}" class="avatar">
              <div class=detail-1>${owner.username}</div>
              <div class=detail-2>${owner.address}</div>
              <div class=detail-3>${file.properties.hash.slice(2)}</div>
            </div>
          </li>
        `;
      }).join('\n');
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
      
      let username = await contracts['sidechain'].Account.methods.getMetadata(myAddress, 'name').call();
      if (!username) {
        username = 'Anonymous';
      }
      let avatarPreview = await contracts['sidechain'].Account.methods.getMetadata(myAddress, 'avatarPreview').call();
      if (!avatarPreview) {
        avatarPreview = `https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png`;
      }

      if (currentUrl !== u) return;

      _setStoreHtml(`\
        <section class=profile>
          <ul class=items>
            <li class="item card big" tokenid="${file.id}" filename="${file.properties.filename}">
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
        <section>
          <div class=sidebar>
            <div class=side>
              <div class=key>Minter</div>
              <div class=value>${file.minter}</div>
            </div>
            <div class=side>
              <div class=key>Owner</div>
              <div class=value>${file.owner}</div>
            </div>
            <div class=side>
              <div class=key>Token id</div>
              <div class=value>${file.id}</div>
            </div>
            <div class=side>
              <div class=key>Timestamp</div>
              <div class=value>${new Date().toString()}</div>
            </div>
          </div>
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
      
      const owners = await Promise.all(files.map(async file => {
        const address = file.owner;
        let username = await contracts['sidechain'].Account.methods.getMetadata(address, 'name').call();
        if (!username) {
          username = 'Anonymous';
        }
        let avatarPreview = await contracts['sidechain'].Account.methods.getMetadata(address, 'avatarPreview').call();
        if (!avatarPreview) {
          avatarPreview = `https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png`;
        }
        
        return {
          address,
          username,
          avatarPreview,
        };
      }));
      
      if (currentUrl !== u) return;

      _setStoreHtml(`\
        <section>
          <div class="content2">
            <ul class=items id=items></ul>
          </div>
        </section>
      `);

      const itemsEl = document.querySelector('#items');
      itemsEl.innerHTML = files.map((file, i) => {
        const owner = owners[i];
        return `\
          <li class="item card" tokenid="${file.id}" filename="${file.properties.filename}">
            <div class=title>${file.properties.filename}</div>
            <a href="/items/${file.id}" class="anchor">
              <img src="${file.image}" class="preview">
            </a>
            <div class="wrap">
              <img src="${owner.avatarPreview}" class="avatar">
              <div class=detail-1>${owner.username}</div>
              <div class=detail-2>${owner.address}</div>
              <div class=detail-3>${file.properties.hash.slice(2)}</div>
            </div>
          </li>
        `;
      }).join('\n');
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
    } else if (mint) {
      _setStoreHtml(`\
        <form id=sidechain-mint-form>
          <h2>Mint</h2>
          <input type=file id=sidechain-mint-file>
          <input type=number id=sidechain-mint-count value=1 min=1 max=100>
          <input type=submit id=sidechain-mint-button value="Mint token">
        </form>
      `);
      
      const sidechainMintForm = document.getElementById('sidechain-mint-form');
      const sidechainMintFileInput = document.getElementById('sidechain-mint-file');
      const sidechainMintCount = document.getElementById('sidechain-mint-count');
      const sidechainMintButton = document.getElementById('sidechain-mint-button');
      sidechainMintForm.addEventListener('submit', async e => {
        e.preventDefault();
        e.stopPropagation();
        
        sidechainMintButton.disabled = true;

        const {files} = sidechainMintFileInput;
        if (files.length > 0) {
          const [file] = files;

          const res = await fetch(storageHost, {
            method: 'POST',
            body: file,
          });
          const j = await res.json();
        
          const filename = {
            t: 'string',
            v: file.name,
          };
          const hash = {
            t: 'uint256',
            v: '0x' + web3['sidechain'].utils.padLeft(j.hash, 32),
          };
          const count = {
            t: 'uint256',
            v: new web3['sidechain'].utils.BN(sidechainMintCount.value),
          };
          
          const receipt = await runSidechainTransaction('NFT', 'mint', myAddress, hash.v, filename.v, count.v);
          console.log('minted', receipt);
          // sidechainNftIdInput.value = new web3['sidechain'].utils.BN(receipt.logs[0].topics[3].slice(2), 16).toNumber();
        } else {
          console.log('no files');
        }
        
        sidechainMintButton.disabled = false;
      });
      
      _selectTabIndex(0);
    } else if (withdrawId) {
      _setStoreHtml(`\
        <form id=sidechain-withdraw-form>
          <h2>Withdraw</h2>
          <div>NFT ${withdrawId}</div>
          <input type=submit id=sidechain-nft-button value="Withdraw NFT">
        </form>
      `);

      const withdrawForm = document.getElementById('sidechain-withdraw-form');
      const sidechainNftButton = document.getElementById('sidechain-nft-button');
      withdrawForm.addEventListener('submit', async e => {
        e.preventDefault();
        e.stopPropagation();

        sidechainNftButton.disabled = true;
    
        const id = parseInt(withdrawId, 10);
        if (!isNaN(id)) {
          const tokenId = {
            t: 'uint256',
            v: new web3['sidechain'].utils.BN(id),
          };
          
          const hashSpec = await contracts.sidechain.NFT.methods.getHash(tokenId.v).call();
          const hash = {
            t: 'uint256',
            v: new web3['sidechain'].utils.BN(hashSpec),
          };
          const filenameSpec = await contracts.sidechain.NFT.methods.getMetadata(hashSpec, 'filename').call();
          const filename = {
            t: 'string',
            v: filenameSpec,
          };
          console.log('got filename hash', hash, filename);

          // approve on sidechain
          const receipt0 = await runSidechainTransaction('NFT', 'setApprovalForAll', NFTProxyAddressSidechain, true);
          
          // deposit on sidechain
          const receipt = await runSidechainTransaction('NFTProxy', 'deposit', address, tokenId.v);
          console.log('got receipt', receipt);

          // get sidechain deposit receipt signature
          const signature = await getTransactionSignature('sidechain', 'NFT', receipt.transactionHash);
          console.log('got signature', signature);
          const timestamp = {
            t: 'uint256',
            v: signature.timestamp,
          };
          const {r, s, v} = signature;
          /* const chainId = {
            t: 'uint256',
            v: new web3['sidechain'].utils.BN(2),
          };

          const filenameHash = web3.utils.sha3(filename.v);
          const message = web3.utils.encodePacked(address, tokenId, hash, filenameHash, timestamp, chainId);
          const hashedMessage = web3.utils.sha3(message);
          const sgn = await web3.eth.personal.sign(hashedMessage, address);
          const r = sgn.slice(0, 66);
          const s = '0x' + sgn.slice(66, 130);
          const v = '0x' + sgn.slice(130, 132);
          console.log('got', JSON.stringify({r, s, v}, null, 2)); */

          // withdraw receipt signature on sidechain
          // console.log('main withdraw', [address, tokenId.v.toString(10), hash.v.toString(10), filename, timestamp.v.toString(10), r, s, v]);
          await contracts.main.NFTProxy.methods.withdraw(address, tokenId.v, hash.v, filename.v, timestamp.v, r, s, v).send({
            from: address,
          });
          
          console.log('OK');
        } else {
          console.log('failed to parse', JSON.stringify(ethNftIdInput.value));
        }
        
        sidechainNftButton.disabled = false;
      });
      
      _selectTabIndex(0);
    } else if (withdraw) {
      const balance = await contracts['sidechain'].FT.methods.balanceOf(myAddress).call();

      if (currentUrl !== u) return;

      _setStoreHtml(`\
        <form id=sidechain-withdraw-form>
          <h2>Withdraw</h2>
          <div>${balance} FT</div>
          <input type=number id=sidechain-ft-amount value=1 min=1 max=100>
          <input type=submit id=sidechain-ft-button value="Withdraw FTs">
        </form>
      `);

      const withdrawForm = document.getElementById('sidechain-withdraw-form');
      const sidechainFtAmountInput = document.getElementById('sidechain-ft-amount');
      const sidechainFtButton = document.getElementById('sidechain-ft-button');
      withdrawForm.addEventListener('submit', async e => {
        e.preventDefault();
        e.stopPropagation();

        sidechainFtButton.disabled = true;

        const amt = parseInt(sidechainFtAmountInput.value, 10);
        if (!isNaN(amt)) {
          const ftAmount = {
            t: 'uint256',
            v: new web3['sidechain'].utils.BN(amt),
          };
          
          // approve on sidechain
          const receipt0 = await runSidechainTransaction('FT', 'approve', FTProxyAddressSidechain, ftAmount.v);
          
          // deposit on sidechain
          const receipt = await runSidechainTransaction('FTProxy', 'deposit', address, ftAmount.v);
          console.log('got receipt', receipt);

          // get sidechain deposit receipt signature
          const signature = await getTransactionSignature('sidechain', 'FT', receipt.transactionHash);
          const {amount, timestamp, r, s, v} = signature;
          /* const {transactionHash} = receipt;
          const timestamp = {
            t: 'uint256',
            // v: new web3.utils.BN(Date.now()),
            v: transactionHash,
          };
          const chainId = {
            t: 'uint256',
            v: new web3.utils.BN(1),
          };
          const message = web3.utils.encodePacked(address, amount, timestamp, chainId);
          const hashedMessage = web3.utils.sha3(message);
          const sgn = await web3.eth.personal.sign(hashedMessage, address);
          const r = sgn.slice(0, 66);
          const s = '0x' + sgn.slice(66, 130);
          const v = '0x' + sgn.slice(130, 132);
          console.log('got', JSON.stringify({r, s, v}, null, 2)); */

          // withdraw receipt signature on main chain
          await contracts.main.FTProxy.methods.withdraw(address, amount, timestamp, r, s, v).send({
            from: address,
          });
          
          console.log('OK');
        } else {
          console.log('failed to parse', JSON.stringify(sidechainFtAmountInput.value));
        }
        
        sidechainFtButton.disabled = false;
      });

      _selectTabIndex(0);
    } else { // home
      let username = await contracts['sidechain'].Account.methods.getMetadata(myAddress, 'name').call();
      if (!username) {
        username = 'Anonymous';
      }
      let avatarPreview = await contracts['sidechain'].Account.methods.getMetadata(myAddress, 'avatarPreview').call();
      if (!avatarPreview) {
        avatarPreview = `https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png`;
      }
      const balance = await contracts['sidechain'].FT.methods.balanceOf(myAddress).call();
    
      const res = await fetch('https://tokens.webaverse.com/' + myAddress);
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
                <div class=detail-2>${myAddress}</div>
                <div class=detail-3>${balance} FT (<a href="/withdraw" id=widthdraw-ft-link>withdraw</a>)</div>
              </div>
            </li>
          </ul>
          <div class=favorites>
            <h1>Favorites</h1>
            <div class=tiles>
              <a href="#" class="tile selected">
                <div class="wrap">
                  <h3>Slot 1</h3>
                  <i class="fas fa-sword" aria-hidden="true"></i>
                </div>
              </a>
              <a href="#" class="tile">
                <div class="wrap">
                  <h3>Slot 2</h3>
                  <i class="fas fa-sword" aria-hidden="true"></i>
                </div>
              </a>
              <a href="#" class="tile">
                <div class="wrap">
                  <h3>Slot 3</h3>
                  <i class="fas fa-sword" aria-hidden="true"></i>
                </div>
              </a>
            </div>
          </div>
          <a href="/mint" class=big-button id=mint-link>Mint NFT...</a>
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
          <div class=bottom>(<a href="/withdraw/${file.id}" class=widthdraw-nft-link>withdraw</a>)</div>
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

        const withdrawNftLink = item.querySelector('.widthdraw-nft-link');
        withdrawNftLink.addEventListener('click', e => {
          e.preventDefault();
          /* const hash = item.getAttribute('hash');
          const filename = item.getAttribute('filename');
          _pushState(`/items/0x${hash}`); */
          const href = withdrawNftLink.getAttribute('href');
          _pushState(href);
        });
      }
      
      const mintLinkEl = document.querySelector('#mint-link');
      mintLinkEl.addEventListener('click', e => {
        e.preventDefault();
        // e.stopPropagation();
        
        const href = e.target.getAttribute('href');
        _pushState(href);
      });

      const withdrawFtLink = document.querySelector('#widthdraw-ft-link');
      withdrawFtLink.addEventListener('click', e => {
        e.preventDefault();
        // e.stopPropagation();
        
        const href = e.target.getAttribute('href');
        _pushState(href);
      });
      
      _selectTabIndex(0);
    }
  } else {
    _set404Html();
  }
};

await tryLogin();

const loginToken = await storage.get('loginToken');
const {mnemonic} = loginToken;
const myAddress = getAddressFromMnemonic(mnemonic);

window.addEventListener('popstate', event => {
  _setUrl(location.pathname);
});

const pathname = location.pathname;
_setUrl(pathname);

})();