/* eslint-disable */
export const upstreetCharactersUtil = {
  getUpstreetCharacters,
};

const upstreetCharacters = {
  upstreet: [
    {
      name: 'Scillia',
      previewUrl: './images/characters/upstreet/small/scillia.png',
      avatarUrl: './avatars/scillia_drophunter_v15_vian.vrm',
      voice: `Sweetie Belle`,
      voicePack: `ShiShi voice pack`,
      class: 'Drop Hunter',
      bio: `Her nickname is Scilly or SLY. 13/F drop hunter. She is an adventurer, swordfighter and fan of potions. She is exceptionally skilled and can go Super Saiyan.`,
      themeSongUrl: `https://webaverse.github.io/music/themes/149274046-smooth-adventure-quest.mp3`,
      // "Scilly is short for "Saga Cybernetic Lifeform Interface" or SLY. It's a complicated name, but it means I'm the best at what I do: Collecting data from living organisms and machines to help my development.)"
      // "She's not like other girls. She doesn't spend her time talking about boys, or clothes, or anything else that isn't important. No, she spends her time adventuring, swordfighting and looking for new and interesting potions to try."
      // "I'm not saying I don't like boys, but they're just not as interesting as swords."
      detached: true,
    },
    {
      name: 'Drake',
      previewUrl: './images/characters/upstreet/small/drake.png',
      avatarUrl: './avatars/Drake_hacker_v8_Guilty.vrm',
      voice: `Shining Armor`,
      voicePack: `Andrew voice pack`,
      class: 'Neural Hacker',
      bio: `His nickname is DRK. 15/M hacker. Loves guns. Likes plotting new hacks. He has the best equipment and is always ready for a fight.`,
      themeSongUrl: `https://webaverse.github.io/music/themes/129079005-im-gonna-find-it-mystery-sci-f.mp3`,
      detached: true,
    },
    {
      name: 'Hyacinth',
      previewUrl: './images/characters/upstreet/small/hyacinth.png',
      avatarUrl: './avatars/hya_influencer_v2_vian.vrm',
      voice: `Maud Pie`,
      voicePack: `Tiffany voice pack`,
      class: 'Beast Painter',
      bio: `Scillia's mentor. 15/F beast tamer. She is quite famous. She is known for releasing beasts on her enemies when she get angry.`,
      themeSongUrl: `https://webaverse.github.io/music/themes/092909594-fun-electro-dance-groove-racin.mp3`,
      detached: true,
    },
    {
      name: 'Juniper',
      previewUrl: './images/characters/upstreet/small/juniper.png',
      avatarUrl: './avatars/jun_engineer_v1_vian.vrm',
      voice: `Cadance`,
      voicePack: `Tiffany voice pack`,
      class: 'Academy Engineer',
      bio: `She is an engineer. 17/F engineer. She is new on the street. She has a strong moral compass and it the voice of reason in the group.`,
      themeSongUrl: `https://webaverse.github.io/music/themes/092958842-groovy-jazzy-band-fun-light-su.mp3`,
      detached: true,
    },
    {
      name: 'Anemone',
      previewUrl: './images/characters/upstreet/small/anemone.png',
      avatarUrl: './avatars/ann.vrm',
      voice: `Trixie`,
      voicePack: `ShiShi voice pack`,
      class: 'Lisk Witch',
      bio: `A witch studying to make the best potions. 13/F. She is exceptionally skilled and sells her potions on the black market, but she is very shy.`,
      themeSongUrl: `https://webaverse.github.io/music/themes/158618260-ghost-catcher-scary-funny-adve.mp3`,
      detached: true,
    },
  ],
};

async function getUpstreetCharacters() {
  return await upstreetCharacters;
}
