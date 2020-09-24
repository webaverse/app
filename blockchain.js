import flowConstants from './flow-constants.js';
const {FungibleToken, NonFungibleToken, ExampleToken, ExampleNFT, ExampleAccount} = flowConstants;
import wordList from './flow/wordlist.js';

/* import flowConstants from './flow-constants.js';
import {accountsHost} from './constants.js';
import {uint8Array2hex} from './util.js';

const _createAccount = async () => {
  const res = await fetch(accountsHost, {
    method: 'POST',
  });
  const j = await res.json();
  return j;
};
const _bakeContract = async (contractKeys, contractSource) => {
  const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
    method: 'POST',
    body: JSON.stringify({
      address: contractKeys.address,
      privateKey: contractKeys.privateKey,
      publicKey: contractKeys.publicKey,

      limit: 100,
      transaction: `\
        transaction(code: String) {
          prepare(acct: AuthAccount) {
            acct.setCode(code.decodeHex())
          }
        }
      `,
      args: [
        {value: uint8Array2hex(new TextEncoder().encode(contractSource)), type: 'String'},
      ],
      wait: true,
    }),
  });
  const response2 = await res.json();

  console.log('bake contract 2', response2);
  return response2;
};
const _bakeUserAccount = async (userKeys, ftContractAddress, nftContractAddress) => {
  // set up ft
  {
    const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
      method: 'POST',
      body: JSON.stringify({
        address: userKeys.address,
        privateKey: userKeys.privateKey,
        publicKey: userKeys.publicKey,

        limit: 100,
        transaction: `\
          import FungibleToken from ${flowConstants.FungibleToken}
          import ExampleToken from 0x${ftContractAddress}

          transaction {

              prepare(signer: AuthAccount) {

                  if signer.borrow<&ExampleToken.Vault>(from: /storage/exampleTokenVault) == nil {
                      // Create a new exampleToken Vault and put it in storage
                      signer.save(<-ExampleToken.createEmptyVault(), to: /storage/exampleTokenVault)

                      // Create a public capability to the Vault that only exposes
                      // the deposit function through the Receiver interface
                      signer.link<&ExampleToken.Vault{FungibleToken.Receiver}>(
                          /public/exampleTokenReceiver,
                          target: /storage/exampleTokenVault
                      )

                      // Create a public capability to the Vault that only exposes
                      // the balance field through the Balance interface
                      signer.link<&ExampleToken.Vault{FungibleToken.Balance}>(
                          /public/exampleTokenBalance,
                          target: /storage/exampleTokenVault
                      )
                  }
              }
          }
        `,
        wait: true,
      }),
    });
    const response2 = await res.json();

    console.log('got response 8', response2);
  }
  // set up nft
  {
    const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
      method: 'POST',
      body: JSON.stringify({
        address: userKeys.address,
        privateKey: userKeys.privateKey,
        publicKey: userKeys.publicKey,

        limit: 100,
        transaction: `\
          import NonFungibleToken from ${flowConstants.NonFungibleToken}
          import ExampleNFT from 0x${nftContractAddress}
          // This transaction is what an account would run
          // to set itself up to receive NFTs

          transaction {
              prepare(acct: AuthAccount) {

                  // If the account doesn't already have a collection
                  if acct.borrow<&ExampleNFT.Collection>(from: /storage/NFTCollection) == nil {

                      // Create a new empty collection
                      let collection <- ExampleNFT.createEmptyCollection() as! @ExampleNFT.Collection
                      
                      // save it to the account
                      acct.save(<-collection, to: /storage/NFTCollection)

                      // create a public capability for the collection
                      acct.link<&{NonFungibleToken.CollectionPublic}>(/public/NFTCollection, target: /storage/NFTCollection)
                  }
              }
          }
        `,
        wait: true,
      }),
    });
    const response2 = await res.json();

    console.log('got response 10', response2);
  }
  return userKeys;
};
const testFlow = async () => {
  const exampleTokenSource = await (async () => {
    const res = await fetch('./flow/ExampleToken.cdc');
    const text = await res.text();
    return text.replace('0xFUNGIBLETOKENADDRESS', flowConstants.FungibleToken);
  })();
  const exampleNFTSource = await (async () => {
    const res = await fetch('./flow/ExampleNFT.cdc');
    const text = await res.text();
    return text.replace('0xNFTADDRESS', flowConstants.NonFungibleToken);
  })();

  console.log('ready to test');

  const [
    ftContractKeys,
    nftContractKeys,
    userKeys,
    userKeys2,
  ] = await Promise.all([
    _createAccount(),
    _createAccount(),
    _createAccount(),
    _createAccount(),
  ]);

  console.log('got keys', {
    ftContractKeys,
    nftContractKeys,
    userKeys,
    userKeys2,
  });

  await Promise.all([
    _bakeContract(ftContractKeys, exampleTokenSource),
    _bakeContract(nftContractKeys, exampleNFTSource),
  ]);
  console.log('baked contracts');
  await Promise.all([
    _bakeUserAccount(userKeys, ftContractKeys.address, nftContractKeys.address),
    _bakeUserAccount(userKeys2, ftContractKeys.address, nftContractKeys.address),
  ]);
  console.log('baked user accounts');

  // mint ft
  {
    const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
      method: 'POST',
      body: JSON.stringify({
        address: ftContractKeys.address,
        privateKey: ftContractKeys.privateKey,
        publicKey: ftContractKeys.publicKey,

        limit: 100,
        transaction: `\
          import FungibleToken from ${flowConstants.FungibleToken}
          import ExampleToken from 0x${ftContractKeys.address}

          transaction(recipient: Address, amount: UFix64) {
            let tokenAdmin: &ExampleToken.Administrator
            let tokenReceiver: &{FungibleToken.Receiver}

            prepare(signer: AuthAccount) {
                self.tokenAdmin = signer
                .borrow<&ExampleToken.Administrator>(from: /storage/exampleTokenAdmin) 
                ?? panic("Signer is not the token admin")

                self.tokenReceiver = getAccount(recipient)
                .getCapability(/public/exampleTokenReceiver)!
                .borrow<&{FungibleToken.Receiver}>()
                ?? panic("Unable to borrow receiver reference")
            }

            execute {
                let minter <- self.tokenAdmin.createNewMinter(allowedAmount: amount)
                let mintedVault <- minter.mintTokens(amount: amount)

                self.tokenReceiver.deposit(from: <-mintedVault)

                destroy minter
            }
          }
        `,
        args: [
          {value: '0x' + userKeys.address, type: 'Address'},
          {value: '10.0', type: 'UFix64'},
        ],
        wait: true,
      }),
    });
    const response2 = await res.json();

    console.log('got response 12', response2);
  }
  // transfer ft
  {
    const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
      method: 'POST',
      body: JSON.stringify({
        address: ftContractKeys.address,
        privateKey: ftContractKeys.privateKey,
        publicKey: ftContractKeys.publicKey,

        limit: 100,
        transaction: `\
          import FungibleToken from ${flowConstants.FungibleToken}
          import ExampleToken from 0x${ftContractKeys.address}

          transaction(amount: UFix64, to: Address) {

              // The Vault resource that holds the tokens that are being transferred
              let sentVault: @FungibleToken.Vault

              prepare(signer: AuthAccount) {

                  // Get a reference to the signer's stored vault
                  let vaultRef = signer.borrow<&ExampleToken.Vault>(from: /storage/exampleTokenVault)
                ?? panic("Could not borrow reference to the owner's Vault!")

                  // Withdraw tokens from the signer's stored vault
                  self.sentVault <- vaultRef.withdraw(amount: amount)
              }

              execute {

                  // Get the recipient's public account object
                  let recipient = getAccount(to)

                  // Get a reference to the recipient's Receiver
                  let receiverRef = recipient.getCapability(/public/exampleTokenReceiver)!.borrow<&{FungibleToken.Receiver}>()
                      ?? panic("Could not borrow receiver reference to the recipient's Vault")

                  // Deposit the withdrawn tokens in the recipient's receiver
                  receiverRef.deposit(from: <-self.sentVault)
              }
          }
        `,
        args: [
          {value: '5.0', type: 'UFix64'},
          {value: '0x' + userKeys2.address, type: 'Address'},
        ],
        wait: true,
      }),
    });
    const response2 = await res.json();

    console.log('got response 14', response2);
  }

  // mint nft
  let nft;
  {
    const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
      method: 'POST',
      body: JSON.stringify({
        address: nftContractKeys.address,
        privateKey: nftContractKeys.privateKey,
        publicKey: nftContractKeys.publicKey,

        limit: 100,
        transaction: `\
          import NonFungibleToken from ${flowConstants.NonFungibleToken}
          import ExampleNFT from 0x${nftContractKeys.address}

          // This script uses the NFTMinter resource to mint a new NFT
          // It must be run with the account that has the minter resource
          // stored in /storage/NFTMinter

          transaction(hash: String, recipient: Address) {
              
              // local variable for storing the minter reference
              let minter: &ExampleNFT.NFTMinter

              prepare(signer: AuthAccount) {

                  // borrow a reference to the NFTMinter resource in storage
                  self.minter = signer.borrow<&ExampleNFT.NFTMinter>(from: /storage/NFTMinter)
                      ?? panic("Could not borrow a reference to the NFT minter")
              }

              execute {
                  // Get the public account object for the recipient
                  let recipient = getAccount(recipient)

                  // Borrow the recipient's public NFT collection reference
                  let receiver = recipient
                      .getCapability(/public/NFTCollection)!
                      .borrow<&{NonFungibleToken.CollectionPublic}>()
                      ?? panic("Could not get receiver reference to the NFT Collection")

                  // Mint the NFT and deposit it to the recipient's collection
                  self.minter.mintNFT(hash: hash, recipient: receiver)
              }
          }
        `,
        args: [
          {value: 'lol', type: 'String'},
          {value: '0x' + userKeys.address, type: 'Address'},
        ],
        wait: true,
      }),
    });
    const response2 = await res.json();

    console.log('got response 16', response2);
    nft = parseInt(response2.transaction.events[0].payload.value.fields[0].value.value);
  }
  {
    const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
      method: 'POST',
      body: JSON.stringify({
        script: `\
          import ExampleNFT from 0x${nftContractKeys.address}

          pub fun main() : String {
            return ExampleNFT.getHash(id: ${nft})
          }
        `,
      }),
    });
    const response = await res.json();

    console.log('got response 15 A', response);
    console.log('got response 16 A', response.encodedData.value);
  }
  {
    const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
      method: 'POST',
      body: JSON.stringify({
        address: nftContractKeys.address,
        privateKey: nftContractKeys.privateKey,
        publicKey: nftContractKeys.publicKey,

        limit: 100,
        transaction: `\
          import NonFungibleToken from ${flowConstants.NonFungibleToken}
          import ExampleNFT from 0x${nftContractKeys.address}

          // This script uses the NFTMinter resource to mint a new NFT
          // It must be run with the account that has the minter resource
          // stored in /storage/NFTMinter

          transaction(hash: String, recipient: Address) {
              
              // local variable for storing the minter reference
              let minter: &ExampleNFT.NFTMinter

              prepare(signer: AuthAccount) {

                  // borrow a reference to the NFTMinter resource in storage
                  self.minter = signer.borrow<&ExampleNFT.NFTMinter>(from: /storage/NFTMinter)
                      ?? panic("Could not borrow a reference to the NFT minter")
              }

              execute {
                  // Get the public account object for the recipient
                  let recipient = getAccount(recipient)

                  // Borrow the recipient's public NFT collection reference
                  let receiver = recipient
                      .getCapability(/public/NFTCollection)!
                      .borrow<&{NonFungibleToken.CollectionPublic}>()
                      ?? panic("Could not get receiver reference to the NFT Collection")

                  // Mint the NFT and deposit it to the recipient's collection
                  self.minter.mintNFT(hash: hash, recipient: receiver)
              }
          }
        `,
        args: [
          {value: 'lol', type: 'String'},
          {value: '0x' + userKeys.address, type: 'Address'},
        ],
        wait: true,
      }),
    });
    const response2 = await res.json();

    console.log('got response 16 X', response2);
  }
  // transfer nft
  {
    const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
      method: 'POST',
      body: JSON.stringify({
        address: userKeys.address,
        privateKey: userKeys.privateKey,
        publicKey: userKeys.publicKey,

        limit: 100,
        transaction: `\
            import NonFungibleToken from ${flowConstants.NonFungibleToken}
            import ExampleNFT from 0x${nftContractKeys.address}

            // This transaction is for transferring and NFT from 
            // one account to another

            transaction(recipient: Address, withdrawID: UInt64) {
                prepare(acct: AuthAccount) {
                    
                    // get the recipients public account object
                    let recipient = getAccount(recipient)

                    // borrow a reference to the signer's NFT collection
                    let collectionRef = acct.borrow<&ExampleNFT.Collection>(from: /storage/NFTCollection)
                        ?? panic("Could not borrow a reference to the owner's collection")

                    // borrow a public reference to the receivers collection
                    let depositRef = recipient.getCapability(/public/NFTCollection)!.borrow<&{NonFungibleToken.CollectionPublic}>()!

                    // withdraw the NFT from the owner's collection
                    let nft <- collectionRef.withdraw(withdrawID: withdrawID)

                    // Deposit the NFT in the recipient's collection
                    depositRef.deposit(token: <-nft)
                }
            }
        `,
        args: [
          {value: '0x' + userKeys2.address, type: 'Address'},
          {value: nft, type: 'UInt64'},
        ],
        wait: true,
      }),
    });
    const response2 = await res.json();

    console.log('got response 18', response2);
  }
  // list nfts
  {
    const res = await fetch(`https://accounts.exokit.org/sendTransaction`, {
      method: 'POST',
      body: JSON.stringify({
        script: `\
          import NonFungibleToken from ${flowConstants.NonFungibleToken}

          pub fun main() : [UInt64] {          
            let acct = getAccount(${'0x' + userKeys2.address})
            
            let collectionRef = acct.getCapability(/public/NFTCollection)!.borrow<&{NonFungibleToken.CollectionPublic}>()
              ?? panic("Could not borrow capability from public collection")

            return collectionRef.getIDs()
          }
        `,
      }),
    });
    const response2 = await res.json();

    console.log('got response 18', response2);
  }
}; */

