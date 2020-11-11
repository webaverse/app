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

  const iframe = document.createElement('iframe');
  iframe.classList.add('preview');
  iframe.src = '/edit.html?o=' + `https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm`;
  iframe.setAttribute('frameBorder', 0)
  document.getElementById('iframe-container').appendChild(iframe);

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
    const items = div.querySelector('.items');
    items.innerHTML = files.map(file => `\
      <li>
        <img src="${file.image}" class="preview">
        <div class="wrap">
          <img src="https://preview.exokit.org/[https://raw.githubusercontent.com/avaer/vrm-samples/master/vroid/male.vrm]/preview.png" class="avatar">
          <div class=detail-1>avaer</div>
          <div class=detail-2>0xdeadbeef</div>
        </div>
      </li>
    `).join('\n');
  });
}