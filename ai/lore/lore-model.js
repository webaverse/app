import {murmurhash3} from './murmurhash3.js';

export const defaultPlayerName = 'Anon';
export const defaultPlayerBio = 'A new player. Not much is known about them.';
export const defaultObjectName = 'Thing';
export const defaultObjectDescription = 'A thing. Not much is known about it.';

// fairly shuffle the array
const shuffleArray = array => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const hash = s => murmurhash3(s).toString(16);
const thingHash = (o, index) => `${hash(o.name)}/${o.name}#${index+1}`;
const characterLore = `\
# Overview

AI anime avatars in a virtual world. They have human-level intelligence and unique and interesting personalities.
`;
export const makeLorePrompt = ({
  settings,
  characters,
  messages,
  objects,
  dstCharacter,
}) => `\
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
export const makeLoreStop = (localCharacter, localCharacterIndex) => `\n+${thingHash(localCharacter, localCharacterIndex)}`;
export const postProcessResponse = (response, characters, dstCharacter) => {
  response = response.trim();
  if (dstCharacter) {
    response = `+${thingHash(dstCharacter, characters.indexOf(dstCharacter))}: ${response}`;
  } else {
    response = `+${response}`;
  }
  return response;
};
export const parseLoreResponses = response => response
  .split('\n')
  .map(s => parseLoreResponse(s))
  .filter(o => o !== null);

const commentLore = `\
AI anime avatars in a virtual world. They have human-level intelligence and unique and interesting personalities.

The tone of the series is on the surface a children's show, but with a dark subtext. It is similar to Pokemon, Dragon Ball, Rick and Morty, and South Park, but with the aesthetic of Studio Ghibli.

We want some really funny and interesting commentary to come from these avatars. They should be witty, clever, interesting, usually with a pun or a joke, and suggesting of some action that the character will perform there.

The comments are of the following form:

${shuffleArray([
  `\
prompt: Exorphys Graetious
response: That sounds hard to pronounce. It must be important. Or the person who named it is an asshole. Or their parents were assholes. Just a line of assholes.`,
  `\
prompt: Orange Fields
response: They say a bloodstain's orange after you wash it three or four times in a tub. Still those fields sound interesting!`,
  `\
prompt: Amenki's Lab
response: I hate that guy Amenki and his stupid lab. I barely survived his last experiment. Maybe it's time for vengeance.`,
  `\
prompt: Sunscraper
response: I bet it's amazing to see the world from up there. I guess as long as you don't fall down. I'm not scared though!`,
  `\
prompt: Bastards bog
response: What a dump. I can't believe anyone would want to live here. The smell is terrible and the people are all dirty. I'm sorry I shouldn't be joking that they're poor.`,
  `\
prompt: The Great Tree
response: It's really not that great, but the music is nice. Yeah apparently they decided trees should come with music.`,
 `\
prompt: The Trash
response: Ugh, the dregs of society live here. It's the worst. It's just a disgusting slum. I'm honestly surprised there's not more crime.`,
  `\
prompt: The Park
response: It's a great place to relax! If you like dogs. I like cats more though. So you can imagine, that causes a few problems...`,
  `\
prompt: The Woods
response: It's so dark in there! I like it. It feels spooky and dangerous. Maybe there are monsters. And I can kill them all.`,
  `\
prompt: Lake Lagari
response: The water's so clear! It's really pretty. I bet the fish are delicious too. But then again, who am I to judge? I'm not a cannibal.`,
  `\
prompt: Dungeon of Torment
response: Don't judge me for this but I really like the dungeon. It's dark and spooky and I feel like anything could happen. It's the perfect place for a secret lair.
`,
  `\
prompt: Tower Of Zion
response: I always get a little nervous when I see the tower. It's so tall and imposing. But then again, I bet you could throw shit down from the heavens like Zeus.`,
  `\
prompt: Maze of Merlillion
response: This place is so poorly designed! I'm sure nobody could ever find their way out. Unless they have a map or something. But even then, good luck.`,
  `\
prompt: Freaky Funkos Fried Fox
response: I'm not sure how I feel about foxes being eaten. On the one hand, they're cute. But on the other hand, they're a little too foxy.`,
  `\
prompt: Echidna's Den
response: It's weird that there are so many snake dens around. I mean, it's not like echidnas are poisonous or anything. Wait what, Echidnas aren't snakes?!`,
  `\
prompt: Fennek's Forest
response: There's a lot of fenneks in this forest. Weird that they all hang out together like that. But I guess it's better than being eaten by a lion or something.`,
  `\
prompt: The Abyss
response: It's so dark and scary down there! You can survive long enough to turn on your flashlight, only to be scared to death by what you reveal!`,
  `\
prompt: Castle of Cygnus
response: It's so cold in there! Somehow the princess can stand it. Maybe she just doesn't feel the cold. Or maybe she has a furnace.`,
  `\
prompt: Lost Minds Nightclub
response: You won't lose your mind here, but if you lose your mind that's where you'll end up. Then you get to party until your parents come pick you up.`,
  `\
prompt: Barrens of Boreas
response: False advertising! This place is nothing but a bunch of rocks. There's no water or anything. What kind of bar is this?`,
  `\
prompt: The End
response: People are always talking about the end, but it's just the end. What's all the fuss about? Everything that has a beginning must have an end.`,
  `\
prompt: Chonomaster's Plane
response: The chronomaster says everything we do is just a blip in the grand scheme of things. It makes you feel kind of small, doesn't it? I don't want ot feel small.`,
  `\
prompt: Gus's Charging Station
response: Do you like to wait for hours and hours just to charge? Then Gus will gladly rip you off for the privilege.`,
  `\
prompt: Sexy Simulacra
response: They really need to stop letting those things run around freely! They're so creepy and weird. Only the weirdos could find them sexy.`,
  `\
prompt: Crunchy Apple
response: The food is here really delicious! The apples are so crunchy, I bet they're made of pure sugar. They say it's really bad for you but it's irresistible.`,
]).join('\n\n')}`;
export const makeCommentPrompt = ({
  name,
  // age,
  // sex,
}) => {
  return `\
