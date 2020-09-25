import NonFungibleToken from NONFUNGIBLETOKENADDRESS
import ExampleNFT from EXAMPLENFTADDRESS

// This transaction is for transferring and NFT from 
// one account to another

transaction {
    prepare(acct: AuthAccount) {
        let recipient : Address = 0x
        let withdrawID : UInt64 = 0
        
        // get the recipients public account object
        let acct2 = getAccount(recipient)

        // borrow a reference to the signer's NFT collection
        let collectionRef = acct.borrow<&ExampleNFT.Collection>(from: /storage/NFTCollection)
            ?? panic("Could not borrow a reference to the owner's collection")

        // borrow a public reference to the receivers collection
        let depositRef = acct2.getCapability(/public/NFTCollection)!.borrow<&{NonFungibleToken.CollectionPublic}>()!

        // withdraw the NFT from the owner's collection
        let nft <- collectionRef.withdraw(withdrawID: withdrawID)

        // Deposit the NFT in the recipient's collection
        depositRef.deposit(token: <-nft)
    }
}