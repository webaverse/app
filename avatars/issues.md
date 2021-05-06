# Issues 
* blender -> unity -> univrm workflow 
* blender -> vrm workflow 
* fbx -> blender -> gltf -> webaverse workflow 
* get some test chars into webaverse to familiarize yourself 
* delete ybot.fbx from animations dir , also delete all fbx anims and include one single default_anims.glb *EXPORT AS GLB*
* [low detail default avatar](https://github.com/webaverse/app/issues/1004) , glitch-atar , ghosts , soul-sphere , placeholder-tar
* [scene testing / lightmapping](https://github.com/webaverse/app/issues/960)
* [avatar concepting](https://github.com/webaverse/app/issues/952)
* [scene planning](https://github.com/webaverse/app/issues/950)
* [scene ideas](https://github.com/webaverse/app/issues/949)
* [avatar re-texturing](https://github.com/webaverse/app/issues/994)

## Animation Issues
* current canonical armature all animations have to work with is based off of a mixamo fbx armature, this exists in the blender src file and must never be touched.
* as a result most of blender's animation tools are not able to work well, instead a translation armature must be created and bone constraints made so that the export armature is 'puppetted' to the translation armature. in this way blender's animation tools can be utilized to there full extent and more / better animations can be crafted from within blender. 
* empties can also be used as bone constraints for small animation changes, note that while these work for small changes, doing much larger scale animations will make this technique more problematic and thus require the use of a translation rig. 
* experiments with translation rig are progressing but this has not been completed yet. 
* when importing fbx , leave everything as is , ecpecially do not be tempted to touch bone orienation alignment this unfortunately breaks everything. 
* the armature gets brought in with .01 scaling and 90 degree rotation, why? no one knows .
* upon export to fbx you can leave things as is and it should be ok.. *maybe not though* .
* upon exprting to gltf/glb make sure you apply the scale so that the model becomes enormous but do *not* apply the 90 degree rotation unless you want fun hijinx to ensue.
* if you have frame blended animations like running / walking / crouch-walking , make sure they all have the exact same frame count or you are going to have a bad day. 

## Animation Tree Issue notes 
* [main link](https://github.com/webaverse/app/issues/977)
* [related issue](https://github.com/webaverse/app/issues/1005)

## mixamo / blender issues 

* when importing fbx , leave everything as is , ecpecially do not be tempted to touch bone orienation alignment this unfortunately breaks everything. 
* the armature gets brought in with .01 scaling and 90 degree rotation, why? no one knows 
* upon export to fbx you can leave things as is and it should be ok.. *maybe not though* 
* upon exprting to gltf/glb make sure you apply the scale so that the model becomes enormous but do *not* apply the 90 degree rotation unless you want fun hijinx to ensue.

## Secondary Issues

* got most things deleted out of street.scn but now need to go into index.js and tweak further (re-added mirror)
* why does parcels need to exist <-- load seperate parcel assets
* export grid texture / plane as glb
* import into main scene 

## More Animation Issues 
## Issues

* when shooting pistol the run animation blends with the shooting animation and gun aim becomes comically non precise, potential solution is ik-target for the hand bone that can modify shooting animation to point towards it. 
* need to have animation derivative options to see what people prefer ,, animation system needs cleaned up completely first
* no clipped camera , so walls can be passed through by camera
* no mouse / look animation control, otoh so many other things to fix first before getting to this
* in order to fix hand flipping you have to flip the names for left/right hand assignment this ALSO seems like a bug and needs investigation
* hip bone should not move avatar, there should either be an avatar space or a bounding box that controls where the armature is and any global transformations
* poses need to be audited for there utility and made sure they are not used anywhere not necessary 
* need flowcharts for how ik system / pose system / animation system / hmd system interact when and how they override eachother 
* need to brainstorm ideas about avatar control as it is currently a combinatorial explosion with no solve 
* make bad animations to sort-of fix the current issues 
* remove animation frame normal﻿ization code as it is not needed , only normalization code that is needed would be for syncing up walk animations when blending between them
* remove any potential "fixes" so they can be fixed by the animator and not code first
* when monitor is over 60hz , animations get deformed oddly , potentially due to ik solver expecting 60hz deltatime
* left/right hand bones seem flipped somehow, in general need more debugging tools for animation
* when crouched weird pose glitches occur , potential ik / pose issue
* need to organize some video clips of animation concepts to make more stylized / interesting animations
* figure out a better workflow from blender -> webaverse for default anims 
* modularize code + json configuration files that will make tweaking animations easier for artists 
* implementing basic functions using three.js animation system to allow artists to on a higher leavel (json file) design animation trees without coder intervention. 
  * animation node 
  * 3 way blend 
  * timescale 
  * transition (for doing basic transitions between two animations)
  * 2d blend (for 8 way animation blending typically for walking)
  * a way to dictate links/heirarchy for the functions 
  * One shot animation overrides for things like attack animations
* would also be helpful to have json config files for movement variables 
