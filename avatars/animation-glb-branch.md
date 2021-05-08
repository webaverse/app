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

## Animation References 
* [ghost in the shell](https://youtu.be/OisFMN1BWvg)


