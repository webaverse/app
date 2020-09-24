import FungibleToken from FUNGIBLETOKENADDRESS
import ExampleToken from EXAMPLETOKENADDRESS

transaction {
  let tokenAdmin: &ExampleToken.Administrator
  let tokenReceiver: &{FungibleToken.Receiver}

  prepare(signer: AuthAccount) {
      let recipient : Address = 0x
  
      self.tokenAdmin = signer
      .borrow<&ExampleToken.Administrator>(from: /storage/exampleTokenAdmin) 
      ?? panic("Signer is not the token admin")

      self.tokenReceiver = getAccount(recipient)
      .getCapability(/public/exampleTokenReceiver)!
      .borrow<&{FungibleToken.Receiver}>()
      ?? panic("Unable to borrow receiver reference")
  }

  execute {
      let amount : UFix64 = 100.0
      let minter <- self.tokenAdmin.createNewMinter(allowedAmount: amount)
      let mintedVault <- minter.mintTokens(amount: amount)

      self.tokenReceiver.deposit(from: <-mintedVault)

      destroy minter
  }
}