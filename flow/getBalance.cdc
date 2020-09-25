import FungibleToken from FUNGIBLETOKENADDRESS
import ExampleToken from EXAMPLETOKENADDRESS

pub fun main() : UFix64 {
    let acct = getAccount(ARG0)
    let vaultRef = acct.getCapability(/public/exampleTokenBalance)!.borrow<&ExampleToken.Vault{FungibleToken.Balance}>()
        ?? panic("Could not borrow Balance reference to the Vault")

    return vaultRef.balance
}
