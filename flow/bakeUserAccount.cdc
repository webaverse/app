[
  {
    transaction: `\
      import ExampleAccount from EXAMPLEACCOUNTADDRESS

      transaction {
          prepare(acct: AuthAccount) {

              // If the account doesn't already have a collection
              if acct.borrow<&ExampleAccount.State>(from: /storage/AccountCollection) == nil {

                  // Create a new empty collection
                  let state <- ExampleAccount.createState() as! @ExampleAccount.State

                  // save it to the account
                  acct.save(<-state, to: /storage/AccountCollection)

                  // create a public capability for the collection
                  acct.link<&{ExampleAccount.ExampleAccountStatePublic}>(/public/AccountCollection, target: /storage/AccountCollection)
              }
          }
      }
    `,
  },
  {
    transaction: `\
      import FungibleToken from FUNGIBLETOKENADDRESS
      import ExampleToken from EXAMPLETOKENADDRESS

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
  },
  {
    transaction: `\
      import NonFungibleToken from NONFUNGIBLETOKENADDRESS
      import ExampleNFT from EXAMPLENFTADDRESS
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
  },
];