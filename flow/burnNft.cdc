import NonFungibleToken from NONFUNGIBLETOKENADDRESS
import ExampleNFT from EXAMPLENFTADDRESS

// This transaction is for transferring and NFT from 
// one account to another

transaction {
    prepare(acct: AuthAccount) {
        let withdrawID : UInt64 = 0

        // borrow a reference to the signer's NFT collection
        let collectionRef = acct.borrow<&ExampleNFT.Collection>(from: /storage/NFTCollection)
            ?? panic("Could not borrow a reference to the owner's collection")

        // withdraw the NFT from the owner's collection
        let nft <- collectionRef.withdraw(withdrawID: withdrawID)

        destroy nft
    }
}