/* eslint-disable */
export const tokensCharactersUtil = {
  getTokenCharacters,
};

const userTokenCharacters = Array(5);

for (let i = 0; i < userTokenCharacters.length; i++) {
  userTokenCharacters[i] = {
    name: '',
    previewUrl: '',
    avatarUrl: '',
    voice: '',
    class: '',
    bio: '',
  };
}

async function getTokenCharacters() {
  return await userTokenCharacters;
}