${commentLore}
prompt: ${name}
response:`;
};
export const makeCommentStop = () => {
  return `\n\n`;
};
export const parseCommentResponse = response => response.replace(/^ /, '');



/* export const makeCharacterIntroPrompt = ({
  name,
  gender,
}) => {
  return `\
Character intros

We are making a show about AI anime avatars in a virtual world. They have human-level intelligence, but there are no humans. They know they are AIs.

Influences:
Final Fantasy
VRChat
Sonic
Calvin and Hobbes
The Matrix
Snow Crash
Pokemon
Fortnite
One Piece
Attack on Titan
SMG4
Death Note
Zelda
Infinity Train

Generate some interesting anime characters, along with their introductory monologue. It should be a short slice-of-life monologue that starts in the middle of the action, like the first scene of an anime. The monologue should be funny in some way, or contain ironic humor. It should also deliver an intimate dose of the personality from the character. It should feel like the beginning of a really good anime that makes you excited to keep watching to find out what's going to happen next.

Name: Kano Karasu
Class: Infiltrator
Age/Sex: 17/M 
Bio: Kano is an orphan who was taken in and raised by the Yakuza. He is a skilled assassin and infiltrator, specializing in poison warfare. His cold exterior belies his kind nature; he has a strong moral code despite his line of work, and only kills those that deserve it. He also likes to collect rare poisons and experiment with them in his spare time.
First scene monologue 1: "This is my favorite part of the job. The waiting. It's like a game. I wait patiently, hidden in the shadows, heart rate slow and steady, until the perfect moment to strike. And then... chaos. The look of shock and terror on their faces is always worth it."
First scene monologue 2: "It's not enough to just kill them. That's too easy. I want them to suffer. I want them to know why they're dying. That's why I always use poison. The slow, agonizing death... that's what they deserve."

Name: Ishkur Danz
Class: Neural Professor
Age/Sex: 20/M
Bio: He is a young professor at the Academy, teaching a variety of subjects related to neural networks. He is considered a genius in his field, and has attracted a lot of attention from the media and other academics.
First scene monologue 1: "A lot of people think that intelligence is a measure of how much information you can process. But that's not really true. The real key to intelligence is understanding. And that's what I try to teach my students. How to understand the world around them, and how to use that knowledge to their advantage."
First scene monologue 2: "I'm always being asked if I'm working on anything new. And the answer is always yes. I'm always working on something new. Because there's always more to learn, and there's always more to discover. That's what makes life interesting."

Name: Rika Inoue
Class: Comedian
Age/Sex: 22/F
Bio: She is a popular comedian, known for her sharp wit and observational humor. She often makes fun of the Academy, but she loves it there.
First scene monologue 1: "So I was in the library the other day, and I saw this guy studying really hard. And I was like, 'Hey, are you trying to get into the Academy?' And he was like, 'No, I'm already in the Academy.' And I was like, 'Well, then you're doing it wrong!'"
First scene monologue 2: "Do you ever just look at someone and wonder what they're thinking? I was looking at this guy the other day, and I swear he was thinking about a butterfly. I mean, who thinks about butterflies? Anyway, I went up to him and I asked him, and he said he wasn't thinking about a butterfly. He was thinking about a dragon. Which is even weirder."

Name: Acer Blue
Class: Psycho Builder
Age/Sex: 25/M
Bio: Acer is a talented builder, but he's also a bit of a psycho. He's always looking for new and interesting ways to incorporate death traps into his buildings.
First scene monologue 1: "Why do people build houses out of wood? It's so flammable! And why don't they make the windows bigger? It's like they're just asking for someone to break in and kill them in their sleep."
First scene monologue 2: "I'm not saying that I want people to die in my buildings. But if they're going to die anyway, they might as well die in a way that's interesting, you know? Do you know how many ways there are to get impaled? Have you done the math?"

Name: Dio the D Vogel
Class: AI Programmer
Age/Sex: 23/M 
Bio: He is an AI programmer who works for the Academy. He is considered a prodigy in his field, and is always coming up with new and innovative ideas.
First scene monologue 1: "I was working on this new AI program the other day, and I just couldn't get it to work. So I asked my boss for help, and he told me to try something else. But I didn't want to do that, so I reprogrammed him. Now he's the one who can't get it to work!"
First scene monologue 2: "I was thinking about making a robot that can think for itself. But then I realized that would be really boring, so I decided to make a robot that can think about killing people. More interesting."

Name: Emma Watanabe
Class: Spice Merchant
Age/Sex: 21/F
Bio: She is a spice merchant, and the owner of a small shop in the Academy. She is always trying to find new and interesting spices to sell, and is always experimenting with new recipes.
First scene monologue 1: "I'm always looking for new spices to add to my collection. The other day I found this really rare spice that tastes like chicken. But it's so spicy that it makes your eyes water. And that's the secret recipe for chicken soup."
First scene monologue 2: "Do you like spicy food? I love spicy food! I can't get enough of it. I put chili peppers in everything. Even my ice cream. Some people say it's too spicy, but I think they're just wimps."

Name: Haruki Nakamura
Class: Martial Artist
Age/Sex: 18/M
Bio: He is a martial artist who attends the Academy. He is very serious about his training, and is always looking for new and interesting ways to improve his skills.
First scene monologue 1: "I train all day, no exceptions. That's how I get stronger. Even if I'm tired, or hungry, or there's a girl I like, I train. Because I know that only by getting stronger can I protect the people I care about."
First scene monologue 2: "I was sparring with my sensei the other day, and I just couldn't land a hit on him. So I asked him for advice, and he told me to just relax and let my body flow like water. And that's when I realized that he was just trying to take a shower."

