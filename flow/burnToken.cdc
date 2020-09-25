import FungibleToken from FUNGIBLETOKENADDRESS
import ExampleToken from EXAMPLETOKENADDRESS

transaction {

    // The Vault resource that holds the tokens that are being transferred
    let sentVault: @FungibleToken.Vault

    prepare(signer: AuthAccount) {
        let amount : UFix64 = 1.0

        // Get a reference to the signer's stored vault
        let vaultRef = signer.borrow<&ExampleToken.Vault>(from: /storage/exampleTokenVault)
      ?? panic("Could not borrow reference to the owner's Vault!")

        // Withdraw tokens from the signer's stored vault
        self.sentVault <- vaultRef.withdraw(amount: amount)
    }

    execute {
        destroy self.sentVault
    }
}