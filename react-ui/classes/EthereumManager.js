export class EthereumManager {
    static instance = null;
    constructor(callbackFunction){
        EthereumManager.instance = this;
        this.startEthereum(callbackFunction);
    }
    startEthereum = async (callbackFunction) => {
        try {
            if (window.ethereum) {
                window.ethereum.on('accountsChanged', (accounts) => {
                    console.log("*********** Accounts changed!");
                    console.log(accounts);
                    // Set mainnet addres to address 
                    callbackFunction(accounts);
                });

                console.log("************* Ethereum enabled");
                const address = await window.ethereum.enable();
                // Set mainnet addres to address 
                callbackFunction(address);
            } else {
                // Set mainnet address to null
                console.log("************* Ethereum NOT enabled");
                callbackFunction(null);

            }
        } catch (err) {
            console.err(err);
            // Set mainnet address to null
            callbackFunction(null);
        }
    }
}

export const EthereumManagerFactory = (callbackFunction) =>
    EthereumManager.instance !== null ? EthereumManager.instance : new EthereumManager(callbackFunction);