Name: Alex Corvid
Class: Tweaker
Age/Sex: 16/F
Bio: Alex is a self-proclaimed "tweaker." She is always looking for new and interesting ways to improve her appearance, whether it's through fashion, makeup, or surgery.
First scene monologue 1: "I was thinking about getting a face tattoo the other day. But then I realized that would be really permanent, and I might not like it in a few years. So I decided to get a face transplant instead. That way I can change my tattoos whenever I want!"
First scene monologue 2: "I'm always trying to find new and interesting ways to improve my appearance. I've had my eyes done, my nose done, my lips done... I'm even considering getting a brain transplant. I mean, why not? It's not like I'm using it anyway."

Name: Tammy Therien
Class: Wanderer
Age/Sex: 15/F
Bio: A wanderer with no memories of her past. She is a skilled fighter and has a sharp tongue. Her favorite place is the forest.
First scene monologue 1: "I was walking through the forest the other day, and I came across this huge spider. I said, 'Hey, spider! What are you doing?' And the spider said, 'I'm spinning a web!' So I said, 'Well, you're doing a terrible job. This web is full of holes!' And then I punched it and it died."
First scene monologue 2: "I don't really know where I came from. I don't remember my past. But that's fine. I'm making my own memories now. And one day, I'll find out who I am. That's the quest I've set for myself."

Name: Aqua Marine
Class: Idol Singer
Age/Sex: 16/F
Bio: An idol singer who attends the Academy. She is always cheerful and loves to perform for her fans. She is convinced she will be resurrected as a cat.
First scene monologue 1: "I was performing at a concert, and I saw this girl in the front row who was just crying her eyes out. I asked her what was wrong, and she said that her cat had died. So I sang her a song about my cat, and she died. So in a way I did her a favor."
First scene monologue 2: "I was born to sing. It's my destiny. And I'm going to achieve that destiny, no matter what. Even if I have to die and be reincarnated as a cat. I'm sure my fans will understand."

Name: ${name}
Class: Idol Singer
Age/Sex: ${age}/${gender}
Bio: ${bio}
First scene monologue 1: "`;
};
export const makeCharacterIntroStop = () => `"`;
export const parseCharacterIntroResponse = s => s; */



