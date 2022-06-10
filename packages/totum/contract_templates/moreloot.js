import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, addTrackedApp, removeTrackedApp, useLocalPlayer, useActivate, useLoaders, useCleanup, usePhysics, useWeb3, useAbis} = metaversefile;

const _capitalize = s => s.slice(0, 1).toUpperCase() + s.slice(1);
const _capitalizeWords = s => {
  let words = s.split(/\\s/);
  words = words.map(_capitalize);
  return words.join(' ');
};
const _underscoreWhitespace = s => s.replace(/\\s/g, '_');
const _getBaseName = s => {
  const match = s.match(/([^\\.\\/]*?)\\.[^\\.]*$/);
  return match ? match[1] : '';
};
const _normalizeName = name => {
  const weapons = [
      "Warhammer",
      "Quarterstaff",
      "Maul",
      "Mace",
      "Club",
      "Katana",
      "Falchion",
      "Scimitar",
      "Long Sword",
      "Short Sword",
      "Ghost Wand",
      "Grave Wand",
      "Bone Wand",
      "Wand",
      "Grimoire",
      "Chronicle",
      "Tome",
      "Book"
  ];
  const chestArmor = [
      "Divine Robe",
      "Silk Robe",
      "Linen Robe",
      "Robe",
      "Shirt",
      "Demon Husk",
      "Dragonskin Armor",
      "Studded Leather Armor",
      "Hard Leather Armor",
      "Leather Armor",
      "Holy Chestplate",
      "Ornate Chestplate",
      "Plate Mail",
      "Chain Mail",
      "Ring Mail"
  ];
  const headArmor = [
      "Ancient Helm",
      "Ornate Helm",
      "Great Helm",
      "Full Helm",
      "Helm",
      "Demon Crown",
      "Dragon's Crown",
      "War Cap",
      "Leather Cap",
      "Cap",
      "Crown",
      "Divine Hood",
      "Silk Hood",
      "Linen Hood",
      "Hood"
  ];
  const waistArmor = [
      "Ornate Belt",
      "War Belt",
      "Plated Belt",
      "Mesh Belt",
      "Heavy Belt",
      "Demonhide Belt",
      "Dragonskin Belt",
      "Studded Leather Belt",
      "Hard Leather Belt",
      "Leather Belt",
      "Brightsilk Sash",
      "Silk Sash",
      "Wool Sash",
      "Linen Sash",
      "Sash"
  ];
  const footArmor = [
      "Holy Greaves",
      "Ornate Greaves",
      "Greaves",
      "Chain Boots",
      "Heavy Boots",
      "Demonhide Boots",
      "Dragonskin Boots",
      "Studded Leather Boots",
      "Hard Leather Boots",
      "Leather Boots",
      "Divine Slippers",
      "Silk Slippers",
      "Wool Shoes",
      "Linen Shoes",
      "Shoes"
  ];
  const handArmor = [
      "Holy Gauntlets",
      "Ornate Gauntlets",
      "Gauntlets",
      "Chain Gloves",
      "Heavy Gloves",
      "Demon's Hands",
      "Dragonskin Gloves",
      "Studded Leather Gloves",
      "Hard Leather Gloves",
      "Leather Gloves",
      "Divine Gloves",
      "Silk Gloves",
      "Wool Gloves",
      "Linen Gloves",
      "Gloves"
  ];
  const necklaces = [
      "Necklace",
      "Amulet",
      "Pendant"
  ];
  const rings = [
      "Gold Ring",
      "Silver Ring",
      "Bronze Ring",
      "Platinum Ring",
      "Titanium Ring"
  ];
  const all = [weapons, chestArmor, headArmor, waistArmor, footArmor, handArmor, necklaces, rings].flat();
  for (const n of all) {
    if (name.includes(n)) {
      return n;
    }
  }
  return null;
};

