![Webaverse Banner](./img/webaverse_banner.jpg)

![Skyboxes](./img/skyboxes.gif)

Webaverse is a feature-packed open source web-based metaverse engine built to support user generated content on standard file formats, built from the ground up to be WebXR compatible with networked physics for concurrent users. The engine supports

* User management - Avatar and inventory (includes account management via Discord and Metamask login)
* VRMs for avatars with full inverse kinematics and facial expressions
* GLB / GLTF for 3D models, extendable for wearables, pets, weapons and vehicles
* PNG, JPG for Images
* MP4, WEBM for Video
* MP3, Wav, OGG for Audio
* Javascript files

---

## Architecture

There are three main architectural foundations on which Webaverse is built:

**Composability**: Everything is an App and there can be multiple Apps within an App (think hyperlinks)

**Integrability**: Objects and actions are bound to Avatars

**Accessibility**: A wide array of device specs can be supported by controlling fidelity levels for avatars and environments

### Scenes

The way to build a custom scene is through a .scn file which is essentially a scene graph. (Scene editor - coming soon. If you are interested in contributing to the scene editor pls create a PR)

Details and example links can be found here

(https://webaverse.notion.site/Scene-scn-Files-674ac34814384170b1734b1637048c5f)
 
Also scenes can be built in-game by hitting the ` button and dragging and dropping files onto the browser.

User generated content can be dragged and dropped locally or on-chain assets can be imported by connecting your metamask.

### Models

3D models are predefined and extendable for certain categories (think prefabs in Unity):

* Wearables (Skinned & Unskinned) 
* Pets
* Weapons (Ranged & Melee)
* Vehicles (Land & Aerial)

Details and example links can be found here (link here add details here on how to make the above)

---

### Avatar and Animation System

The Weapons object defines the animations to be used in the metaversefile but the animation blend comes from the Aavatar system and we retarget it onto the VRM. Find more info [here](./avatars/README.md)

---

## Webaverse client App

App is the frontend client which uses NodeJS, with vite.js on the backend, serving up index.mjs and index.html and other types of imports to the end-client. 

We also have [Totum](https://github.com/webaverse/Totum/) which accepts requests to decode or load various types of files and represent each of them as a javascript file, and [wsrtc](https://github.com/webaverse/wsrtc/) handles multiplayer communication over websockets. 

Users can join rooms and share CRDT [z.js](https://github.com/webaverse/zjs) state data to one another across the network. Wsrtc also uses web codecs to perform voice encoding and decoding. 

Once the app is installed, just go to https://localhost to launch the client (to sidestep ssl warnings, direct “local.webaverse.com” to 127.0.0.1 in your host file and then access the app through https://local.webaverse.com). ThreeJS is used as a renderer. We use PhysX compiled for physics calculations. Physx-wasm is also used to auto generate colliders for scenes and objects.

---

## Client Quick Start

### To Use!

To clone and run App you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) v.17 (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

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

#### **Pay Attention**
When cloning App from git, you must include the option **"--recurse-submodules"**. The App repo relies upon and imports other Webaverse repos that are vital to the functioning application.

---

## Technologies

The App primarily uses the following technologies

* [NodeJS](https://nodejs.org/)
* [ThreeJS](https://threejs.org/)
* [ViteJS](https://vitejs.dev/)
* [ReactJS](https://reactjs.org/)

---

## Development Environment Setup

### IDEs

We prefer using [VSCode](https://code.visualstudio.com/download) for development, so the below notes reflect that toolset; however you should be able to adapt this guide to apply to any other IDEs.

---

### Directory Structure

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
...
```

---

### Setup ESLint

* Within VSCode, go to your extensions tab and search for `ESLINT`

![VSCodeESLintSetup](https://user-images.githubusercontent.com/51108458/144331775-2f5363d9-8d3f-4120-bb22-3308047c5605.png)


	OR From the command line:

	```bash
		npm install eslint -g
		eslint --init
	```

---

### Development Mode

The application uses vite to hot reload itself automatically if there are any changes to any files. To start the App in dev mode, run:

```bash
npm run dev
```

Any changes inside the `packages` folder won't recompile automatically and so will require restarting the entire development server by just running again: `npm run dev`


---


