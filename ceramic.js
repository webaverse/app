import {DID} from 'dids';
import CeramicClient from '@ceramicnetwork/http-client';
import {IDX} from '@ceramicstudio/idx';
import {
  ThreeIdConnect,
  EthereumAuthProvider,
} from '@3id/connect';
import KeyDidResolver from 'key-did-resolver';
/* import {
  Ed25519Provider,
} from 'key-did-provider-ed25519'; */
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver';
/* import {
  TileDocument,
} from '@ceramicnetwork/stream-tile'; */
import {
  ModelManager,
} from '@glazed/devtools';
import {getMainnetAddress} from './blockchain.js';
import {ceramicNodeUrl, metaverseProfileDefinition} from './constants.js';
// window.global = window.globalThis;

/* const metaverseProfileSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BasicProfile",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "maxLength": 150
    },
    "image": {
      "$ref": "#/definitions/imageSources"
    },
    "description": {
      "type": "string",
      "maxLength": 420
    },
    "emoji": {
      "type": "string",
      "maxLength": 2
    },
    "background": {
      "$ref": "#/definitions/imageSources"
    },
    "birthDate": {
      "type": "string",
      "format": "date",
      "maxLength": 10
    },
    "url": {
      "type": "string",
      "maxLength": 240
    },
    "gender": {
      "type": "string",
      "maxLength": 42
    },
    "homeLocation": {
      "type": "string",
      "maxLength": 140
    },
    "residenceCountry": {
      "type": "string",
      "pattern": "^[A-Z]{2}$",
      "maxLength": 2
    },
    "nationalities": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "string",
        "pattern": "^[A-Z]{2}$",
        "maxItems": 5
      }
    },
    "affiliations": {
      "type": "array",
      "items": {
        "type": "string",
        "maxLength": 140
      }
    }
  },
  "definitions": {
    "IPFSUrl": {
      "type": "string",
      "pattern": "^ipfs://.+",
      "maxLength": 150
    },
    "positiveInteger": {
      "type": "integer",
      "minimum": 1
    },
    "imageMetadata": {
      "type": "object",
      "properties": {
        "src": {
          "$ref": "#/definitions/IPFSUrl"
        },
        "mimeType": {
          "type": "string",
          "maxLength": 50
        },
        "width": {
          "$ref": "#/definitions/positiveInteger"
        },
        "height": {
          "$ref": "#/definitions/positiveInteger"
        },
        "size": {
          "$ref": "#/definitions/positiveInteger"
        }
      },
      "required": ["src", "mimeType", "width", "height"]
    },
    "imageSources": {
      "type": "object",
      "properties": {
        "original": {
          "$ref": "#/definitions/imageMetadata"
        },
        "alternatives": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/imageMetadata"
          }
        }
      },
      "required": ["original"]
    }
  }
}; */
const login = async () => {
  const address = await getMainnetAddress();
  const threeIdConnect = new ThreeIdConnect();
  const authProvider = new EthereumAuthProvider(window.ethereum, address);
  await threeIdConnect.connect(authProvider);
  const provider = await threeIdConnect.getDidProvider();

  const ceramic = new CeramicClient(ceramicNodeUrl);
  // console.log('set provider 0');
  const resolver = {
    ...KeyDidResolver.getResolver(),
    ...ThreeIdResolver.getResolver(ceramic),
  };

  const did = new DID({
    resolver,
  });
  // console.log('set provider 1');
  did.setProvider(provider);
  // console.log('set provider 2');
  await did.authenticate();
  // console.log('set provider 3', provider);
  
  ceramic.did = did;
  const aliases = {
    metaverseProfile: metaverseProfileDefinition,
  };
  const idx = new IDX({
    ceramic,
    aliases,
  });
  // console.log('got idx 1', idx);
  // const result = await idx.get('metaverseProfile');
  // console.log('got idx 2', result);
  const profile = await idx.get('metaverseProfile');
  
  return {
    address,
    profile,
  };
  
  /* console.time('lol');
  const setResult = await idx.set('metaverseProfile', {
    name: 'Lol',
    // description: 'I make computers beep good.',
    // emoji: '💻',
  });
  console.timeEnd('lol');
  const getResult2 = await idx.get('metaverseProfile');
  console.log('results', {getResult1, getResult2, setResult}); */
};
export {
  login,
};