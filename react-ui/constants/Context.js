import { createContext } from 'https://unpkg.com/es-react/dev';
export const initialState = {
    loginToken: null,
    publicKey: null,
    privateKey: null,
    name: null,
    mainnetAddress: null,
    avatarThumbnail: null,
    showUserDropdown: false,
    address: null,
    avatarUrl: null,
    avatarFileName: null,
    avatarPreview: null,
    ftu: true,
    inventory: null,
    creatorProfiles: {},
    creatorInventories: {},
    lastFileHash: null,
    lastFileId: null
  }
export const Context = createContext(initialState);
