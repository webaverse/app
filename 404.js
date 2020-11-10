const pathname = location.pathname;
const match = pathname.match(/^\/([a-z0-9]+)\/([a-z0-9]+)$/i);
if (match) {
  const username = match[1];
  const hash = match[2];
  
  const div = document.createElement('div');
  document.body.appendChild(div);
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
}