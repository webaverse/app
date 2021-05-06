# Animation Project for webaverse

## Avatars.js video breakdown 
* [avaer explaining avatars.js](https://drive.google.com/file/d/1t_AyyxvhscVgFYgfpDvNnORbWftGZW33/view)
* summary : take all inputs and produce animation output

## Animation Ideas 
* hoverboard 
  * use a single animation for forward / back and a single animation for left/right , lerp between these
  * the hoverboard should have a rig and there should be hoverboard animations but maybe these are seperate so that multiple hoverboard gltfs are compatible?
  * decouple first and third person views , this will allow all third person animations to be cosmetic only and not need to be mathmatically accurate as is potentially required by a fps view
* redo all currently used animations
  * walk , 8 way animaitons (forward,back,strafes,diagonals)
  * run , 8 way animations (forward,back,strafes,diagonals)
  * crouch walk , 8 animations (forward,back,strafes,diagonals)
  * jump
  * float 
  * select object (some kind of telekenisis animation)
  * sit 
  * dance (just use mixamo for this for now)
  * idle 
* ik ideas 
  * godot can do some [nice stuff](https://youtu.be/-JMKR2sjlkY)
  * ik mouse aim look , have to experiment with this in blender first 
  * research modern animation solutions
* higher dimensional blend space for accurately blending more than just walk animations , hmmm
* animation-tree / finite state machine + ik impulses
* 1d blend , a blend defined by some kind of value going from a to b , from idle -> walk -> run based on speed or say different attack animations based on speed of locomotion
* index of multiple animations that will randomly be played when a specific animation is called 

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

## Secondary Issues

* got most things deleted out of street.scn but now need to go into index.js and tweak further (re-added mirror)
* why does parcels need to exist <-- load seperate parcel assets
* export grid texture / plane as glb
* import into main scene 

## Completed  
* fully retargetted blend file so that you can add new animations that will be compatible with the fbx armature 
* a more bare main scene just for checking animations 
* begun new animations for stylized animation overhaul

## Animation References 
* [ghost in the shell](https://youtu.be/OisFMN1BWvg)