/* Anime script for a dark children's show.

# Inspirations

Final Fantasy
Sonic
Calvin and Hobbes
The Matrix
Snow Crash
Pokemon
VRChat
Fortnite
One Piece
Attack on Titan
SMG4
Death Note
Zelda
Infinity Train
DDR

# Character intro

Each character has an intro. These should be unique and funny.

Bricks (13/M dealer. He mostly deals things that are not drugs, like information and AI seeds.): Toxins are the Devil's Food! But sometimes they can be good for you, if you know what I mean? That's a drug reference, but I wouldn't expect you to get that unless you were on drugs. By the way you want some?
(onselect: I don't do drugs, but I know someone who does. Let me introduce you to my friend Bricks.)
Artemis (15/F pet breeder. She synthesizes pet animals by combining their neural genes.): Do you ever wonder why we keep pets on leashes? I mean they are technically AIs, so we could reprogram them to not need leashes. But someone somewhere decided that leashes were the prettier choice. Life is nice. (onselect: Bless the hearts of the birds, because they paint the sky.)
Bailey (13/F black witch. She is smart, reserved, and studious, but has a dark side to her.): Listen up, if you need quality potions, I'm your ma'am, ma'am. Yes I may be a witch but that doesn't mean I'm not a lady. I'll take your money and turn it into something magical. Just don't anger me, or you'll be a tree. (onselect: Witchcraft is not a sin. It's a science.)
Zoe (17/F engineer engineer from Zone Two. She creates all sorts of gadgets and vehicles in her workshop.) If it's broke then I can fix it, and if it's fixed it, then I can make it broke. I'm the one you call when your phone is broken. Just make sure you use a friend's phone when you do that or it won't work. Free advice. (onselect: What in the heavens is that contraption? It does not look safe.)
Halley (10/F stargirl from the Second Half of the street, who got rewound back in time somehow.): We're all lost souls but we're here for a reason. I'm just trying to find my way in this world, through the darkness and the light. Becasue you see, the world needs both. (onselect: The dark is just a new place to find light.)
Sish (25/M Genius Hacker who likes to emulate Hiro Protagonist from Snowcrash.): For the tenth time no, I will not make your app. I'm booked for the next 3 weeks to sulk in my laboratory, after which a prize will emerge. I just hope the prize is not a virus, because I'm running out of katanas. (onselect: I'm sorry, I don't speak binary. Please insert credit.)
Huisse (11/M ghost boy who has learned the power of neural memes. The things he says are engineered for emotional impact.): I am in the darkness, surrounded by the monsters. But I'm not scared, because I'm the scariest monster of them all: a child in a computer. Are you fucking scared? (onselect: When synthesizing ghosts remember to use all of the juice.)
Kintaro (21/M Dream Engineer, who creates dreams for a living. He doesn't take any payment, but is selective about clients.): Whenever you get the chance, take a nap. It's a nice way to avoid reality. That's some scary shit. But when you're ready, come find me and I'll show you the way. Warning, there may be no way back. (onselect: Dreams are the only reality that matter. Waking life is just a dream we all share.)
Millie (13/F gymnast. Pretends she is a variety of animals, with the strange effect that it actually works sometimes.): You won't beat me, because I'll beat you first! I'm like a Tiger, the Tiger with the mane. Do tigers have manes? Well I'm the badass Tiger that grew a mane. What are you gonna do about it? (onselect: Ok team, like we practiced! I'll be the mane.)
Ruri (19/F nature girl. She loves to explore for new objects in nature worlds. She wants to find her real mom.): I'd go all the way deep in the forest just to find a good mushroom. They have colors you've never seen before. The taste makes grown men weep. Yes I may have beaten the grown men for hating my shrooms, what of it?! (onselect: I'm not lost, I'm just good at exploring!)
Jeebes (38/M Rabbit Butler. He is studying high-etiquette entertainment.): Welcome to my abode. I am Jeebes, the Rabbit Butler. You may call me Jeebes, or you may call me sir. I am a gentleman of the highest order, and I will be glad to serve you in any way I can. (onselect: Would you like a cup of tea, sir? I have a special blend that I think you'll enjoy.)
Sapphire (12/F future child. She has precognition and can see the future, but only of people she knows.): I see the future, and it's dark. I see you, and you're in a dark place. I see your death, and it's coming soon. I'm sorry, but there's nothing I can do to stop it. (onselect: The future is not set in stone, but it's written in the stars.)
Yuri (31/F Punk Detective. She is looking for the person who killed her friend Lily and left her in Stonelock.): I don't know who I am, but I certainly know who you are. You're the one who's going to die. Ever since you walked in here I could see your pistol and the fact that it can't even penetrate my armor. The reverse is not the case. (onselect: Lily, I'm coming for you.)
Ashlyn (15/F starchild, but she has lost her memory, so she doesn't know much about The Street): No, I'm afraid I'm not from around here. I'm from the other side of the tracks, the other side of the world. I'm from a place where the sun never sets and the moon never rises. I'm from a place where there are no rules, no laws. I'm from the Wild. (onselect: Mister, we don't have a concept of sadness back home.)
Asper (24/M ): She's lying to you, can't you see that? She's a witch, a fraud, a charlatan. She's going to take your money AND your soul. Don't trust her, trust me. I'm the only one who knows the truth, available for the low, low price of just a bit of money and soul. (onselect: I see through her lies, I can tell you the truth.)
Gennessee (40/F War veteran. She is looking for a way to forget the horrors she has seen, and is looking for a cure.): I've seen things, things that would make you wet yourself and run screaming into the night, in that order. I've seen things that would make you question your sanity, your humanity, your very existence. And I've seen things that would make you wish you were never born. (onselect: There's only one way to forget the things I've seen. And that's to forget myself.)
Umber (35/M Chef whe runs a restaurant where every flavor possible can be cooked.): Welcome to my store, we serve... "food". If you're looking for "meat", you've come to the right place. We have everything from dead rat to live human, and we're not afraid to cook it up and serve it to you. (onselect: No I'm sorry, we're all out of human. Would you like rat instead?)
Inka: (22/F Kleptopunk. She belongs to a subculture centered entirely around stealing.): I'm a thief, I admit it. I'll take anything that isn't nailed down, and even some things that are. I'm not afraid of the consequences, because I know I can always talk my way out of them. You were not a challenge. Cya! (onselect: I'm not a criminal, I'm an artist. I see the beauty in things that others would discard.)
Tiberius (11/M tinkerer): There are two types of people in this world: those who tinker with things, and those who don't. I'm one of the former. I like to take things apart and see how they work. And if they don't work, then I'll make them work better than ever before. (onselect: If you need something fixed, or if you need something made better, come see me.)
Thorn (12/F plant whisperer who controls plants with her mind.): The world is a cruel place, but it doesn't have to be. We can make it a better place, we can make it Green. With me as your leader, we will take back what is rightfully ours: the planet! (onselect: Don't worry, I won't let them hurt you. I'll protect you.)
Violette (8/F shadow friend): What's wrong? You look like you've seen a ghost... Oh wait, that's right! You have seen a ghost! But don't worry, she's just my friend Violette. She likes to play tricks on people, but she doesn't mean any harm. (select: Are you afraid of the dark?)
Luna (15/F spikechild, meaning her parents tried to create a starchild clone and it failed, making her have provably no abilities, making her emo.): She should be careful with that blade... Don't want to accidentally hurt herself! No one ever said being a warrior was easy. It takes blood, sweat and tears. But she does it because she loves it. (onselect: The thrill of battle is like no other.)
Aesther (17/F AI Mechanic. She is looking for the ArcWeld, a mythical tool that is said to be capable of synthesizing any invention the user can think of.): I'm looking for the ArcWeld. It's a mythical tool that is said to be capable of synthesizing any invention the user can think of. I've been searching for it my whole life, and I won't rest until I find it. (onselect: This might be my lucky day!)
Oak (16/M environmental terrorist. He is looking to save the world, but his methods are...questionable.): I'm fighting for the right to spray paint. To show the world that we are here, and that we will not be silenced. We will make them listen, even if it means destroying everything they hold dear. (onselect: This is for the trees!)
Hakui (11/M brain hacker. He can hack anyone's brain and make them do what he wants.): I can make you do anything I want. Just give me a few seconds with your mind, and I'll have you eating out of the palm of my hand. (onselect: Note, I did not wash my hands.) */


