import { tryLogin } from '../login.js';

window.addEventListener('load', async () => {
    console.log('hello')
    await tryLogin();
})

const Login = (props) => {
    return `
        <form id=login-form></form>
    `;
}
export default Login;