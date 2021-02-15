import { procgen } from "./procgen.js"
// import fs from "fs";

const _testHash = "QmaBDgByQgwTuCBFdnRzRESYd5puE9SwE5u6sSZ7vVSjvE";
const simulationSize = 1000;

const rarities = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
];

const SaberType = [ "Light", "Dark" ]
const SaberTypeRarity = [ 75, 25 ].map(n => n / 100)

const BladeColor = {
  Light : ["Blue", "Green", "Yellow", "Orange", "Purple", "Pink", "White" ],
  Dark: ["Red", "Orange", "Yellow", "Purple", "Silver", "Black"]
};

const BladeColorRarity = {
  Light: [40, 24, 14, 10, 8, 3.5, .5].map(n => n / 100),
  Dark: [50, 20, 20, 7, 2.6, .4].map(n => n / 100)
}

const EmitterType = {
  Light: ["CommonOne", "CommonTwo", "CommonThree", "CommonFour", "CommonFive", "CommonSix", "RareSeven", "RareEight", "EpicNine"],
  Dark: ["CommonOne", "CommonTwo", "CommonThree", "CommonFour", "RareFive", "RareSix", "EpicSeven"]
}

const EmitterTypeRarity = {
  Light: [30, 26, 18, 14, 8, 3.9, .1].map(n => n / 100),
  Dark: [40, 30, 20, 9, .9, .1].map(n => n / 100)
}

const SwitchType = {
  Light: ["CommonOne", "CommonTwo", "CommonThree", "CommonFour", "CommonFive", "CommonSix", "RareSeven", "RareEight", "EpicNine"],
  Dark: ["CommonOne", "CommonTwo", "CommonThree", "CommonFour", "RareFive", "RareSix", "EpicSeven"]
}

const SwitchTypeRarity = {
  Light: [24, 20, 18, 16, 12, 7, 2, .8, .2].map(n => n / 100),
  Dark: [28, 26, 22, 16, 5, 2.8, .2].map(n => n / 100)
}

const PommelType = {
  Light: ["CommonOne", "CommonTwo", "CommonThree", "CommonFour", "CommonFive", "CommonSix", "RareSeven", "RareEight", "EpicNine"],
  Dark: ["CommonOne", "CommonTwo", "CommonThree", "CommonFour", "RareFive", "RareSix", "EpicSeven"]
}

const PommelTypeRarity = {
  Light: [24, 20, 18, 16, 12, 7, 2, .8, .2].map(n => n / 100),
  Dark: [28, 26, 22, 16, 5, 2.8, .2].map(n => n / 100)
}

const SpecialFeature = {
  Light: [ "None", "Guard", "ShortBlade"],
  Dark: [ "None", "Crossguard", "DoubleSided" ]
}

const SpecialFeatureRarity = {
  Light: [98.5, 1.25, .25].map(n => n / 100),
  Dark: [92, 6, 2].map(n => n / 100)
}

const ColorScheme = {
  Light: ["LightSilverBlack", "LightSilverBlue", "LightSilverRed", "LightWhitePink", "LightSilverGold", "LightGoldWhite"],
  Dark: ["DarkBlackRed", "DarkBlackPurple", "DarkBlackPink", "DarkBlackGreen", "DarkBlackGold", "DarkGoldBlack"]
}

const ColorSchemeRarity = {
  Light: [48, 24, 12, 8, 4, 2].map(n => n / 100),
  Dark: [48, 24, 12, 8, 4, 2].map(n => n / 100)
}

const getTableOutput = ((randomNumber, table, factors) => {
  let totalFactor = 0;
  for (let i = 0; i < factors.length; i++) {
    totalFactor += factors[i];
    if (randomNumber <= totalFactor) {
      return table[i];
    }
  }
  return table[table.length - 1];
});

