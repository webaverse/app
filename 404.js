const pathname = location.pathname;
// const match = pathname.match(/^\/([a-z0-9]+)\/([a-z0-9]+)$/i);
const match = pathname.match(/^\/([0xa-f0-9]+)$/i);
if (match) {
  // const username = match[1];
  // const hash = match[2];
  const address = match[1];

  const div = document.createElement('div');
  div.classList.add('store');
  document.body.appendChild(div);
  const iframe = document.createElement('iframe');
  iframe.src = '/edit.html?o=';
  document.body.appendChild(iframe);
}