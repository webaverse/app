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