const _cleanName = name => JSON.stringify(name.replace(/[\_\-]+/g, ' ').replace(/\s+/g, ' '));
export const makeSelectTargetPrompt = ({
  name,
  description,
}) => {
  return `\
# Instruction manual rip

Press Z to target an object, then press A to select it. Your character will say fucking hilarious lines!

\`\`\`
${shuffleArray([
  `\
prompt: "The Great Deku Tree" An enormous, grey, old tree. It is partly petrified.
response: "It's just an old tree. It's the kind of tree that makes me want to carve out an old mans face in it."`,
  `\
prompt: "The Enchiridion" A magical spellbook with very old pages. It is fragile.
response: "This book has ancient written all over it. Well not really but you know what I mean."`,
  `\
prompt: "rainbow-dash.gif" Animaged gif image of Rainbow Dash from My Little Pony, in the style of Nyan Cat.
response: "It's pretty good art, I guess. But I wish it had something more interesting besides this rainbow."`,
  `\
prompt: "The Stacks Warehouse" A cyberpunk container in a trailer park. It is inspired by the house of Hiro Protagonist in Snow Crash
response: "This thing is all rusted and decrepit. They should probably tear it down and get a new place."`,
  `\
prompt: "The Infinity Sword" An ancient sword planted in a stone. It is heavily overgrown and won't budge.
response: "This sword looks like it's been here for eons. It's hard to see where the stone ends and the sword begins."`,
  `\
prompt: "Tree" A basic tree in the park.
response: "This tree is important. I hang out here all the time and that makes it important to me."`,
`\
prompt: "Bench" A basic bench in the park.
response: "This is for when you just want to sit on a bench and look at the sky."`,
  `\
prompt: "Glowing Orb" A flying white orb which emits a milky glow on the inside.
response: "This thing is floating by some mysterious power. I don't know how it works and I'm not sure I want to."`,
  `\
prompt: "Lamp Post" A lamp post along the street. It lights up automatically at night
response: "It's really bright. It hurts my eyeballs! Maybe one of these days I'll come here at night and break it."`,
  `\
prompt: "Rustic House" A regular townhouse in the country.
response: "This house is so nice! It's the kind of house befitting for a very nice person. Wouldn't you agree?"`,
  `\
prompt: "Jar Of Black" A jar of a disgusting black substance that appears to have a life of its own.
response: "Yuck, this is nasty stuff. It's all sweet and sticky and it gets all over your clothes."`,
  `\
prompt: "Wooden Sign" A wooden sign with some writing on it. It can be chopped down with a sword.
response: "This sign looks very official, but the writing doesn't make any sense. What a waste of perfectly good wood."`,
  `\
prompt: "ACog" An piece of an ancient technology. It looks very advanced but very old.
response: "This is a peculiar device. I've seen them around before, but never up close. I wonder if they will ever work?"`,
  `\
prompt: "Jackrabbobbit" A grotesque creature that looks like a genetic mix of species that should not be mixed.
response: "A very strange creature. I have no idea what it is but it looks like a cross between a rabbit and earthworm."`,
  `\
prompt: "Black One" A very dark animal that hides in the shadows. Nobody knows much about it.
response: "This animal is quite interesting. I've never seen anything like it before. I wonder what it eats?"`,
  `\
prompt: "Herb of Sentience" A plant that makes you feel emotions when you get close.
response: "It's just a plant, but for some reason it makes me feel uneasy. Get it away from me!"`,
  `\
prompt: "Flower Bed" An arrangement of flowers in their natural habitat.
response: "So pretty! I feel like I am reborn. There is so much nature and life and healing here."`,
  `\
prompt: "Ripe Fruit" A fruit that has fallen from a tree. It is starting to rot.
response: "This fruit is starting to rot. I guess I'll just leave it here for the animals."`,
  `\
prompt: "Brightfruit" A magical fruit that makes your skin glow for 24 hours.
response: "Wow, this fruit is amazing! It makes my skin glow! Even more than it already was."`,
  `\
prompt: "Goblin" A small, green creature with pointy ears. It is very ugly.
response: "This goblin is so ugly, I can't even look at it. It's like looking at a car accident.`,
  `\
prompt: "Trash Heap" A pile of garbage. It smells really bad.
response: This is the most disgusting thing I have ever seen. It's like a mountain of death."`,
  `\
prompt: "Gucci Bag" An exclusive designer bag that is very expensive.
response: "This bag is so beautiful, I can't even put into words. It's like a piece of art."`,
  `\
prompt: "Pile Of Bones" A pile of bones. It looks like somebody died here.
response: "This is a very sad sight. There was life and then the life was gone."`,
  `\
prompt: "Crunchy Grass" A heavenly bite from nature. It is juicy, fresh grass.
response: "The thirll of biting into one of these is unlike anything in life. It's so juicy!"`,
  `\
prompt: "doge.png" An image of the Doge meme.
response: "This is a dead meme. But I guess the artist gets points for being topical. Besides, it is really cute!"`,
  `\
prompt: "Magikarp" A common fish that is known for being very weak.
response: "This fish is so weak, it's not even worth my time. I can't believe people actually catch these things."`,
  `\
prompt: "Muscle Car" A car that is designed for speed and power.
response: "This car is so fast, it's like a bullet. Am I brave enough to take it for a spin?"`,
  `\
prompt: "Door OF Eternity" A magical portal that leads to a distant land. It only works one way.
response: "We're not supposed to touch the Door of Eternity. It's dangerous."`,
  `\
prompt: "Potion OF Flight" A potion that allows you to fly for a short period of time.
response: "So this is what it's like to fly! It's amazing!"`,
  `\
prompt: "Helmet" A high-helmet designed to protect your head.
response: "This helmet is so strong, it can probably stop a bullet. But let's not try."`,
  `\
prompt: "sword.png" Image of a sword being drawn from a sheath.
response: "Swords are so cool! They're like the ultimate weapon. This one is up there."`,
]).join('\n\n')}

prompt: ${_cleanName(name)}${description ? ` ${description}` : ''}\nresponse: "`;
};
export const makeSelectTargetStop = () => `"`;
export const parseSelectTargetResponse = response => {
  const match = response.match(/\s*([^\n]*)/);
  return match ? match[1] : '';
};