const contractSourceCache = {};
async function getContractSource(p) {
  let contractSource = contractSourceCache[p];
  if (!contractSource) {
    const res = await fetch('./flow/' + p);
    contractSource = await res.text();
    contractSource = resolveContractSource(contractSource);
    if (/\.json$/.test(p)) {
      contractSource = eval(contractSource);
    }
    contractSourceCache[p] = contractSource;
  }
  return contractSource;
}

function resolveContractSource(contractSource) {
  return contractSource
    .replace(/NONFUNGIBLETOKENADDRESS/g, NonFungibleToken)
    .replace(/FUNGIBLETOKENADDRESS/g, FungibleToken)
    .replace(/EXAMPLETOKENADDRESS/g, ExampleToken)
    .replace(/EXAMPLENFTADDRESS/g, ExampleNFT)
    .replace(/EXAMPLEACCOUNTADDRESS/g, ExampleAccount);
}

function hexToWordList(hex) {
  const words = [];
  let n = BigInt('0x' + hex);
  n <<= 2n;
  while (n !== 0n) {
    const a = n & 0x7FFn;
    words.push(wordList[Number(a)]);
    n -= a;
    n >>= 11n;
  }
  return words.join(' ');
}
function wordListToHex(words) {
  words = words.split(/\s+/);

  let n = 0n;
  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i];
    const index = wordList.indexOf(word);
    const a = BigInt(index);
    n <<= 11n;
    n |= a;
  }
  n >>= 2n;
  return n.toString(16);
}

export {
  // testFlow,
  getContractSource,
  resolveContractSource,
};