import ExampleAccount from EXAMPLEACCOUNTADDRESS

transaction {
    
    // local variable for storing the minter reference
    let state: &ExampleAccount.State

    prepare(signer: AuthAccount) {

        // borrow a reference to the NFTMinter resource in storage
        self.state = signer.borrow<&ExampleAccount.State>(from: /storage/AccountCollection)
            ?? panic("Could not borrow a reference to the account state")
    }

    execute {
        self.state.keyValueMap["name"] = "lol"
        self.state.keyValueMap["avatar"] = "zol"
    }
}