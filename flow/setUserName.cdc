import ExampleAccount from EXAMPLEACCOUNTADDRESS

transaction {

    let state: &ExampleAccount.State

    prepare(signer: AuthAccount) {
        self.state = signer.borrow<&ExampleAccount.State>(from: /storage/AccountCollection)
            ?? panic("Could not borrow a reference to the account state")
    }

    execute {
        self.state.keyValueMap["name"] = "lol"
        // self.state.keyValueMap["avatar"] = "zol"
    }
}