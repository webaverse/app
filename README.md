# Webaverse Quick Start Guide

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and Latest Current version of [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone --recurse-submodules https://github.com/webaverse/app.git
# Go into the repository
cd app/
# Install dependencies
npm install
# Run the app
npm run dev
# Navigate to the URL mentioned in the terminal

```

## Development Environment Setup

> Preferred tool for development is [VSCode](https://code.visualstudio.com/download)


### Technologies

* [NodeJS](https://nodejs.org/)
* [ThreeJS](https://threejs.org/)
* [ViteJS](https://vitejs.dev/)
* [ReactJS](https://reactjs.org/)
* [YJS](https://docs.yjs.dev/)

## Features

- Custom file type loaders (GLSL, VRM, VOX, GLTF, WBN)
- PhysX compiled to WebAssembly for collisions/raycasting
- Custom avatar IK + WebXR support
- Character controller w/ animation blend system
- Multiplayer powered by y.js, mediasoup, and WebRTC
- IPFS + Geth integration for pulling assets

## Examples

<a href="https://i.imgur.com/WhmtEDV.gif">
  <img alt="Wearables" target="_blank" src="https://i.imgur.com/WhmtEDV.gif" height="190" width="32%">
</a>
<a href="https://i.imgur.com/8MOpwnn.gif">
  <img alt="Pets" target="_blank" src="https://i.imgur.com/8MOpwnn.gif" height="190" width="32%">
</a>
<a href="https://i.imgur.com/g7RBgp6.gif">
  <img alt="WebXR" target="_blank" src="https://i.imgur.com/g7RBgp6.gif" height="190" width="32%">
</a>

<a href="https://i.imgur.com/QQg3z4A.jpg">
  <img alt="Editor" target="_blank" src="https://i.imgur.com/QQg3z4A.jpg" height="190" width="32%">
</a>
<a href="https://i.imgur.com/EFyvdx2.jpg">
  <img alt="Street" target="_blank" src="https://i.imgur.com/EFyvdx2.jpg" height="190" width="32%">
</a>
<a href="https://i.imgur.com/ydNfbwD.jpg">
  <img alt="Builder" target="_blank" src="https://i.imgur.com/ydNfbwD.jpg" height="190" width="32%">
</a>

<br>


# Loading sub-apps
The Webaverse can load many types of sub-apps and files. <br>
The architecture of this project allows for development of isolated apps, that can then be loaded via the metaversefile loaders <br>
Developers can build their own sub-apps and load them into the main application, quite easily <br>
```bash
├───scenes <--- Application can be loaded in via scenes/[NAME].scn
	├───canyon.scn <-- This contains a kind of scene node graph with each node containing a position, quaternion, scale and startURL
```
Each of these sub-app repositories contain a .metaversefile which essentially lets the application know what the entry point for the sub-app is.

Please look at the following example for guidance on building an app to load with this repository<br>
https://github.com/webaverse/simple-application

Once you are ready to test your sub-app. You will have to set up GitHub Pages on the repository, and set the source as the master/main/copy or branch.

If you make a change on the sub-app repo, you will have to push it and re-run the main application as vite.js caches sub-apps.

# Adding your own features
Common javascript functionality is used across the application so do not be intimidated by all of the depth and breadth (1000s of lines some files),
they are all put together in a simple / isolated manner. 

## How to add a new common shader?
Really the strategy here should be to create any new shader that will commonly be used across the applicatiuon( not specific to any sub-app, but across all apps) should be added to shaders.js or similarly, a new sub directory could be added with further subcategorisation of files and folders according to types. 
## <b>Shaders.js <br>
If you follow along with the example of the buildMaterial on line 186 of Shaders.js. 

```javascript
const buildMaterial = new THREE.ShaderMaterial({
  uniforms:{
    uTime:{
      type:'f',
      value:0,
      needsUpdate:true
    }
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader
});
```
This is then exported out and imported into game.js, and could be imported elsewhere. Applying this material onto any 3d mesh should have the intended shader effect.

## <b>character-controller.js <br>
This file contains a number of classes that all inherit from a common base class called Player (which is just an Object3D, which contains all the functionality around the avatar, rig, and player position, rotation along with bones. State is also being synchronised via y.js using interpolation.

## <b>Avatars.js
Related to the character-controller is avatars.js, which contains fuinctionality around the bones, and using quaternion smooth interpolation to animate between animation clips. You can also see some bone functionality introduced from the VRM package.

You will also have the ability to switch IK-Mode on and off for the upper or bottom half of the body by enabling the following

```javascript
  setTopEnabled(enabled)
  setBottomEnabled(enabled)
```

## Directory Structure

```bash
**Root**
│
├───src <--- React Application Resides Here
	├───Main.jsx <-- Rgisters the routes of the React App and Load Dom
	├───App.jsx <-- Loads Webaverse.js from Root directory
│
├─ index.js <-- This starts the vite server that serves the React App
│
├─ webaverse.js <-- This is the entry point of the Webaverse
│
├─ io-manager.js <-- Controls the input events within the application.
│
├─ game.js <-- Manages the scene and brings together components such as renderer and shaders.js
│
├─ renderer.js <-- Handles the various scenes, and brings the post-processing stack together
│
├─ world.js <-- Controls the functionality of single player
│
├─ universe.js <-- Controls the functionality of multiplayer
│
├─ shaders.js <-- Common shaders in the application
│
├─ character-controller.js <-- Controls all types of players, including local and online
...

```

## Submodules
* [Metaversefile](https://github.com/webaverse/metaversefile/) <br>
  This is the loader part of the application, it is used to load ANY and MANY file types, each with their own loading strategy. <br>
  If you want to edit a kind of loader, maybe its specific such as GLTF, you can look at the type/templates and edit glb.js to add your own modification to this loader.
* [wsrtc](https://github.com/webaverse/wsrtc/) <br>
  WSRTC is a custom websocket based RTC networking protocol. Allowing for P2P communication as well as utilising WS.

<br>


# Metaverse File

`MetaverseFile` componet is used by `entire application` to load assets in the application.

```js
import  metaversefileApi  from  './metaversefile-api.js';
```

Depends on: [MetaverseFile](https://github.com/webaverse/metaversefile) 

## Usage

```js

	let  object;
	try {
		object = await  metaversefileApi.load(url);
	} catch (err) {
		console.warn(err);
	}
	return  object;

```

#### Inputs 
* url: {URL of the asset that can be downloadable by the screenshot system} **[Required]**

#### Returns 
* Promise: 

#### Output
* Object of application with the 

#### Supported Assets 
* VRM
* VOX
* JS
* SCN
* LIGHT
* IMAGE
* HTML
* GROUP
* GLBB
* GLB
* GIF
* FOG
* Background



## Architecture

### Flow Diagram

![enter image description here](https://i.ibb.co/Z8v4ySC/Metaverse-File.png)

### Location

```
Webaverse App
└───src
   └───metaversedile-api.js

```



### Setup ESLint

* Go to your extensions tab and search for `ESLINT`

	![enter image description here](https://res.cloudinary.com/practicaldev/image/fetch/s--gWL807Xl--/c_limit,f_auto,fl_progressive,q_auto,w_880/https://thepracticaldev.s3.amazonaws.com/i/9rmkgbk7nio6ravjm0rx.PNG)

	```bash
		npm install eslint -g
		eslint --init
	```

## Auto-recompile

The application uses vite to hot reload itself automatically if there is any changes to any file.


> Any change inside `packages` folder don't recompile automatically for which we have restart the development server by using `npm run dev`



