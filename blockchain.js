import flow from './flow/flow.js';
import flowConstants from './flow-constants.js';

function buf2hex(buffer) {
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}
async function genKeys(entropy) {
  entropy = new TextEncoder().encode(entropy);
  const digest = await crypto.subtle.digest('SHA-256', entropy);
  return flow.crypto.genKeys({
    entropy: buf2hex(digest),
    entropyEnc: 'hex',
  });
};

function uint8Array2hex(uint8Array) {
  return Array.prototype.map.call(uint8Array, x => ('00' + x.toString(16)).slice(-2)).join('');
}
const _isSealed = tx => tx.status >= 4;
const _waitForTx = async txid => {
  for (;;) {
    const response2 = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.getTransactionStatus(txid),
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveParams,
      ]),
    ]), { node: flowConstants.host });
    // console.log('got response 2', response2);
    if (_isSealed(response2.transaction)) {
      return response2;
    } else {
      await new Promise((accept, reject) => {
        setTimeout(accept, 500);
      });
    }
  }
};
const _createContract = async contractSource => {
  const contractKeys = flow.crypto.genKeys();
  {
    const acctResponse = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.getAccount(flowConstants.address),
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveParams,
      ]),
    ]), { node: flowConstants.host });
    const seqNum = acctResponse.account.keys[0].sequenceNumber;

    const signingFunction = flow.signingFunction.signingFunction(flowConstants.privateKey);

    const response = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.authorizations([flow.sdk.authorization(flowConstants.address, signingFunction, 0)]),
      flow.sdk.payer(flow.sdk.authorization(flowConstants.address, signingFunction, 0)),
      flow.sdk.proposer(flow.sdk.authorization(flowConstants.address, signingFunction, 0, seqNum)),
      flow.sdk.limit(100),
      flow.sdk.transaction`
        transaction(publicKeys: [String], code: String) {
          prepare(signer: AuthAccount) {
            let acct = AuthAccount(payer: signer)
            for key in publicKeys {
              acct.addPublicKey(key.decodeHex())
            }
            acct.setCode(code.decodeHex())
          }
        }
      `,
      flow.sdk.args([
        flow.sdk.arg([contractKeys.flowKey], flow.types.Array(flow.types.String)),
        flow.sdk.arg(uint8Array2hex(new TextEncoder().encode(contractSource)), flow.types.String),
      ]),
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveArguments,
        flow.sdk.resolveParams,
        flow.sdk.resolveAccounts,
        flow.sdk.resolveRefBlockId({ node: flowConstants.host }),
        flow.sdk.resolveSignatures,
      ]),
    ]), { node: flowConstants.host });
    console.log('got response 1', response);
    const response2 = await _waitForTx(response.transactionId);
    console.log('got response 2', response2);
    contractKeys.address = response2.transaction.events[0].payload.value.fields[0].value.value.slice(2);
    console.log('got response 3', contractKeys.address);
  }
  return contractKeys;
};
const _createAccount = async (ftContractAddress, nftContractAddress) => {
  const userKeys = flow.crypto.genKeys();
  // create user account
  {
    const acctResponse = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.getAccount(flowConstants.address),
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveParams,
      ]),
    ]), { node: flowConstants.host });
    const seqNum = acctResponse.account.keys[0].sequenceNumber;

    const signingFunction = flow.signingFunction.signingFunction(flowConstants.privateKey);

    const response = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.authorizations([flow.sdk.authorization(flowConstants.address, signingFunction, 0)]),
      flow.sdk.payer(flow.sdk.authorization(flowConstants.address, signingFunction, 0)),
      flow.sdk.proposer(flow.sdk.authorization(flowConstants.address, signingFunction, 0, seqNum)),
      flow.sdk.limit(100),
      flow.sdk.transaction`
        transaction(publicKeys: [String]) {
          prepare(signer: AuthAccount) {
            let acct = AuthAccount(payer: signer)
            for key in publicKeys {
              acct.addPublicKey(key.decodeHex())
            }
          }
        }
      `,
      flow.sdk.args([
        // flow.sdk.arg(2, t.Uint8),
        flow.sdk.arg([userKeys.flowKey], flow.types.Array(flow.types.String)),
      ]),
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveArguments,
        flow.sdk.resolveParams,
        flow.sdk.resolveAccounts,
        flow.sdk.resolveRefBlockId({ node: flowConstants.host }),
        flow.sdk.resolveSignatures,
      ]),
    ]), { node: flowConstants.host });
    console.log('got response 4', response);
    const response2 = await _waitForTx(response.transactionId);
    console.log('got response 5', response2);
    userKeys.address = response2.transaction.events[0].payload.value.fields[0].value.value.slice(2);
    console.log('got response 6', userKeys.address);
  }
  // set up ft
  {
    const acctResponse = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.getAccount(userKeys.address),
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveParams,
      ]),
    ]), { node: flowConstants.host });
    const seqNum = acctResponse.account.keys[0].sequenceNumber;

    const signingFunction = flow.signingFunction.signingFunction(userKeys.privateKey);

    const response = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.authorizations([flow.sdk.authorization(userKeys.address, signingFunction, 0)]),
      flow.sdk.payer(flow.sdk.authorization(userKeys.address, signingFunction, 0)),
      flow.sdk.proposer(flow.sdk.authorization(userKeys.address, signingFunction, 0, seqNum)),
      flow.sdk.limit(100),
      flow.sdk.transaction`
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
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveArguments,
        flow.sdk.resolveParams,
        flow.sdk.resolveAccounts,
        flow.sdk.resolveRefBlockId({ node: flowConstants.host }),
        flow.sdk.resolveSignatures,
      ]),
    ]), { node: flowConstants.host });
    console.log('got response 7', response);
    const response2 = await _waitForTx(response.transactionId);
    console.log('got response 8', response2);
  }
  {
    const acctResponse = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.getAccount(userKeys.address),
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveParams,
      ]),
    ]), { node: flowConstants.host });
    const seqNum = acctResponse.account.keys[0].sequenceNumber;

    const signingFunction = flow.signingFunction.signingFunction(userKeys.privateKey);

    const response = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.authorizations([flow.sdk.authorization(userKeys.address, signingFunction, 0)]),
      flow.sdk.payer(flow.sdk.authorization(userKeys.address, signingFunction, 0)),
      flow.sdk.proposer(flow.sdk.authorization(userKeys.address, signingFunction, 0, seqNum)),
      flow.sdk.limit(100),
      flow.sdk.transaction`
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
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveArguments,
        flow.sdk.resolveParams,
        flow.sdk.resolveAccounts,
        flow.sdk.resolveRefBlockId({ node: flowConstants.host }),
        flow.sdk.resolveSignatures,
      ]),
    ]), { node: flowConstants.host });
    console.log('got response 9', response);
    const response2 = await _waitForTx(response.transactionId);
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

  const ftContractKeys = await _createContract(exampleTokenSource);
  const nftContractKeys = await _createContract(exampleNFTSource);

  const userKeys = await _createAccount(ftContractKeys.address, nftContractKeys.address);
  const userKeys2 = await _createAccount(ftContractKeys.address, nftContractKeys.address);
  // mint ft
  {
    const acctResponse = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.getAccount(ftContractKeys.address),
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveParams,
      ]),
    ]), { node: flowConstants.host });
    const seqNum = acctResponse.account.keys[0].sequenceNumber;

    const signingFunction = flow.signingFunction.signingFunction(ftContractKeys.privateKey);

    const response = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.authorizations([flow.sdk.authorization(ftContractKeys.address, signingFunction, 0)]),
      flow.sdk.payer(flow.sdk.authorization(ftContractKeys.address, signingFunction, 0)),
      flow.sdk.proposer(flow.sdk.authorization(ftContractKeys.address, signingFunction, 0, seqNum)),
      flow.sdk.limit(100),
      flow.sdk.transaction`
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
      flow.sdk.args([
        flow.sdk.arg('0x' + userKeys.address, flow.types.Address),
        flow.sdk.arg('10.0', flow.types.UFix64),
      ]),
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveArguments,
        flow.sdk.resolveParams,
        flow.sdk.resolveAccounts,
        flow.sdk.resolveRefBlockId({ node: flowConstants.host }),
        flow.sdk.resolveSignatures,
      ]),
    ]), { node: flowConstants.host });
    console.log('got response 11', response);
    const response2 = await _waitForTx(response.transactionId);
    console.log('got response 12', response2);
  }
  // transfer ft
  {
    const acctResponse = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.getAccount(userKeys.address),
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveParams,
      ]),
    ]), { node: flowConstants.host });
    const seqNum = acctResponse.account.keys[0].sequenceNumber;

    const signingFunction = flow.signingFunction.signingFunction(userKeys.privateKey);

    const response = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.authorizations([flow.sdk.authorization(userKeys.address, signingFunction, 0)]),
      flow.sdk.payer(flow.sdk.authorization(userKeys.address, signingFunction, 0)),
      flow.sdk.proposer(flow.sdk.authorization(userKeys.address, signingFunction, 0, seqNum)),
      flow.sdk.limit(100),
      flow.sdk.transaction`
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
      flow.sdk.args([
        flow.sdk.arg('5.0', flow.types.UFix64),
        flow.sdk.arg('0x' + userKeys2.address, flow.types.Address),
      ]),
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveArguments,
        flow.sdk.resolveParams,
        flow.sdk.resolveAccounts,
        flow.sdk.resolveRefBlockId({ node: flowConstants.host }),
        flow.sdk.resolveSignatures,
      ]),
    ]), { node: flowConstants.host });
    console.log('got response 13', response);
    const response2 = await _waitForTx(response.transactionId);
    console.log('got response 14', response2);
  }

  // mint nft
  let nft;
  {
    const acctResponse = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.getAccount(nftContractKeys.address),
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveParams,
      ]),
    ]), { node: flowConstants.host });
    const seqNum = acctResponse.account.keys[0].sequenceNumber;

    const signingFunction = flow.signingFunction.signingFunction(nftContractKeys.privateKey);

    const response = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.authorizations([flow.sdk.authorization(nftContractKeys.address, signingFunction, 0)]),
      flow.sdk.payer(flow.sdk.authorization(nftContractKeys.address, signingFunction, 0)),
      flow.sdk.proposer(flow.sdk.authorization(nftContractKeys.address, signingFunction, 0, seqNum)),
      flow.sdk.limit(100),
      flow.sdk.transaction`
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
      flow.sdk.args([
        flow.sdk.arg('lol', flow.types.String),
        flow.sdk.arg('0x' + userKeys.address, flow.types.Address),
      ]),
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveArguments,
        flow.sdk.resolveParams,
        flow.sdk.resolveAccounts,
        flow.sdk.resolveRefBlockId({ node: flowConstants.host }),
        flow.sdk.resolveSignatures,
      ]),
    ]), { node: flowConstants.host });
    console.log('got response 15', response);
    const response2 = await _waitForTx(response.transactionId);
    console.log('got response 16', response2);
    nft = parseInt(response2.transaction.events[0].payload.value.fields[0].value.value);
  }
  {
    /* const acctResponse = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.getAccount(nftContractKeys.address),
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveParams,
      ]),
    ]), { node: flowConstants.host });
    const seqNum = acctResponse.account.keys[0].sequenceNumber;

    const signingFunction = flow.signingFunction.signingFunction(nftContractKeys.privateKey); */

    console.log('got args', flow.sdk.args([
      flow.sdk.arg(nft, flow.types.UInt64),
    ]));

    const response = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      // flow.sdk.authorizations([flow.sdk.authorization(nftContractKeys.address, signingFunction, 0)]),
      // flow.sdk.payer(flow.sdk.authorization(nftContractKeys.address, signingFunction, 0)),
      // flow.sdk.proposer(flow.sdk.authorization(nftContractKeys.address, signingFunction, 0, seqNum)),
      // flow.sdk.limit(100),
      flow.sdk.script`
        import ExampleNFT from 0x${nftContractKeys.address}

        pub fun main() : String {
          return ExampleNFT.getHash(id: ${nft})
        }
      `,
      /* flow.sdk.args([
        flow.sdk.arg(nft, t.UInt64),
      ]), */
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveParams,
        flow.sdk.resolveArguments,
      ]),
    ]), { node: flowConstants.host });
    console.log('got response 15 A', response);
    console.log('got response 16 A', response.encodedData.value);
  }
  {
    const acctResponse = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.getAccount(nftContractKeys.address),
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveParams,
      ]),
    ]), { node: flowConstants.host });
    const seqNum = acctResponse.account.keys[0].sequenceNumber;

    const signingFunction = flow.signingFunction.signingFunction(nftContractKeys.privateKey);

    const response = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.authorizations([flow.sdk.authorization(nftContractKeys.address, signingFunction, 0)]),
      flow.sdk.payer(flow.sdk.authorization(nftContractKeys.address, signingFunction, 0)),
      flow.sdk.proposer(flow.sdk.authorization(nftContractKeys.address, signingFunction, 0, seqNum)),
      flow.sdk.limit(100),
      flow.sdk.transaction`
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
      flow.sdk.args([
        flow.sdk.arg('lol', flow.types.String),
        flow.sdk.arg('0x' + userKeys.address, flow.types.Address),
      ]),
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveArguments,
        flow.sdk.resolveParams,
        flow.sdk.resolveAccounts,
        flow.sdk.resolveRefBlockId({ node: flowConstants.host }),
        flow.sdk.resolveSignatures,
      ]),
    ]), { node: flowConstants.host });
    console.log('got response 15 X', response);
    const response2 = await _waitForTx(response.transactionId);
    console.log('got response 16 X', response2);
  }
  // transfer nft
  {
    const acctResponse = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.getAccount(userKeys.address),
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveParams,
      ]),
    ]), { node: flowConstants.host });
    const seqNum = acctResponse.account.keys[0].sequenceNumber;

    const signingFunction = flow.signingFunction.signingFunction(userKeys.privateKey);

    const response = await flow.sdk.send(await flow.sdk.pipe(await flow.sdk.build([
      flow.sdk.authorizations([flow.sdk.authorization(userKeys.address, signingFunction, 0)]),
      flow.sdk.payer(flow.sdk.authorization(userKeys.address, signingFunction, 0)),
      flow.sdk.proposer(flow.sdk.authorization(userKeys.address, signingFunction, 0, seqNum)),
      flow.sdk.limit(100),
      flow.sdk.transaction`
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
      flow.sdk.args([
        flow.sdk.arg('0x' + userKeys2.address, flow.types.Address),
        flow.sdk.arg(nft, flow.types.UInt64),
      ]),
    ]), [
      flow.sdk.resolve([
        flow.sdk.resolveArguments,
        flow.sdk.resolveParams,
        flow.sdk.resolveAccounts,
        flow.sdk.resolveRefBlockId({ node: flowConstants.host }),
        flow.sdk.resolveSignatures,
      ]),
    ]), { node: flowConstants.host });
    console.log('got response 17', response);
    const response2 = await _waitForTx(response.transactionId);
    console.log('got response 18', response2);
  }
};

export {
  genKeys,
  testFlow,
};