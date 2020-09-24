import NonFungibleToken from NONFUNGIBLETOKENADDRESS
import ExampleNFT from EXAMPLENFTADDRESS

// This script uses the NFTMinter resource to mint a new NFT
// It must be run with the account that has the minter resource
// stored in /storage/NFTMinter

transaction {
    
    // local variable for storing the minter reference
    let minter: &ExampleNFT.NFTMinter

    prepare(signer: AuthAccount) {

        // borrow a reference to the NFTMinter resource in storage
        self.minter = signer.borrow<&ExampleNFT.NFTMinter>(from: /storage/NFTMinter)
            ?? panic("Could not borrow a reference to the NFT minter")
    }

    execute {
        let hash : String = ""
        let recipient : Address = 0x

        // Get the public account object for the recipient
        let acct = getAccount(recipient)

        // Borrow the recipient's public NFT collection reference
        let receiver = acct
            .getCapability(/public/NFTCollection)!
            .borrow<&{NonFungibleToken.CollectionPublic}>()
            ?? panic("Could not get receiver reference to the NFT Collection")

        // Mint the NFT and deposit it to the recipient's collection
        self.minter.mintNFT(hash: hash, recipient: receiver)
    }
}