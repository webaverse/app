openssl genrsa -out rootCA.key 4096
openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 1024 -out rootCA.crt -subj "/C=US/ST=Test/L=Test/O=Test/CN=localhost"
openssl genrsa -out webaverse-self-signed.key 2048
openssl req -new \
  -key webaverse-self-signed.key \
  -subj '/C=US/ST=CA/O=Webaverse, Inc./CN=webaverse.com' \
  -reqexts SAN \
  -extensions SAN \
  -config <(cat /etc/ssl/openssl.cnf \
    <(printf "\n[SAN]\nsubjectAltName=DNS:webaverse.com,DNS:webaverse.link,DNS:*.webaverse.com,DNS:*.webaverse.link")) \
  -out webaverse-self-signed.csr
openssl x509 -req \
  -in webaverse-self-signed.csr \
  -CA rootCA.crt -CAkey rootCA.key -CAcreateserial \
  -extensions SAN \
  -extfile <(cat /etc/ssl/openssl.cnf \
    <(printf "\n[SAN]\nsubjectAltName=DNS:webaverse.com,DNS:webaverse.link,DNS:*.webaverse.com,DNS:*.webaverse.link")) \
  -out webaverse-self-signed.crt \
  -days 1024
openssl x509 -in webaverse-self-signed.crt -text -noout