const domParser = new DOMParser();
const xmlSerializer = new XMLSerializer();
export default e => {
  const app = useApp();
  const physics = usePhysics();
  const web3 = useWeb3();
  const {ERC721} = useAbis();
  
  const contractAddress = '${this.contractAddress}';
  const tokenId = parseInt('${this.tokenId}', 10);
  console.log('got token id', tokenId);

  const apps = [];
  const physicsIds = [];
  e.waitUntil((async () => {
    const promises = []; 
    
    const contract = new web3.eth.Contract(ERC721, contractAddress);
    // console.log('got contract', {ERC721, contractAddress, contract});

    const tokenURI = await contract.methods.tokenURI(tokenId).call();
    const res = await fetch(tokenURI);
    const j = await res.json();
    // console.log('got moreloot j', j);
    
    promises.push((async () => {
      const texture = new THREE.Texture();
      const geometry = new THREE.PlaneBufferGeometry(1, 1);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
      });
      const imageMesh = new THREE.Mesh(geometry, material);
      const img = await (async () => {
        const res = await fetch(j.image);
        const text = await res.text();
        
        const doc = domParser.parseFromString(text, 'image/svg+xml');
        const svg = doc.children[0];
        svg.setAttribute('width', 1024);
        svg.setAttribute('height', 1024);
        const dataUrl = 'data:image/svg+xml;utf8,' + xmlSerializer.serializeToString(svg);
        
        const img = new Image();
        await new Promise((accept, reject) => {
          img.onload = accept;
          img.onerror = reject;
          img.crossOrigin = 'Aynonymous';
          img.src = dataUrl;
        });
        return img;
      })();
      texture.image = img;
      texture.needsUpdate = true;
      imageMesh.position.set(0, 1.3, -0.2);
      app.add(imageMesh);
      
      const physicsId = physics.addBoxGeometry(
        imageMesh.position,        
        imageMesh.quaternion,
        new THREE.Vector3(1/2, 1/2, 0.01),
        false
      );
      physicsIds.push(physicsId);
    })());

    let spec;
    {
      const res2 = await fetch(j.image);
      const text = await res2.text();
      const doc = domParser.parseFromString(text, 'image/svg+xml');
      const svg = doc.children[0];
      const elements = Array.from(doc.querySelectorAll('text')).map(e => e.innerHTML);
      // console.log('got doc', doc, Array.from(doc.children), elements);
      
      let index = 0;
      const slots = {
        weapon: elements[index++],
        chest: elements[index++],
        head: elements[index++],
        waist: elements[index++],
        foot: elements[index++],
        hand: elements[index++],
        neck: elements[index++],
        ring: elements[index++],
      };
      const frontOffset = 0;
      const slotOuters = {
        weapon: {
          // boneAttachment: 'rightArm',
          position: new THREE.Vector3(-0.4, 1.1, 0.1 + frontOffset),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1),
        },
        chest: {
          position: new THREE.Vector3(0, 0.45, frontOffset),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1),
        },
        head: {
          position: new THREE.Vector3(0, 0.45, frontOffset),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1),
        },
        waist: {
          position: new THREE.Vector3(0, 0.3, frontOffset),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1),
        },
        foot: {
          position: new THREE.Vector3(0, 0.3, frontOffset),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1),
        },
        hand: {
          position: new THREE.Vector3(0, 0.4, frontOffset),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1),
        },
        neck: {
          position: new THREE.Vector3(0, 0.47, frontOffset),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1),
        },
        ring: {
          position: new THREE.Vector3(-0.6, 1.2, frontOffset),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1),
        },
      };
      const slotInners = {
        weapon: {
          boneAttachment: 'leftHand',
          position: new THREE.Vector3(-0.07, -0.03, 0),
          quaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI/2),
          scale: new THREE.Vector3(1, 1, 1),
        },
        chest: {
          skinnedMesh: true,
          /* boneAttachment: 'chest',
          position: new THREE.Vector3(0, -0.25, 0),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1).multiplyScalar(1.5), */
        },
        head: {
          skinnedMesh: true,
          /* boneAttachment: 'head',
          position: new THREE.Vector3(0, 0, 0),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1).multiplyScalar(1.5), */
        },
        waist: {
          skinnedMesh: true,
          /* boneAttachment: 'hips',
          position: new THREE.Vector3(0, 0, 0),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1).multiplyScalar(1.3), */
        },
        foot: {
          skinnedMesh: true,
          /* boneAttachment: 'leftFoot',
          position: new THREE.Vector3(0, -0.13, 0.03),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1).multiplyScalar(1.4), */
        },
        hand: {
          skinnedMesh: true,
          /* boneAttachment: 'leftHand',
          position: new THREE.Vector3(0, 0, 0),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1), */
        },
        neck: {
          skinnedMesh: true,
          /* boneAttachment: 'neck',
          position: new THREE.Vector3(0, 0, 0),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1), */
        },
        ring: {
          boneAttachment: 'leftRingFinger1',
          position: new THREE.Vector3(0, 0, 0),
          quaternion: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1),
        },
      };
      
      const slotNames = Object.keys(slots);
      const srcUrls = slotNames.map(k => {
        const v = _normalizeName(slots[k]);
        return 'https://webaverse.github.io/loot-assets/' + k + '/' + _underscoreWhitespace(_capitalizeWords(v)) + '/' + _underscoreWhitespace(v.toLowerCase()) + '.glb';
      });
      
      // console.log('loading', {slots, srcUrls});
      
      const _makeComponents = (slotName, slotInner, srcUrl) => {
        const wearComponent = (() => {
          const {boneAttachment, skinnedMesh, position, quaternion, scale} = slotInner;
          let value;
          if (boneAttachment) {
            value = {
              boneAttachment,
              position: position.toArray(),
              quaternion: quaternion.toArray(),
              scale: scale.toArray(),
            };
          } else if (skinnedMesh) {
            const baseName = _getBaseName(srcUrl);
            // console.log('got skinned mesh', _underscoreWhitespace(baseName.toLowerCase()));
            value = {
              skinnedMesh: _underscoreWhitespace(baseName.toLowerCase()),
            };
          }
          return {
            key: 'wear',
            value,
          };
        })();
        
        const components = [
          wearComponent,
        ];
        if (slotName === 'weapon') {
          const useComponent = {
            key: "use",
            value: {
              animation: "combo",
              boneAttachment: "leftHand",
              position: [-0.07, -0.03, 0],
              quaternion: [0.7071067811865475, 0, 0, 0.7071067811865476],
              scale: [1, 1, 1]
            }
          };
          components.push(useComponent);
        }
        return components;
      };
      
      // const srcUrl = 'https://webaverse.github.io/loot-assets/chest/Ring_Mail/ring_mail.glb';
      for (let i = 0; i < srcUrls.length; i++) {
        const srcUrl = srcUrls[i];
        const slotName = slotNames[i];
        const slotOuter = slotOuters[slotName];
        const slotInner = slotInners[slotName];
        
        /* if (Array.isArray(slotOuter.position)) {
          const ps = slotOuter.position.map((position, i) => {
            const quaternion = slotOuter.quaternion[i];
            const scale = slotOuter.scale[i];
            const components = _makeComponents({
              boneAttachment: slotInner.boneAttachment[i],
              position: slotInner.position[i],
              quaternion: slotInner.quaternion[i],
              scale: slotInner.scale[i],
            });
            const p = addTrackedApp(
              srcUrl,
              app.position.clone()
                .add(position.clone().applyQuaternion(app.quaternion)),
              app.quaternion
                .multiply(quaternion),
              scale,
              components
            );
            p.then(app => {
              apps.push(app);
            });
            return p;
          });
          promises.push.apply(promises, ps);
        } else { */
          const {position, quaternion, scale} = slotOuter;
          const components = _makeComponents(slotName, slotInner, srcUrl);
          
          // console.log('got loot components', srcUrl, components);
          const p = addTrackedApp(
            srcUrl,
            app.position.clone()
              .add(position.clone().applyQuaternion(app.quaternion)),
            app.quaternion
              .multiply(quaternion),
            scale,
            components
          );
          promises.push(p);
          p.then(app => {
            apps.push(app);
          });
        // }
      }
      await Promise.all(promises);
    } catch(err) {
      console.warn(err);
      throw err;
    }
  })());
  
  useActivate(e => {
    for (const a of apps) {
      a.activate();
    }
    removeApp(app);
    app.destroy();
  });

  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
    physicsIds.length = 0;
  });
  
  return app;
};

export const contentId = ${this.contentId};
export const name = ${this.name};
export const description = ${this.description};
export const type = 'js';
export const components = ${this.components};