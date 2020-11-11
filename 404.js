import inventory from './inventory.js';

const pathname = location.pathname;
// const match = pathname.match(/^\/([a-z0-9]+)\/([a-z0-9]+)$/i);
const match = pathname.match(/^\/([0xa-f0-9]+)$/i);
if (match) {
  // const username = match[1];
  // const hash = match[2];
  const address = match[1];

  const div = document.createElement('div');
  div.classList.add('store');
  div.innerHTML = `\
    <section>
      <div class=tabs>
        <div class="tab selected">Me</div>
        <div class=tab>Creators</div>
        <div class=tab>Items</div>
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
	    </div>
	    <div class="content2">
	    </div>
	    <div class="content2">
	      <ul class=items></ul>
	    </div>
    </section>
    <section id=iframe-container></section>
  `;
  document.body.appendChild(div);

  const iframeContainer = document.getElementById('iframe-container');
  const _setIframe = u => {
	  const iframe = document.createElement('iframe');
	  iframe.classList.add('preview');
	  iframe.src = '/edit.html?o=' + u;
	  iframe.setAttribute('frameBorder', 0);
	  iframeContainer.innerHTML = '';
	  iframeContainer.appendChild(iframe);
	};
	_setIframe(`https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm`);

  const tabsElements = Array.from(div.querySelectorAll('.tab'));
  const contents = Array.from(div.querySelectorAll('.content'));
  const contents2 = Array.from(div.querySelectorAll('.content2'));
  for (let i = 0; i < tabsElements.length; i++) {
  	const tab = tabsElements[i];
  	const content = contents[i];
  	const content2 = contents2[i];
  	tab.addEventListener('click', e => {
  		for (let i = 0; i < tabsElements.length; i++) {
  			const tab = tabsElements[i];
  	    const content = contents[i];
  	    const content2 = contents2[i];
      	tab.classList.remove('selected');
      	content.classList.remove('selected');
      	content2.classList.remove('selected');
      }
      tab.classList.add('selected');
      content.classList.add('selected');
      content2.classList.add('selected');
  	});
  }

  inventory.getFiles(0, 100).then(files => {
  	console.log('got files', files);
    const itemsEl = div.querySelector('.items');
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

  window.addEventListener('mousemove', e => {
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
  });
}