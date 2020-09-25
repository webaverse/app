pub contract ExampleAccount {

    pub resource interface ExampleAccountStatePublic {
        pub var keyValueMap: {String: String}
    }

    pub resource State : ExampleAccountStatePublic {

        pub var keyValueMap: {String: String}

        init() {
            self.keyValueMap = {}
        }
    }

    pub fun createState() : @State {
        return <-create State()
    }

    init() {
    }
}
