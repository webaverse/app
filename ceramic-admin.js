import {DID} from 'dids';
import CeramicClient from '@ceramicnetwork/http-client';
import {IDX} from '@ceramicstudio/idx';
import {ThreeIdConnect, EthereumAuthProvider} from '@3id/connect';
import KeyDidResolver from 'key-did-resolver';
import {Ed25519Provider} from 'key-did-provider-ed25519';
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver';
import {ModelManager} from '@glazed/devtools';
import {getMainnetAddress} from './blockchain.js';
import {ceramicNodeUrl} from './constants.js';

const keyString = ``;

const metaverseProfileSchema = {
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
};
const hex2U8 = hexString => new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
const key = hex2U8(keyString);

const createSchema = async () => {
  // const addresses = await window.ethereum.enable();
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
  let did2;
  {
    did2 = new DID({
      provider: new Ed25519Provider(key),
      resolver: KeyDidResolver.getResolver(),
    })
    await did2.authenticate();
  }

  // model
  ceramic.did = did2;
  const manager = new ModelManager(ceramic);
  const schemaID = await manager.createSchema('metaverseProfile', metaverseProfileSchema);
  const definition = await manager.createDefinition('metaverseProfile', {
    name: 'Metaverse Profile',
    description: 'metaverse profile',
    schema: manager.getSchemaURL(schemaID),
  });
  // console.log('got definition', definition);
  return {
    definition,
  };
  // const model = await manager.toPublished();
  // console.log('got model', model);
  
  /* ceramic.did = did;
  const aliases = {
    metaverseProfile: definition,
  };
  const idx = new IDX({
    ceramic,
    aliases,
  });
  // console.log('got idx 1', idx);
  // const result = await idx.get('metaverseProfile');
  // console.log('got idx 2', result);
  const getResult1 = await idx.get('metaverseProfile');
  // console.time('lol');
  const setResult = await idx.set('metaverseProfile', {
    name: 'Lol',
    // description: 'I make computers beep good.',
    // emoji: '💻',
  });
  // console.timeEnd('lol');
  const getResult2 = await idx.get('metaverseProfile');
  // console.log('results', {getResult1, getResult2, setResult}); */
};
export {
  createSchema,
};