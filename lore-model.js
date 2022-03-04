import murmurhash3js from 'murmurhash3js';

const hash = s => murmurhash3js.x86.hash32(s).toString(16);
const thingHash = (o, index) => `${hash(o.name)}/${o.name}#${index+1}`;
const characterLore = `\
# Overview

AI anime avatars in a virtual world. They have human-level intelligence and unique and interesting personalities.
`;
export const makeLorePrompt = (settings, characters, messages, objects, dstCharacter) => `\
${characterLore}

Script examples:

\`\`\`
+${thingHash({name:'Character1'}, 0)}: What's the meaning of life? [emote=normal,action=none,object=none,target=none]
+${thingHash({name:'Npc1'}, 1)}: Doesn't matter. Anyway, I'll follow you Character1. [emote=happy,action=follow,object=none,target=${thingHash({name:'Character1'}, 0)}]
+${thingHash({name:'Character1'}, 0)}: Don't do that. [emote=normal,action=none,object=none,target=none]
+${thingHash({name:'Npc1'}, 1)}: Ok I'll stop. [emote=normal,action=stop,object=none,target=none]
+${thingHash({name:'Character1'}, 0)}: Come over here, Npc1! [emote=normal,action=none,object=none,target=none]
+${thingHash({name:'Npc1'}, 1)}: Ok coming. [emote=normal,action=none,object=none,target=${thingHash({name:'Character1'}, 0)}]
+${thingHash({name:'Npc1'}, 1)}: I'm going Super Saiyan mode! [emote=angry,action=supersaiyan,object=none,target=none]
+${thingHash({name:'Character1'}, 0)}: Press that button. [emote=normal,action=none,object=none,target=none]
+${thingHash({name:'Npc1'}, 1)}: What does this button do? [emote=joy,action=use,object=${'BUTTON#1'},target=none]
+${thingHash({name:'Npc1'}, 1)}: Here, Character1, take my sword. [emote=sorrow,action=give,object=${'SWORD#2'},target=${thingHash({name:'Character1'}, 0)}]
+${thingHash({name:'Npc1'}, 1)}: I'm equipping my armor. [emote=angry,action=equip,object=${'ARMOR#5'},target=none]
+${thingHash({name:'Npc1'}, 1)}: I'm dropping this potion. [emote=normal,action=drop,object=${'POTION#6'},target=none]
+${thingHash({name:'Npc1'}, 1)}: Ok Character1, I'll go get the bow. [emote=normal,action=fetch,object=${'BOW#7'},target=${thingHash({name:'Character1'}, 0)}]
\`\`\`

# Scene 1

# Setting

${settings.join('\n\n')}

## Characters

${
  characters.map((c, i) => {
    return `Id: ${thingHash(c, i)}
Name: ${c.name}
Bio: ${c.bio}
`;
  }).join('\n\n')
}

# Objects

${
  objects.map((o, i) => thingHash(o, i)).join('\n')
}

## Script (raw format)

${
  messages.map(m => {
    const characterIndex = characters.indexOf(m.character);
    const suffix = `[emote=${m.emote},action=${m.action},object=${m.object},target=${m.target}]`;
    return `+${thingHash(m.character, characterIndex)}: ${m.message} ${suffix}`;
  }).join('\n')
}
+${
  dstCharacter ? `${thingHash(dstCharacter, characters.indexOf(dstCharacter))}:` : ''
}`;

const parseLoreResponse = response => {
  let match;
  // console.log('parse lore', response, match);
  /* if (match = response?.match(/^\+([^\/]+?)\/([^#]+?)#([0-9]+?):([\s\S]*)\[emote=([\s\S]*?)\]$/)) {
    const hash = match[1];
    const name = match[2];
    const nonce = parseInt(match[3], 10);
    const message = match[4].trim();
    const emote = match[5];
    const action = 'none';
    const object = 'none';
    const target = 'none';
    return {
      hash,
      name,
      nonce,
      message,
      emote,
      action,
      object,
      target,
    };
  } else */if (match = response?.match(/^\+([^\/]+?)\/([^#]+?)#([0-9]+?):([^\[]*?)\[emote=([\s\S]*?),action=([\s\S]*?),object=([\s\S]*?),target=([\s\S]*?)\]$/)) {
    // console.log('match 1', match);
    const hash = match[1];
    const name = match[2];
    const nonce = parseInt(match[3], 10);
    const message = match[4].trim();
    const emote = match[5].trim();
    const action = match[6].trim();
    const object = match[7].trim();
    const target = match[8].trim();
    return {
      hash,
      name,
      nonce,
      message,
      emote,
      action,
      object,
      target,
    };
  } else if (match = response?.match(/^\+([^\/]+?)\/([^#]+?)#([0-9]+?):([^\[]*?)$/)) {
    // console.log('match 2', match);
    const hash = match[1];
    const name = match[2];
    const nonce = parseInt(match[3], 10);
    const message = match[4].trim();
    const emote = 'normal';
    const action = 'none';
    const object = 'none';
    const target = 'none';
    return {
      hash,
      name,
      nonce,
      message,
      emote,
      action,
      object,
      target,
    };
  } else {
    // console.log('no match', response);
    return null;
  }
};
export const parseLoreResponses = responses => responses
  .split('\n')
  .map(s => parseLoreResponse(s))
  .filter(o => o !== null);
export const makeLoreStop = (localCharacter, localCharacterIndex) => `\n+${thingHash(localCharacter, localCharacterIndex)}`;
export const postProcessResponse = (response, characters, dstCharacter) => {
  response = response.trim();
  if (dstCharacter) {
    response = `+${thingHash(dstCharacter, characters.indexOf(dstCharacter))}: ${response}`;
  }
  return response;
};