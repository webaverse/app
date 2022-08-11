import {getAddressFromMnemonic} from './blockchain.js';

async function pullUserObject(loginToken) {
  const address = getAddressFromMnemonic(loginToken.mnemonic);
  const res = await fetch(`${accountsHost}/${address}`);
  var result = await res.json();
  result.mnemonic = loginToken.mnemonic;
  return result;
}

export const handleDiscordLogin = async (code, id) => {
  if (!code) {
    return;
  }
  try{
    let res = await fetch(loginEndpoint + `?discordid=${encodeURIComponent(id)}&discordcode=${encodeURIComponent(code)}&redirect_uri=${window.location.origin}/login`, {
      method: 'POST',
    });
    res = await res.json();
    if (!res.error) {
      return await pullUserObject(res);
    } else {
      //console.warn('Unable to login ', res.error);
      return res;
    }
  }catch(e){
    
  }
};