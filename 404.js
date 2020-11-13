import inventory from './inventory.js';
import * as blockchain from './blockchain.js';

(async () => {

const _setStoreHtml = () => {
  const div = document.createElement('div');
  div.classList.add('store');
  div.innerHTML = `\
    <section>
      <div class=tabs>
        <a href="/" class="tab selected">Me</a>
        <a href="/users" class=tab>Creators</a>
        <a href="/items" class=tab>Items</a>
      </div>
      <div class="content selected">
		    <ul class=users>
		      <li>
		        <img src="https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png" class="preview">
		        <div class="wrap">
		          <img src="https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png" class="avatar">
		          <div class=detail-1>avaer</div>
		          <div class=detail-2>0xdeadbeef</div>
		        </div>
		      </li>
		    </ul>
	      <button class=big-button>Mint NFT...</button>
      </div>
      <div class=content>
      </div>
      <div class=content>
      </div>
    </section>
    <section>
	    <div class="content2 selected">
	    </div>
	    <div class="content2">
        <ul class=users id=users></ul>
	    </div>
	    <div class="content2">
	      <ul class=items id=items></ul>
	    </div>
    </section>
    <section id=iframe-container></section>
  `;
  document.body.appendChild(div);

  const tabsElements = Array.from(div.querySelectorAll('.tab'));
  for (let i = 0; i < tabsElements.length; i++) {
  	const tab = tabsElements[i];
  	tab.addEventListener('click', e => {
      e.preventDefault();

      const href = tab.getAttribute('href');
      history.pushState({}, '', href);
      _setUrl(href);
  	});
  }
};
const _selecTabIndex = index => {
  const div = document.querySelector('.store');
  const tabsElements = Array.from(div.querySelectorAll('.tab'));
  const contents = Array.from(div.querySelectorAll('.content'));
  const contents2 = Array.from(div.querySelectorAll('.content2'));
  
  for (let i = 0; i < tabsElements.length; i++) {
    const tab = tabsElements[i];
    const content = contents[i];
    const content2 = contents2[i];
    tab.classList.remove('selected');
    content.classList.remove('selected');
    content2.classList.remove('selected');
  }
  if (index !== -1) {
    const tab = tabsElements[index];
    const content = contents[index];
    const content2 = contents2[index];
    tab.classList.add('selected');
    content.classList.add('selected');
    content2.classList.add('selected');
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
const _ensureStore = () => {
	if (!document.querySelector('.store')) {
		_setStoreHtml();
	  _loadContents();
	}
};
const _setIframe = u => {
	const iframeContainer = document.getElementById('iframe-container');
	iframeContainer.innerHTML = '';
	if (u) {
	  const iframe = document.createElement('iframe');
	  iframe.classList.add('preview');
	  iframe.src = '/edit.html?o=' + u;
	  iframe.setAttribute('frameBorder', 0);
	  iframeContainer.appendChild(iframe);
	}
};

const _set404Html = () => {
  const div = document.createElement('div');
  div.classList.add('error');
  div.innerHTML = `\
    <section>
      <h1>404</h1>
    </section>
  `;
  document.body.appendChild(div);
};

const {
  /* web3,
  addresses,
  abis, */
  contracts,
} = await blockchain.load();

const _setUrl = async u => {
  let match;
  if (match = u.match(/^\/(?:([0xa-f0-9]+)(?:\/([0xa-f0-9]+))?)?(users|items)?$/i)) {
    _ensureStore();

    // const username = match[1];
    // const hash = match[2];
    const address = match[1];
    const hash = match[2];
    const users = match[3] === 'users';
    const items = match[3] === 'items';

    if (address && !hash) {
      const tokenIds = await contracts.NFT.methods.getTokenIdsOf(address).call();
      console.log('got token ids', tokenIds);
      
      _selecTabIndex(1);
    } else if (address && hash) {
      _setIframe(`https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm`);

      _setIframe(null);
      _selecTabIndex(2);
    } else if (users) {
      const usersEl = document.querySelector('#users');
      const itemsEl = document.querySelector('#items');

      // (async() => {
        const res = await fetch('https://accounts.webaverse.com/');
        const accounts = await res.json();
        // console.log('got accounts', accounts);

        usersEl.innerHTML = accounts.map(account => {
          const avatarUrl = account.avatarUrl || `https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png`;
          return `\
            <li class=user>
              <img src="${avatarUrl}" class="preview">
              <div class="wrap">
                <img src="${avatarUrl}" class="avatar">
                <div class=detail-1>${account.name || 'Anonymous'}</div>
                <div class=detail-2>${account.address}</div>
              </div>
            </li>
          `;
        }).join('\n');
        const users = Array.from(itemsEl.querySelectorAll('.user'));

        /* for (const user of users) {
          const anchor = item.querySelector('.anchor');
          anchor.addEventListener('click', e => {
            const hash = item.getAttribute('hash');
            const filename = item.getAttribute('filename');
            _setIframe(`https://storage.exokit.org/${hash}/${filename}`);
          });
        } */
      // })();

      _setIframe(null);
      _selecTabIndex(1);
    } else if (items) {
      const itemsEl = document.querySelector('#items');
      
      inventory.getFiles(0, 100).then(files => {
        itemsEl.innerHTML = files.map(file => `\
          <li class="item card" hash="${file.properties.hash.slice(2)}" filename="${file.properties.filename}">
            <div class=title>${file.properties.filename}</div>
            <a href="#" class="anchor">
              <img src="${file.image}" class="preview">
            </a>
            <div class="wrap">
              <img src="https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png" class="avatar">
              <div class=detail-1>avaer</div>
              <div class=detail-2>0xdeadbeef</div>
            </div>
          </li>
        `).join('\n');
        const items = Array.from(itemsEl.querySelectorAll('.item'));

        for (const item of items) {
          const anchor = item.querySelector('.anchor');
          anchor.addEventListener('click', e => {
            const hash = item.getAttribute('hash');
            const filename = item.getAttribute('filename');
            _setIframe(`https://storage.exokit.org/${hash}/${filename}`);
          });
        }
      });

      _setIframe(null);
      _selecTabIndex(2);
    } else {
      _setIframe(null);
      _selecTabIndex(0);
    }
  } else {
    _set404Html();
  }
};

window.addEventListener('popstate', event => {
  _setUrl(location.pathname);
});

const pathname = location.pathname;
_setUrl(pathname);

})();