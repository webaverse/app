# Webaverse Issues 

### Getting Started
* git clone https://github.com/webaverse/app.git
* npm install 
* node index 
* checkout animation-glb2 branch of app repo for current changes.
* semi updated main assets on google drive so as not to add too much bloat to github repo: 
    * [src blend](https://drive.google.com/file/d/1ijlc7lWhurEYUAuM2yWMMJnR6tKyI20P/view?usp=sharing)
    * [animation.glb](https://drive.google.com/file/d/194DDfvbUPA7Be55R5CT3bj_ou7twoy2W/view?usp=sharing)
* download latest version of these files , specifically animations.glb
    * copy to app/animations/animations.glb
    * use source blend file to add / modify animations to then export as a single animations.glb file .
    * make sure to keep the google drive updated with the latest useable animations.glb file for others to test and check out.

### Scripts of note that are related to animations
* constants.js <-- asset loading
* avatars/avatars.js <-- take all inputs and produce animation output, does some physics handling as well currently
* weapons-manager.js <-- handles ui drawing of inventory, equippable weapons, checks if weapons are equipped and calls a use function
* rig.js <-- generating bounding boxes , physics , collision data to allow the avatar to move throughout the world

## Compiling FBX animations to .cbor 
* uncomment fbx importer and its instructions , restart webaverse app, let it crash until it compiles , recomment , overwrite cbor

## webaverse animation tidbits 
* if you have frame blended animations like running / walking / crouch-walking , make sure they all have the exact same frame count or you gonna have a bad day. 

## secret inv for testing other anims
* press J to unlock secret inventory
* then press 1-8
* to load assets into hands

## Useful rigging ideas
* [good pole position setup](https://youtu.be/suP14lYWpN8)
* get webaverse app github repo 
* npm install 
* node index 
* app/constants.js <-- where some things are loaded

## Pet Info
* typically uploaded from the frontend
* rig-aux.js handles some pet stuff 

## Ideas for Trailer 
* marketplace
* vending machine for nft's 
* metro with passing train 
* easter eggs 
* sound design 
* skyboxes 
* passing train should teleport to multiplayer realm 
* avatars , come into scene to explain specific features of the world and everything about it. 
* seasons can modify avatars 
* carnival season 
  * vr carnival rides 
* hotel 
  * where your character always wakes up , personal room that is customizable by the user that controls it 
  * lots of asset creation needed for this

### Testing equippable animations
* press J to unlock secret inventory
* then press 1-8
* to load assets into hands
