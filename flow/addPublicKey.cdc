transaction {
  prepare(signer: AuthAccount) {
    signer.addPublicKey("ARG0".decodeHex())
  }
}