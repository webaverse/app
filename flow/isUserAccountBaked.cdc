import ExampleAccount from EXAMPLEACCOUNTADDRESS

pub fun main() : Bool {
    let acct = getAccount(ARG0)
    
    let collectionRef = acct.getCapability(/public/AccountCollection)!.borrow<&{ExampleAccount.ExampleAccountStatePublic}>() ?? nil

    return collectionRef != nil
}