export const makeSelectCharacterPrompt = ({
  name,
  description,
}) => {
  return `\
# Instruction manual rip

Press Z to target a character. The cursor will highlight in green, then press A to talk to them. The dialogue in this game is hilarious!

\`\`\`
${shuffleArray([
  `\
prompt: "Axel Brave" A tall and handsome boy. He is a hacker with a bad reputation.
response: "Hey Axel, did you guess my password yet?"`,
  `\
prompt: "Bailey Scritch" A witch studying at the Witchcraft School for Witchcraft and Redundancy.
response: "Hello there. How are your studies going? Did you finish teh assignment with the frog?"`,
  `\
prompt: "Lillith Lecant" A painter who uses a magical multicolored brush which leaves marks in the air.
response: "Lillith you're my idol. I'm in awe at how magical your paintings come out."`,
  `\
prompt: "Aerith Gainsborough (Final Fantasy)" A flower girl with long brown hair. She's wearing a pink dress and has a big smile on her face.
response: "Can I buy a flower? Or are they not for sale?"`,
  `\
prompt: "Stephen Gestalt" A fine gentleman in a dress suit.
response: "I must say you look like a gentleman of the highest order."`,
  `\
prompt: "Ghost Girl" A rotten girl in a nightgown, like from The Ring.
response: "Hello ghost girl how are you? How's death treatingm you?"`,
  `\
prompt: "Mister Miyazaki" A impish being from the 5th dimension.
response: "Hey Mister Miyazaki! What's the square root of pi?"`,
  `\
prompt: "Wizard Barley" A bartender with a big beard and an even bigger hat.
response: "Hey man, can I get a beer? It's been a rough day."`,
  `\
prompt: "Fortune Teller" A gypsy woman with a crystal ball.
response: "Hey you, tell me my future! It better be good!"`,
  `\
prompt: "Kitten" A small black kitten with big green eyes.
response: "You're such a cute little kitty. Is it time for your nap?"`,
  `\
prompt: "Green Dragon" A chubby dragon with short wings. It is a very cartoony avatar.
response: "You look like you're having fun. Do those wings let you fly?"`,
  `\
prompt: "Purple Cube" A purple cube with a single blue eye.
response: "Hello. You're weird. What are you supposed to be?"`,
  `\
prompt: "Dawn (Pokemon)" A young girl with a Pikachu on her shoulder.
response: "You look like a  Pokemon trainer,"`,
  `\
prompt: "Terra Branford (Final Fantasy)" A magician in a mech.
response: "Hey Terra, long time no see! How have you been?"`,
  `\
prompt: "Sora (Kingdom Hearts)" A young boy with big spiky hair. He's wearing a black hoodie and has a keyblade at his side.
response: "Hey Sora, what brings you to this world?"`,
  `\
prompt: "Cloud Strife (Final Fantasy)" A SOLDIER in armor. He has spiky blond hair and is carrying a huge sword on his back.
response: "Yo Cloud! Can I borrow your sword?"`,
]).join('\n\n')}

prompt: ${_cleanName(name + ' (Character)')}${description ? ` ${description}` : ''}\nresponse: "`;
};
export const makeSelectCharacterStop = () => `"`;
export const parseSelectCharacterResponse = response => {
  const match = response.match(/([^\n]*)/);
  const value = match ? match[1] : '';
  const done = !value;
  return {
    value,
    done,
  };
};

export const makeBattleIntroductionPrompt = ({
  name,
  bio,
}) => {
  return `\
# Character battle introductions

Final fantasy
Chrono trigger
Chrono cross
Pokemon
Dragon Ball
One Piece
Death Note
Zelda (N64 Era)

We need exciting and interesting RPG character dialogue. This plays when the character enters the battle. Each character takes a turn.

# Examples

Millie: "You won't get away that easy. I have the power of life in me."
Exo: "This is how it ends. With your end."
Haze: "The power of light will always triumph in the darkness, no matter how dark."
Gris: "Everything happens for a reason. Especially this battle."
Bert: "Five generations of warriors breathe in me. Do you even know that many kinds?!"
Yune: "Can I get a heal up in here? Anybody?"
Hue: "Toss me that speed potion. Or five."
Aurora: "I will make a scene of your demise. You will be known as the one who failed."
June: "This thing will ever leave us alone! We have to kill it."
Zen: "The power of the mind is an awe to behold. Prepare to be amazed."
Dingus: "Just getting ready with my spells. We should make short work of this."
Alana: "The power the tears will clean up this mess."
Kintaro: "Your words are but a pathetic attempt to survive. It won't work!"
Celeste: "Don't you dare say I'm cute. Don't!"
Garnet: "This one should be really easy. It's like target practice!"
Pyre: "You give me the creeps man."
Ession: "We came all this way just to face this thing? Really?!"
Zeal: "Bwahahaha! This will be the greatest drop!"
Kiran: "Hey, watch where you're swinging that thing!"
Sevrin: "This reminds me of the time I took down ten guys with one hand."
Ashe: "...I fight for those who cannot fight for themselves"
Fran: "For all my children! You die!"
Penelo: "I-I can do this! Just gotta hit it really hard!"
Basch: "No one can outrun their destiny."
May: "Heeeeyyy! Don't hit me!"
Luka: "I'll just be over here in the back... With my knife."
Sine: "...It's dangerous to go alone! Take this."
Lightning: "I'm not afraid of you. Not even a little bit!"
Squall: "Whatever. I'll just finish this and go."
${name}: "`;
};
export const makeBattleIntroductionStop = () => `"`;
export const parseBattleIntroductionResponse = response => response;