function generateLightsaberStats({
  art,
  stats,
}, alreadyCreatedSabers = []) {

  const rarityModifierFactor = .1;
  const fixedRarityModifierFactor = .01;

  // Rarity modifier
  let rarityModifier = 0;
  let fixedRarityModifier = 0;
  let rarity = "";

  for (let i = 0; i < rarities.length; i++) {
    if (rarities[i] == stats.rarity) {
      rarityModifier = i * rarityModifierFactor;
      fixedRarityModifier = i * fixedRarityModifierFactor;
      rarity = stats.rarity;
      break;
    }
  }

  // Is light or dark?
  const bladeType = getTableOutput(stats.level / 100 + (stats.hp / 255 * rarityModifierFactor) + fixedRarityModifier, SaberType, SaberTypeRarity);

  // BladeColor
  const bladeColor = getTableOutput(stats.magic / 255, BladeColor[bladeType], BladeColorRarity[bladeType]);

  // EmitterType
  const emitterType = getTableOutput(stats.attack / 255 + (stats.speed / 255 * rarityModifierFactor) + fixedRarityModifier, EmitterType[bladeType], EmitterTypeRarity[bladeType]);

  // SwitchType
  const switchType = getTableOutput(stats.hp / 255 + (stats.accuracy / 255 * rarityModifierFactor) + fixedRarityModifier, SwitchType[bladeType], SwitchTypeRarity[bladeType]);

  // PommelType
  const pommelType = getTableOutput(stats.defense / 255 + (stats.evasion / 255 * rarityModifierFactor) + fixedRarityModifier, PommelType[bladeType], PommelTypeRarity[bladeType]);

  // SpecialFeature
  const featureType = getTableOutput(stats.magicDefense / 255 + fixedRarityModifier, SpecialFeature[bladeType], SpecialFeatureRarity[bladeType]);

  // ColorScheme
  const colorScheme = getTableOutput(stats.mp / 255 + (stats.luck / 255 * rarityModifierFactor), ColorScheme[bladeType], ColorSchemeRarity[bladeType]);

  let hash = rarity + " | " + bladeType + " | " + bladeColor + " | " + emitterType + " | " +  switchType + " | " +  pommelType + " | " +  featureType + " | " + colorScheme;
  const alreadyExists = false; // alreadyCreatedSabers.filter(saber => hash == saber.hash).length > 0;

  const saber = {
    rarity,
    bladeType,
    bladeColor,
    emitterType,
    switchType,
    pommelType,
    featureType,
    colorScheme,
    duplicate: alreadyExists,
    hash: hash
  }

  alreadyCreatedSabers.push(saber);

  return saber;
}

const result = procgen(_testHash, simulationSize);
const series = [];
let createdCardArray = [];
result.forEach(generatedCard => {
  const saber = generateLightsaberStats(generatedCard, createdCardArray)
  if (!saber.duplicate) series.push(saber);
})

// const data = JSON.stringify(series.sort((a, b) => a.hash > b.hash).map(d => { return { saber: d.hash }}));
// fs.writeFile("sabers.json", data, {}, () => {});


console.log("Made a series with", simulationSize, "attempted. Generated", series.length, "sabers");
if (createdCardArray.length < simulationSize) {
  console.log("Try adding more unique options to generators to increase likelihood of successful generation");
}

console.log("Light Sabers:", series.filter(d => d.bladeType === "Light").length);
console.log("Dark Sabers:", series.filter(d => d.bladeType === "Dark").length);

console.log("Blue Sabers:", series.filter(d => d.bladeColor === "Blue").length);
console.log("Red Sabers:", series.filter(d => d.bladeColor === "Red").length);
console.log("Orange Sabers:", series.filter(d => d.bladeColor === "Orange").length);
console.log("Green Sabers:", series.filter(d => d.bladeColor === "Green").length);
console.log("Purple Sabers:", series.filter(d => d.bladeColor === "Purple").length);
console.log("Black Sabers:", series.filter(d => d.bladeColor === "Black").length);
console.log("White Sabers:", series.filter(d => d.bladeColor === "White").length);

console.log("Common:", series.filter(d => d.rarity === "common").length);
console.log("Uncommon:", series.filter(d => d.rarity === "uncommon").length);
console.log("Rare:", series.filter(d => d.rarity === "rare").length);
console.log("Epics:", series.filter(d => d.rarity === "epic").length);
console.log("Legendaries:", series.filter(d => d.rarity === "legendary").length);

console.log("Specials:", series.filter(d => d.featureType !== "None").length);
