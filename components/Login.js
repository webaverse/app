import { tryLogin } from '../login.js';

window.addEventListener('load', async () => {
    await tryLogin();
})

const Login = (props) => {
    return `
        <form id=login-form></form>
    `;
}
export default Login;