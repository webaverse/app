import { ethers } from 'ethers';

export class MetamaskWallet {
    metamask = undefined;

    async initMetamaskWallet() {
        if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            try {
                await provider.send('eth_requestAccounts', []);
            } catch (error) {
                if (error.code === -32002) {
                    throw new Error('Please open metamask and accept the connection request.')
                }
            }
            const signer = provider.getSigner();
            const address = await signer.getAddress();

            const { chainId } = await provider.getNetwork();
            console.log({ chainId });
            if (![1, 137, 1338].includes(chainId)) {
                throw new Error('Please switch your network. Webaverse only supports Ethereum, Polygon and Webaverse sidechain.');
            }
            this.metamask = {
                provider,
                signer,
                address,
            };
            return address;
        } else {
            throw new Error('Metamask not installed');
        }
    }

    async getChainInfo() {
        if (window.ethereum) {
            const chainId = await ethereum.request({ method: 'eth_chainId' });
            const chainIdNum = Number.parseInt(chainId, 16);
            let chainName = '';
            switch (chainIdNum) {
                case 1:
                    chainName = 'eth';
                    break;
                case 137:
                    chainName = 'polygon';
                    break;
                case 1338:
                    chainName = 'sidechain';
                    break;
                default:
                    chainName = 'unknown';
                    break;
            }
            return {
                chainId: chainIdNum,
                chainName
            }
        } else {
            return {
                chainId: -1,
                chainName: 'unknown'
            }
        }
    }
}