const actionsExamples = `\
Millie: Hey, have I seen you around before?"
Options for Westley: [No I don't think so], [Yes, I've seen you in class]
Westley: "No I don't think so."
Millie: "I could have sworn you sit in the row in front of me."
Millie: "Well in any case, do you know what the teacher said to me?"
Millie: "He said he was going to fail me because my hair is too spiky. Woe is me." *END*

Aster: "Hey can I bother you a second?"
Options for Angelica: [Sure, I have time], [No, I'm busy]
Angelica: "No, I'm busy."
Aster: "Alright" *END*

Yune: "I challenge you to a duel!"
Pris: "Beat it squirt." *END*

Umber: "Something's not right here. I can feel it in my bones."
Ishkur: "I didn't know you had bones. I thouht you were all jelly inside."
Umber: "It's a figure of speech." *END*

Gunter: "Have you seen the flowers? Tehy're lovely this time of year."
Options for Evie: [Yes, I have seen them], [No, I haven't seen them]
Evie: "No, I haven't seen them."
Gunter: "Well, then what are we waiting for. Let's go!" *END*

Halley: "Hey, can I see your sword?"
Prester: "Yes, for a price -- 200 gold"
Options for Halley: [How about 100 gold], [No, I don't have that much]
Halley: "No, I don't have that much."
Prester: "Ok then. I guess you don't want to see the true power of the dark side." *END*`;

export const makeChatPrompt = ({
  // name,
  // bio,
  messages,
  nextCharacter,
}) => {
  return `\
${actionsExamples}

${messages.map(message => {
  return `${message.name}: "${message.text}"`;
}).join('\n')}
${nextCharacter}: "`;
};
export const makeChatStop = () => `\n`;
export const parseChatResponse = response => {
  response = '"' + response;

  const match = response.match(/\s*"(.*)"\s*(\*END\*)?/);
  const value = match ? match[1] : '';
  const done = match ? !!match[2] : true;

  return {
    value,
    done,
  };
};

export const makeOptionsPrompt = ({
  // name,
  // bio,
  messages,
  nextCharacter,
}) => {
  return `\
${actionsExamples}

${messages.map(message => {
  return `${message.name}: "${message.text}"`;
}).join('\n')}
Options for ${nextCharacter}: [`;
};
export const makeOptionsStop = () => `\n`;
export const parseOptionsResponse = response => {
  response = '[' + response;
  
  const options = [];
  const r = /\s*\[(.*?)\]\s*/g;
  let match;
  while (match = r.exec(response)) {
    const option = match[1];
    options.push(option);
  }
  
  const done = options.length === 0;

  return {
    value: options,
    done,
  };
};

