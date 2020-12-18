import { useEffect } from 'https://unpkg.com/es-react@16.13.1/dev';
import css from '../web_modules/csz.js';
import storage from '../webaverse/storage.js';
import { parseQuery } from '../webaverse/util.js';
const styles = css`${window.locationSubdirectory}/components/CreatorsPage.css`

const LoginGateway = () => {
  const handleLogin = async () => {
    const q = parseQuery(location.search);
    const {email, code} = q;
    if (email && code) {
      const res = await fetch(`/gateway?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`, {
        method: 'POST',
      });
      if (res.status >= 200 && res.status < 300) {
        const j = await res.json();
        const {mnemonic} = j;
        await storage.set('loginToken', {mnemonic});
      } else {
        console.warn('invalid status code: ' + res.status);
      }
      location.href = '/';
    } else {
      console.warn('no email/code provided', q);
    }
  };

  useEffect(() => {
    handleLogin();
  }, []);

  return html`
    <div>Logging In...</div>
  `
}

export default LoginGateway;