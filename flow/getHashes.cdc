import NonFungibleToken from NONFUNGIBLETOKENADDRESS
import ExampleNFT from EXAMPLENFTADDRESS

// This transaction returns an array of all the nft ids in the collection

pub fun main() : [String] {
    let acct = getAccount(ARG0)
    let collectionRef = acct.getCapability(/public/NFTCollection)!.borrow<&{NonFungibleToken.CollectionPublic}>()
        ?? panic("Could not borrow capability from public collection")
    
    let ids : [UInt64] = collectionRef.getIDs()
    let res : [String] = []
    for id in ids {
      let hash = ExampleNFT.idToHashMap[id] ?? ""
      res.append(hash)
    }
    return res
}