import {DID} from 'dids';
import CeramicClient from '@ceramicnetwork/http-client';
import {IDX} from '@ceramicstudio/idx';
import {ThreeIdConnect, EthereumAuthProvider} from '@3id/connect';
import KeyDidResolver from 'key-did-resolver';
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver';
import {ModelManager} from '@glazed/devtools';
import {getMainnetAddress} from './blockchain.js';
import {ceramicNodeUrl, metaverseProfileDefinition} from './constants.js';

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