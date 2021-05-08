## Blender Notes for Webaverse

## Import Settings Mixamo Fbx Armature 
* import original fbx with all default , no bone orientation 

## GLTF Export Settings Mixamo Armature
  * on : selected objects 
  * off:  +Yup 
  * off: Apply modifiers in Geometry tab as we are not exporting any meshes

### Default Armature 
* the armature was imported to blender with default fbx import options *note* do not enable automatic bone orientation as it will render the armature's export animations useless.
* the rest of the fbx animations were imported and there subsequent armatures are deleted, blender keeps the animation actions that were present in each individual fbx file and allows you to run these on the initial default armature.
* some cleanup was done on a few of these mixamo mocap animations to make them more game ready , main modifications were to normalize frame count, remove any forward or side motion in animations related to locomotion and to ensure proper looping of animations that require loop-ability.
* more mixamo animations can be imported if need for use if needed .

## Retargetting Summary
* *note* need to find a more general retargetting solution to translate animation from one arbitrary armature to another with high precision
* use rigify rig to modify / add animations 
* retarget with bone constraints 
* bone constraint uses child-of constraint to rigify armature 
* fbx armature then uses copy transform of bone constraint to transfer rigify armature changes to fbx armature 
* once happy with changes, go to pose -> animation -> bake action to make a new action 
  * add visual keying and clear constraints and make sure it bakes to a new action

### Retargeting steps (only works for fbx armature)
* Step 1
  * select fbx armature 
  * pose mode , select bone 
  * shift+s cursor to selected 
  * object mode 
  * add empty 
  * name bonename_transform (empty should be at origin point of fbx armature bone)
* Step 2 
  * select empty 
  * go to object constraints
  * select child-of constraint
  * set object to rigify armature 
  * now you need bone name from rigify armature 
  * go to object mode
  * select rigify armature
  * go to pose mode
  * select deformation bone
  * copy name of deformation bone 
  * go to object mode
  * select empty
  * in its constraints tab input defomration bone name
  * click set inverse 
  * rotate empty 90 degrees
* Step 3 
  * double check empty is at exact origin of the origin of the fbx armature bone you want to control 
  * select armature fbx 
  * go to pose mode 
  * select fbx armature bone to control 
  * go to bone constraints tab 
  * select copy transforms modifier 
  * select bonename_transform empty
* Step 4 
  * do this for every fbx armature bone except the leaf bones

if all goes well rigify should now be able to control the fbx armature , also with drivers properly setup you can also control the influence of rigify on the fbx armature

### Driver setup

* Step 1 
  * add an object that will be your driver 
  * shift+a add empty , cube 
  * name bone_constraint_influence
  * alt+g to make sure it is at origin of world
* Step 2 
  * select fbx armature
  * go to pose mode 
  * go to bone constraints tab 
  * add driver to constraint influence 
  * edit driver
  * var * 0.01
  * select bone_constraints_influence
* Step 3 
  * do this for every fbx armature bone with a bone constraint influence 
*note* with this setup the driver expects 0-100m as the range of influence in the x-axis that the cube will control 

