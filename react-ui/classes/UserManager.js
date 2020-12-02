import bip39 from '../../bip39.js';
import { getAddressFromMnemonic, runSidechainTransaction } from '../../blockchain.js';
import { loginEndpoint, previewExt, previewHost, storageHost } from '../../constants.js';
import storage from '../../storage.js';
import { getExt } from '../../util.js';

export default class UserManager extends EventTarget {
    constructor() {
        super();
    }

    loginToken = null;
    userObject = null;

    pullUserObject = async () => {
        const address = getAddressFromMnemonic(this.loginToken.mnemonic);
        const res = await fetch(`https://accounts.webaverse.com/${address}`);
        const result = await res.json();
        const { name, avatarUrl, avatarFileName, avatarPreview, ftu } = result;
        this.userObject = {
            name,
            avatar: {
                url: avatarUrl,
                filename: avatarFileName,
                preview: avatarPreview,
            },
            ftu,
        };
    }

    finishLogin = async (newLoginToken) => {
        await storage.set('loginToken', newLoginToken);

        this.loginToken = newLoginToken;

        await pullUserObject();
    }

    doLogin = async (email, code) => {
        const res = await fetch(loginEndpoint + `?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`, {
            method: 'POST',
        });

        if (res.status >= 200 && res.status < 300) {
            const newLoginToken = await res.json();
            await finishLogin(newLoginToken);
            return true;
        } else {
            const loginError = document.getElementById('login-error');
            const loginForm = document.getElementById('login-form');
            loginError.innerText = 'Invalid code!';
            loginForm.classList.add('phase-2');
            return false;
        }
    }

    tryLogin = async () => {
        this.loginToken = await storage.get('loginToken');
        if (this.loginToken) {
            await pullUserObject();
            if (this.loginToken.unregistered) console.warn("Login token is unregistered");
        } else {
            const mnemonic = bip39.generateMnemonic();
            await finishLogin({ mnemonic, unregistered: true });
        }
    }

    isLoggedIn = () => !!this.userObject;

    getUsername = () => this.userObject && this.userObject.name;

    setUsername = async (name) => {
        if (this.userObject) this.userObject.name = name;
    }

    getAddress = () => {
        if (!this.loginToken.mnemonic) return null;
        const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(this.loginToken.mnemonic)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
        const address = wallet.getAddressString();
        return address;
    }

    getMnemonic = () => this.loginToken && this.loginToken.mnemonic;

    getAvatar = () => this.userObject && this.userObject.avatar;

    setAvatar = async (id) => {
        if (!this.loginToken) throw new Error('not logged in');
        const res = await fetch(`https://tokens.webaverse.com/${id}`);
        const token = await res.json();
        const { filename, hash } = token.properties;
        const url = `${storageHost}/${hash.slice(2)}`;
        const ext = getExt(filename);
        const preview = `${previewHost}/${hash.slice(2)}.${ext}/preview.${previewExt}`;
        const address = this.getAddress();
        await Promise.all([
            runSidechainTransaction(this.loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarUrl', url),
            runSidechainTransaction(this.loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarFileName', filename),
            runSidechainTransaction(this.loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarPreview', preview),
        ]);
        this.userObject.avatar = {
            url,
            filename,
            preview,
        };
    }

    getFtu = () => !!(this.userObject && this.userObject.ftu);

    setFtu = async (name, avatarUrl) => {
        const address = this.getAddress();
        const avatarPreview = `${previewHost}/[${avatarUrl}]/preview.${previewExt}`;

        await Promise.all([
            runSidechainTransaction(this.loginToken.mnemonic)('Account', 'setMetadata', address, 'name', name),
            runSidechainTransaction(this.loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarUrl', avatarUrl),
            runSidechainTransaction(this.loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarFileName', avatarUrl),
            runSidechainTransaction(this.loginToken.mnemonic)('Account', 'setMetadata', address, 'avatarPreview', avatarPreview),
            runSidechainTransaction(this.loginToken.mnemonic)('Account', 'setMetadata', address, 'ftu', '1'),
        ]);


        this.userObject.avatar = {
            url: avatarUrl,
            filename: avatarUrl,
            preview: avatarPreview,
        };
    }

    getInventory = async () => {
        if (!this.loginToken) return []
        const address = this.getAddress();
        const res = await fetch(`https://tokens.webaverse.com/${address}`);
        return await res.json();
    }

    uploadFile = async (file) => {
        if (!this.loginToken) throw new Error('not logged in');
        if (!file.name) throw new Error('file has no name');

        const { mnemonic, addr } = this.loginToken;
        const res = await fetch(storageHost, {
            method: 'POST',
            body: file,
        });
        const { hash } = await res.json();
        const contractSource = await getContractSource('mintNft.cdc');

        const response = await fetch(`https://accounts.exokit.org/sendTransaction`, {
            method: 'POST',
            body: JSON.stringify({
                address: addr,
                mnemonic,

                limit: 100,
                transaction: contractSource
                    .replace(/ARG0/g, hash)
                    .replace(/ARG1/g, file.name),
                wait: true,
            }),
        });

        const responseJson = await response.json();
        if (responseJson?.transaction?.events[0]) {
            const id = parseInt(responseJson.transaction.events[0].payload.value.fields.find(field => field.name === 'id').value.value, 10);
            return {
                hash,
                id,
            };
        } else {
            return {
                hash,
                id,
            };
        }
    }

    sendFt = async (address, amount) => {
        if (!this.loginToken) throw new Error('not logged in');
        const { mnemonic, addr } = this.loginToken;
        const contractSource = await getContractSource('transferToken.cdc');

        await fetch(`https://accounts.exokit.org/sendTransaction`, {
            method: 'POST',
            body: JSON.stringify({
                address: addr,
                mnemonic,

                limit: 100,
                transaction: contractSource
                    .replace(/ARG0/g, amount)
                    .replace(/ARG1/g, '0x' + address),
                wait: true,
            }),
        });
    }

    sendNft = async (address, id) => {
        if (!this.loginToken) throw new Error('not logged in');
            const { mnemonic, addr } = this.loginToken;
            const contractSource = await getContractSource('transferNft.cdc');

            await fetch(`https://accounts.exokit.org/sendTransaction`, {
                method: 'POST',
                body: JSON.stringify({
                    address: addr,
                    mnemonic,

                    limit: 100,
                    transaction: contractSource
                        .replace(/ARG0/g, id)
                        .replace(/ARG1/g, '0x' + address),
                    wait: true,
                }),
            });
    }

    destroyNft = async (id) => {
        if (!this.loginToken) throw new Error('not logged in');
            const { mnemonic, addr } = this.loginToken;
            const contractSource = await getContractSource('destroyNft.cdc');

            await fetch(`https://accounts.exokit.org/sendTransaction`, {
                method: 'POST',
                body: JSON.stringify({
                    address: addr,
                    mnemonic,

                    limit: 100,
                    transaction: contractSource
                        .replace(/ARG0/g, id),
                    wait: true,
                }),
            });
    }
}