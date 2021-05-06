# Webaverse Animations

## Webaverse Animation System 

Webaverse Animations can be broken up into a few categories: 
* skeletal based animation for the avatar 
* vr input that will control the avatar 
* physics and ik constraints that affect the avatar 
* facial animation is controlled via blend shapes

All of these systems work together to produce a final result that allows maximum flexibility for Webaverse users in how there avatar is controlled and expressed. 

## Avatars 
Avatars in Webaverse are VRM based models which use a default set of GLTF based animations when vr inputs are not used. Vr inputs can vary so as a result Webaverse supports multiple types of VR input control of the avatar which can range from simple to full body mocap suits to control the avatar. 

### Testing equippable animations
In order to test some animations related to upper torso you currently need to equip certain items in order to activate them to do this you must unlock the secret inventory.
* press J to unlock secret inventory
* then press 1-8 to load assets into hands

### Skeletal Animation Source Files 
* [source files](https://drive.google.com/file/d/1xebv88vV396KL5Co8VViNCzxSpYRNS8r/view?usp=sharing﻿)
* [export file](https://drive.google.com/file/d/1ay0eMjCkTa8xia2We8Ptve-rkgLsCadr/view?usp=sharing)
## Avatar Facial Animation 

### Viseme List 
* Neutral
* ""A", "E","I","O", "U"
* Blink", "Blink_L", "Blink_R"
* Angry
* Fun
* Joy
* Sorrow
* Surprised

### Viseme Creation in Blender 
* Visemes are created with [Shape Keys](https://docs.blender.org/manual/en/latest/animation/shape_keys/introduction.html) 
* You can either export your avatar to unity to prepare it with [UniVrm](https://vrm.dev/en/docs/univrm/install/univrm_install/) or export with a [VRM export addon for blender](https://github.com/saturday06/VRM_Addon_for_Blender) 