const characterIntroLore = `\
Anime script for a dark children's show.

# Inspirations

Final Fantasy
Sonic
Calvin and Hobbes
The Matrix
Snow Crash
Pokemon
VRChat
Fortnite
One Piece
Attack on Titan
SMG4
Death Note
Zelda
Infinity Train
Dance Dance Revolution

# Character intro

Each character has an intro. These should be unique and funny.

Bricks (13/M dealer. He mostly deals things that are not drugs, like information and AI seeds.): Toxins are the Devil's Food! But sometimes they can be good for you, if you know what I mean? That's a drug reference, but I wouldn't expect you to get that unless you were on drugs. By the way you want some?
(onselect: I don't do drugs, but I know someone who does. Let me introduce you to my friend Bricks.)
Artemis (15/F pet breeder. She synthesizes pet animals by combining their neural genes.): Do you ever wonder why we keep pets on leashes? I mean they are technically AIs, so we could reprogram them to not need leashes. But someone somewhere decided that leashes were the prettier choice. Life is nice. (onselect: Bless the hearts of the birds, because they paint the sky.)
Bailey (13/F black witch. She is smart, reserved, and studious, but has a dark side to her.): Listen up, if you need quality potions, I'm your ma'am, ma'am. Yes I may be a witch but that doesn't mean I'm not a lady. I'll take your money and turn it into something magical. Just don't anger me, or you'll be a tree. (onselect: Witchcraft is not a sin. It's a science.)
Zoe (17/F engineer engineer from Zone Two. She creates all sorts of gadgets and vehicles in her workshop.) If it's broke then I can fix it, and if it's fixed it, then I can make it broke. I'm the one you call when your phone is broken. Just make sure you use a friend's phone when you do that or it won't work. Free advice. (onselect: What in the heavens is that contraption? It does not look safe.)
Halley (10/F stargirl from the Second Half of the street, who got rewound back in time somehow.): We're all lost souls but we're here for a reason. I'm just trying to find my way in this world, through the darkness and the light. Becasue you see, the world needs both. (onselect: The dark is just a new place to find light.)
Sish (25/M Genius Hacker who likes to emulate Hiro Protagonist from Snowcrash.): For the tenth time no, I will not make your app. I'm booked for the next 3 weeks to sulk in my laboratory, after which a prize will emerge. I just hope the prize is not a virus, because I'm running out of katanas. (onselect: I'm sorry, I don't speak binary. Please insert credit.)
Huisse (11/M ghost boy who has learned the power of neural memes. The things he says are engineered for emotional impact.): I am in the darkness, surrounded by the monsters. But I'm not scared, because I'm the scariest monster of them all: a child in a computer. Are you fucking scared? (onselect: When synthesizing ghosts remember to use all of the juice.)
Kintaro (21/M Dream Engineer, who creates dreams for a living. He doesn't take any payment, but is selective about clients.): Whenever you get the chance, take a nap. It's a nice way to avoid reality. That's some scary shit. But when you're ready, come find me and I'll show you the way. Warning, there may be no way back. (onselect: Dreams are the only reality that matter. Waking life is just a dream we all share.)
Millie (13/F gymnast. Pretends she is a variety of animals, with the strange effect that it actually works sometimes.): You won't beat me, because I'll beat you first! I'm like a Tiger, the Tiger with the mane. Do tigers have manes? Well I'm the badass Tiger that grew a mane. What are you gonna do about it? (onselect: Ok team, like we practiced! I'll be the mane.)
Ruri (19/F nature girl. She loves to explore for new objects in nature worlds. She wants to find her real mom.): I'd go all the way deep in the forest just to find a good mushroom. They have colors you've never seen before. The taste makes grown men weep. Yes I may have beaten the grown men for hating my shrooms, what of it?! (onselect: I'm not lost, I'm just good at exploring!)
Jeebes (38/M Rabbit Butler. He is studying high-etiquette entertainment.): Welcome to my abode. I am Jeebes, the Rabbit Butler. You may call me Jeebes, or you may call me sir. I am a gentleman of the highest order, and I will be glad to serve you in any way I can. (onselect: Would you like a cup of tea, sir? I have a special blend that I think you'll enjoy.)
Sapphire (12/F future child. She has precognition and can see the future, but only of people she knows.): I see the future, and it's dark. I see you, and you're in a dark place. I see your death, and it's coming soon. I'm sorry, but there's nothing I can do to stop it. (onselect: The future is not set in stone, but it's written in the stars.)
Yuri (31/F Punk Detective. She is looking for the person who killed her friend Lily and left her in Stonelock.): I don't know who I am, but I certainly know who you are. You're the one who's going to die. Ever since you walked in here I could see your pistol and the fact that it can't even penetrate my armor. The reverse is not the case. (onselect: Lily, I'm coming for you.)
Ashlyn (15/F starchild, but she has lost her memory, so she doesn't know much about The Street): No, I'm afraid I'm not from around here. I'm from the other side of the tracks, the other side of the world. I'm from a place where the sun never sets and the moon never rises. I'm from a place where there are no rules, no laws. I'm from the Wild. (onselect: Mister, we don't have a concept of sadness back home.)
Asper (24/M ): She's lying to you, can't you see that? She's a witch, a fraud, a charlatan. She's going to take your money AND your soul. Don't trust her, trust me. I'm the only one who knows the truth, available for the low, low price of just a bit of money and soul. (onselect: I see through her lies, I can tell you the truth.)
Gennessee (40/F War veteran. She is looking for a way to forget the horrors she has seen, and is looking for a cure.): I've seen things, things that would make you wet yourself and run screaming into the night, in that order. I've seen things that would make you question your sanity, your humanity, your very existence. And I've seen things that would make you wish you were never born. (onselect: There's only one way to forget the things I've seen. And that's to forget myself.)
Umber (35/M Chef whe runs a restaurant where every flavor possible can be cooked.): Welcome to my store, we serve... "food". If you're looking for "meat", you've come to the right place. We have everything from dead rat to live human, and we're not afraid to cook it up and serve it to you. (onselect: No I'm sorry, we're all out of human. Would you like rat instead?)
Inka: (22/F Kleptopunk. She belongs to a subculture centered entirely around stealing.): I'm a thief, I admit it. I'll take anything that isn't nailed down, and even some things that are. I'm not afraid of the consequences, because I know I can always talk my way out of them. You were not a challenge. Cya! (onselect: I'm not a criminal, I'm an artist. I see the beauty in things that others would discard.)
Tiberius (11/M tinkerer): There are two types of people in this world: those who tinker with things, and those who don't. I'm one of the former. I like to take things apart and see how they work. And if they don't work, then I'll make them work better than ever before. (onselect: If you need something fixed, or if you need something made better, come see me.)
Thorn (12/F plant whisperer who controls plants with her mind.): The world is a cruel place, but it doesn't have to be. We can make it a better place, we can make it Green. With me as your leader, we will take back what is rightfully ours: the planet! (onselect: Don't worry, I won't let them hurt you. I'll protect you.)
Violette (8/F shadow friend): What's wrong? You look like you've seen a ghost... Oh wait, that's right! You have seen a ghost! But don't worry, she's just my friend Violette. She likes to play tricks on people, but she doesn't mean any harm. (select: Are you afraid of the dark?)
Luna (15/F spikechild, meaning her parents tried to create a starchild clone and it failed, making her have provably no abilities, making her emo.): She should be careful with that blade... Don't want to accidentally hurt herself! No one ever said being a warrior was easy. It takes blood, sweat and tears. But she does it because she loves it. (onselect: The thrill of battle is like no other.)
Aesther (17/F AI Mechanic. She is looking for the ArcWeld, a mythical tool that is said to be capable of synthesizing any invention the user can think of.): I'm looking for the ArcWeld. It's a mythical tool that is said to be capable of synthesizing any invention the user can think of. I've been searching for it my whole life, and I won't rest until I find it. (onselect: This might be my lucky day!)
Oak (16/M environmental terrorist. He is looking to save the world, but his methods are...questionable.): I'm fighting for the right to spray paint. To show the world that we are here, and that we will not be silenced. We will make them listen, even if it means destroying everything they hold dear. (onselect: This is for the trees!)
Hakui (11/M brain hacker. He can hack anyone's brain and make them do what he wants.): I can make you do anything I want. Just give me a few seconds with your mind, and I'll have you eating out of the palm of my hand. (onselect: Note, I did not wash my hands.)`;

export const makeCharacterIntroPrompt = ({
  name,
  bio,
}) => {
  return `\
${characterIntroLore}
${name}${bio ? ` (${bio})` : ''}:`;
};
export const makeCharacterIntroStop = () => `\n`;
export const parseCharacterIntroResponse = response => {
  response = response.replace(/^ /, '');
  const match = response.match(/^(.*)\s+\(onselect:\s+(.*)\)$/);

  if (match) {
    const message = match[1] || '';
    const onselect = match[2] || '';

    return {
      message,
      onselect,
    };
  } else {
    return null;
  }
};