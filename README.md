![horBEaMg](https://user-images.githubusercontent.com/51108458/144297194-f5c7c9ec-37af-4289-8100-118bcbd055d0.png)


# Webaverse

Uses NodeJS, with vite.js on the backend, serving up index.js and index.html and other types of imports to the end-client. We also have [Totum](https://github.com/webaverse/Totum/) which accepts requests to decode or load various types of files and represent it as a javascript file, and [wsrtc](https://github.com/webaverse/wsrtc/) handling the multiplayer over websockets. Users can join rooms and share CRDT [z.js](https://github.com/webaverse/zjs) state data to one another across the network. Also utilised by wsrtc are web codecs used to perform voice encoding and decoding. 
Once the app is installed all you need to do is go to localhost:3000 to launch the client. ThreeJS is used as a Renderer, physx-wasm for physics calculations as well as VRM models for avatars.
   

## Client Quick Start

## To Use!


To clone and run App you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) v.17(which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

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
## Pay Attention
When cloning App from git, you must include the option **"--recurse-submodules"**. The App repo relies upon and imports other Webaverse repos that are vital to the functioning application.


---

## Development Environment Setup

###IDEs

We prefer using [VSCode](https://code.visualstudio.com/download) for development, so the below notes reflect that toolset; however you should be able to adapt this guide to apply to any other IDEs.




## Technologies

The App primarily uses the following technologies

* [NodeJS](https://nodejs.org/)
* [ThreeJS](https://threejs.org/)
* [ViteJS](https://vitejs.dev/)
* [ReactJS](https://reactjs.org/)

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

	![enter image description here](/img/VSCodeESLintSetup.png)

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


