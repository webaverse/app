import * as sha256 from 'fast-sha256'
import nacl from 'tweetnacl'
import naclUtil from 'tweetnacl-util'

export interface KeyStore<PrivateKeyData, PublicKeyData> {
  getKeyIDs (): string[]
  getPublicKeyData (keyID: string): PublicKeyData
  getPrivateKeyData (keyID: string, password: string): PrivateKeyData
  getRawKeyData (keyID: string): RawKeyData<PublicKeyData>
  saveKey (keyID: string, password: string, privateData: PrivateKeyData, publicData?: PublicKeyData): Promise<void>
  saveKeys (data: {keyID: string, password: string, privateData: PrivateKeyData, publicData?: PublicKeyData}[]): Promise<void>
  savePublicKeyData (keyID: string, publicData: PublicKeyData): Promise<void>
  removeKey (keyID: string): Promise<void>
}

interface KeyMetadata {
  nonce: string,
  iterations: number
}

export interface RawKeyData<PublicKeyData> {
  metadata: KeyMetadata,
  public: PublicKeyData,
  private: string
}

export interface KeysData<PublicKeyData> {
  [keyID: string]: RawKeyData<PublicKeyData>
}

export type SaveKeys<PublicKeyData> = (data: KeysData<PublicKeyData>) => Promise<void> | void

function randomNonce () {
  return naclUtil.encodeBase64(nacl.randomBytes(nacl.secretbox.nonceLength))
}

function deriveHashFromPassword (password: string, metadata: KeyMetadata) {
  return sha256.pbkdf2(
    naclUtil.decodeUTF8(password),
    naclUtil.decodeBase64(metadata.nonce),
    metadata.iterations,
    nacl.secretbox.keyLength
  )
}

function decrypt (encryptedBase64: string, metadata: KeyMetadata, password: string) {
  const secretKey = deriveHashFromPassword(password, metadata)
  const decrypted = nacl.secretbox.open(naclUtil.decodeBase64(encryptedBase64), naclUtil.decodeBase64(metadata.nonce), secretKey)

  if (!decrypted) {
    throw new Error('Decryption failed.')
  }
  return JSON.parse(naclUtil.encodeUTF8(decrypted))
}

function encrypt (privateData: any, metadata: KeyMetadata, password: string): string {
  const secretKey = deriveHashFromPassword(password, metadata)
  const data = naclUtil.decodeUTF8(JSON.stringify(privateData))
  const encrypted = nacl.secretbox(data, naclUtil.decodeBase64(metadata.nonce), secretKey)
  return naclUtil.encodeBase64(encrypted)
}

export function createStore<PrivateKeyData, PublicKeyData = {}> (
  // save: SaveKeys<PublicKeyData>,
  initialKeys: KeysData<PublicKeyData> = {},
  options: { iterations?: number } = {}
): KeyStore<PrivateKeyData, PublicKeyData> {
  const { iterations = 10000 } = options
  let keysData = initialKeys

  function save (keysData: any): any {
    localStorage.setItem('key-store', JSON.stringify(keysData));
  }

  function getLocal () {
    if(Object.keys(keysData).length === 0) {      
      keysData = JSON.parse(localStorage.getItem('key-store'));
    }
  }

  function saveKey (keyID: string, password: string, privateData: PrivateKeyData, publicData: PublicKeyData | {} = {}): void {
    // Important: Do not re-use previous metadata!
    // Use a fresh nonce. Also the previous metadata might have been forged.
    const metadata = {
      nonce: randomNonce(),
      iterations
    }
    keysData[keyID] = {
      metadata,
      public: publicData as any,
      private: encrypt(privateData, metadata, password)
    }
  }

  return {
    getKeyIDs () {
      getLocal();
      return Object.keys(keysData)
    },
    getPublicKeyData (keyID: string) {
      getLocal();
      return keysData[keyID].public
    },
    getRawKeyData (keyID: string) {
      getLocal();
      return keysData[keyID]
    },
    getPrivateKeyData (keyID: string, password: string) {
      getLocal();
      if(keysData[keyID]) {
        return decrypt(keysData[keyID].private, keysData[keyID].metadata, password) as PrivateKeyData
      }
    },
    async saveKey (keyID: string, password: string, privateData: PrivateKeyData, publicData: PublicKeyData | {} = {}) {
      saveKey(keyID, password, privateData, publicData)
      await save(keysData);
    },
    async saveKeys (data: {keyID: string, password: string, privateData: PrivateKeyData, publicData: PublicKeyData}[]) {
      data.forEach(d => saveKey(d.keyID, d.password, d.privateData, d.publicData))
      await save(keysData)
    },
    async savePublicKeyData (keyID: string, publicData: PublicKeyData) {
      if (!keysData[keyID]) {
        // Prevent creating an incomplete key record
        throw new Error(`Cannot save public data for key ${keyID}. Key does not yet exist in store.`)
      }
      keysData[keyID] = {
        ...keysData[keyID],
        public: publicData
      }
      await save(keysData)
    },
    async removeKey (keyID: string) {
      if (!keysData[keyID]) {
        throw new Error(`Cannot delete key ${keyID}. Key not found.`)
      }
      delete keysData[keyID]
      await save(keysData)
    }
  }
}